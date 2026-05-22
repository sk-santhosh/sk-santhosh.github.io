---
title: "Building My Homelab: From Zero to Proxmox Cluster"
description: "How I turned a couple of old machines into a self-hosted infrastructure playground with Proxmox, VLANs, and Kubernetes."
date: "2026-01-10"
tags: ["Homelab", "Proxmox", "Self-Hosted", "Networking"]
---

My homelab started as a single Raspberry Pi running Pi-hole. Two years later it's a three-node Proxmox cluster hosting 20+ VMs and containers. Here's how it evolved.

## Why Bother?

Cloud services are convenient but opaque. Running things yourself forces you to understand what's actually happening — DNS, TLS, reverse proxies, storage, networking. Everything you gloss over when someone else manages it.

## Hardware

I picked up two used HP EliteDesk 800 G3 mini PCs for about $80 each. They're quiet, power-efficient, and surprisingly capable. Added a used 8-port managed switch for VLANs.

## Proxmox Setup

Proxmox VE is a Debian-based hypervisor that runs both KVM VMs and LXC containers. The web UI is excellent. Install is straightforward — burn the ISO, boot, follow the wizard.

```bash
# After install, fix the enterprise repo warning
sed -i 's|deb https://enterprise.proxmox.com|# deb https://enterprise.proxmox.com|' \
  /etc/apt/sources.list.d/pve-enterprise.list
apt update && apt upgrade -y
```

## Network Segmentation with VLANs

I run separate VLANs for:
- **VLAN 10** — trusted devices (laptops, phones)
- **VLAN 20** — servers / homelab
- **VLAN 30** — IoT devices (cameras, smart plugs)

This keeps compromised IoT devices from reaching anything important.

## What's Running

- **Traefik** — reverse proxy with automatic Let's Encrypt certs
- **Authentik** — SSO for all internal services
- **Gitea** — self-hosted Git
- **Uptime Kuma** — monitoring dashboard
- **k3s** — lightweight Kubernetes for containerized apps

## Lessons Learned

Start simple. Don't buy a rack server as your first machine — they're loud, power-hungry, and overkill. A used mini PC is a better starting point. Add complexity only when you have a reason.
