---
title: "Beyond 200 OK: connecting LLM traces to business outcomes with OpenTelemetry"
description: "The application-level semantic layer of LLM observability: representing user intent, answer quality and business outcomes as telemetry on the trace, and correlating spans with eval results and feedback to see whether the AI served the user."
date: "2026-06-22"
tags: ["AI", "Observability", "OpenTelemetry", "SRE"]
---

LLM observability operates at two levels. The **operational** level describes how a request ran — tokens, latency, cost, errors — and is instrumented with OpenTelemetry's `gen_ai.*` conventions, which I cover in [observability for AI applications](/blogs/observability-for-ai-applications-opentelemetry). The **application-level semantic** layer sits on top and describes what the request *meant* and whether it *served the user*: its intent, the quality of the answer and the outcome it led to.

This post explains that semantic layer — how to represent user intent, answer quality and business outcomes as telemetry attached to the trace, so an LLM application can be understood in terms of what users were trying to do rather than only whether the service responded.

## Why a successful response isn't a correct one

For a conventional service, a `200 OK` is a reliable proxy for success: correct behaviour and a successful response are tightly coupled, so availability and latency cover most of what you need to know.

LLM applications break that coupling. A model call can return `200 OK` in 1.8 seconds using 312 tokens and still produce an answer that is confidently wrong. The response was delivered successfully; it simply wasn't *right*. Operational metrics can't tell the difference — to a latency or error dashboard, a perfect answer and a hallucination look identical.

Application-level semantic observability addresses this by enriching the trace with two things operational metrics never carry: **what the user was trying to do**, and **what happened as a result**.

![A single trace whose root span carries user.task, session.intent and workflow.path, and whose model span carries cost, model version and retrieval inputs, joined by trace_id to three outcomes: an async eval that failed faithfulness, a thumbs-down from the user and a business event showing the conversation was escalated to a human](/diagrams/llm-traces-business-outcomes.svg)

A defining property of this layer is that the trace is **correlated with eval results and user-feedback events**: a span is understood not only by whether it responded, but by whether the answer was right and whether the user accepted it. The sections below build that picture up piece by piece.

## The semantic signals, and how they're monitored

Operational telemetry — the metrics, logs and traces your stack already emits — describes the **mechanics** of a request. The semantic layer adds a second set of signals describing its **meaning and outcome**: whether it understood the user's intent, whether the answer was grounded in the source material (faithfulness), whether it was relevant, whether it was safe, whether the user accepted it and whether the task resolved.

These are the **semantic signals**, and one practical distinction defines them: the operational signals are emitted by your stack automatically, while the semantic ones are *produced* — through evals, feedback capture and outcome joins — and then attached to the trace.

Monitoring them follows three steps: instrument the trace, produce the semantic signals from evals, feedback and business events, then correlate everything by trace ID and alert on semantic SLOs.

![How application-level semantics are monitored, in three steps: (1) instrument the trace with gen_ai.* spans and user intent on the root span; (2) produce semantic signals from an LLM-as-judge eval, user feedback and business events, each tagged with the trace_id; (3) correlate them by trace_id in Tempo, Prometheus and an eval store and monitor semantic SLOs — faithfulness pass rate, escalation rate by intent and cost per resolution — alerting when one is breached](/diagrams/llm-semantic-signals.svg)

The trace ID is the join key throughout: it stitches the model call to the eval, the feedback and the business outcome it produced. The rest of this post walks through each step — intent on the span, attributes on the model call, and correlation with evals, feedback and business events.

## Trace attributes as first-class citizens

The first move is to stop treating the interesting data as logging exhaust. Cost, prompt shape, model version and retrieval inputs belong **on the span as attributes**, not buried in a sidecar log you have to grep and manually line up by timestamp.

The difference is queryability. If the model version is a span attribute, "p95 latency by model version" or "cost since we shipped the new prompt" is one query. If it's in a log line, it's an afternoon of correlation. Put it on the span:

```python
with tracer.start_as_current_span("gen_ai.chat") as span:
    span.set_attribute("gen_ai.request.model", "gpt-4o")
    span.set_attribute("gen_ai.response.model", "gpt-4o-2026-05")  # exact version served
    span.set_attribute("gen_ai.usage.input_tokens", usage.input)
    span.set_attribute("gen_ai.usage.output_tokens", usage.output)
    span.set_attribute("gen_ai.usage.cost_usd", cost(usage))        # derived: tokens x price
    # retrieval inputs that produced this answer — so a bad answer is traceable
    span.set_attribute("rag.retrieval.doc_ids", retrieved_ids)
    span.set_attribute("rag.retrieval.top_score", top_score)
```

