---
title: "Implementing zero trust workload identity with SPIFFE/SPIRE on Kubernetes"
description: "Static API keys and shared secrets don't scale, and they all hit the Secret Zero problem. Here's how SPIFFE and SPIRE give every workload a short-lived, attested identity on Kubernetes — with production manifests, go-spiffe mTLS and the operational reality of running it."
date: "2026-06-29"
tags: ["Kubernetes", "Security", "Zero Trust", "Platform Engineering"]
---

Every platform I've worked on eventually hits the same wall: services need to authenticate to each other, and the answer was always a shared secret. An API key in a Kubernetes Secret, a token mounted from Vault, a long-lived service-account credential. It works for five services. At fifty it's a sprawl of secrets nobody can rotate without an outage, and at five hundred it's the thing the next breach report will be written about.

SPIFFE and SPIRE fix this properly: every workload gets a short-lived, cryptographically verifiable identity that it never has to be handed as a secret. This is how I deploy it on Kubernetes and use it for real mutual TLS, plus the parts the quickstarts skip — HA, TTL tuning and what to monitor.

## The problem: Secret Zero

Static credentials fail at scale for boring, predictable reasons:

- **They don't rotate.** A key minted once and mounted everywhere is, in practice, permanent. Rotating it means coordinating every consumer at once, so nobody does.
- **They leak and stay leaked.** A bearer secret in an environment variable, a log line or a git history is valid until someone manually revokes it — and you rarely know it leaked.
- **They grant ambient authority.** Anyone holding the secret *is* the service. There's no proof the caller is the workload it claims to be, only proof it possesses the string.

Underneath all of that sits the bootstrapping problem, **Secret Zero**: to fetch a secret from your secret manager, a workload needs a credential to authenticate to the secret manager. To get *that* credential, it needs another credential. It's credentials all the way down, and the first one — Secret Zero — has to be injected from outside, usually as a static token baked into an image or a Kubernetes Secret. That first secret is the weakest link in the entire chain.

JWTs are often offered as the answer, and for *users* they are: a person logs in through an OIDC provider, proves who they are with a password and MFA, and receives a short-lived token. But a workload can't log in. There's no human at 3am to type a password when a pod starts. So who issues the workload's JWT, and what credential does the workload present to get it? You're back at Secret Zero. JWTs solve human identity because a human can bootstrap trust; they don't solve service identity because a service can't.

The insight SPIFFE is built on: a workload's identity shouldn't be a secret it *holds*, it should be something the platform can *attest* about it — which node it runs on, which namespace, which service account. Those are properties an attacker can't trivially forge, and they require no pre-shared secret.

## What SPIFFE and SPIRE actually are

**SPIFFE** (Secure Production Identity Framework For Everyone) is a set of open standards. It defines what a workload identity looks like and how a workload proves it, with no opinion on implementation. **SPIRE** (the SPIFFE Runtime Environment) is the production-grade reference implementation that actually issues and rotates those identities.

The core concepts are small:

- **SPIFFE ID** — a URI that names a workload: `spiffe://example.org/ns/prod/sa/checkout`. The `example.org` part is the **trust domain** (your root of trust); the path is whatever hierarchy you choose, commonly namespace and service account.
- **SVID** (SPIFFE Verifiable Identity Document) — the credential that proves a SPIFFE ID. Two flavours: an **X.509-SVID** is an X.509 certificate carrying the SPIFFE ID in its URI SAN (this is what you use for mTLS), and a **JWT-SVID** is a signed JWT for cases where you can only pass a token.
- **Workload API** — a local unix-domain socket the workload calls to fetch and refresh its SVID. No secret, no network round trip to a central server on the hot path.

It helps to contrast workload identity with the user identity you already know:

- **Users** are human, authenticate interactively (password, MFA, OIDC), hold relatively long-lived sessions, and are identified by something like an email or `sub` claim. A human can bootstrap their own trust.
- **Workloads** are non-human, start with no human present, and must obtain an identity at boot *without* a pre-shared secret. They're identified by a SPIFFE ID, and their SVIDs are short-lived and rotated automatically — often a one-hour certificate refreshed every thirty minutes, entirely in memory.

The architecture has three moving parts: a central **SPIRE Server**, a per-node **SPIRE Agent**, and your **workloads**.

