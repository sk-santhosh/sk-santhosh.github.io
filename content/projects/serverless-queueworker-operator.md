---
title: Serverless Scale-to-Zero on Kubernetes
blurb: A generic Go operator that runs one worker Job per queued message, and nothing at all when the queue is empty.
summary: "Serverless platforms bill you for work, not for capacity. This gets the same behaviour out of plain Kubernetes: a custom resource points a Redis stream at a container image, and a controller creates exactly as many single-shot Jobs as there are messages waiting."
year: "2026"
order: 1
featured: false
category: Platform
tags: [Go, controller-runtime, Redis Streams, Kubernetes, CRD]
impact:
  - value: "1 Job"
    label: per message
  - value: "0"
    label: pods when idle
repo: https://github.com/sk-santhosh/serverless-poc
---

The idea behind serverless is that idle work should cost nothing. Kubernetes
does not give you that by default — a Deployment with one replica is one pod
burning memory all night whether or not anything needs doing.

This project gets the serverless shape out of ordinary Kubernetes primitives.
You declare a `QueueWorker`: here is a Redis stream, here is a container
image, run at most *N* of them at once. A controller watches how much work is
waiting and creates one short-lived Job per message. When the queue drains,
the Jobs finish, Kubernetes garbage-collects them, and nothing is left
running.

## The problem it solves

A queue consumer is the worst possible fit for normal autoscaling. HPA scales
on CPU, but a worker blocked on a queue read is using no CPU while being
exactly the thing you need more of. So teams pin a minimum replica count and
pay for idle capacity, or they under-provision and the backlog grows quietly.

The signal that actually matters is **how many messages are waiting**, and
the correct floor is **zero**.

## How it works

<figure class="diagram">
<svg viewBox="0 0 760 206" role="img" aria-label="A web form appends a message to a Redis stream. The operator reads the consumer group's backlog, compares it with the Jobs already running, and creates the difference as new single-shot Jobs, each processing one message.">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#8c857c"/>
    </marker>
  </defs>
  <g fill="none" stroke="#c9c2b8" stroke-width="1.25">
    <rect x="6" y="78" width="118" height="50"/>
    <rect x="176" y="78" width="136" height="50"/>
    <rect x="176" y="8" width="136" height="44"/>
    <rect x="386" y="78" width="146" height="50"/>
    <rect x="610" y="40" width="144" height="38"/>
    <rect x="610" y="92" width="144" height="38"/>
    <rect x="610" y="144" width="144" height="38"/>
  </g>
  <g stroke="#8c857c" stroke-width="1.25" marker-end="url(#ar)" fill="none">
    <path d="M124 103 H170"/>
    <path d="M312 103 H380"/>
    <path d="M532 95 L604 62"/>
    <path d="M532 103 H604"/>
    <path d="M532 111 L604 158"/>
  </g>
  <g stroke="#ee5126" stroke-width="1.4" marker-end="url(#ar)" fill="none">
    <path d="M244 78 V58"/>
  </g>
  <g font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#131211" text-anchor="middle">
    <text x="65" y="99">① web form</text>
    <text x="65" y="116">XADD</text>
    <text x="244" y="99">② Redis Stream</text>
    <text x="244" y="116">consumer group</text>
    <text x="244" y="34">③ XINFO GROUPS</text>
    <text x="459" y="99">④ operator</text>
    <text x="459" y="116">poll, then create</text>
    <text x="682" y="64">⑤ Job → one message</text>
    <text x="682" y="116">⑤ Job → one message</text>
    <text x="682" y="168">⑤ Job → one message</text>
  </g>
  <g font-family="ui-monospace, monospace" font-size="10.5" fill="#ee5126" text-anchor="middle">
    <text x="346" y="98">depth</text>
  </g>
</svg>
<figcaption>Five steps, and the operator never touches a message.</figcaption>
</figure>

Reading the diagram left to right:

1. **Something enqueues work.** In the demo it is a Next.js signup form, but
   the operator neither knows nor cares what the producer is.
2. **Redis holds the backlog** in a stream with a consumer group, which is
   what gives at-least-once delivery and lets a dead worker's message be
   picked up by another.
3. **The operator asks how deep the queue is** — and only that. It never
   reads, processes or acknowledges a message.
4. **It compares depth with the Jobs already running** and creates the
   difference, capped by the concurrency limit on the custom resource.
5. **Each Job runs the worker image once**, handles a single message, acks
   it and exits. A TTL reaps the finished Job.

The division of labour in steps 3–5 is the design. The operator owns *how
many* workers exist; the Redis consumer group owns *which* worker gets
*which* message, including retries and reclaiming from crashed pods. Neither
has to know about the other, which is why the CRD contains no mention of
email even though the demo sends email.

## The one line worth stealing

Everything above collapses into a single subtraction, and the subtlety is in
how `depth` is obtained:

```go
	depth = g.Pending
	// Lag is unknown (reported <= 0) after XDEL/XSETID; fall back
	// to pending-only rather than over- or under-counting.
	if g.Lag > 0 {
		depth += g.Lag
	}

	// …then, once the Jobs already running have been counted:
	desired := int(minInt64(depth, int64(qw.Spec.MaxConcurrency))) - running
```

`Lag` is messages nobody has taken yet; `Pending` is messages delivered to a
consumer but not yet acknowledged — work genuinely in flight, plus anything
whose worker died before acking. You need both, and you must not use `XLEN` —
`XACK` does not remove entries from a stream, so its length only ever grows
and a controller trusting it would scale up forever. That one mistake is the
difference between this working and a runaway Job loop.

## What I would tell you before adopting it

There is no scale-*down* path because there is nothing to scale down, but
there is a cost: a message waits up to one poll interval before a Job is even
created, plus scheduling and image pull. That is fine for batch work and
wrong for anything a user is waiting on. The poll interval is a latency
budget, not a tuning knob.

The full controller, CRD and Helm charts are in the
[repo](https://github.com/sk-santhosh/serverless-poc).
