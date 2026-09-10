---
title: 'Embedding and vector search for incident recall (2/3)'
description: 'Step 6 of a first-level investigation — "have we seen this before?" — is the one a human always loses, because Slack search is keyword search. How pgvector makes it work: rendering alerts and resolved threads into the same shape so similarity means something, a cosine HNSW index and the filter trap hiding inside it, and a Kafka pipeline that re-embeds whole threads rather than messages.'
date: '2026-09-10'
tags: ['AI', 'PostgreSQL', 'RAG', 'SRE']
---

Of the seven steps in a [first-level investigation](/blogs/ai-first-level-incident-analysis), six are merely slow. Step 6 — _have we seen this before?_ — is the one a human cannot do at 3am, because Slack search is keyword search and the thread you want used different words than the ones you are typing.

This post is how that step is built: the read side, then the write side that fills it.

- Part 1/3 — [the agent](/blogs/incident-bot-langgraph-langchain-mcp): MCP, LangGraph, the judge, and scaling the workers.
- **Part 2/3 — recall** (this post): embedding and vector search.
- Part 3/3 — [memory and context engineering](/blogs/incident-bot-agent-memory-context-engineering): how a thread survives a pod that vanishes.

## Why pgvector, and not a vector database

The corpus is small. A busy team generates a few thousand resolved incidents a year, not a few million documents, so approximate nearest-neighbour search is nowhere near the bottleneck. What matters is that everything else already lives in Postgres — the message log, the incident state — so the metadata filter and the vector search are one statement, writes join the same transaction, and there is one thing to back up instead of two.

The case for a dedicated store is a corpus that outgrows a single Postgres, sharded multi-tenancy, or hybrid search you would rather not build. An incident corpus needs none of those. It needs to be there at 3am.

## The read side

Step 6 is the one a human loses, and it works here only because there is a corpus to search — built by the pipeline further down. This is the read side.

Both sides of the search go through one renderer. An alert is machine output and a resolved thread is human prose; embed each raw and similarity ranks writing style rather than failure mode:

```typescript
// both sides of the search go through this — an alert and a resolved thread
// have to land in the same register, or similarity ranks prose style
function renderForEmbedding(r: IncidentRecord): string {
	return [
		`service: ${r.service}`,
		`symptom: ${r.symptom}`, // "pod OOMKilled, 3 restarts in 10m"
		`signals: ${r.signals.join('; ')}`, // "memory rising 33Mi/min; no deploy in window"
		`cause: ${r.cause ?? 'unknown'}`, // filled on documents, 'unknown' on a query
		`fix: ${r.fix ?? 'unknown'}`,
	].join('\n');
}

// no query instruction prefix, deliberately — see below
const qvec = await embed(renderForEmbedding(fromAlert(alert)));
```

Note what is _absent_. bge ships an instruction prefix — `Represent this sentence for searching relevant passages:` — for **asymmetric** retrieval, where a terse query has to meet a long passage. Rendering both sides into the same template is precisely what removes that asymmetry, so adding the prefix would reintroduce the skew the renderer just took out. Symmetric task, no prefix, both sides embedded identically.

```typescript
import pgvector from 'pgvector/pg';

// one transaction, because SET LOCAL is scoped to one: issued outside a
// transaction Postgres ignores it, and a pool would hand the SELECT a
// different connection regardless
const priorIncidents = await db.tx(async (t) => {
	// widen the HNSW candidate list; the filter below prunes hard on a small corpus
	await t.query('SET LOCAL hnsw.ef_search = 100');

	const {rows} = await t.query(
		`SELECT thread_ts, summary, resolution, 1 - (embedding <=> $1) AS similarity
		   FROM incident_threads
		  WHERE service = $2 AND resolved = true
		  ORDER BY embedding <=> $1
		  LIMIT 5`,
		[pgvector.toSql(qvec), alert.service],
	);

	// a similarity floor, so "the five closest" doesn't become "five red herrings"
	return rows.filter((r) => r.similarity >= 0.78);
});
```

