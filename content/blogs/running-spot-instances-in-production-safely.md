---
title: 'Spot instances in production: when to use them, when not to and how to maintain availability'
description: 'When spot instances are the right call, when not to use them at all, and how to keep a service available even as AWS reclaims nodes underneath it. A workload-by-workload model with the reasoning behind each decision.'
date: '2026-06-09'
tags: ['AWS', 'Spot Instances', 'Reliability', 'Cost Optimisation']
---

Spot capacity is the same hardware as on-demand at up to 90% off, and the usual reaction is that it's too risky for production. It isn't — for the right workloads, designed the right way. The risk was never spot itself; it's running the _wrong_ workload on it, or running the _right_ workload without the safety net. The whole game is keeping a service available while AWS reclaims the nodes underneath it. This post answers three questions in order: **when** spot is the right call, **when not** to use it at all and **how** to maintain availability when you do.

It's the reliability companion to the [Karpenter cost post](/blogs/reducing-kubernetes-costs-karpenter-spot) — that one covered provisioning and savings, this one is about staying up while running on capacity that can vanish.

## The only guarantee spot gives you

Spot makes exactly one promise: a **two-minute interruption notice** before the node is reclaimed. Every decision below follows from that single fact.

There's also a **rebalance recommendation** — an earlier, best-effort signal that a reclaim is becoming likely. Treat it as a bonus, not a guarantee: it may arrive well ahead of time, or not at all. Design for the two minutes; act on the rebalance hint if you get it.

![Timeline of a spot reclaim: an early best-effort rebalance recommendation, then the interruption notice at T−2:00 opening a two-minute window in which Karpenter drains the node and your app handles SIGTERM, ending with the node reclaimed at T−0:00](/diagrams/spot-interruption-lifecycle.svg)

## Voluntary vs involuntary disruption

This is the distinction that trips most people up, and getting it wrong is how "protected" workloads still lose data.

- **Voluntary disruption** — consolidation, node upgrades, rollouts. PodDisruptionBudgets, the `karpenter.sh/do-not-disrupt` annotation and long termination grace periods all apply here.
- **Involuntary disruption** — spot reclaim, hardware failure. **None of those controls apply.** AWS takes the node back regardless of your PDBs or annotations.

The practical consequence: you cannot "pin" a long-running pod safely onto spot. Setting `terminationGracePeriodSeconds` to 600 does nothing against a reclaim — the pod is force-killed at the two-minute mark anyway. Availability on spot is a property of the _workload design_, not a flag you set on the node. Keep this in mind for everything that follows.

## When spot is the right call

Two things have to line up: the **economics** have to be worth it, and the **workload** has to tolerate a reclaim.

The economics are usually obvious. On a typical cluster compute dominates the bill, spot is 60–90% cheaper than on-demand, and the discount applies to identical hardware. If a workload runs at any real scale, the savings are material.

Whether the workload tolerates a reclaim comes down to one rule:

> If the workload is killed at any moment and retried from scratch, and the outcome is still **correct** (just slower), it belongs on spot. If kill-and-retry could be **wrong or lost**, it does not.

The workloads that pass, and _why_ they pass:

- **Stateless services behind a load balancer, with several replicas.** A reclaim drops one replica; the load balancer reroutes to the others and a replacement spins up. No request is lost as long as you never run the last copy on spot.
- **Queue-driven workers.** If a worker dies mid-task the message returns to the queue and another worker reprocesses it. The unit of work survives the node.
- **Batch jobs, data processing and CI runners.** Re-runnable by nature — the worst case of a reclaim is that the job takes longer, not that it produces a wrong result.
- **Cache nodes and read replicas.** They rebuild or resync from the source of truth, so losing one is a performance blip, not a correctness problem.

For all of these, running on on-demand means paying a premium for reliability the workload doesn't need. That's the real justification for spot: not just that it's cheaper, but that for these workloads the thing you'd be paying extra for adds nothing.

## When not to use spot

This is the half people skip, and it's where spot earns its bad reputation. Some workloads should stay on on-demand — not out of caution, but because the maths or the failure mode genuinely doesn't work.

- **Stateful singletons without fast failover.** One copy means a reclaim is downtime, and possibly data loss with no second copy to serve from. The two-minute window isn't enough to safely relocate state. Databases are the classic case — keep the data tier on on-demand by default.
- **Non-idempotent one-shot side effects.** If retrying could charge a card twice, send a duplicate email or double-post to an external system, at-least-once retries turn a reclaim into a real-world error. Make it idempotent first, or keep it on on-demand.
- **Leader-elected controllers and singletons where two concurrent runs are wrong.** A reclaim mid-handover can briefly produce two active instances; if that corrupts state rather than just wasting effort, spot is the wrong home.
- **Strict low-latency workloads with no slack.** If the reschedule churn — pods moving, connections re-establishing — would breach a tight latency SLO, the savings aren't worth the jitter.
- **Long in-memory work that can't checkpoint.** Anything holding minutes or hours of unrecoverable in-memory state will lose it on reclaim. Either add checkpointing or keep it on on-demand.
- **Workloads you can't diversify.** If you're pinned to one scarce instance type — a specific GPU available in a single zone, say — you can't spread across pools, so interruptions are correlated and a single reclaim can take everything. Spot's availability model depends on diversity it can't have here.
- **When the savings don't justify the engineering.** Spot isn't free — it costs the effort of making a workload reclaim-tolerant and testing it. For a small, cheap or rarely-run workload, that effort can outweigh the savings. On-demand is the honest choice when the complexity costs more than it returns.