Recording the **retrieval inputs** matters more than it looks. When an answer is wrong, the first question is always "did the model hallucinate, or did it get fed the wrong context?" With the retrieved document IDs on the span you can answer it immediately, instead of trying to reconstruct what the retriever returned at the time.

## Anchoring to user intent

Attributes about the model tell you *how* the call ran. They still don't tell you *why* the user was there. That context lives at the top of the request, so put it on the **root span**: what the user was trying to accomplish.

```python
with tracer.start_as_current_span("chat.request") as root:
    root.set_attribute("user.task", "reset_password")
    root.set_attribute("session.intent", "account_recovery")
    root.set_attribute("workflow.path", "support/self-serve")
```

If the intent needs to be visible on child spans too — to slice the model call or the retrieval by it — propagate it with **baggage**, which rides alongside the trace context:

```python
from opentelemetry import baggage, context

ctx = baggage.set_baggage("session.intent", "account_recovery")
context.attach(ctx)
# a span processor can copy baggage onto every span in the trace
```

This is the unlock. Now you can ask questions that are about *users*, not infrastructure: which user tasks have the worst answer quality, whether `account_recovery` costs more per resolution than `billing`, whether one `workflow.path` quietly burns twice the tokens of another. The same telemetry, sliced by what people were actually trying to do.

## Closing the loop

Intent on the way in is half of it. The other half is the outcome — and the outcome usually arrives *later*, from a different system. The join key that makes this possible is the **trace ID**. Capture it at request time, return it to the client, and stamp it on everything downstream:

```python
from opentelemetry import trace

span_ctx = trace.get_current_span().get_span_context()
trace_id = format(span_ctx.trace_id, "032x")   # return this with the response
```

With that ID flowing outward, you can correlate the trace with the three signals that actually define whether the AI worked:

- **Eval failures.** An offline or async judge scores the answer — faithfulness, relevance, refusal — and writes the verdict keyed by trace ID. Now "show me the traces that failed faithfulness" is a real query.
- **Explicit feedback.** When the user clicks thumbs-down, the client posts that feedback back with the trace ID it was given. The complaint is now attached to the exact prompt, context and model version that produced it.
- **Business events.** Did the conversation convert? Was the support case resolved or escalated? Did the user abandon? Emit these with the trace ID (or join them in the warehouse), and you can finally measure the thing that matters: *of the answers that failed an eval, how many led to an escalation?*

That last query is the whole point. It connects a model span to revenue and resolution — the difference between "the service was up" and "the AI did its job."

## How the LLM-as-judge produces the eval scores

The faithfulness numbers used below — 71% for `technical_support`, 96% for `order_status` — come from an **LLM-as-judge**: a second model call that grades each answer against an explicit rubric. For faithfulness the rubric is groundedness — *is every factual claim in the answer supported by the retrieved context?* The judge is given the question, the retrieved context (the same `rag.retrieval.doc_ids` recorded on the span) and the answer, and returns a structured verdict.

![How the faithfulness pass rate is computed: inputs from the trace (question, retrieved context, answer) go to an LLM-as-judge that grades against a groundedness rubric, producing a structured verdict (score 0 to 1, pass if score is at least 0.7, plus a reason), which is aggregated by intent into a pass rate per user.task — for example 96% for order_status and 71% for technical_support; the judge is validated against human labels](/diagrams/llm-as-judge-eval.svg)

The judge runs off the hot path on sampled traffic, and the prompt asks for a numeric score and a short reason so each verdict is auditable:

```python
JUDGE_RUBRIC = """You are grading an answer for faithfulness.
Given the CONTEXT and the ANSWER, decide whether every factual claim in the
ANSWER is supported by the CONTEXT. Unsupported or invented claims fail.
Return JSON: {"score": 0.0-1.0, "supported_claims": int, "total_claims": int, "reason": "..."}"""

resp = judge.chat.completions.create(
    model="gpt-4o",                          # strong model, ideally not the one being judged
    response_format={"type": "json_object"},
    messages=[
        {"role": "system", "content": JUDGE_RUBRIC},
        {"role": "user", "content": f"CONTEXT:\n{context}\n\nANSWER:\n{answer}"},
    ],
)
verdict = json.loads(resp.choices[0].message.content)
passed = verdict["score"] >= 0.7             # the pass/fail threshold
```

Each verdict is written back against the trace ID, and the **faithfulness pass rate is simply the share of sampled answers that clear the 0.7 threshold, aggregated by `user.task`** — which is exactly the per-intent column on the dashboard.

