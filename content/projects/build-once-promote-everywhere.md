---
title: Build Once, Promote Everywhere
blurb: One image is built once, and production ships the exact artefact staging already ran.
summary: Most pipelines rebuild the image on the way to each environment, which quietly means production runs something nobody tested. This builds once into GHCR and promotes that same image forward — merging to main deploys nothing, and shipping is a deliberate human act.
year: "2026"
order: 4
featured: true
category: Delivery
tags: [GitHub Actions, GHCR, Argo CD, Reusable workflows, Release Drafter]
impact:
  - value: "1"
    label: place an image is built
  - value: "0"
    label: rebuilds to promote
repo: https://github.com/sk-santhosh/k8s-cicd
---

If a pipeline runs `docker build` again on the way to production, then the
thing you tested in staging and the thing customers get are two different
builds that you are hoping are identical. Usually they are. The interesting
days are the ones where a base image moved, or a dependency was republished
under the same version, and now production is running code that never passed
a test.

This repo is a working pipeline built around the opposite rule: an image is
produced exactly once, and every environment after that receives *that*
image.

## The problem it solves

Two habits cause most of the trouble, and they are both about who decides to
ship.

The first is rebuilding per environment, which breaks the chain of evidence
between "tested" and "deployed". The second is treating a merge to `main` as
a deployment — which means a routine code review becomes a release decision,
and nobody can answer "what is in production?" without reading commit history.

## How it works

<figure class="diagram">
<svg viewBox="0 0 760 212" role="img" aria-label="Merging to main updates a draft release and deploys nothing. Publishing that draft cuts a version tag, builds the image once into GHCR, and deploys it to staging. Production dispatches the same deploy workflow with the same image, behind a required reviewer, with no build step.">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#8c857c"/>
    </marker>
  </defs>
  <g fill="none" stroke="#c9c2b8" stroke-width="1.25">
    <rect x="6" y="20" width="126" height="44"/>
    <rect x="168" y="20" width="142" height="44"/>
    <rect x="168" y="112" width="142" height="44"/>
    <rect x="356" y="112" width="128" height="44"/>
    <rect x="530" y="112" width="106" height="44"/>
    <rect x="530" y="20" width="224" height="44"/>
  </g>
  <g stroke="#8c857c" stroke-width="1.25" marker-end="url(#ar)" fill="none">
    <path d="M132 42 H162"/>
    <path d="M239 64 V106"/>
    <path d="M310 134 H350"/>
    <path d="M484 134 H524"/>
  </g>
  <g stroke="#ee5126" stroke-width="1.5" marker-end="url(#ar)" fill="none">
    <path d="M583 112 V68"/>
  </g>
  <g font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" fill="#131211" text-anchor="middle">
    <text x="69" y="47">① merge to main</text>
    <text x="239" y="40">② draft release</text>
    <text x="239" y="57">nothing deploys</text>
    <text x="239" y="132">③ publish draft</text>
    <text x="239" y="149">= cut vX.Y.Z</text>
    <text x="420" y="132">④ build once</text>
    <text x="420" y="149">into GHCR</text>
    <text x="583" y="140">⑤ staging</text>
    <text x="642" y="40">⑥ production</text>
    <text x="642" y="57">approval, same image</text>
  </g>
  <g font-family="ui-monospace, monospace" font-size="10.5" fill="#ee5126" text-anchor="middle">
    <text x="583" y="92">promote</text>
  </g>
</svg>
<figcaption>Production is the only arrow that skips the build. That is the entire design.</figcaption>
</figure>

Walking the path:

1. **Merging to `main` runs tests and nothing else.** No image, no rollout.
2. **A draft release accumulates** instead, with the next semantic version
   worked out from the labels on the pull requests that were merged.
3. **Publishing that draft is the decision to ship.** It is a person
   clicking a button, and it is what cuts the version tag.
4. **The image is built once**, from the tag itself rather than from `main`
   — by the time a release is published, `main` may have moved on.
5. **Staging gets it automatically**, through a reusable deploy workflow
   that every environment shares, so there is one rollout path to read
   instead of six.
6. **Production promotes.** It dispatches that same deploy workflow with the
   image reference that already exists, behind a GitHub Environment with a
   required reviewer. There is no build step on this arrow at all.

Steps 4 and 6 are the point. Because the build workflow returns the image
reference as an output, promotion can pass the exact artefact forward rather
than reconstructing a name and hoping it matches.

## The design, stated in the repo's own words

The clearest expression of it is a comment at the top of the workflow:

```yaml
# Production is deliberately not here. It promotes an image this workflow
# already built and staging already ran, so it dispatches deploy.yml directly
# with no build at all.
```

The approval is not a conditional somebody can forget — it is the
environment itself, so the job simply waits:

```yaml
    # Production has a required reviewer on its GitHub environment, so the job
    # waits here for approval. Dev and staging have no protection rules.
    environment:
      name: ${{ inputs.environment }}
```

## What the repo is honest about

There is no cluster behind this repository, so the Argo CD sync calls print
what they would do rather than doing it, and the deploy job resolves a
`nonprod`/`prod` runner pool without a self-hosted pool to route to. What is
real is everything the design rests on: the reusable workflows, the
environment gate holding production until someone approves, and the image
reference being handed from build to deploy untouched.

All six workflows are in the
[repo](https://github.com/sk-santhosh/k8s-cicd/tree/main/.github/workflows).
