---
title: 'Implementing SLOs and error budgets in production'
description: 'How to turn reliability from a gut feeling into a measurable, negotiated target — choosing good SLIs, setting honest SLOs, deriving an error budget and wiring up multi-window burn-rate alerts in Prometheus.'
date: '2026-06-16'
tags: ['SRE', 'Reliability', 'Observability', 'Prometheus']
---

Ask two engineers whether a service is "healthy" and you'll get two answers, both based on instinct. Ask whether it met its SLO last month and there's one answer, and it's a number. That's the whole point of service level objectives: they turn reliability from an argument into a measurement, and an error budget turns that measurement into a decision about what to do next. This is how I implement them in production — the definitions, the maths and the Prometheus rules that make it real.

## SLI, SLO, SLA — and the budget

Three terms get muddled constantly:

- **SLI — service level indicator** — a metric of how the service is doing, expressed as a ratio of **good events to valid events**. "The proportion of requests served without a 5xx." "The proportion of requests faster than 300ms."
- **SLO — service level objective** — a target for that SLI over a window. "99.9% of requests succeed over 30 days." This is your internal goal.
- **SLA — service level agreement** — a contractual promise to customers, usually looser than the SLO and with financial penalties. Your SLO should be stricter than your SLA, so you find out before the customer does.

The **error budget** falls straight out of the SLO: it's `100% − SLO`, the amount of unreliability you're _allowed_. A 99.9% SLO grants a 0.1% budget — and that budget is the part that changes behaviour.

![The chain from SLI (good events over valid events) to SLO (99.9% over 30 days) to error budget (0.1%, about 43 minutes), with a 30-day budget burndown chart and a release policy: ship features while budget remains, freeze releases and fix reliability when it's exhausted](/diagrams/slo-error-budget.svg)

## Choose SLIs your users actually feel

A good SLI tracks something a user would complain about. For a request/response service that's almost always two things:

- **Availability** — `good = non-5xx responses`, `valid = all responses`.
- **Latency** — `good = requests faster than a threshold`, `valid = all requests`.

Measure them per **user journey**, not per microservice. "Checkout succeeds" is an SLI; "the inventory pod's CPU" is not. Different service types need different indicators — a data pipeline cares about freshness and correctness, storage cares about durability — but the good-over-valid shape stays the same. Resist the urge to define twenty SLIs; pick the few that map to user pain.

## Set the target honestly

The right SLO is not 99.999% by default. Each extra nine costs exponentially more engineering, and a target you can't meet is just a permanent source of guilt. Start by **measuring current performance**, then set the SLO at a level that keeps users happy and that you can realistically hold. The error budget is easier to feel in time than in percentages:

- **99%** → about 7.2 hours of downtime per 30 days
- **99.9%** → about 43 minutes
- **99.95%** → about 22 minutes
- **99.99%** → about 4.3 minutes
- **99.999%** → about 26 seconds

Going from 99.9% to 99.99% means cutting your monthly budget from 43 minutes to 4 — be sure users need that before you sign up to defend it.

## Implement the SLI in Prometheus

Record the SLI as a ratio with recording rules, so the expensive query runs once and dashboards and alerts read the cheap result:

```yaml
groups:
  - name: slo-api
    rules:
      # error ratio over several windows, reused by the alerts below
      - record: job:slo_errors:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{job="api", code=~"5.."}[5m]))
            / sum(rate(http_requests_total{job="api"}[5m]))
      - record: job:slo_errors:ratio_rate1h
        expr: |
          sum(rate(http_requests_total{job="api", code=~"5.."}[1h]))
            / sum(rate(http_requests_total{job="api"}[1h]))
```

The SLIs come from your existing telemetry — the same request metrics you already export, ideally instrumented with OpenTelemetry as in [the APM post](/blogs/apm-opentelemetry-grafana-tempo).

## Alert on burn rate, not thresholds

The old way — page when error rate crosses 1% — is noisy and arbitrary. The SRE approach is to alert on **how fast you're burning the error budget**. Burn rate is a multiplier: a burn rate of 1 means you'll spend exactly the whole budget over the window; a burn rate of 14.4 means you'll exhaust a 30-day budget in roughly two days.

Use **multi-window, multi-burn-rate** alerts. A fast burn pages immediately; a slow burn opens a ticket. Requiring both a long and a short window to agree suppresses false alarms from brief blips:

```yaml
# FAST burn: ~2% of a 30-day budget in 1 hour → page
- alert: ErrorBudgetFastBurn
  expr: |
    job:slo_errors:ratio_rate1h > (14.4 * 0.001)
      and job:slo_errors:ratio_rate5m > (14.4 * 0.001)
  for: 2m
  labels: {severity: page}

# SLOW burn: steady drain over hours → ticket
- alert: ErrorBudgetSlowBurn
  expr: |
    job:slo_errors:ratio_rate6h > (6 * 0.001)
      and job:slo_errors:ratio_rate30m > (6 * 0.001)
  labels: {severity: ticket}
```

The `0.001` is the error budget for a 99.9% SLO; the `14.4` and `6` are the burn-rate multipliers. You generally want a fast-burn pair and a slow-burn pair — enough to catch an outage in minutes and a slow leak in hours, without paging on noise.

Writing these rules by hand for every service gets tedious, so generate them from a short SLO spec with **Sloth** or **Pyrra** — you declare the objective and the tool emits the recording and alerting rules.

## The error budget policy is the point

SLOs without a policy are vanity metrics. The **error budget policy** is the agreement, made in advance and in writing, for what happens when the budget runs low:

- **Budget remaining** → ship features freely. Reliability is good enough; spend your time on product.
- **Budget exhausted** → freeze non-essential releases and redirect effort to reliability until you're back in budget.

This is what gives SLOs teeth. It reframes the eternal "ship vs harden" argument as a data-driven rule both product and engineering agreed to when nobody was under pressure. The budget also _grants permission to fail_: while it's healthy, a risky deploy or a planned experiment is fine — that's literally what the budget is for.

## Make it visible and review it

Put the SLO, the budget remaining and the burn rate on a dashboard the whole team sees, and review it on a regular cadence. If a service ends every month with most of its budget untouched, the SLO is too loose — tighten it or move the effort elsewhere. If it blows the budget repeatedly, either the target is unrealistic or reliability genuinely needs investment, and now you have the number to make that case.

Done well, SLOs change the conversation. "Is it reliable enough?" stops being a matter of opinion and becomes a number everyone agreed on — and the error budget tells you, without a meeting, whether this week's job is shipping features or shoring up the foundations.
