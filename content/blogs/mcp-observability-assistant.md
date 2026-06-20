---
title: "Analysing incidents in plain language with MCP and AI"
description: "Investigating incidents by asking questions in plain language — exposing Prometheus, Loki and Tempo as tools an AI assistant calls over the Model Context Protocol, instead of reaching for PromQL, LogQL and TraceQL."
date: "2026-06-19"
tags: ["AI", "MCP", "Observability", "Platform Engineering"]
---

It's 2am. The checkout service is slow. You have everything you need — metrics in Prometheus, logs in Loki, traces in Tempo — but answering "why" means pivoting between three tools and writing PromQL, then LogQL, then TraceQL from memory, half-awake. The data is there. The friction is the query languages and the context-switching.

So I wired the observability stack up as a set of tools an AI assistant can call over the **Model Context Protocol (MCP)**, and analysing an incident became a plain-language conversation. The on-call engineer asks "why was checkout slow around 14:00?" — in human language, not query languages — and the model does the querying and correlation across metrics, logs and traces.

## What MCP gives you

MCP is an open protocol that lets an AI assistant call tools and read data you expose. You write an **MCP server** that publishes a set of typed tools; an **MCP client** — Claude Desktop, Claude Code, an IDE or your own agent — connects to it, and the model decides when to call each tool and how to chain them.

The important shift: you don't build a chatbot with hard-coded queries. You expose capabilities, and the model orchestrates them. Add a `query_tempo` tool today and every MCP client can use it tomorrow, without changing the client.

![An engineer asks an AI assistant (MCP client) in plain English; the assistant calls tools on an MCP server — query_prometheus, query_loki, query_tempo — which hit the Prometheus, Loki and Tempo HTTP APIs and return results the model correlates](/diagrams/mcp-observability.svg)

## The tools to expose

The server is a thin, read-only adapter over each backend's HTTP API. Three tools cover most investigations:

- `query_prometheus(promql, start, end, step)` — metrics: latency, error rate, saturation
- `query_loki(logql, start, end, limit)` — logs filtered by label and pattern
- `query_tempo(traceql, start, end)` and `get_trace(trace_id)` — traces and spans

With the Python MCP SDK, a tool is just a decorated function. The docstring and type hints *are* the interface the model sees, so they need to be clear:

```python
from mcp.server.fastmcp import FastMCP
import httpx

mcp = FastMCP("observability")
PROM = "http://prometheus.monitoring.svc.cluster.local:9090"

@mcp.tool()
def query_prometheus(promql: str, start: str, end: str, step: str = "30s") -> dict:
    """Run a PromQL range query. Times are RFC3339.
    Use for metrics: request latency, error rate, CPU and memory saturation."""
    r = httpx.get(
        f"{PROM}/api/v1/query_range",
        params={"query": promql, "start": start, "end": end, "step": step},
        timeout=15,
    )
    r.raise_for_status()
    return r.json()["data"]
```

`query_loki` and `query_tempo` follow the same shape against `/loki/api/v1/query_range` and Tempo's `/api/search` — a few dozen lines each. The model writes the PromQL and LogQL; your job is to hand it a safe, well-described door into each system.

## What an investigation looks like

Ask: *"Why was checkout slow between 14:00 and 14:15 today?"* The model strings the tools together on its own:

1. **`query_prometheus`** — p99 latency for `checkout` over that window. It sees a spike at 14:05.
2. **`query_loki`** — error-level logs for `checkout` in the same window. It finds a burst of database timeouts.
3. **`query_tempo`** — the slowest traces in that window. The bottleneck span is a connection-pool wait on Postgres.
4. It correlates the three and answers: *the latency spike came from Postgres connection-pool exhaustion at 14:05; here are the metric, the log lines and a trace ID.*

That is exactly the path an experienced engineer takes — metric anomaly, then logs for the cause, then a trace to confirm — but driven from one plain-language question.

## Guardrails — this is the part that matters

Handing an LLM a query interface to production telemetry needs firm boundaries. The discipline lives in the server, not the prompt:

- **Read-only by construction.** The server only ever calls query endpoints. There is no path to delete a series, change a config or silence an alert.
- **Bounded queries.** Enforce a maximum time range and step, cap result rows and set hard HTTP timeouts, so a careless query can't melt Prometheus or pull gigabytes of logs.
- **Scoped credentials.** The server runs with its own least-privilege token. The AI inherits exactly what the server can reach — nothing more.
- **Redaction.** Logs carry secrets and personal data. Strip or mask sensitive fields before returning them, especially if the client or model is outside your trust boundary.
- **Audit everything.** Log every tool call with its arguments. You want a record of what was asked and what was returned.

## Where it runs

The MCP server is a small service that lives next to your observability stack — a single container in the same cluster, reaching Prometheus, Loki and Tempo over in-cluster DNS. Locally it speaks stdio to a desktop client; in the cluster it serves over HTTP for shared or agent use. Either way it stays inside your network: the telemetry never leaves, only the questions and answers cross the boundary.

The payoff is a change in who can debug. Analysing an incident across three telemetry systems stops being a skill you must carry in your head at 2am and becomes a conversation. The query languages don't go away — the MCP server still speaks them fluently — they just stop being the thing standing between a question and an answer.
