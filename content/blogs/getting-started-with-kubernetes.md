---
title: "Getting Started with Kubernetes"
description: "A practical introduction to Kubernetes for developers who want to move beyond Docker Compose."
date: "2026-03-15"
tags: ["Kubernetes", "DevOps", "Docker"]
---

Kubernetes can feel overwhelming at first, but once you understand the core abstractions it clicks fast. This post walks through the concepts I wish someone had explained to me when I started.

## Why Kubernetes?

Docker Compose is great for local development, but it doesn't give you automatic restarts on failure, rolling deployments, or horizontal scaling. That's where Kubernetes comes in.

## Core Concepts

**Pod** — the smallest deployable unit, wrapping one or more containers.

**Deployment** — manages a set of identical pods and handles rolling updates.

**Service** — a stable DNS name and IP for accessing pods (which come and go).

**ConfigMap / Secret** — inject configuration and credentials without baking them into images.

## Your First Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: my-app:latest
          ports:
            - containerPort: 3000
```

Apply it with `kubectl apply -f deployment.yaml` and check `kubectl get pods` to see it running.

## Next Steps

Once you're comfortable with basic deployments, explore Helm for packaging, and Argo CD for GitOps-style continuous delivery. The ecosystem is large but you don't need all of it on day one.
