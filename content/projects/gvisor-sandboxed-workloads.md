---
title: Sandboxed Workloads with gVisor
blurb: Running untrusted worker code behind a user-space kernel, switched on per queue from the custom resource.
summary: The operator launches whatever container image a QueueWorker names, which is exactly when sharing the host kernel stops feeling comfortable. gVisor puts a second kernel in the way, and the choice is a field on the CRD rather than a separate cluster.
year: "2026"
order: 3
featured: true
category: Security
tags: [gVisor, runsc, RuntimeClass, Kubernetes, Helm]
impact:
  - value: "2"
    label: kernels between code and host
  - value: "Per-CR"
    label: opt-in
repo: https://github.com/sk-santhosh/serverless-poc
---

A container feels like a box, but it is really just a process with some
namespaces around it. It makes system calls directly to the **host kernel**,
the same kernel every other pod on that node is using. The isolation is only
as strong as the kernel's syscall surface — which is large, and occasionally
has holes.

gVisor changes the shape of that risk. It runs a second, much smaller kernel
called the Sentry in user space, written in Go. The workload's syscalls are
answered by the Sentry, and the Sentry itself only makes a narrow, carefully
chosen set of real calls to the host.

## The problem it solves

In this system the operator is deliberately generic: a `QueueWorker` names a
container image and the controller runs it, with no idea what the code
inside does. That is the feature — it is what lets one operator serve any
number of unrelated queues.

It is also the problem. The moment the image is something you did not write
— a tenant's plugin, a third-party processor — "it shares the host kernel
with everything else on this node" is no longer a comfortable sentence.

## How it works

<figure class="diagram">
<svg viewBox="0 0 760 200" role="img" aria-label="A QueueWorker sets runtimeClassName; the operator copies it onto the Job's pod spec; containerd routes that pod to the runsc handler, where the gVisor Sentry answers syscalls instead of the host kernel. Pods without the field keep using runc.">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#8c857c"/>
    </marker>
  </defs>
  <g fill="none" stroke="#c9c2b8" stroke-width="1.25">
    <rect x="6" y="20" width="156" height="54"/>
    <rect x="6" y="122" width="156" height="54"/>
    <rect x="222" y="72" width="140" height="54"/>
    <rect x="424" y="72" width="148" height="54"/>
    <rect x="636" y="72" width="118" height="54"/>
  </g>
  <g stroke="#8c857c" stroke-width="1.25" marker-end="url(#ar)" fill="none">
    <path d="M162 47 L216 86"/>
    <path d="M362 99 H418"/>
    <path d="M572 99 H630"/>
  </g>
  <g stroke="#ee5126" stroke-width="1.5" marker-end="url(#ar)" fill="none">
    <path d="M162 149 L216 112"/>
  </g>
  <g font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#131211" text-anchor="middle">
    <text x="84" y="43">① trusted pod</text>
    <text x="84" y="61">no runtimeClassName</text>
    <text x="84" y="145">① worker Job</text>
    <text x="84" y="163">runtimeClassName: gvisor</text>
    <text x="292" y="93">② containerd</text>
    <text x="292" y="111">picks a handler</text>
    <text x="498" y="93">③ gVisor Sentry</text>
    <text x="498" y="111">answers syscalls</text>
    <text x="695" y="103">④ host kernel</text>
  </g>
  <g font-family="ui-monospace, monospace" font-size="10.5" fill="#ee5126" text-anchor="middle">
    <text x="188" y="140">runsc</text>
  </g>
</svg>
<figcaption>Only the sandboxed path goes through the Sentry. Redis and the monitoring stack deliberately stay on the default runtime.</figcaption>
</figure>

What happens at each hop:

1. **The pod asks for a runtime.** A `runtimeClassName` on the pod spec is a
   request for a named RuntimeClass. Leave it off and you get the cluster
   default. In this project the field travels from the `QueueWorker` CR,
   through the chart, onto the Job's pod template.
2. **containerd routes it.** The `gvisor` RuntimeClass maps to the `runsc`
   handler, so containerd starts that pod with gVisor instead of runc.
3. **The Sentry intercepts.** The container's syscalls are serviced inside
   the Sentry rather than by Linux. Most of the kernel surface the workload
   could previously reach simply is not there any more.
4. **A narrow path reaches the host.** The Sentry makes a restricted set of
   real syscalls — that remaining surface is the actual attack surface, and
   it is dramatically smaller than the full kernel ABI.

Crucially this is per-pod, not per-cluster. Untrusted workers run sandboxed
while Redis, the operator and the monitoring stack keep full performance on
the default runtime.

## The detail that bites

The field is a `*string`, not a `string`, and that distinction is load-bearing:

```go
func runtimeClassNameOrNil(name string) *string {
	if name == "" {
		return nil
	}
	return &name
}
```

Kubernetes validates `runtimeClassName` as a DNS name whenever the field is
present, so an empty string is rejected at admission rather than read as "no
preference". Only `nil` means "use the cluster default". Without this helper,
every pod that simply did not opt in would fail to be created at all.

## What I would tell you before adopting it

The Sentry implements a *subset* of Linux, and the things that break are
rarely the application — they are the tools around it. In this project
`kubectl port-forward` stopped working against sandboxed pods: it dials the
pod's network-namespace loopback, but a gVisor pod's sockets live in runsc's
userspace netstack. Traffic to the pod IP works; loopback does not. The fix
was a NodePort Service for local access.

There is a throughput cost too, concentrated in syscall- and I/O-heavy
workloads. So this is not a cluster-wide default — it is a boundary you draw
around the specific code whose behaviour is not yours.

The CRD field, the Job builder and the chart plumbing are in the
[repo](https://github.com/sk-santhosh/serverless-poc).