```sql
CREATE INDEX ON incident_threads
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**Cosine, not L2.** `<=>` is cosine distance, `<->` is Euclidean. bge returns normalised vectors and was trained on a cosine objective, so magnitude carries no signal — ranking on L2 ranks on something the model never optimised.

**HNSW, not IVFFlat.** IVFFlat is built against a representative sample and its lists go stale as the table grows, which is exactly wrong for a corpus that starts empty and fills incident by incident. HNSW builds incrementally and holds recall as rows arrive. More memory; at a few thousand rows nobody notices.

**The filter is the trap.** `WHERE service = $2` is applied _during_ the index scan, so on a small corpus a narrow filter can exhaust the HNSW candidate list before finding five matching rows — and you silently get fewer or worse results rather than an error. That's the failure misdiagnosed as "the embeddings are bad". Raise `hnsw.ef_search`, use pgvector's iterative index scans, or keep a partial index for a dominant service.

Filtering by service is a deliberate loss of recall — the same symptom elsewhere usually has a different cause. Service is also in the embedded text, so it counts twice. On purpose.

## The write side

Every message in the thread — the bot's, the engineers', tagged or not — ends up here. This is the write side of step 6, and the reason today's argument about the sidecar is what a future investigation retrieves.

![The thread embedding loop: every Slack message in the alert channel is published to a Kafka topic; an embedder consumer loads the entire thread rather than the single new message, summarises it into a canonical incident record with service, symptom, root cause and resolution, embeds that summary and upserts it into the incident_threads table in pgvector; the recall branch of a future investigation reads from that same table, so each resolved thread improves the next investigation](/diagrams/incident-thread-embedding.svg)

```typescript
await consumer.run({
	eachMessage: async ({message}) => {
		const {thread_ts} = JSON.parse(message.value!.toString());

		// the unit of meaning is the thread, so rebuild the whole record
		const thread = await loadThread(thread_ts);
		const record = await summariseThread(thread); // service · symptom · cause · fix · resolved

		await db.query(
			`INSERT INTO incident_threads
			   (thread_ts, service, summary, resolution, resolved, embedding, embed_rev, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, now())
			 ON CONFLICT (thread_ts) DO UPDATE SET
			   summary    = EXCLUDED.summary,
			   resolution = EXCLUDED.resolution,
			   resolved   = EXCLUDED.resolved,
			   embedding  = EXCLUDED.embedding,
			   embed_rev  = EXCLUDED.embed_rev, -- model + template version
			   updated_at = now()`,
			[
				thread_ts,
				record.service,
				record.summary,
				record.resolution,
				record.resolved,
				pgvector.toSql(await embed(renderForEmbedding(record))),
				EMBED_REV,
			],
		);
	},
});
```

`summariseThread` is a model call, so it's debounced — a few seconds of quiet, or a message that changes the record, whichever comes first. Kafka keeps ordering honest while the debounce collapses bursts, and replaying the topic rebuilds the whole corpus when the model or template changes.

The embedder is `bge-base-en-v1.5` at 768 dimensions on the same self-hosted vLLM endpoint as [the RAG pipeline post](/blogs/building-a-rag-pipeline). Local and small, for three reasons: it runs on every thread that moves, so per-call cost compounds; incident text describes production internals and needn't leave the cluster; and at a few thousand incidents a larger model buys recall you can't measure while costing index memory.

`embed_rev` stamps the model plus template version on every row. Vectors from different models aren't comparable and neither are vectors from different templates, so a half-finished migration leaves a table where similarity quietly means two things. The stamp makes that visible and lets a rebuild resume.

Next: [how the conversation is kept](/blogs/incident-bot-agent-memory-context-engineering) — the table behind all of this, and the context engineering that stops 400 log lines becoming 400 lines of context.