The throughline: spot is wrong wherever a kill-and-retry is incorrect, where you can't diversify, or where keeping it available costs more than it saves.

## How to maintain availability on spot

Passing the test makes a workload _eligible_. These patterns are what keep the service available when a node is reclaimed underneath it — the difference between a reclaim that's a non-event and one that's an outage.

### Replicate and spread

Never run the last copy of anything on a single spot node. Run multiple replicas, spread them across zones and instance types with topology constraints, and add a PDB so _voluntary_ disruption can't drop you below a safe count.

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels: {app: checkout}
  - maxSkew: 1
    topologyKey: kubernetes.io/hostname
    whenUnsatisfiable: ScheduleAnyway
    labelSelector:
      matchLabels: {app: checkout}
```

### Drive work from a queue

This is what makes a background job safe even if it runs longer than two minutes. Put the work behind a queue with at-least-once delivery and set the **visibility timeout longer than your maximum processing time**. If a worker is reclaimed mid-task, the message reappears and another worker picks it up.

A three-minute job on a node that's reclaimed at minute two is a non-event under this model — the message simply returns to the queue and runs again elsewhere. Without it, those three minutes of work are lost.

### Make it idempotent

Retries are only safe if reprocessing the same item is harmless. Use a dedupe key, an upsert or a "skip if already done" check. This is the non-negotiable companion to queue-driven retries — without it, at-least-once delivery becomes at-least-once _corruption_.

### Handle SIGTERM gracefully

When the node drains, your pod gets SIGTERM. Use the window: stop accepting new work, finish or checkpoint what's in flight, then exit. Keep the grace period under the two-minute budget.

```javascript
let shuttingDown = false;

process.on('SIGTERM', async () => {
	shuttingDown = true; // stop pulling new messages
	await finishInFlight(); // let current work drain or checkpoint
	await queue.close();
	process.exit(0);
});

async function loop() {
	while (!shuttingDown) {
		const job = await queue.receive();
		if (job) await handleIdempotently(job);
	}
}
```

A SIGTERM handler that's never exercised is a handler that doesn't work — test it.

### Checkpoint long work

For anything that genuinely runs for minutes, save progress periodically so a restart resumes rather than starting over. Losing two minutes of a long computation is annoying; losing two hours because nothing was checkpointed is an outage.

### Diversify, or none of this matters

The single biggest availability lever for spot is **instance-type and zone diversity**. Each instance type in each zone is a separate capacity pool, and reclaims hit pools, not your whole fleet. Allow fifteen instance types and a reclaim takes out a sliver you can absorb; pin to one type and a single pool drying up takes everything at once. A provisioner like Karpenter does this for you when you give it broad requirements rather than a single instance type.

### Blend spot and on-demand deliberately

Going 100% spot is rarely the right call for a production service. Two patterns work well:

- **On-demand base, spot burst.** Keep a floor of on-demand capacity sized for the steady-state load you must always serve, and let spot handle the variable top. Even a total spot blackout only degrades you to the base.
- **Per-workload split.** Separate node pools with a taint, so the can't-be-interrupted tier lands on on-demand and everything else defaults to spot.

Allowing `capacity-type` of both `spot` and `on-demand` in a single pool also gives automatic fallback: spot when it's available, on-demand when it isn't.

## The bottom line

Spot keeps a service available in production when three things are true: the workload can be killed and retried correctly, you've diversified across pools, and the genuinely-can't-be-interrupted tier stays on on-demand. Decide _when_ with the kill-and-retry rule, be honest about _when not to_ — the data tier, one-shot side effects and undiversifiable workloads belong on on-demand — and _maintain availability_ with replicas, queues, idempotency, graceful shutdown and diversity. Get the split right and availability is a design property, not a gamble, while the savings on everything else are too large to leave on the table.

Before you trust it, test it. **AWS Fault Injection Simulator** has a spot interruption action that sends a genuine two-minute notice on demand — use it to confirm that PDBs hold, replicas survive, the SIGTERM path drains cleanly and interrupted jobs actually retry. Then watch interruption rates per pool in production and drop any pool that interrupts far more than the rest.
