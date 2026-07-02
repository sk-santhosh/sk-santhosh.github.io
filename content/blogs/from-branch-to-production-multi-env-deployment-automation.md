---
title: "From branch to production: automating multi-environment deployments with GitHub Actions and Argo CD on EKS"
description: "How I run 20+ developer environments plus testing, staging and production across two AWS accounts with one standalone deploy-pipeline repo whose workflow every microservice reuses — GitHub Actions building images, self-hosted runners reaching private EKS, and per-cluster Argo CD doing the syncs. On-demand dev deploys, auto-drafted releases and a branch-to-production promotion flow that never rebuilds the artefact."
date: "2026-07-02"
tags: ["Kubernetes", "GitOps", "CI/CD", "Platform Engineering"]
---

Every deployment story starts the same way. A developer finishes a change to the `checkout` service, commits it to their branch — `user/santhosh/new-tax-rules` — and pushes. The unit tests pass. But `checkout` doesn't live alone: before this change goes anywhere near a pull request, it needs to run against the real `payments` service. Which raises the question every microservice team eventually collides with — *where does that happen?*

Give a team of thirty engineers one shared staging environment and they queue behind each other all week. Give each of them a full environment of their own and the cloud bill and the cluster count both explode. The platform I run threads that needle: developers get environments on demand — `dev1`, `dev2`, all the way past `dev20` — plus a testing environment, a staging environment and production, and every one of them deploys through the *same* pipeline. The only things that change between "a developer trying an integration" and "the release going to production" are the trigger and the target. The mechanics — build an image once, set its tag, tell Argo CD to sync — never change.

This post follows that one change from the first push all the way to production: the infrastructure underneath, the single reusable pipeline and the promotion gates in between.

## The shape of the platform

Before the pipeline, the ground it runs on. Two AWS accounts, split along the only boundary that really matters — production versus everything else.

- The **non-prod account** holds a single EKS cluster. Every non-production environment is a namespace in it: `dev1`…`dev20+`, `dev0` (which doubles as the testing environment) and `staging`. One cluster, one Argo CD, many namespaces is the cheap way to run twenty-odd environments — you pay for one control plane, not twenty.
- The **production account** is on its own. Separate EKS cluster, separate IAM, separate service quotas. Nothing in dev or staging shares an account with production, so a fat-fingered role or a runaway namespace can never reach it.

Each cluster runs its **own** Argo CD in-cluster, and both cluster APIs are private — no public endpoint. That last decision drives everything about how the CI reaches them.

![Platform topology across two AWS accounts. GitHub Actions dispatches jobs down to a self-hosted runner Auto Scaling group inside the non-prod account. The non-prod account holds one EKS cluster with a private API, namespace-isolated into dev1, dev2, dev3, dev20+, dev0/testing and staging, an in-cluster Argo CD, and RDS plus self-hosted databases in private subnets. The isolated production account has its own Argo CD, its own EKS cluster with a single production namespace and its own RDS. The runner reaches the non-prod Argo CD directly and the production Argo CD cross-account — it is the only path into the private cluster APIs.](/diagrams/multi-env-aws-topology.svg)

## Why self-hosted runners

GitHub-hosted runners live on the public internet. My cluster APIs, my Argo CD servers and my databases do not — they only answer on private DNS inside the VPC. A hosted runner simply cannot reach them, and I am not about to punch a public hole in the cluster API to make CI convenient.

So the deploy half of the pipeline runs on **self-hosted runners** in an EC2 Auto Scaling group, inside the VPC, with Docker available. Because they sit on the private network they can reach each cluster's Argo CD over its internal endpoint, hit the private EKS API and talk to databases for migrations. The ASG scales the fleet up when jobs queue and back down to nothing when idle, so I am not paying for permanently-on runners.