![SPIFFE/SPIRE architecture on Kubernetes: a SPIRE Server StatefulSet holding the CA, the registration registry and a Postgres datastore; a SPIRE Agent DaemonSet on each node exposing the Workload API socket; agents perform node attestation with a projected service account token to the server; workloads call the Workload API to receive an X.509-SVID after the agent attests their Kubernetes selectors; the two workloads then establish mTLS using their SVIDs with no shared secret](/diagrams/spiffe-spire-architecture.svg)

The flow is: the **Agent** proves the *node's* identity to the **Server** (node attestation) and gets its own SVID. When a **workload** calls the Workload API socket, the Agent attests the *workload* (it inspects the calling pod's namespace, service account and labels) and hands back the matching X.509-SVID. Two workloads then do mutual TLS using those SVIDs — each verifies the other's SPIFFE ID, and neither was ever given a secret.

## Hands-on: deploying SPIRE on Kubernetes

SPIRE on Kubernetes is two workloads. The **Server** is a `StatefulSet` — it owns the CA keys and a datastore, so it needs stable identity and persistence. The **Agent** is a `DaemonSet` — one per node, exposing the Workload API socket over a `hostPath`. Everything below targets Kubernetes 1.28+.

Start with the namespace, service accounts and the RBAC the server needs to validate projected tokens:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: spire-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spire-server
  namespace: spire-system
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spire-agent
  namespace: spire-system
