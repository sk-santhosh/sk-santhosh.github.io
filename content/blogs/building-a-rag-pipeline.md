---
title: 'Building a RAG pipeline with pgvector and vLLM'
description: 'How retrieval-augmented generation grounds an LLM in your own data — chunking, embeddings, vector search with pgvector and generation with a self-hosted vLLM endpoint.'
date: '2026-06-02'
tags: ['AI', 'RAG', 'PostgreSQL', 'Platform Engineering']
---

A language model only knows what it saw during training. Ask it about your internal runbooks, last week's incident or a private contract and it will either refuse or, worse, invent something plausible. Fine-tuning to teach it new facts is expensive and goes stale the moment the data changes. Retrieval-augmented generation (RAG) takes the other route: keep the model fixed, and at query time fetch the relevant facts and hand them to the model as context.

This is the RAG setup I run on top of the [self-hosted vLLM endpoint](/blogs/deploying-ai-models-on-kubernetes) from the previous post — no managed AI service, just Postgres and an open model.

## How RAG works

RAG has two phases. **Indexing** happens offline whenever your documents change: split them into chunks, turn each chunk into a vector with an embedding model and store the vectors. **Query** happens on every request: embed the question, find the most similar chunks, and pass them to the LLM as grounding context.

![Indexing turns documents into chunks, embeds them and writes vectors to Postgres with pgvector; on each query the question is embedded, the top-k similar chunks are retrieved and passed to vLLM as context to produce a grounded answer](/diagrams/rag-pipeline.svg)

The key idea: the LLM never has to _remember_ your data, it just has to _read_ the few relevant chunks you put in front of it.

## Indexing: from documents to vectors

Two decisions shape retrieval quality more than anything else: how you chunk, and which embedding model you use.

**Chunking.** Split documents into passages small enough to be specific but large enough to stand alone. Around 500–800 tokens with a little overlap is a sensible default — overlap stops a sentence that straddles a boundary from losing its meaning.

```typescript
function chunk(text: string, size = 800, overlap = 150): string[] {
	const words = text.split(/\s+/);
	const step = size - overlap;
	const out: string[] = [];
	for (let i = 0; i < words.length; i += step) {
		out.push(words.slice(i, i + size).join(' '));
	}
	return out;
}
```

**Embeddings.** An embedding model maps text to a vector so that similar meanings sit close together. Serve one through the same OpenAI-compatible interface as your LLM — vLLM can host an embedding model directly — and call it with any OpenAI client:

```typescript
import OpenAI from 'openai';

const embedClient = new OpenAI({
	baseURL: 'http://vllm-embed.ai.svc.cluster.local:8000/v1',
	apiKey: 'not-needed',
});

async function embed(texts: string[]): Promise<number[][]> {
	const resp = await embedClient.embeddings.create({
		model: 'BAAI/bge-base-en-v1.5',
		input: texts,
	});
	return resp.data.map((d) => d.embedding);
}
```

**Storage.** `bge-base` emits 768-dimension vectors, so the table holds the chunk text plus a `vector(768)` column. An HNSW index keeps nearest-neighbour search fast as the table grows:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
    id        bigserial PRIMARY KEY,
    doc_id    text NOT NULL,
    content   text NOT NULL,
    embedding vector(768)
);

CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);
```

Then chunk, embed and insert each document:

```typescript
import {Client} from 'pg';
import pgvector from 'pgvector/pg';

const conn = new Client({connectionString: DSN});
await conn.connect();
await pgvector.registerType(conn);

for (const {docId, text} of await loadDocuments()) {
	const chunks = chunk(text);
	const vectors = await embed(chunks);
	for (const [i, content] of chunks.entries()) {
		await conn.query(
			'INSERT INTO chunks (doc_id, content, embedding) VALUES ($1, $2, $3)',
			[docId, content, pgvector.toSql(vectors[i])],
		);
	}
}
```

## Retrieval and generation

On a query, embed the question with the _same_ model, pull the closest chunks with pgvector's cosine-distance operator (`<=>`), then ask the LLM to answer using only that context:

```typescript
const llm = new OpenAI({
	baseURL: 'http://vllm.ai.svc.cluster.local:8000/v1',
	apiKey: 'not-needed',
});

async function answer(question: string, k = 5): Promise<string | null> {
	const [qvec] = await embed([question]);

	const {rows} = await conn.query(
		'SELECT content FROM chunks ORDER BY embedding <=> $1 LIMIT $2',
		[pgvector.toSql(qvec), k],
	);

	const context = rows.map((r) => r.content).join('\n\n');
	const resp = await llm.chat.completions.create({
		model: 'meta-llama/Llama-3.2-3B-Instruct',
		messages: [
			{
				role: 'system',
				content:
					"Answer using only the context below. If the answer isn't there, say you don't know.",
			},
			{role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}`},
		],
	});
	return resp.choices[0].message.content;
}
```

That system prompt is doing real work: instructing the model to stay within the retrieved context — and to admit when the answer isn't there — is what turns a confident hallucination into an honest "I don't know".

## Why pgvector?

You can reach for a dedicated vector database (Qdrant, Weaviate, Milvus), and at hundreds of millions of vectors you probably should. But if you already run Postgres, pgvector keeps your embeddings next to your relational data — one database to back up, secure and operate. You can filter by ordinary SQL columns and do the vector search in the same query:

```sql
SELECT content
FROM chunks
WHERE doc_id = ANY(%s)            -- ordinary metadata filter
ORDER BY embedding <=> %s
LIMIT 5;
```

For a platform team, not adding a new datastore is often worth more than the last few percent of recall.

## What actually moves the needle

The retrieval half of RAG is where most quality lives — the LLM can only be as good as the context you give it.

- **Chunk size and overlap.** Too large and you bury the relevant sentence in noise; too small and chunks lose context. Tune it against real questions, not in the abstract.
- **Hybrid search.** Pure vector search misses exact terms — error codes, product names, identifiers. Combine it with keyword search (Postgres full-text, or Elasticsearch) and merge the results.
- **Reranking.** Retrieve a generous top-20 with the cheap vector search, then reorder with a cross-encoder reranker and keep the best 5. This is often the single biggest quality win.
- **Citations.** Return the `doc_id` of each retrieved chunk alongside the answer so users can verify it. Grounding the model is good; letting people check its working is better.
- **Keep the index fresh.** Re-embed and upsert when a document changes. A RAG system is only as current as its last indexing run.
- **Measure it.** Track retrieval recall (did the right chunk make the top-k?) separately from answer faithfulness (did the model stick to the context?). When quality drops, that split tells you which half to fix.

RAG isn't one model call — it's a retrieval system with a language model on the end. Get the retrieval right and a small open model on your own hardware will answer questions about your data better than the largest frontier model that has never seen it.