The runner is the trust boundary. GitHub dispatches a job; the runner — and only the runner — touches the clusters. Reaching into production is deliberately narrow: only the prod-labelled runner pool has the network route and security-group access to the production Argo CD endpoint, and the production Argo CD credentials live in the `production` GitHub Environment — released to a job only after its approval gate clears. That keeps the whole "reach into prod" capability in one auditable place rather than smeared across workflow YAML.

The image *build* is different — it has no need for private access, so I keep it on ordinary GitHub-hosted runners and only push the resulting image to ECR. Build in the cheap public lane, deploy in the private one.

## One reusable pipeline, many triggers

Here is the idea that keeps the whole thing maintainable: there is really only one deployment pipeline, and it lives in its own standalone repo — `org/deploy-pipeline`. Each microservice repo builds its own image with an immutable tag; the pipeline takes a service name, a target environment and that tag, points the right environment's Argo CD at it, and syncs. Every scenario below is every microservice running that same shared workflow from a different trigger against a different namespace.

![Sequence diagram of one on-demand deployment end to end, across six lifelines: Developer, checkout repo CI, deploy-pipeline repo, self-hosted runner, Argo CD and EKS namespace dev7. The developer fires workflow_dispatch with a branch and target environment dev7. The checkout repo's CI builds the image and pushes it to ECR with a sha-and-timestamp tag, then pulls in the deploy-pipeline repo's reusable workflow with uses:, passing the service, environment and tag — the deploy job runs inside this same run, landing on the private self-hosted runner. The runner logs in to Argo CD over the private endpoint, sets image.tag on checkout-dev7 and runs app sync with a health wait. Argo CD applies the manifests and rolls out in namespace dev7. Healthy status flows back through Argo CD and the runner, and the developer sees their own run go green — dev7 ready to test.](/diagrams/multi-env-deploy-sequence.svg)

That reuse is enforced by construction. The pipeline YAML lives once, in its own repo, and each service's workflow pulls it in by reference with `uses:` — a cross-repo reusable workflow, not a separate run being triggered. Nothing is copied, so there is nothing to drift: a fix merged to `deploy-pipeline@main` reaches all thirty services on their very next deploy.

## The developer inner loop: environments on demand

Back to the developer from the opening. Their branch is pushed and they want `checkout` running next to the live `payments` service before a pull request exists. They do not file a ticket for an environment and they do not wait for one to free up. They open the Actions tab in GitHub, pick their branch and pick a target namespace.

```yaml
# .github/workflows/deploy-on-demand.yml
name: Deploy to a dev environment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: Target namespace
        type: choice
        options: [dev0, dev1, dev2, dev3, dev4, dev5, dev6, dev7]   # …dev20+ trimmed
        required: true

jobs:
  build:
    runs-on: ubuntu-latest              # public lane: no private access needed
    permissions:
      id-token: write                   # OIDC — required to assume the ECR push role
      contents: read
    outputs:
      tag: ${{ steps.meta.outputs.tag }}
    steps:
      - uses: actions/checkout@v4
      - id: meta
        # immutable, traceable tag: short SHA + timestamp
        run: echo "tag=sha-$(git rev-parse --short HEAD)-$(date +%s)" >> "$GITHUB_OUTPUT"
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.ECR_PUSH_ROLE }}
          aws-region: eu-north-1
      - uses: aws-actions/amazon-ecr-login@v2
      - run: |
          docker build -t "$ECR/checkout:$TAG" .
          docker push "$ECR/checkout:$TAG"
        env:
          ECR: ${{ vars.ECR_REGISTRY }}
          TAG: ${{ steps.meta.outputs.tag }}

  deploy:
    needs: build
    # reuse the shared YAML from the pipeline repo — runs inside this same pipeline run
    uses: org/deploy-pipeline/.github/workflows/deploy.yml@main
    with:
      service: checkout
      environment: ${{ inputs.environment }}
      image_tag: ${{ needs.build.outputs.tag }}
    secrets: inherit
```

