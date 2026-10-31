---
title: OTLP Push Metrics for Short-Lived Jobs
blurb: Getting metrics out of worker pods that live for seconds — shorter than any scrape interval.
summary: Prometheus pulls metrics on a timer, which means a pod that exists for five seconds is never measured at all. The worker pushes OpenTelemetry metrics to a collector instead, and flushes them on the way out, so the numbers survive the pod that produced them.
year: "2026"
order: 2
featured: true
category: Observability
tags: [OpenTelemetry, OTLP, TypeScript, Prometheus, Kubernetes Jobs]
impact:
  - value: "Push"
    label: not scraped
  - value: "5s"
    label: bounded flush
repo: https://github.com/sk-santhosh/serverless-poc/tree/main/worker
---

Prometheus works by pulling: every thirty seconds or so it visits each target
and reads whatever counters are there. That model assumes the thing being
measured is still running when it comes knocking.

The workers in this system are not. Each one is a Kubernetes Job that starts,
handles a single message and exits — a lifetime measured in seconds. A scrape
will essentially never catch one alive, so by default these pods do their work
completely unmeasured.

## The problem it solves

The usual answer is Pushgateway, where short-lived jobs park their metrics for
Prometheus to collect later. It works, but it makes you responsible for the
lifetime of every series you push: Pushgateway holds them indefinitely, so a
one-off job's numbers sit there looking current for days until somebody
deletes them.

Pushing OpenTelemetry to a collector sidesteps that. The worker reports what
happened and exits; the collector is a long-lived process that Prometheus can
scrape normally, and it ages the data out on its own.

## How it works

<figure class="diagram">
<svg viewBox="0 0 760 192" role="img" aria-label="The operator injects the collector endpoint into the worker Job through a ConfigMap. The worker records metrics in memory and flushes them over OTLP as it exits. The collector is long-lived, so Prometheus scrapes it normally.">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#8c857c"/>
    </marker>
  </defs>
  <g fill="none" stroke="#c9c2b8" stroke-width="1.25">
    <rect x="6" y="6" width="190" height="40"/>
    <rect x="6" y="74" width="190" height="62"/>
    <rect x="22" y="88" width="158" height="34"/>
    <rect x="300" y="74" width="160" height="62"/>
    <rect x="568" y="74" width="186" height="62"/>
  </g>
  <g stroke="#8c857c" stroke-width="1.25" marker-end="url(#ar)" fill="none">
    <path d="M101 46 V68"/>
    <path d="M196 105 H294"/>
    <path d="M460 105 H562"/>
  </g>
  <g stroke="#ee5126" stroke-width="1.5" fill="none" stroke-dasharray="4 3">
    <path d="M101 136 V166 H380 V142"/>
  </g>
  <path d="M380 136 l-4 -7 h8 z" fill="#ee5126"/>
  <g font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#131211" text-anchor="middle">
    <text x="101" y="31">① endpoint from a ConfigMap</text>
    <text x="101" y="110">② records in memory</text>
    <text x="380" y="99">④ OTel Collector</text>
    <text x="380" y="117">long-lived</text>
    <text x="661" y="99">⑤ Prometheus</text>
    <text x="661" y="117">scrapes the collector</text>
  </g>
  <g font-family="ui-sans-serif, system-ui, sans-serif" font-size="11" fill="#7a736a" text-anchor="middle">
    <text x="101" y="68">worker Job pod — lives seconds</text>
  </g>
  <g font-family="ui-monospace, monospace" font-size="10.5" fill="#ee5126" text-anchor="middle">
    <text x="245" y="98">OTLP/HTTP</text>
    <text x="240" y="179">③ flush on exit</text>
  </g>
</svg>
<figcaption>The collector is the long-lived thing Prometheus scrapes. The pod only has to survive long enough to flush.</figcaption>
</figure>

Following the numbers:

1. **The operator injects the target.** Each queue gets a ConfigMap carrying
   `OTEL_EXPORTER_OTLP_ENDPOINT`, so the worker image has no hard-coded host
   and the same image works in any cluster.
2. **The worker records to memory** as it runs — messages claimed, emails
   sent or failed, how long the send took.
3. **On exit it flushes.** This is the actual delivery mechanism. A periodic
   exporter is configured, but at sixty seconds it will never fire inside a
   pod that lives for five; a shorter interval would just add network
   round-trips to every worker for nothing.
4. **The collector receives and batches**, and unlike the worker it is always
   running.
5. **Prometheus scrapes the collector** on its normal schedule, which is the
   part that was impossible before.

The shift is small but complete: nothing downstream has to know that the
producer was ephemeral.

## The flush needs a stopwatch on it

The one piece of code worth reading closely is the shutdown, because the
obvious version has a failure mode:

```ts
export async function shutdownTelemetry(): Promise<void> {
  await Promise.race([
    provider.shutdown().catch((err) => {
      console.error("Failed to flush telemetry:", err);
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 5_000).unref()),
  ]);
}
```

`provider.shutdown()` forces the pending batch out, but if the collector is
unreachable it will block — leaving a pod that has finished its real work
still running, still holding a concurrency slot the operator is counting
against the queue. Racing the flush against a five-second timer caps that
damage. The `.unref()` matters too: without it, the pending timer would keep
Node's event loop alive for the full five seconds even when the flush
returned immediately.

It is called from the worker's `finally` block, so it runs on success,
failure and malformed-message paths alike.

## What I would tell you before adopting it

Push moves the reliability problem rather than removing it. If the collector
is down at the moment a worker exits, those metrics are gone — there is no
later scrape to catch up. For per-job counters that is an acceptable loss.
For anything you would bill a customer against, it is not.

The worker, its telemetry module and the chart that injects the endpoint are
in the [repo](https://github.com/sk-santhosh/serverless-poc/tree/main/worker).