Two things make those scores an instrument rather than another model's opinion:

- **A narrow, explicit rubric.** "Is every claim supported by the context?", with a claim count, is far more reliable than "is this a good answer?". Decomposing the answer into claims and, where you have them, comparing against a golden reference, scores far more consistently than a single holistic grade.
- **Calibration against humans.** The judge is itself an LLM, so before its scores drive decisions you validate them on a human-labelled set and measure agreement. A judge that matches human graders ~90% of the time is a usable instrument; one that doesn't is noise. You re-check that agreement whenever the judge model or rubric changes.

This is why faithfulness — a calibrated judge that scores every sampled conversation — carries the dashboard rather than thumbs-up, which is sparse and self-selecting.

## Where the eval actually runs

A natural question at this point: the trace belongs to the LLM request, so are we evaluating *inside* that request? No — and that separation is the whole architecture. Three things happen on three different timelines, joined by one `trace_id`.

![Where the eval runs: a synchronous request path (user request, model call, response plus trace with trace_id, with only inline guardrails running while the user waits), and three signals produced later and out of band — an async sampled eval worker running the LLM-as-judge, ad hoc human thumbs up/down feedback, and business events like resolution and escalation — each written back by trace_id and correlated in the observability backend for dashboards and semantic SLOs](/diagrams/llm-eval-architecture.svg)

1. **The request path (synchronous).** The user's call runs the model, returns the response and emits the trace — `trace_id`, prompt, retrieved context and answer on the spans. The user is waiting, so the *only* thing that runs here is a cheap, must-block guardrail (safety, PII). The judge does **not** run here: it would add a second model call's latency and cost to every request, for a verdict the user never sees.

2. **The eval path (asynchronous, sampled).** A separate worker runs the LLM-as-judge off the hot path — either consuming an eval queue the app publishes to at response time (`{trace_id, question, context, answer}`), or tailing the traces exported by the collector. It scores a *sample* of traffic, not all of it, and writes each verdict back keyed by `trace_id`, seconds to minutes later.

3. **The feedback path (ad hoc, human).** This is a separate source, not an eval. When the user clicks thumbs up or down, the client posts it with the `trace_id` it was handed at response time. It arrives whenever — seconds to days later. Business events such as resolution and escalation arrive the same way.

So evals and feedback are **two different signal sources on two different clocks**, and neither runs inside the request. The `trace_id`, captured at request time and carried outward, is the stable key that lets a verdict produced minutes later and a thumbs-down produced days later both join back to the exact model call that caused them. That leaves one open decision — what little *must* run inline versus what can wait off the hot path.

## Inline vs async quality checks

That decision comes down to a real tension: checking quality costs time, and the user is waiting. The resolution is to split checks by their purpose.

**Inline** — on the hot path, adding latency to the response. Reserve this for checks that are cheap and *must* block a bad response from reaching the user: a safety or policy filter, PII leakage, an obvious refusal or empty answer. These are guardrails, and a few hundred milliseconds is worth paying to stop a harmful answer.

**Async** — off the hot path, after the response has gone out. This is where the expensive quality work belongs: LLM-as-judge faithfulness scoring, relevance grading, semantic similarity to a golden answer. Running an LLM judge inline would often double your latency for a verdict the user never sees — so don't. Sample the traffic, score it in a consumer that reads the traces, and write the result back against the trace ID.

A practical pattern: tag each check with where it ran, so the latency budget is visible too.

```python
# inline guardrail — blocks, so keep it cheap
with tracer.start_as_current_span("guardrail.safety") as g:
    g.set_attribute("check.kind", "inline")
    g.set_attribute("check.passed", safe)

# async eval — emitted later, linked back to the original trace
with tracer.start_as_current_span(
    "eval.faithfulness",
    links=[trace.Link(original_span_context)],
) as e:
    e.set_attribute("check.kind", "async")
    e.set_attribute("eval.score", score)
    e.set_attribute("eval.passed", score >= 0.7)
```

The span **link** is the clean way to attach an async verdict to the request it judges without forcing it into the original trace's timing.

## What the data actually shows

Once intent is on the root span and outcomes are joined by trace ID, the dashboard stops being about infrastructure and starts being about the product. Here's the shape of it for a support assistant over a week — the same telemetry, sliced by `user.task` and joined to evals, feedback and resolution:

![A Grafana dashboard of AI outcomes by user intent: stat panels for 28.7k conversations, 88% eval pass rate, 11% escalation rate and $0.19 cost per resolution; a table breaking down faithfulness, thumbs-up, escalation and cost per resolution for each user.task; a panel showing escalation is 6.3x higher when the eval fails; and faithfulness pass rate by intent](/diagrams/grafana-llm-outcomes.svg)

