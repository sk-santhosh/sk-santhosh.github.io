---
title: "Deploying AI inference on Kubernetes"
description: "A practical guide to running AI model inference workloads on Kubernetes — resource limits, autoscaling and serving at scale."
date: "2025-12-10"
tags: ["Kubernetes", "AI", "Platform Engineering", "DevOps"]
---

Running AI models in production is a different class of problem from a typical web service. The compute profile is spiky, models are large, startup times are slow and GPU scheduling adds a new layer of complexity. Here's the setup that's worked for me across a few deployments.

## The stack

- **Ollama** — model server that handles loading, caching and inference for open models
- **Kubernetes** — orchestration, resource limits, rolling deployments
- **HPA + KEDA** — autoscaling based on queue depth or GPU utilisation
- **Persistent Volume** — model weights live here, not in the container image

![App calls a ClusterIP Service that routes to an Ollama pod on a GPU node; an init container pulls the model into a PVC mounted at /root/.ollama, and KEDA scales replicas on Redis queue depth](/diagrams/ai-inference-k8s.svg)

## Why not bake models into the image?

A 7B parameter model is 4–8 GB. Embedding it in a Docker image makes every pull and every node that runs the pod download that data. Instead, mount a PVC at `/root/.ollama` and pre-pull the model once. The container image stays small, and the weights survive pod restarts.

`ReadWriteOnce` is fine for a single replica. If you plan to scale across nodes (see autoscaling below), switch to a `ReadWriteMany` volume backed by NFS, EFS or Filestore — or give each replica its own volume with a StatefulSet and `volumeClaimTemplates`. An RWO volume can only be mounted by pods on one node, so extra replicas elsewhere will stay `Pending`.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ollama-models
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 50Gi
```

## Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
  namespace: ai
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
        - name: ollama
          image: ollama/ollama:latest
          ports:
            - containerPort: 11434
          resources:
            requests:
              memory: "8Gi"
              cpu: "2"
            limits:
              memory: "16Gi"
              cpu: "4"
              # nvidia.com/gpu: "1"  # uncomment for GPU nodes
          volumeMounts:
            - name: models
              mountPath: /root/.ollama
          readinessProbe:
            httpGet:
              path: /api/tags
              port: 11434
            initialDelaySeconds: 30
            periodSeconds: 10
      volumes:
        - name: models
          persistentVolumeClaim:
            claimName: ollama-models
---
apiVersion: v1
kind: Service
metadata:
  name: ollama
  namespace: ai
spec:
  selector:
    app: ollama
  ports:
    - port: 11434
      targetPort: 11434
```

## Pre-pulling models with an init container

Use an init container to pull the model before the main container starts, so the pod is never serving requests with a cold model cache:

```yaml
initContainers:
  - name: pull-model
    image: ollama/ollama:latest
    command: ["sh", "-c", "ollama serve & sleep 5 && ollama pull llama3.2:3b"]
    volumeMounts:
      - name: models
        mountPath: /root/.ollama
```

## GPU nodes

If you have GPU nodes in your cluster, add the NVIDIA device plugin and then request GPUs in the container spec:

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.16.0/deployments/static/nvidia-device-plugin.yml
```

Then in your container spec:

```yaml
resources:
  limits:
    nvidia.com/gpu: "1"
```

Kubernetes will schedule the pod onto a node with a free GPU. Taint GPU nodes so only GPU workloads land there:

```bash
kubectl taint nodes <gpu-node> nvidia.com/gpu=present:NoSchedule
```

And add a toleration to your Deployment so Ollama pods can be scheduled there.

## Autoscaling

GPU pods don't scale the same way HTTP services do. A single replica with queued requests is usually better than five replicas contending for GPU memory. KEDA lets you scale on queue depth (SQS, Redis, Kafka) instead of CPU — more meaningful for inference workloads:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: ollama-scaler
  namespace: ai
spec:
  scaleTargetRef:
    name: ollama
  minReplicaCount: 1
  maxReplicaCount: 4
  triggers:
    - type: redis
      metadata:
        address: redis.default.svc.cluster.local:6379
        listName: inference-queue
        listLength: "10"
```

## Exposing the API

If you want your app pods to call Ollama, the ClusterIP service is enough — use `http://ollama.ai.svc.cluster.local:11434` from within the cluster. For external access, put it behind Cloudflare Tunnel (no public IP needed) or an internal ingress with auth.

The biggest operational lesson: set `initialDelaySeconds` on your readiness probe generously. Large models take 20–40 seconds to load from disk on a cold start. A misconfigured probe will put the pod into a restart loop before it's ever ready.
