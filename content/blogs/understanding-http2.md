---
title: "HTTP/2 in Practice: Multiplexing, Performance, and the Gotchas"
description: "What HTTP/2 actually changes under the hood, how to enable it across Nginx and Kubernetes ingress, and the failure modes that catch people out."
date: "2026-06-12"
tags: ["Networking", "Performance", "HTTP", "Kubernetes"]
---

HTTP/2 has been a default for years, but a surprising number of services still terminate at HTTP/1.1 — or worse, claim HTTP/2 at the edge and silently fall back to HTTP/1.1 between the proxy and the backend. This post covers what HTTP/2 actually changes, how to turn it on correctly, and the gotchas that bite in production.

## What HTTP/1.1 Got Wrong

Under HTTP/1.1, a connection handles one request at a time. The browser opens 6 parallel connections per host and hopes for the best. If one response is slow, everything queued behind it on that connection waits — **head-of-line blocking** at the application layer.

The workarounds were hacks: domain sharding, sprite sheets, inlining CSS, concatenating JS bundles. All of them existed purely to dodge the one-request-per-connection limit.

## What HTTP/2 Changes

HTTP/2 keeps the same semantics — methods, headers, status codes — but rewrites how bytes go over the wire.

**Multiplexing.** A single TCP connection carries many concurrent *streams*. Requests and responses are split into frames, interleaved, and reassembled. One slow response no longer blocks the others on the connection.

**Binary framing.** Messages are binary frames, not plaintext lines. Faster to parse, less ambiguous.

**Header compression (HPACK).** HTTP headers are repetitive — the same `User-Agent`, `Cookie`, and `Accept` on every request. HPACK compresses them with a shared dynamic table, so repeated headers cost almost nothing.

**Server push.** The server could preemptively send resources the client would ask for next. In practice this was hard to get right, often wasteful, and is now deprecated — don't build around it.

## Enabling HTTP/2 on Nginx

HTTP/2 in browsers requires TLS. The syntax changed in recent Nginx versions — the `http2` parameter on `listen` is deprecated in favor of the `http2` directive:

```nginx
server {
    listen 443 ssl;
    http2 on;

    ssl_certificate     /etc/nginx/certs/tls.crt;
    ssl_certificate_key /etc/nginx/certs/tls.key;

    location / {
        proxy_pass http://backend;
    }
}
```

Verify it's actually negotiated — don't assume:

```bash
curl -I --http2 https://example.com
# look for: HTTP/2 200

# confirm the protocol was negotiated via ALPN
openssl s_client -connect example.com:443 -alpn h2 </dev/null 2>/dev/null \
  | grep ALPN
# ALPN protocol: h2
```

## HTTP/2 on Kubernetes with the Gateway API

The Gateway API is the successor to Ingress — a proper typed resource model instead of a pile of controller-specific annotations. A `Gateway` defines the listeners (ports, protocols, TLS); an `HTTPRoute` (or `GRPCRoute`) attaches to it and routes traffic to backends. Most modern controllers (Envoy Gateway, Istio, Cilium, NGINX Gateway Fabric) implement it.

For a TLS listener, HTTP/2 is negotiated automatically via ALPN — there's no flag to flip. You just declare the listener:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: edge
  namespace: gateway
spec:
  gatewayClassName: envoy-gateway
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: "*.example.com"
      tls:
        mode: Terminate
        certificateRefs:
          - kind: Secret
            name: example-tls
```

Then attach an `HTTPRoute` for a normal REST backend:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: my-app
spec:
  parentRefs:
    - name: edge
      namespace: gateway
  hostnames: ["api.example.com"]
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: api-svc
          port: 8080
```

### The Second Hop

The subtler question is the **gateway-to-pod hop**. By default that's HTTP/1.1, which is fine for REST. To make the gateway speak HTTP/2 to the backend, the Gateway API uses the Service's standard `appProtocol` field — no annotations:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: grpc-svc
spec:
  ports:
    - name: grpc
      port: 50051
      targetPort: 50051
      appProtocol: kubernetes.io/h2c   # cleartext HTTP/2 to the pod
  selector:
    app: grpc-svc
```

For gRPC backends, use a `GRPCRoute` — a first-class route type, where Ingress needed a `backend-protocol: GRPC` annotation:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GRPCRoute
metadata:
  name: grpc-app
spec:
  parentRefs:
    - name: edge
      namespace: gateway
  hostnames: ["grpc.example.com"]
  rules:
    - backendRefs:
        - name: grpc-svc
          port: 50051
```

For plain REST backends, leaving the second hop at HTTP/1.1 is the right default — the multiplexing win is between the *browser* and the edge, where high latency and many parallel requests live.

## The Gotchas

**TCP head-of-line blocking still exists.** HTTP/2 removes head-of-line blocking at the *application* layer, but everything still rides one TCP connection. A single lost packet stalls *every* stream until it's retransmitted, because TCP delivers bytes in order. On lossy networks (mobile), HTTP/2 can be *worse* than HTTP/1.1's multiple connections. This is the exact problem HTTP/3 (QUIC over UDP) was built to solve.

**Don't keep the HTTP/1.1 optimizations.** Domain sharding actively *hurts* under HTTP/2 — it forces multiple connections and defeats multiplexing and a shared HPACK table. Concatenating every asset into one giant bundle also hurts, because it kills granular caching. Serve from a single origin and let multiplexing do its job.

**Connection reuse and load balancing.** A long-lived HTTP/2 connection pins a client to one backend. An L4 load balancer that balances per-connection (not per-request) can leave one pod hot while others sit idle. Use an L7-aware proxy, or cap connection lifetime so clients periodically rebalance.

**Verify end to end, not just at the edge.** A green padlock and `HTTP/2 200` at the browser says nothing about the edge-to-backend hop. Check both legs when you're chasing latency.

## When It Actually Matters

The biggest wins show up for clients making many requests over high-latency links — exactly the browser-to-edge path. For low-latency service-to-service calls inside a cluster, the difference is usually marginal unless you're using gRPC (which mandates HTTP/2 for its streaming).

Turn it on at the edge, verify ALPN negotiated `h2`, drop the HTTP/1.1-era hacks, and reach for HTTP/3 when your traffic is mobile-heavy and packet loss is your real enemy.