Three findings jump out, and none of them are visible in a latency or token chart:

- **Quality is wildly uneven by intent.** `order_status` and `billing` answer faithfully 94–96% of the time and escalate 4–6%. `account_recovery` and `technical_support` sit at 71–78% faithfulness and escalate **31–38%**. Aggregate "88% pass rate" hid two intents that are quietly failing a third of their users. You only see this once you slice by what the user was trying to do.
- **Eval failure predicts escalation.** Answers that failed the faithfulness eval escalated **38% of the time, versus 6% when they passed — 6.3× higher.** That correlation is the proof that the eval is measuring something real, and it's the bridge from a model span to a business cost. Tokens and latency can't draw that line.
- **Cost per *resolution* tells a different story than cost per call.** `technical_support` costs **$0.63 per resolved conversation — 9× `order_status`** — not because each call is dear, but because failed answers get retried and escalated. Cost per call looked fine; cost per *outcome* exposed the waste.

The same data drawn as a funnel shows where users actually fall out — and how little of it availability monitoring can even see:

![A funnel from conversation to resolved: 28,710 conversations, 99% answered without error, 88% with a grounded answer that passed the eval, 80% where the user did not thumbs-down, and 72% where the task was resolved successfully — with a note that availability metrics only see the first two stages](/diagrams/llm-quality-funnel.svg)

The first two bars — conversations received and answered without an error — are the only ones a `200 OK` or an uptime SLO can see, and they sit at 99–100%. The drops that matter to the user happen *after* the response was successfully delivered: here, a quarter of conversations never reach a resolved outcome, which only the semantic layer surfaces.

## Using the signals to improve output quality

The semantic layer is most useful because it closes a loop — observe, diagnose, act, measure — that operational metrics can't drive on their own. Here is that loop applied to `technical_support`, the worst intent in the table above:

1. **Observe.** The dashboard flags `technical_support` at 71% faithfulness and 38% escalation — far below the rest. The aggregate looked fine; the per-intent slice made the problem unmissable.
2. **Diagnose.** Drill into the failing traces. The `rag.retrieval.doc_ids` on the spans show the retriever was returning generic FAQ pages, not the device-specific articles — and the model was dutifully answering from the wrong context. The failure was **retrieval, not the model**. You can only know that because the retrieval inputs are on the span.
3. **Act.** Three targeted changes, each tied to that diagnosis and shipped separately so its effect is visible:
   - a **reranker plus fixed chunking**, because retrieval was the diagnosed cause
   - **prompt v2**, instructing the model to answer only from the supplied context and cite the source, to cut confidently-ungrounded answers
   - **routing the hardest queries to a stronger model**, to mop up the long tail
4. **Measure.** Watch the *same* semantic signal move after each deploy.

![A Grafana time series of faithfulness pass rate over eight weeks for technical_support and account_recovery, rising from 71% and 78% towards 90% with dashed markers at the reranker, prompt v2 and model-routing interventions, and a target line at 90%](/diagrams/grafana-llm-quality-improvement.svg)

The results over the eight weeks:

- **`technical_support` faithfulness: 71% → 91%**, and its escalation rate fell from **38% to 14%**.
- **`account_recovery`: 78% → 89%** on the same changes.
- The **reranker gave the biggest single jump** (+10 points), confirming the retrieval diagnosis; the prompt change cut the confidently-wrong answers; the model route handled the remainder.

The point isn't the numbers — it's that **each change was attributable**. Because faithfulness was measured for `technical_support` specifically and tied to a deploy, you know which fix worked and which didn't. Without trace-level semantic signals you'd have shipped three changes against a blended aggregate, watched it barely move, and had no idea which one to keep. That attribution is the entire return on building the semantic layer.

## In summary

Application-level semantic observability is built from a handful of concrete pieces, all anchored to the trace:

- **Intent on the root span** — `user.task`, `session.intent`, `workflow.path` — so telemetry can be sliced by what the user was doing.
- **Attributes on the model span** — cost, model version and retrieval inputs — so each answer is queryable and its context reconstructable.
- **The trace ID carried outward** — to evals, user feedback and business events — so quality and outcome become signals you can join, not anecdotes.
- **Inline guardrails and async evals** — split by their latency cost — feeding verdicts back to the trace.

Together these form the semantic layer that sits on top of the operational `gen_ai.*` instrumentation: operational telemetry describes whether the service responded, and the semantic layer describes whether it served the user.
