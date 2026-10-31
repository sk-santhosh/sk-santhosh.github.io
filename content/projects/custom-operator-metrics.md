---
title: Custom Operator Metrics
blurb: Instrumenting the events a controller actually decides on, not the ones the framework hands you for free.
summary: "controller-runtime gives every operator reconcile counts and latency for free. They prove the controller is alive and say nothing about whether work is getting done. This defines metrics for the domain events across the pipeline, and ships the scrape config and dashboard in the same repo as the code they describe."
year: "2026"
order: 5
featured: false
category: Observability
tags: [Prometheus, Grafana, OpenTelemetry, Helm, controller-runtime]
impact:
  - value: "0"
    label: framework metrics on the dashboard
  - value: "3"
    label: components, one dashboard
repo: https://github.com/sk-santhosh/serverless-poc/tree/main/deploy/helm/monitoring
---

Build an operator with controller-runtime and you get a metrics endpoint
without asking: reconcile totals, error totals, duration, workqueue depth.
It is a good free gift, and it answers exactly one question — *is the
controller running and keeping up?*

It cannot tell you whether the system is doing its job, because the
framework has no idea what your controller is for. The useful metrics are
the ones you define yourself, named after events in your own domain.

## The problem it solves

"The controller is healthy" and "work is getting done" are different
statements, and only one of them matters to a user.

This operator could be reconciling cleanly every five seconds, zero errors,
sub-millisecond latency — a perfect set of framework metrics — while the
Redis queue grows without bound because the worker image is crash-looping.
Every generic signal would be green.

The tell is in the finished dashboard: **not one panel queries a
`controller_runtime_*` series.** Every single one reads a metric that was
defined for this pipeline.

## How it works

<figure class="diagram">
<svg viewBox="0 0 760 214" role="img" aria-label="The webapp and worker push OTLP metrics to a collector, whose Prometheus exporter is scraped on port 8889. The operator exposes its custom metrics on its own endpoint and is scraped there. Both scrapes are ServiceMonitors, and both land in one Prometheus feeding one Grafana dashboard.">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#8c857c"/>
    </marker>
  </defs>
  <g fill="none" stroke="#c9c2b8" stroke-width="1.25">
    <rect x="6" y="8" width="158" height="42"/>
    <rect x="6" y="66" width="158" height="42"/>
    <rect x="6" y="150" width="158" height="46"/>
    <rect x="248" y="30" width="136" height="52"/>
    <rect x="462" y="92" width="140" height="52"/>
    <rect x="656" y="92" width="98" height="52"/>
  </g>
  <g stroke="#8c857c" stroke-width="1.25" marker-end="url(#ar)" fill="none">
    <path d="M164 29 L242 48"/>
    <path d="M164 87 L242 68"/>
  </g>
  <g stroke="#ee5126" stroke-width="1.5" marker-end="url(#ar)" fill="none">
    <path d="M384 62 L456 104"/>
    <path d="M164 173 H370 Q400 173 410 152 L448 124 Q454 120 456 119"/>
  </g>
  <g stroke="#8c857c" stroke-width="1.25" marker-end="url(#ar)" fill="none">
    <path d="M602 118 H650"/>
  </g>
  <g font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#131211" text-anchor="middle">
    <text x="85" y="27">① webapp</text>
    <text x="85" y="85">① worker</text>
    <text x="85" y="170">② operator</text>
    <text x="316" y="52">OTel Collector</text>
    <text x="316" y="68">prometheus exporter</text>
    <text x="532" y="114">③ Prometheus</text>
    <text x="532" y="130">one store</text>
    <text x="705" y="124">④ Grafana</text>
  </g>
  <g font-family="ui-monospace, monospace" font-size="9.5" fill="#7a736a" text-anchor="middle">
    <text x="85" y="42">webapp_subscribe_requests</text>
    <text x="85" y="100">worker_emails_processed</text>
    <text x="85" y="188">queueworker_queue_depth</text>
  </g>
  <g font-family="ui-monospace, monospace" font-size="9.5" fill="#8c857c" text-anchor="middle">
    <text x="196" y="18">OTLP push</text>
    <text x="196" y="112">OTLP push</text>
  </g>
  <g font-family="ui-monospace, monospace" font-size="9.5" fill="#ee5126" text-anchor="middle">
    <text x="436" y="76">scrape :8889</text>
    <text x="286" y="142">scrape /metrics</text>
  </g>