The build tags the image with the short commit SHA and a timestamp — disposable and unique, never reused. Then the `deploy` job *is* the shared workflow: `uses:` pulls the YAML from the `deploy-pipeline` repo and runs it inside this same run — no second pipeline is triggered, and the deploy status lands on the developer's own run, right next to the build. Two practical details: the `deploy-pipeline` repo has to grant workflow access to repositories in the organisation (Settings → Actions → Access), and pinning `@main` means every service picks up pipeline fixes immediately — pin a tag instead if you want a controlled rollout of pipeline changes.

### The standalone pipeline repo

`org/deploy-pipeline` is the only place the deploy logic exists. Its one workflow is `workflow_call`-able — that is what the services `uses:` — and carries a `workflow_dispatch` trigger as well, for the manual production promote later. It runs on a self-hosted runner, picks up the environment's private Argo CD endpoint, points the service's Argo CD Application at the new image tag — the apps are Helm-based, so `-p image.tag` overrides a chart parameter — and syncs it.

```yaml
# org/deploy-pipeline · .github/workflows/deploy.yml
name: deploy

on:
  workflow_call:                # services reuse this YAML inside their own runs
    inputs:
      service:     { required: true, type: string }
      environment: { required: true, type: string }
      image_tag:   { required: true, type: string }
  workflow_dispatch:            # humans dispatch it here for production promotes
    inputs:
      service:     { required: true, type: string }
      environment: { required: true, type: string }
      image_tag:   { required: true, type: string }

jobs:
  sync:
    # production promotes run in this repo, where the environment gate lives
    environment: ${{ inputs.environment }}
    # route to a runner that can reach this environment's private endpoints
    runs-on:
      - self-hosted
      - ${{ inputs.environment == 'production' && 'prod' || 'nonprod' }}
    steps:
      - name: Log in to the environment's Argo CD (private endpoint)
        run: |
          argocd login "$ARGOCD_SERVER" --grpc-web \
            --username "$ARGOCD_USER" --password "$ARGOCD_PASSWORD"
        env:
          # organisation-scoped vars/secrets — resolved wherever the workflow runs
          ARGOCD_SERVER: ${{ inputs.environment == 'production' && vars.ARGOCD_SERVER_PROD || vars.ARGOCD_SERVER_NONPROD }}
          ARGOCD_USER: ${{ secrets.ARGOCD_USER }}
          ARGOCD_PASSWORD: ${{ secrets.ARGOCD_PASSWORD }}

      - name: Set the image tag and sync
        run: |
          app="${{ inputs.service }}-${{ inputs.environment }}"
          argocd app set "$app" -p image.tag="${{ inputs.image_tag }}"
          argocd app sync "$app" --timeout 300
          argocd app wait "$app" --health --timeout 300
```

Three things earn their place here. First, `runs-on` chooses the runner pool by environment, so a production deploy lands on the pool that has the network route into the production account and a dev deploy never does. Second, the Argo CD credentials are organisation-scoped secrets, restricted to the repos that need them and resolved through `secrets: inherit` — service workflows reference them but never contain them. Third, a subtlety of reusable workflows that this design leans on: a called workflow runs in the *caller's* context, so for dev and staging the `environment:` resolves against the calling service's repo — those environments carry no protection rules and auto-create on first use — while the production promote is dispatched in *this* repo, where the `production` environment and its required-reviewer gate are configured exactly once.

A note on honesty here: `argocd app set -p image.tag=…` writes the override into the live Application and `argocd app sync` reconciles it. That is deliberately imperative — the CI is the source of the running tag, not a git commit. It is fast and it is exactly what you want for throwaway dev environments. The purer GitOps alternative is to commit the new tag to a config repo and let Argo CD notice; I reach for that on `staging` and `production`, where git history alone should answer "what was deployed and when", and keep the imperative path for the dev namespaces where speed matters more than an audit trail.

## Promotion: from a branch to production

The integration test in `dev7` passed — the new tax rules work against the live `payments` service. On-demand dev deploys are the inner loop; the outer loop is promotion — how that change now earns its way from a branch to production through a series of gates, each one automated except the ones that genuinely need a human.

