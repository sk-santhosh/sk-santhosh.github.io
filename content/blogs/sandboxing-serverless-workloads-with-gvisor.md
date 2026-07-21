---
title: 'Sandboxing serverless workloads with gVisor and Kubernetes RuntimeClass'
description: 'A container is not a security boundary — every pod on a node shares one kernel. Adding gVisor to a pod-per-message serverless platform on Kubernetes: how runsc works, wiring RuntimeClass through Helm and an operator, and the loopback gotcha that breaks kubectl port-forward.'
date: '2026-07-21'
tags: ['Kubernetes', 'Security', 'gVisor', 'Serverless']
---

I built a small serverless platform on Kubernetes — [serverless-poc](https://github.com/sk-santhosh/serverless-poc) — where a Go operator watches a Redis stream and spins up one worker Job per queued message: true scale-to-zero, pod-per-message execution. The operator is deliberately generic; nothing in it knows about email. It points a stream at *any* worker image and a concurrency limit, and new queues are added by appending an entry to a Helm values list.

That generality is the feature — and the threat model. A platform that runs "whatever image the queue config names" is exactly the kind of platform where you should stop and ask what actually separates that worker's code from the node it lands on. The uncomfortable answer: by default, one shared kernel and not much else. So the POC ships a second mode — `make up PLATFORM=minikube` — that runs the webapp, the operator, and every operator-created worker Job inside **gVisor** sandboxes, selected per-pod through Kubernetes **RuntimeClass**. This post is about that layer: what a container runtime actually is, how gVisor changes the isolation story, and the wiring (plus one very real networking gotcha) to make it work end to end.

## A container is not a security boundary

It's worth being precise about what a "container" is, because the word suggests more isolation than exists. A standard Linux container is a normal process with three kinds of decoration:

- **Namespaces** change what the process can *see* — its own PID tree, mount table, network interfaces, hostname.
- **cgroups** change what it can *consume* — CPU, memory, IO.
- **Capabilities, seccomp and LSMs** trim what it can *do* — drop privileges, filter some syscalls.

What none of that changes is what the process *talks to*. Every container on the node makes system calls directly against the same host kernel — an interface of 350+ syscalls, millions of lines of C, running at the highest privilege level on the machine. The default runtime, **runc**, sets up the namespaces and cgroups and then gets out of the way; after that, your untrusted workload and your kubelet are clients of the same kernel.

That's why container escapes are almost always kernel (or runtime) bugs, not "container" bugs — Dirty COW, DirtyPipe, the `runc` file-descriptor leak (CVE-2019-5736). One exploitable syscall path and the blast radius is the node: every other pod's secrets, the kubelet's credentials, the CNI. For trusted first-party services that's an accepted risk. For a platform that executes per-message workers from arbitrary images, it's the primary risk.

## The runtime spectrum

Kubernetes doesn't run containers itself — the kubelet delegates to a CRI runtime (containerd), which delegates to a low-level OCI runtime. That bottom layer is swappable, and there's a spectrum of how much isolation you can buy:

- **runc** — the default. Namespaces + cgroups, shared kernel. Fastest, weakest boundary.
- **gVisor (`runsc`)** — a user-space kernel between the app and the host. Strong syscall isolation, moderate overhead, no VM required.
- **Kata Containers / Firecracker** — each pod in its own lightweight VM with its own guest kernel. Hardware-virtualized boundary, but needs virtualization support and carries VM lifecycle weight.

gVisor sits in the sweet spot for this project: dramatically better isolation than runc, works anywhere containerd works, and — crucially for a laptop POC — runs unmodified container images with a one-line pod spec change.

## How gVisor actually works

gVisor's core is the **Sentry**: an application kernel written in Go that runs in user space. When a sandboxed container makes a syscall, the syscall never reaches the host kernel. A platform layer (**Systrap** on current releases, previously ptrace, optionally KVM) intercepts it and redirects it to the Sentry, which implements the Linux syscall ABI itself — process management, virtual memory, `/proc`, futexes, epoll — in memory-safe Go.

![Left: a standard runc pod where the application container makes all syscalls directly against the shared host kernel. Right: a gVisor pod where syscalls are intercepted by the Sentry user-space kernel (with its own netstack and Gofer file access), which itself makes only ~70 filtered, seccomp-pinned syscalls to the host](/diagrams/gvisor-sandbox-runtime.svg)

Three design choices matter for the security story:

1. **The Sentry is the syscall surface.** The application can invoke any of the 350+ Linux syscalls, but they all terminate in the Sentry. The Sentry itself talks to the host through a deliberately tiny set — on the order of 70 syscalls — and pins itself there with seccomp filters at startup. A kernel exploit now needs *two* independent escapes: out of the Sentry's Linux implementation, then through the narrowed, filtered host interface.
2. **File access goes through the Gofer.** The Sentry has no direct access to the host filesystem. A separate per-pod process, the Gofer, proxies file operations over an IPC protocol (LISAFS), so even a compromised Sentry can't open arbitrary host paths.
3. **Networking runs in netstack.** gVisor ships its own TCP/IP stack in Go. The pod's sockets, TCP state machine, and loopback all live inside the Sentry's user-space network stack — not in the host kernel's netns. File that one away; it's the punchline of the debugging story below.

The trade: every syscall pays an interception and emulation cost, so syscall-heavy and IO-heavy workloads slow down, and a handful of exotic syscalls aren't implemented. For a Node.js worker that reads a Redis stream and talks SMTP, neither matters measurably.

## RuntimeClass: choosing a runtime per pod

The Kubernetes-native way to opt into an alternate runtime is `RuntimeClass` — a cluster-scoped object that maps a name to a containerd handler:

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc   # must match a runtime entry in containerd's config
```

Any pod can then select it with one field:

```yaml
spec:
  runtimeClassName: gvisor
```

Everything else about the pod — image, probes, Services, resource limits — is unchanged. That per-pod granularity is the point: you sandbox the workloads that need it and leave the rest on runc, on the same nodes.

In the POC, minikube does the node-level setup. Its `gvisor` addon installs `runsc`, patches containerd's config with the `runsc` runtime handler, and creates the `RuntimeClass` named `gvisor`. One wrinkle worth recording: the addon's default image reference was broken at the time, so the Makefile pins a working one explicitly:

```makefile
GVISOR_ADDON_IMAGE    := minikube/gvisor:v0.0.4@sha256:0f389d92114b6342...
GVISOR_ADDON_REGISTRY := registry.k8s.io

gvisor: ## Enable minikube's gvisor addon if it isn't already
	@minikube addons list 2>/dev/null | grep gvisor | grep -q enabled \
		&& echo "gvisor addon already enabled" \
		|| minikube addons enable gvisor \
			--images=GvisorAddon=$(GVISOR_ADDON_IMAGE) \
			--registries=GvisorAddon=$(GVISOR_ADDON_REGISTRY)
```

Note `--container-runtime=containerd` on `minikube start` — gVisor plugs in as a containerd handler, so Docker-shim-based clusters won't do.

## Wiring it through Helm and the operator

Deciding *which* pods get sandboxed is a policy question, and the POC's answer is: the three things that touch user input or run platform code — webapp, operator, workers — run under gVisor; the bundled Redis and the monitoring stack stay on the default runtime. Infrastructure you trust and want fast stays on runc; code paths that handle outside data get the sandbox.

The mechanism is plain Helm values. Both charts expose a `runtimeClassName` knob, empty by default, and the Makefile flips them for the minikube platform:

```makefile
HELM_WEBAPP_RUNTIME_ARGS   := --set runtimeClassName=gvisor \
                              --set service.type=NodePort
HELM_OPERATOR_RUNTIME_ARGS := --set operator.runtimeClassName=gvisor \
                              --set workerRuntimeClassName=gvisor
```

The interesting one is the third: the worker Jobs don't exist at deploy time — the operator creates them on demand when messages arrive. So the RuntimeClass has to travel through the `QueueWorker` CRD as part of the worker's pod template:

```yaml
spec:
  worker:
    image: serverless-poc/welcome-email-worker:latest
    # "gvisor" to sandbox workers with runsc; empty means the
    # cluster's default runtime.
    runtimeClassName: gvisor
```

and the controller copies it into every Job it stamps out. The only subtlety is Go's API-shape mismatch — the CRD field is a plain string, but `PodSpec.RuntimeClassName` is a `*string` where `nil` means "cluster default":

```go
Spec: corev1.PodSpec{
    RestartPolicy:    corev1.RestartPolicyNever,
    RuntimeClassName: runtimeClassNameOrNil(qw.Spec.Worker.RuntimeClassName),
    ...
}

// runtimeClassNameOrNil maps the CRD's plain-string field onto PodSpec's
// *string: empty string means "cluster default runtime", i.e. leave nil.
func runtimeClassNameOrNil(name string) *string {
    if name == "" {
        return nil
    }
    return &name
}
```

This composes nicely with the platform's multi-tenant shape: because RuntimeClass is per-`QueueWorker`, a future untrusted queue can run sandboxed while a trusted internal one runs on runc — same operator, same cluster, different blast radius per queue.

Did it work? Two checks. `kubectl get pods -o jsonpath='{.spec.runtimeClassName}'` confirms scheduling intent, but the convincing one is asking the pod which kernel it's talking to:

```bash
$ kubectl exec deploy/webapp -- dmesg | head -3
[  0.000000] Starting gVisor...
[  0.123456] Checking naughty and nice process list...
[  0.234567] Committing treasure map to memory...

$ kubectl exec deploy/webapp -- uname -r
4.4.0   # the Sentry's emulated kernel version, not the host's
```

That `dmesg` output is the Sentry's own boot log (complete with its joke boot messages) — the application genuinely isn't talking to the host kernel anymore.

## The gotcha: `kubectl port-forward` can't reach a gVisor pod

Here's the part no tutorial warned me about. On kind, `make port-forward` tunnels to the webapp on `localhost:4000`. Under gVisor, the same command connects and then every request dies with connection refused — while the pod is healthy, probes pass, and pod-to-pod traffic works fine.

The explanation is that netstack design choice from earlier. `kubectl port-forward` doesn't go through the Service or the pod IP: the kubelet's runtime dials **loopback inside the pod's network namespace**. In a runc pod, the app's listening socket lives in the host kernel's netns, so that dial lands on it. In a gVisor pod, the netns contains no sockets at all — the app's sockets, and its loopback, exist inside the Sentry's user-space netstack. The port-forward dial hits an empty kernel netns and is refused. Traffic *addressed to the pod IP* — Services, NodePorts, kubelet probes — is fine, because that path goes through the interface netstack is attached to.

Nothing is broken; the sandbox is just honest about where the network stack lives. The fix is to stop using the loopback path — that's why the Makefile switches the webapp Service to `NodePort` on minikube and reaches it through a real Service instead of a port-forward:

```makefile
webapp:
ifeq ($(PLATFORM),minikube)
	# gVisor pods can't be kubectl-port-forwarded: the dial targets the
	# pod netns loopback, but a sandboxed pod's sockets live in runsc's
	# userspace netstack. NodePort traffic works — tunnel to that instead.
	minikube service webapp --url
else
	$(KUBECTL) port-forward svc/webapp 4000:3000
endif
```

Grafana, which stayed on runc, keeps its ordinary port-forward. If you take one operational lesson from this post: when you move a workload into a sandbox runtime, audit every path that assumes "the pod's netns" and "the app's sockets" are the same thing — port-forwards, sidecar-over-loopback patterns, node-local debugging habits.

## When to reach for this

The honest trade-off table for gVisor: you pay syscall overhead (real for IO-heavy and syscall-chatty workloads, negligible for most web/API/queue workers), a small compatibility tail of unimplemented syscalls, and operational quirks like the loopback one above. You get a security boundary where a workload compromise no longer equals a node compromise — without VMs, hypervisor requirements, or image changes.

Where it earns its cost is any platform that runs code it didn't write: multi-tenant workers like this POC, CI runners, plugin systems — and, increasingly, AI workloads. If you're building [an AI platform on Kubernetes](/blogs/building-an-ai-platform-on-kubernetes), agent-generated code execution is precisely the "untrusted code, per-task pod, scale-to-zero" shape this POC models with a queue and disposable Jobs; it's no accident the commercial code-execution sandboxes are built on gVisor and Firecracker. And defense in depth still applies: the POC keeps every container non-root with read-only root filesystems, RBAC scoped to the CRD and Jobs, and resource limits on everything — the sandbox is a layer, not a substitute.

The full implementation — operator, charts, Makefile, and the [pod-per-message operator pattern](/blogs/kubernetes-operator-spiffe-workload-registration) it builds on — is in [sk-santhosh/serverless-poc](https://github.com/sk-santhosh/serverless-poc). `make up PLATFORM=minikube` gives you the whole thing sandboxed; diff it against plain `make up` and the entire gVisor layer turns out to be one RuntimeClass, three Helm values, and a nil-check.