</svg>
<figcaption>Both orange arrows are ServiceMonitor scrapes. What differs is where the push/pull boundary sits — ephemeral components push to a collector first, and the collector is what gets scraped.</figcaption>
</figure>

1. **Short-lived components push.** The worker exists for seconds and the
   webapp is a Next.js route, so both emit OpenTelemetry over OTLP to a
   collector. The collector runs the contrib image for its Prometheus
   exporter, which re-publishes everything it receives on port 8889.
2. **The operator is scraped at the source.** It is a long-running
   Deployment, so there is nothing to push through — Prometheus reads the
   endpoint the custom gauges were registered onto directly.
3. **Both arrows into Prometheus are ServiceMonitor scrapes.** Worth being
   precise about: the collector is scraped by one too. The transports differ
   only in *where* the push/pull boundary sits, not in how Prometheus is
   told to look — and past this point nothing knows which component was
   ephemeral.
4. **One dashboard reads across all three**, so "submissions went up, queue
   depth went up, workers did not" is a single glance rather than three
   tabs.

## Registering into the endpoint that already exists

The operator's custom metrics go into controller-runtime's own registry
rather than a second HTTP server. One endpoint, one scrape target, custom
series sitting beside the framework ones:

```go
func init() {
	metrics.Registry.MustRegister(queueDepthGauge, runningJobsGauge, jobsCreatedCounter)
}
```

They are then set at the moment the controller makes its decision — not
sampled afterwards on a timer — so the gauge is always the number the
reconcile actually acted on:

```go
	queueDepthGauge.WithLabelValues(qw.Name, qw.Spec.Redis.Stream).Set(float64(depth))
	runningJobsGauge.WithLabelValues(qw.Name, qw.Spec.Redis.Stream).Set(float64(running))
```

## Labels are where the thinking goes

The metric name says what happened; the labels are what make it
*answerable*. Each one here was chosen to separate causes that need
different responses:

- `{queueworker, stream}` on the operator's series — without it, every
  declared queue collapses into one line that says something is backed up
  but not which thing.
- `{outcome}` on `worker_emails_processed` — a broken SMTP server and a
  malformed message are both "failures" and have nothing else in common.
- `{source}` on `worker_messages_claimed` — distinguishes normal delivery
  from messages reclaimed off a dead consumer, which is the signal that
  workers are dying mid-flight.

A counter without those labels tells you a number went up. With them it
tells you what to go and fix.

## Where the dashboard lives

The ServiceMonitors and the dashboard sit in their own `monitoring` chart,
not inside the operator chart — so the operator still installs on a cluster
that has never heard of Prometheus. That chart pulls `kube-prometheus-stack`
and `opentelemetry-collector` as dependencies and brings the CRDs its own
templates need.

The part that matters is that it lives in the **same repository** as the
code it describes. Keep dashboards in a central monitoring repo owned by
another team and they version separately from the controller, so a metric
rename silently blanks a panel. Here both land in one commit.

## What I would tell you before adopting it

Every label multiplies series count, and the pressure is always to add one
more. `{queueworker, stream}` is bounded by how many queues you declare; a
message ID would not be, and would turn a metrics store into a very
expensive log store.

The honest gap today is that neither ServiceMonitor is guarded by a
conditional — they assume the Prometheus Operator CRDs exist, which is true
only because the monitoring chart installs them.

The dashboard JSON, chart templates and instrumentation are in the
[repo](https://github.com/sk-santhosh/serverless-poc/tree/main/deploy/helm/monitoring).