![Sequence diagram of the release and promotion flow in four phases, across six lifelines: Developer/QA, checkout repo CI, deploy-pipeline repo, self-hosted runner, Argo CD and EKS namespaces. Phase one, integrate: merging the PR from the feature branch into testing builds a sha-tagged image, and the checkout repo reuses the deploy-pipeline repo's workflow targeting dev0, where QA verifies the feature and signs off. Phase two, release cut: merging into main makes release-drafter re-draft to release-2.3.12, and a human publishes the release creating the identical git tag release-2.3.12 — the one deliberate human decision. Phase three, staging: publishing triggers a build of the release-2.3.12 image and the same reuse of the shared workflow targeting staging, where the release is verified in a prod-like environment. Phase four, production: a manual dispatch of the deploy-pipeline workflow promotes release-2.3.12, the production environment gate requires reviewer approval, and the prod runner pool syncs checkout-production cross-account — rolling out the same image, never rebuilt.](/diagrams/multi-env-release-sequence.svg)

### Testing on merge

Once the developer is happy, they open a pull request from their branch into the `testing` branch (which drives the `dev0` namespace). Merge is gated on review. The merge itself triggers a build — same build job, but on `push` to `testing` instead of a manual dispatch — ending with the same `uses:` of the shared workflow, always targeting `dev0`. Now the integration team has the feature running in a stable, shared testing environment without anyone clicking anything.

### Cutting a release

When testing signs off, a pull request goes from the feature into `main`. And here I let automation do the bookkeeping I would otherwise get wrong: every merge into `main` updates a **draft release** with an automatically bumped sequential version.

```yaml
# .github/release-drafter.yml
name-template: 'release-$RESOLVED_VERSION'
tag-template: 'release-$RESOLVED_VERSION'   # tag = name = image tag: one identifier everywhere
version-resolver:
  minor:
    labels: [feature]
  patch:
    labels: [fix, chore]
  default: patch
categories:
  - title: Features
    labels: [feature]
  - title: Fixes
    labels: [fix]
template: |
  ## What changed
  $CHANGES
```

```yaml
# .github/workflows/release-drafter.yml
on:
  push:
    branches: [main]
permissions:
  contents: write
  pull-requests: read
jobs:
  draft:
    runs-on: ubuntu-latest
    steps:
      - uses: release-drafter/release-drafter@v6
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Each merge re-drafts the notes, and the next version is resolved from the labels of everything merged since the last published release — after `release-2.3.11`, a stack of fix-labelled PRs drafts `release-2.3.12`, and one feature-labelled PR in the mix would lift it to `release-2.4.0` instead. Nobody hand-maintains a changelog and nobody argues about the next version number. When every feature slated for the release has landed, a human publishes the draft. Publishing creates the git tag — `release-2.3.12`, deliberately identical to the release name and to the image tag that is about to be built, so there is exactly one identifier for a release in git, in ECR and in Argo CD. That publish is the one deliberate manual decision in the whole flow: *this* is the cut.

### Staging on publish, production on approval

Publishing the release fires the next workflow. It builds the image **once**, tagged with the release name, and deploys it to `staging` automatically.

```yaml
# .github/workflows/release-deploy.yml
on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      id-token: write                   # OIDC for the ECR push role, as before
      contents: read
    outputs:
      tag: ${{ steps.meta.outputs.tag }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.release.tag_name }}
      - id: meta
        # permanent, human-meaningful tag: the release tag itself (immutable,
        # unlike the release name which can be edited after publishing)
        run: echo "tag=${{ github.event.release.tag_name }}" >> "$GITHUB_OUTPUT"
      # …ECR login + build + push as before…

  staging:
    needs: build
    uses: org/deploy-pipeline/.github/workflows/deploy.yml@main
    with:
      service: checkout
      environment: staging
      image_tag: ${{ needs.build.outputs.tag }}
    secrets: inherit