---
# The server validates agent PSATs via the TokenReview API
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: spire-server-trust-role
rules:
  - apiGroups: ["authentication.k8s.io"]
    resources: ["tokenreviews"]
    verbs: ["get", "create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: spire-server-trust-role-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: spire-server-trust-role
subjects:
  - kind: ServiceAccount
    name: spire-server
    namespace: spire-system
---
# The agent's k8s workload attestor reads pod/node metadata from the kubelet
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: spire-agent-cluster-role
rules:
  - apiGroups: [""]
    resources: ["pods", "nodes", "nodes/proxy"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: spire-agent-cluster-role-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: spire-agent-cluster-role
subjects:
  - kind: ServiceAccount
    name: spire-agent
    namespace: spire-system
```

The server configuration is HCL. The important choices are the trust domain, a real datastore (Postgres, not the sqlite default), the `k8s_psat` node attestor, and the SVID TTLs:

```hcl
server {
  bind_address          = "0.0.0.0"
  bind_port             = "8081"
  trust_domain          = "example.org"
  data_dir              = "/run/spire/data"
  log_level             = "INFO"
  ca_ttl                = "24h"
  default_x509_svid_ttl = "1h"
  default_jwt_svid_ttl  = "5m"
}

plugins {
  DataStore "sql" {
    plugin_data {
      database_type     = "postgres"
      connection_string = "dbname=spire host=spire-db.spire-system user=spire password=changeme sslmode=require"
    }
  }

  NodeAttestor "k8s_psat" {
    plugin_data {
      clusters = {
        "prod-cluster" = {
          service_account_allow_list = ["spire-system:spire-agent"]
        }
      }
    }
  }

  KeyManager "disk" {
    plugin_data {
      keys_path = "/run/spire/data/keys.json"
    }
  }

  # Publishes the trust bundle into a ConfigMap the agents mount
  Notifier "k8sbundle" {
    plugin_data {
      namespace  = "spire-system"
      config_map = "spire-bundle"
    }
  }
}

health_checks {
  listener_enabled = true
  bind_address     = "0.0.0.0"
  bind_port        = "8080"
  live_path        = "/live"
  ready_path       = "/ready"
}
```

Wrap that config in a ConfigMap and run the server as a StatefulSet with a PVC for the datastore:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: spire-server
  namespace: spire-system
spec:
  replicas: 1
  serviceName: spire-server
  selector:
    matchLabels:
      app: spire-server
  template:
    metadata:
      labels:
        app: spire-server
    spec:
      serviceAccountName: spire-server
      containers:
        - name: spire-server
          image: ghcr.io/spiffe/spire-server:1.9.6
          args: ["-config", "/run/spire/config/server.conf"]
          ports:
            - containerPort: 8081
          livenessProbe:
            httpGet:
              path: /live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 60
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
          volumeMounts:
            - name: spire-config
              mountPath: /run/spire/config
              readOnly: true
            - name: spire-data
              mountPath: /run/spire/data
      volumes:
        - name: spire-config
          configMap:
            name: spire-server
  volumeClaimTemplates:
    - metadata:
        name: spire-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 2Gi
---
apiVersion: v1
kind: Service
metadata:
  name: spire-server
  namespace: spire-system
spec:
  selector:
    app: spire-server
  ports:
    - name: grpc
      port: 8081
      targetPort: 8081
```

The agent config points at the server, attests with the same `k8s_psat` plugin, and — crucially — uses the `k8s` **workload** attestor, which is what lets the agent identify which pod is calling the socket:

```hcl
agent {
  data_dir          = "/run/spire"
  log_level         = "INFO"
  server_address    = "spire-server.spire-system.svc.cluster.local"
  server_port       = "8081"
  socket_path       = "/run/spire/agent-sockets/agent.sock"
  trust_domain      = "example.org"
  trust_bundle_path = "/run/spire/bundle/bundle.crt"
}

plugins {
  NodeAttestor "k8s_psat" {
    plugin_data {
      cluster = "prod-cluster"
    }
  }

  WorkloadAttestor "k8s" {
    plugin_data {
      # In managed clusters the kubelet cert often isn't in the node trust store
      skip_kubelet_verification = true
    }
  }

  KeyManager "memory" {
    plugin_data {}
  }
}
```

The DaemonSet mounts the trust bundle ConfigMap, a `hostPath` for the socket, and a **projected service account token** with the audience the server expects — that token *is* the node-attestation credential, and it's short-lived and issued by Kubernetes, not a static secret. Seed an empty `spire-bundle` ConfigMap in `spire-system` first; the server's `k8sbundle` notifier keeps it populated and the agent mounts it as its trust anchor. The agent runs with `hostPID` so the `k8s` workload attestor can resolve a caller's PID to its pod via `/proc`:

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: spire-agent
  namespace: spire-system
spec:
  selector:
    matchLabels:
      app: spire-agent
  template:
    metadata:
      labels:
        app: spire-agent
    spec:
      serviceAccountName: spire-agent
      hostPID: true   # needed to map a caller PID to its pod during attestation
      containers:
        - name: spire-agent
          image: ghcr.io/spiffe/spire-agent:1.9.6
          args: ["-config", "/run/spire/config/agent.conf"]
          volumeMounts:
            - name: spire-config
              mountPath: /run/spire/config
              readOnly: true
            - name: spire-bundle
              mountPath: /run/spire/bundle
              readOnly: true
            - name: spire-agent-socket
              mountPath: /run/spire/agent-sockets
            - name: spire-token
              mountPath: /var/run/secrets/tokens
      volumes:
        - name: spire-config
          configMap:
            name: spire-agent
        - name: spire-bundle
          configMap:
            name: spire-bundle
        - name: spire-agent-socket
          hostPath:
            path: /run/spire/agent-sockets
            type: DirectoryOrCreate
        - name: spire-token
          projected:
            sources:
              - serviceAccountToken:
                  path: spire-agent
                  audience: spire-server
                  expirationSeconds: 7200
```

With both running, register your workloads. SPIRE issues an SVID only when an entry matches the attested selectors. First a **node entry** so every agent shares a common parent identity, then a **workload entry** per service parented to it:

```bash
# 1. Node entry: agents attesting with these PSAT selectors get this identity
kubectl exec -n spire-system spire-server-0 -- \
  /opt/spire/bin/spire-server entry create \
    -node \
    -spiffeID spiffe://example.org/ns/spire-system/sa/spire-agent \
    -selector k8s_psat:cluster:prod-cluster \
    -selector k8s_psat:agent_ns:spire-system \
    -selector k8s_psat:agent_sa:spire-agent

# 2. Workload entry: the checkout service in the prod namespace
kubectl exec -n spire-system spire-server-0 -- \
  /opt/spire/bin/spire-server entry create \
    -parentID spiffe://example.org/ns/spire-system/sa/spire-agent \
    -spiffeID spiffe://example.org/ns/prod/sa/checkout \
    -selector k8s:ns:prod \
    -selector k8s:sa:checkout \
    -x509SVIDTTL 3600
```

The expected output confirms the entry is registered:

```text
Entry ID         : 7f3d9b21-4e0c-4a6e-9b2d-2c8a1f0e5d44
SPIFFE ID        : spiffe://example.org/ns/prod/sa/checkout
Parent ID        : spiffe://example.org/ns/spire-system/sa/spire-agent
Revision         : 0
X509-SVID TTL    : 3600
Selector         : k8s:ns:prod
Selector         : k8s:sa:checkout
```

You can sanity-check what the server holds with `spire-server entry show`, and confirm an agent has registered with `spire-server agent list`:

```bash
kubectl exec -n spire-system spire-server-0 -- \
  /opt/spire/bin/spire-server agent list
# Found 3 attested agents:
#
# SPIFFE ID         : spiffe://example.org/spire/agent/k8s_psat/prod-cluster/8c1e9f2a-...
# Attestation type  : k8s_psat
# Can re-attest     : true
```

## From SVID to mTLS

The payoff is mutual TLS where neither side reads a certificate from disk. Both sides talk to the Workload API through the `go-spiffe/v2` library, which keeps the SVID and trust bundle fresh in memory and rotates them transparently.

Here's the `payments` service running an mTLS server that only accepts the `checkout` service:

```go
package main

import (
	"context"
	"log"
	"net/http"

	"github.com/spiffe/go-spiffe/v2/spiffeid"
	"github.com/spiffe/go-spiffe/v2/spiffetls/tlsconfig"
	"github.com/spiffe/go-spiffe/v2/workloadapi"
)

func main() {
	ctx := context.Background()
	socket := "unix:///run/spire/agent-sockets/agent.sock"

	// X509Source fetches our SVID + trust bundle and keeps them rotated.
	source, err := workloadapi.NewX509Source(ctx,
		workloadapi.WithClientOptions(workloadapi.WithAddr(socket)))
	if err != nil {
		log.Fatalf("create X509Source: %v", err)
	}
	defer source.Close()

	// Authorize exactly one caller: the checkout service.
	checkout := spiffeid.RequireFromString("spiffe://example.org/ns/prod/sa/checkout")
	tlsConfig := tlsconfig.MTLSServerConfig(source, source, tlsconfig.AuthorizeID(checkout))

	server := &http.Server{
		Addr:      ":8443",
		TLSConfig: tlsConfig,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("charge authorised\n"))
		}),
	}
	// Empty strings: the cert and key come from the SVID, not files.
	log.Fatal(server.ListenAndServeTLS("", ""))
}
```

And the `checkout` client, which authorises the `payments` server's identity:

```go
source, err := workloadapi.NewX509Source(ctx,
	workloadapi.WithClientOptions(workloadapi.WithAddr(socket)))