```

The team verifies the release in staging — a prod-like environment, but still in the non-prod account. When it holds up, production is one manual step: dispatch the deploy pipeline itself, from the `deploy-pipeline` repo's Actions tab or the CLI, with the tag that was verified in staging.

```bash
gh workflow run deploy.yml -R org/deploy-pipeline \
  -f service=checkout \
  -f environment=production \
  -f image_tag=release-2.3.12
```

No new build, no separate promote workflow — production is the same `deploy.yml`, this time fired by its `workflow_dispatch` trigger in the pipeline repo itself. The exact tag that cleared staging is pointed at the production Argo CD, and the required-reviewer rule on the pipeline repo's `production` environment means the deploy pauses for an approval before the cross-account sync runs.

## Why the same image all the way through

The thing I care about most in that flow is what it *doesn't* do: it never rebuilds between staging and production. The image that gets verified in staging is the byte-for-byte image that ships to prod — same layers, same digest.

Rebuild for production and you have thrown away everything staging just told you. A fresh build can pull a different transitive dependency, bake in a different base-image patch or pick up a different build-time environment, and now the artefact you tested is not the artefact you shipped. Build once, promote the digest, and staging becomes a real gate instead of a rough approximation.

That is also why the tagging strategy is split:

- **Dev tags are disposable** — a git SHA plus a timestamp. They are unique, they are traceable back to a commit and nobody ever needs to find them again.
- **Release tags are permanent** — the semantic release version, `release-2.3.12`. That is the tag that lives in staging, gets promoted to production and is what I roll back *to* if something goes wrong.

## The guardrails I would not skip

Running this many environments on shared infrastructure only stays sane with a few rules held firmly:

- **Immutable image tags, always.** No `:latest`, no re-pushing a tag. If the tag is immutable then "what is running" is an unambiguous question with one answer, and a rollback is just pinning an older tag.
- **The production boundary is an account boundary.** Namespaces are fine for isolating dev environments from each other; they are not enough between dev and prod. Separate accounts give you separate IAM, separate quotas and a blast radius that stops at the account edge.
- **Runners are the only door into the clusters.** Private cluster APIs plus self-hosted runners mean the attack surface is the runner fleet and its credentials, not a public endpoint. Keep the network route into production scoped to the prod runner pool, and the production secrets behind the environment gate.
- **Cost-watch the long tail of namespaces.** Twenty-plus dev namespaces quietly accrete idle Deployments and orphaned PVCs. I reap dev namespaces on a schedule — anything not redeployed in N days gets scaled to zero — because "cheap per environment" only stays cheap if nobody has to remember to clean up.
- **One pipeline repo, not thirty copies.** The moment each service or environment grows its own bespoke deploy workflow, they drift, and a fix made for staging never reaches dev. The standalone `deploy-pipeline` repo, reused by reference, is the single most valuable decision in this design — dev and staging deploys show up on each service's own run, and every production promote lives in the pipeline repo's history.

## Closing

Trace the whole journey once more. A push to `user/santhosh/new-tax-rules`; an on-demand deploy to `dev7` to test against `payments`; a PR into `testing` that auto-deploys to `dev0`; QA sign-off; a PR into `main` that bumps the draft to `release-2.3.12`; a human publishing the release; an automatic build-and-deploy to `staging`; and finally a manual, approved promotion of that exact image into the production account. Every hop was the same pipeline with a different trigger and a different target.

None of the pieces here are exotic. GitHub Actions builds images, self-hosted runners bridge into private networks, Argo CD reconciles clusters and release-drafter counts versions. What makes it work is the discipline of collapsing everything onto **one pipeline in one repo** and letting the service, the trigger and the target be the only variables — so a developer testing an integration in `dev7` and a release manager promoting `release-2.3.12` to production are, mechanically, running the identical workflow in `deploy-pipeline`.

That is the property worth designing for. When your on-demand dev deploy and your production promotion share their machinery, the path to production gets exercised dozens of times a day by ordinary development — and the day you actually ship to prod, nothing about the mechanism is new.