if err != nil {
	log.Fatalf("create X509Source: %v", err)
}
defer source.Close()

payments := spiffeid.RequireFromString("spiffe://example.org/ns/prod/sa/payments")
tlsConfig := tlsconfig.MTLSClientConfig(source, source, tlsconfig.AuthorizeID(payments))

client := &http.Client{Transport: &http.Transport{TLSClientConfig: tlsConfig}}
resp, err := client.Get("https://payments.prod.svc.cluster.local:8443/charge")
```

Compare the two worlds:

- **The old way.** Stand up an internal CA, issue a cert per service, ship each cert and key into a Kubernetes Secret, mount them as files, and have the app load them at boot. Rotation means re-issuing, re-distributing and restarting — so certs get year-long TTLs and live in etcd, where any Secret reader can lift them. Authorisation is "trust anything signed by our CA", which is far too broad.
- **The new way.** The app asks the Workload API for its identity, gets an SVID scoped to exactly its SPIFFE ID, and the library rotates it every half-life with no restart. Nothing is in etcd, TTLs are an hour, and authorisation is a specific SPIFFE ID — `payments` accepts `checkout` and nothing else.

To get the socket into a workload pod in production, don't `hostPath`-mount it everywhere — use the **SPIFFE CSI Driver**, which mounts the agent socket read-only into pods that request it, keeping the host path out of your application manifests.

## An identity maturity model

It helps to place SPIFFE/SPIRE on a ladder, because most teams climb it rather than jump:

- **Level 1 — static API keys.** A shared string per integration. Simple, and the first thing you outgrow. No rotation, no proof of identity, leaks are permanent. Fine for a prototype, dangerous at scale.
- **Level 2 — JWT tokens.** Short-lived and signed, which is a real improvement for *user* traffic behind an OIDC provider. For service-to-service it just relocates Secret Zero: something still has to mint the token and the service still needs a credential to ask for one. Bearer tokens are also replayable if captured.
- **Level 3 — cloud-native workload identity.** AWS IRSA, GCP Workload Identity, Azure Workload Identity. Genuinely good: the platform attests the pod and hands it a credential with no static secret. The catch is it's *per cloud* — IRSA identities mean nothing to GCP, and nothing to a VM, a bare-metal box or an on-prem service. Multi-cloud and hybrid estates end up with a different identity system per environment.
- **Level 4 — SPIFFE/SPIRE.** One identity model across every cloud, Kubernetes, VMs and bare metal, under a trust domain you control. It's more to operate than IRSA, but it's the only level that gives a single, portable, attested identity everywhere — which is the whole point of zero trust.

If you live entirely inside one cloud and your services are all on EKS, Level 3 may be all you ever need. SPIFFE/SPIRE earns its keep when "everywhere" stops meaning "one place".

## Real-world considerations

**When not to use it.** SPIRE is infrastructure you have to run, monitor and keep highly available. For a handful of services in a single cluster, a service mesh's built-in mTLS or even cert-manager-issued certs will get you most of the security for a fraction of the operational cost. Don't stand up SPIRE for three services. Reach for it when you have many services, multiple clusters or clouds, or workloads outside Kubernetes that all need to authenticate to each other.

**Server HA.** A single SPIRE Server is a single point of failure for *issuance* — existing SVIDs keep working until they expire, but nothing new gets signed while it's down. For production, run multiple servers behind a load balancer sharing one SQL datastore (Postgres or MySQL), and front them with an `UpstreamAuthority` plugin (AWS Private CA, Vault, or a disk-based root) so every server chains to the same trust root rather than each minting its own.

**TTL tuning.** Short SVID TTLs shrink the blast radius of a stolen credential, and the agent rotates at roughly half the TTL — but set them *too* short and you hammer the server with signing requests and risk workloads racing rotation. An `default_x509_svid_ttl` of one hour with a `ca_ttl` of 24 hours is a sane starting point; tune from the signing-rate and rotation-failure metrics, not from a blog (including this one).

**Service mesh integration.** If you run Istio, it already uses SPIFFE IDs internally, and you can configure it to source identities from SPIRE through Envoy's SDS talking to the agent socket — useful when you want mesh and non-mesh workloads under one trust domain. Linkerd ships its own identity system; SPIRE complements it by extending identity to workloads the mesh doesn't cover. The mesh gives you the mTLS data plane; SPIRE gives you the identity, and crucially extends it beyond the mesh boundary to VMs and serverless.

**What to monitor.** SPIRE exposes Prometheus metrics from both server and agent — turn it on in the config:

```hcl
telemetry {
  Prometheus {
    host = "0.0.0.0"
    port = 9988
  }
}
```

The signals worth alerting on:

- **SVID signing rate and errors** on the server — a spike usually means a TTL set too low or a rotation storm; errors mean issuance is failing.
- **Expiring and rotation-failed SVIDs** on the agents — a workload whose SVID can't rotate is minutes away from being unable to authenticate.
- **Datastore query latency** — the server is only as available as its database.
- **CA / trust-bundle expiry** — track time-to-expiry of the root so a missed rotation never surprises you.

Wire those into the same Prometheus and Grafana you already run, and hold them to the same [SLOs and error budgets](/blogs/implementing-slos-and-error-budgets) as any other critical platform service — because once workloads depend on SPIRE for identity, it *is* one.

## Conclusion

The shift SPIFFE/SPIRE makes is small to state and large in consequence: a workload's identity stops being a secret you give it and becomes a property the platform attests about it. That removes Secret Zero, makes rotation automatic and invisible, and gives you one identity model that works the same on EKS, GKE, a VM or bare metal. It's more machinery than an API key — but it's the machinery that lets you stop shipping long-lived secrets entirely.

If you're building this out as part of a wider platform, it slots in next to the other foundations I've written about: keeping the cluster itself current with [zero-downtime Kubernetes upgrades](/blogs/zero-downtime-kubernetes-upgrades), running it cost-effectively with [Karpenter and spot instances](/blogs/reducing-kubernetes-costs-karpenter-spot), and giving every service the [SLOs and error budgets](/blogs/implementing-slos-and-error-budgets) that make reliability a measurable target rather than a hope.
