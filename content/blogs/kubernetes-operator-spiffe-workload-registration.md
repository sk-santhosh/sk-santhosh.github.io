---
title: "Building a Kubernetes operator in Go: automating SPIFFE workload registration"
description: "In the previous post I registered SPIFFE entries by hand with spire-server entry create. Here I build the Kubernetes operator that automates it — a controller-runtime reconciler that watches Deployments and registers them with the SPIRE Entry API, finalizer cleanup and Prometheus metrics included."
date: "2026-06-29"
tags: ["Kubernetes", "Go", "Operators", "Platform Engineering"]
---

In the [previous post](/blogs/zero-trust-workload-identity-spiffe-spire) I gave workloads a zero trust identity with SPIFFE and SPIRE — and registered every workload entry by hand with `spire-server entry create`. That's fine for a demo and untenable in production: a human typing CLI commands does not scale to hundreds of services that come and go on every deploy.

So in this post I build the piece that closes the gap — a Kubernetes operator called **spiffe-registrar** that watches Deployments and registers them with SPIRE automatically. Every new Deployment gets a SPIFFE ID without anyone touching the CLI, and when a Deployment is deleted its entry is cleaned up. It's a real, production-shaped operator built on `controller-runtime`, calling the SPIRE Entry API over gRPC.

## Why operators exist

`kubectl` is for humans. You observe the cluster, decide what should change and apply it. An **operator** is that same loop, automated: a program that watches the Kubernetes API, compares the world to the desired state and acts to close the difference — forever, without you.

That's the whole idea, the **control loop**: observe current state, compare to desired state, act, repeat. Kubernetes itself is built from these loops — the Deployment controller reconciles ReplicaSets, the ReplicaSet controller reconciles Pods. An operator extends the same machinery to *your* domain. Ours reconciles "Deployments" against "SPIRE entries".

When should you write one? When the gap between desired and actual state needs ongoing, automated reconciliation that no existing tool covers — provisioning external state from Kubernetes objects, in this case SPIRE registration entries. If a Helm chart or a one-off Job does the job, use those. Reach for an operator when the work is continuous and event-driven, not a one-time apply.

The reassuring part: an operator is just a Go program watching the Kubernetes API. There's no magic. `controller-runtime` gives you the caching, the work queue and the leader election; you write the function that decides what to do.

## What I'm building

`spiffe-registrar` introduces one custom resource, `SpiffeRegistration`, which is a **policy**: it says "for Deployments matching this selector, register a SPIFFE entry under this trust domain". A single policy covers many Deployments — that's the design that scales, rather than one custom resource per workload.

```yaml
apiVersion: registrar.example.com/v1alpha1
kind: SpiffeRegistration
metadata:
  name: prod-workloads
spec:
  trustDomain: example.org
  parentID: spiffe://example.org/ns/spire-system/sa/spire-agent
  ttl: 1h
  namespaceSelector:
    matchLabels:
      spiffe.io/registrar: enabled
  deploymentSelector: {}        # all Deployments in matching namespaces
```

The operator watches Deployments. For each Deployment a policy selects, it derives the SPIFFE ID from the namespace and service account — `spiffe://example.org/ns/prod/sa/checkout` — and calls the SPIRE Entry API to create the entry with the `k8s:ns` and `k8s:sa` selectors. **This automates exactly what I did manually** with:

```bash
spire-server entry create \
  -parentID spiffe://example.org/ns/spire-system/sa/spire-agent \
  -spiffeID spiffe://example.org/ns/prod/sa/checkout \
  -selector k8s:ns:prod \
  -selector k8s:sa:checkout
```

On deletion, a finalizer ensures the entry is removed before Kubernetes lets the Deployment go.

![The spiffe-registrar reconcile loop: the operator watches Deployments and SpiffeRegistration custom resources in the Kubernetes API (desired state), runs a Reconcile function that observes, diffs and acts, manages a finalizer, and calls the SPIRE Server Entry API over mTLS gRPC (actual state) to create or delete registration entries, writing finalizer and status back to the Kubernetes API](/diagrams/spiffe-registrar-operator.svg)

## Project setup with controller-runtime

I'll use `controller-runtime` directly rather than scaffolding with the full kubebuilder CLI — it's fewer moving parts and makes the wiring explicit. Start a module and pull the dependencies:

```bash
go mod init github.com/example/spiffe-registrar
```

```text
module github.com/example/spiffe-registrar

go 1.22

require (
	github.com/prometheus/client_golang v1.19.0
	github.com/spiffe/go-spiffe/v2 v2.3.0
	github.com/spiffe/spire-api-sdk v1.9.6
	google.golang.org/grpc v1.64.0
	k8s.io/api v0.29.3
	k8s.io/apimachinery v0.29.3
	k8s.io/client-go v0.29.3
	sigs.k8s.io/controller-runtime v0.17.3
)
```

The layout is the conventional one — API types, the controller, and a thin `main`:

```text
spiffe-registrar/
├── cmd/main.go                       # manager wiring + SPIRE client
├── api/v1alpha1/                      # CRD Go types
│   ├── groupversion_info.go
│   └── spiffe_registration_types.go
├── internal/controller/              # the reconciler
│   └── deployment_controller.go
└── config/{crd,rbac}/                # generated manifests
```

Two code-generation tools do the boilerplate — deepcopy methods, the CRD YAML and the RBAC ClusterRole — and `setup-envtest` provides the API-server binaries for tests:

```bash
go install sigs.k8s.io/controller-tools/cmd/controller-gen@v0.14.0
go install sigs.k8s.io/controller-runtime/tools/setup-envtest@latest
```

## Defining the CRD in Go

The API group registration is small:

```go
// api/v1alpha1/groupversion_info.go
// +kubebuilder:object:generate=true
// +groupName=registrar.example.com
package v1alpha1

import (
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/scheme"
)

var (
	GroupVersion  = schema.GroupVersion{Group: "registrar.example.com", Version: "v1alpha1"}
	SchemeBuilder = &scheme.Builder{GroupVersion: GroupVersion}
	AddToScheme   = SchemeBuilder.AddToScheme
)
```

The resource itself. The `kubebuilder` markers drive validation, the status subresource and the printer columns — `controller-gen` turns them into the CRD's OpenAPI schema:

```go
// api/v1alpha1/spiffe_registration_types.go
package v1alpha1

import metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

type SpiffeRegistrationSpec struct {
	// TrustDomain is the SPIFFE trust domain entries are created under.
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:MinLength=1
	TrustDomain string `json:"trustDomain"`

	// ParentID is the agent/node-alias SPIFFE ID that parents the entries.
	// +kubebuilder:validation:Required
	// +kubebuilder:validation:Pattern=`^spiffe://.+`
	ParentID string `json:"parentID"`

	// TTL is the X.509-SVID lifetime for registered workloads.
	// +kubebuilder:default="1h"
	// +optional
	TTL metav1.Duration `json:"ttl,omitempty"`

	// NamespaceSelector selects namespaces in scope. Nil matches all.
	// +optional
	NamespaceSelector *metav1.LabelSelector `json:"namespaceSelector,omitempty"`

	// DeploymentSelector further filters Deployments by label. Nil matches all.
	// +optional
	DeploymentSelector *metav1.LabelSelector `json:"deploymentSelector,omitempty"`
}

type SpiffeRegistrationStatus struct {
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`
	// +optional
	LastSyncTime *metav1.Time `json:"lastSyncTime,omitempty"`
	// +optional
	RegisteredEntries int `json:"registeredEntries,omitempty"`
	// +optional
	ObservedGeneration int64 `json:"observedGeneration,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:scope=Cluster,shortName=sreg
// +kubebuilder:printcolumn:name="Trust Domain",type=string,JSONPath=`.spec.trustDomain`
// +kubebuilder:printcolumn:name="Entries",type=integer,JSONPath=`.status.registeredEntries`
// +kubebuilder:printcolumn:name="Age",type=date,JSONPath=`.metadata.creationTimestamp`
type SpiffeRegistration struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   SpiffeRegistrationSpec   `json:"spec,omitempty"`
	Status SpiffeRegistrationStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true
type SpiffeRegistrationList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []SpiffeRegistration `json:"items"`
}

func init() {
	SchemeBuilder.Register(&SpiffeRegistration{}, &SpiffeRegistrationList{})
}
```

Then generate the deepcopy methods and the CRD/RBAC manifests:

```bash
controller-gen object paths=./api/...
controller-gen crd rbac:roleName=spiffe-registrar \
  paths=./... output:crd:dir=config/crd output:rbac:dir=config/rbac
```

## Writing the reconciler

This is the core. The reconciler's primary object is the **Deployment** — that's what triggers work — and a `SpiffeRegistration` policy decides whether a given Deployment is in scope. The controller holds a SPIRE `EntryClient` injected at startup.

First the type, constants and the custom metrics, registered into `controller-runtime`'s Prometheus registry so they're served on the manager's metrics endpoint:

```go
// internal/controller/deployment_controller.go
package controller

import (
	"context"
	"fmt"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	entryv1 "github.com/spiffe/spire-api-sdk/proto/spire/api/server/entry/v1"
	"github.com/spiffe/spire-api-sdk/proto/spire/api/types"
	"github.com/spiffe/go-spiffe/v2/spiffeid"
	"google.golang.org/grpc/codes"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apimeta "k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"

	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/handler"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/metrics"
	"sigs.k8s.io/controller-runtime/pkg/reconcile"

	registrarv1alpha1 "github.com/example/spiffe-registrar/api/v1alpha1"
)

const (
	finalizerName     = "registrar.example.com/entry-cleanup"
	entryIDAnnotation = "registrar.example.com/entry-id"
)

var (
	registrationTotal = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "spiffe_registration_total",
		Help: "SPIFFE workload entries successfully registered, by namespace.",
	}, []string{"namespace"})

	registrationErrors = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "spiffe_registration_errors_total",
		Help: "SPIFFE registration failures, by namespace.",
	}, []string{"namespace"})
)

func init() {
	metrics.Registry.MustRegister(registrationTotal, registrationErrors)
}

// DeploymentReconciler registers selected Deployments with SPIRE.
type DeploymentReconciler struct {
	client.Client
	Entry entryv1.EntryClient
}
```

Now `Reconcile`. The finalizer pattern is the part to get exactly right: add the finalizer *before* you create remote state, and remove it only *after* the remote state is gone — otherwise you can leak SPIRE entries when a Deployment is deleted:

```go
func (r *DeploymentReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	var deploy appsv1.Deployment
	if err := r.Get(ctx, req.NamespacedName, &deploy); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	policy, err := r.matchingPolicy(ctx, &deploy)
	if err != nil {
		return ctrl.Result{}, err
	}
	if policy == nil {
		// Out of scope — drop any finalizer added on a previous pass.
		if controllerutil.RemoveFinalizer(&deploy, finalizerName) {
			return ctrl.Result{}, r.Update(ctx, &deploy)
		}
		return ctrl.Result{}, nil
	}

	// --- deletion path: clean up the SPIRE entry, then release the object ---
	if !deploy.DeletionTimestamp.IsZero() {
		if controllerutil.ContainsFinalizer(&deploy, finalizerName) {
			if err := r.deleteEntry(ctx, &deploy); err != nil {
				registrationErrors.WithLabelValues(deploy.Namespace).Inc()
				return ctrl.Result{}, err // requeue: never drop the finalizer on failure
			}
			controllerutil.RemoveFinalizer(&deploy, finalizerName)
			if err := r.Update(ctx, &deploy); err != nil {
				return ctrl.Result{}, err
			}
			log.Info("removed SPIRE entry", "deployment", req.NamespacedName)
		}
		return ctrl.Result{}, nil
	}

	// --- create/update path: finalizer first, then remote state ---
	if controllerutil.AddFinalizer(&deploy, finalizerName) {
		if err := r.Update(ctx, &deploy); err != nil {
			return ctrl.Result{}, err
		}
	}

	entryID, err := r.ensureEntry(ctx, policy, &deploy)
	if err != nil {
		registrationErrors.WithLabelValues(deploy.Namespace).Inc()
		r.setCondition(ctx, policy, metav1.ConditionFalse, "RegistrationFailed", err.Error())
		// Back off and retry rather than hot-looping on a failing SPIRE server.
		return ctrl.Result{RequeueAfter: 30 * time.Second}, err
	}

	// Record the entry ID on the Deployment for idempotency + cleanup.
	if deploy.Annotations[entryIDAnnotation] != entryID {
		if deploy.Annotations == nil {
			deploy.Annotations = map[string]string{}
		}
		deploy.Annotations[entryIDAnnotation] = entryID
		if err := r.Update(ctx, &deploy); err != nil {
			return ctrl.Result{}, err
		}
	}

	registrationTotal.WithLabelValues(deploy.Namespace).Inc()
	r.setCondition(ctx, policy, metav1.ConditionTrue, "Registered", "all selected Deployments registered")
	log.Info("registered workload", "entryID", entryID)

	// Re-sync periodically so drift (a manually deleted entry) self-heals.
	return ctrl.Result{RequeueAfter: time.Minute}, nil
}
```

The SPIRE calls live in two helpers. `ensureEntry` is idempotent — `BatchCreateEntry` returns `AlreadyExists` (and the existing entry) if it's already there, which I treat as success:

```go
func (r *DeploymentReconciler) ensureEntry(
	ctx context.Context, policy *registrarv1alpha1.SpiffeRegistration, deploy *appsv1.Deployment,
) (string, error) {
	sa := serviceAccount(deploy)
	sid, err := spiffeid.FromString(
		fmt.Sprintf("spiffe://%s/ns/%s/sa/%s", policy.Spec.TrustDomain, deploy.Namespace, sa))
	if err != nil {
		return "", fmt.Errorf("build spiffe id: %w", err)
	}
	parent, err := spiffeid.FromString(policy.Spec.ParentID)
	if err != nil {
		return "", fmt.Errorf("invalid parentID: %w", err)
	}

	ttl := int32(policy.Spec.TTL.Duration.Seconds())
	if ttl == 0 {
		ttl = 3600
	}

	entry := &types.Entry{
		SpiffeId: &types.SPIFFEID{TrustDomain: sid.TrustDomain().Name(), Path: sid.Path()},
		ParentId: &types.SPIFFEID{TrustDomain: parent.TrustDomain().Name(), Path: parent.Path()},
		Selectors: []*types.Selector{
			{Type: "k8s", Value: "ns:" + deploy.Namespace},
			{Type: "k8s", Value: "sa:" + sa},
		},
		X509SvidTtl: ttl,
	}

	resp, err := r.Entry.BatchCreateEntry(ctx, &entryv1.BatchCreateEntryRequest{
		Entries: []*types.Entry{entry},
	})
	if err != nil {
		return "", fmt.Errorf("BatchCreateEntry rpc: %w", err)
	}

	res := resp.Results[0]
	switch codes.Code(res.Status.Code) {
	case codes.OK, codes.AlreadyExists:
		return res.Entry.Id, nil // the existing entry is returned on AlreadyExists
	default:
		return "", fmt.Errorf("entry rejected: %s (%s)", res.Status.Message, codes.Code(res.Status.Code))
	}
}

func (r *DeploymentReconciler) deleteEntry(ctx context.Context, deploy *appsv1.Deployment) error {
	entryID := deploy.Annotations[entryIDAnnotation]
	if entryID == "" {
		return nil // nothing was ever registered
	}
	resp, err := r.Entry.BatchDeleteEntry(ctx, &entryv1.BatchDeleteEntryRequest{Ids: []string{entryID}})
	if err != nil {
		return fmt.Errorf("BatchDeleteEntry rpc: %w", err)
	}
	if c := codes.Code(resp.Results[0].Status.Code); c != codes.OK && c != codes.NotFound {
		return fmt.Errorf("delete rejected: %s (%s)", resp.Results[0].Status.Message, c)
	}
	return nil // NotFound is fine — the entry is already gone
}
```

And the small helpers — policy matching against namespace and Deployment labels, and the status condition:

```go
func (r *DeploymentReconciler) matchingPolicy(
	ctx context.Context, deploy *appsv1.Deployment,
) (*registrarv1alpha1.SpiffeRegistration, error) {
	var policies registrarv1alpha1.SpiffeRegistrationList
	if err := r.List(ctx, &policies); err != nil {
		return nil, err
	}
	var ns corev1.Namespace
	if err := r.Get(ctx, client.ObjectKey{Name: deploy.Namespace}, &ns); err != nil {
		return nil, err
	}
	for i := range policies.Items {
		p := &policies.Items[i]
		if selectorMatches(p.Spec.NamespaceSelector, ns.Labels) &&
			selectorMatches(p.Spec.DeploymentSelector, deploy.Labels) {
			return p, nil
		}
	}
	return nil, nil
}

func selectorMatches(sel *metav1.LabelSelector, set map[string]string) bool {
	if sel == nil {
		return true
	}
	s, err := metav1.LabelSelectorAsSelector(sel)
	if err != nil {
		return false
	}
	return s.Matches(labels.Set(set))
}

func serviceAccount(deploy *appsv1.Deployment) string {
	if sa := deploy.Spec.Template.Spec.ServiceAccountName; sa != "" {
		return sa
	}
	return "default"
}

func (r *DeploymentReconciler) setCondition(
	ctx context.Context, policy *registrarv1alpha1.SpiffeRegistration,
	status metav1.ConditionStatus, reason, msg string,
) {
	apimeta.SetStatusCondition(&policy.Status.Conditions, metav1.Condition{
		Type:    "Registered",
		Status:  status,
		Reason:  reason,
		Message: msg,
	})
	now := metav1.Now()
	policy.Status.LastSyncTime = &now
	policy.Status.ObservedGeneration = policy.Generation
	_ = r.Status().Update(ctx, policy) // best-effort; the next reconcile retries
}
```

### A caveat on shared identities

The SPIFFE ID is derived from the namespace and service account — its selectors are `k8s:ns` and `k8s:sa` — so it is per *service account*, not per Deployment. Two Deployments sharing a service account map to the **same** SPIFFE ID and the same SPIRE entry. That is correct SPIFFE modelling, but it makes the naive delete-on-Deployment-delete above unsafe: deleting one Deployment would pull the entry out from under a sibling that still needs it. In production, either give each workload its own service account (good practice regardless), or ref-count before deleting — only call `BatchDeleteEntry` once no remaining Deployment selects that SPIFFE ID. The code above assumes one workload per service account; say so in your `SpiffeRegistration` docs, or add the ref-count guard before you ship it.

### Old way vs new way

Manually, every new service meant a human running `spire-server entry create`, and every deleted service meant remembering to run `entry delete` — which nobody did, so the registry filled with stale entries pointing at workloads that no longer existed. With the operator, registration is a side effect of `kubectl apply` and de-registration is guaranteed by the finalizer. The CLI commands didn't go away; they just stopped being a human's job.

## Registering the controller

`SetupWithManager` wires the watches. It reconciles Deployments, and also watches `SpiffeRegistration` so that editing a policy re-evaluates every Deployment it could now match.

One production insight worth more than the code: **do not reach for `GenerationChangedPredicate` here.** It filters out updates that don't bump `.metadata.generation` — but a deletion (setting `deletionTimestamp`) and the controller's own finalizer writes are *metadata-only* changes. Filter on generation and the controller will silently never see deletions, and your cleanup never runs. I watch the full stream and filter cheaply inside `Reconcile` instead.

```go
//+kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;update;patch
//+kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch
//+kubebuilder:rbac:groups=registrar.example.com,resources=spifferegistrations,verbs=get;list;watch
//+kubebuilder:rbac:groups=registrar.example.com,resources=spifferegistrations/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=registrar.example.com,resources=spifferegistrations/finalizers,verbs=update

func (r *DeploymentReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		Named("spiffe-registrar").
		For(&appsv1.Deployment{}).
		Watches(
			&registrarv1alpha1.SpiffeRegistration{},
			handler.EnqueueRequestsFromMapFunc(r.deploymentsForPolicy),
		).
		Complete(r)
}

// deploymentsForPolicy re-queues every Deployment when a policy changes.
func (r *DeploymentReconciler) deploymentsForPolicy(ctx context.Context, _ client.Object) []reconcile.Request {
	var deploys appsv1.DeploymentList
	if err := r.List(ctx, &deploys); err != nil {
		return nil
	}
	reqs := make([]reconcile.Request, 0, len(deploys.Items))
	for i := range deploys.Items {
		reqs = append(reqs, reconcile.Request{NamespacedName: client.ObjectKeyFromObject(&deploys.Items[i])})
	}
	return reqs
}
```

The RBAC markers above generate the ClusterRole. Note the verbs: the controller needs `update;patch` on `deployments` (to write the finalizer and the entry-ID annotation), `get;list;watch` on `namespaces` (for namespace-label matching), and the standard status/finalizers subresource permissions on its own CRD.

`main` wires the manager and — the bit specific to this operator — builds the SPIRE `EntryClient`. The operator authenticates to the SPIRE server with *its own SVID* over mTLS, using the `go-spiffe` gRPC credentials. That SVID needs an admin entry, which you bootstrap once: `spire-server entry create -admin -spiffeID spiffe://example.org/ns/spire-system/sa/spiffe-registrar ...`. One manual entry to bootstrap the automation of all the others.

```go
// cmd/main.go
package main

import (
	"flag"
	"os"

	"github.com/spiffe/go-spiffe/v2/spiffeid"
	"github.com/spiffe/go-spiffe/v2/spiffegrpc/grpccredentials"
	"github.com/spiffe/go-spiffe/v2/spiffetls/tlsconfig"
	"github.com/spiffe/go-spiffe/v2/workloadapi"
	entryv1 "github.com/spiffe/spire-api-sdk/proto/spire/api/server/entry/v1"
	"google.golang.org/grpc"

	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/healthz"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	metricsserver "sigs.k8s.io/controller-runtime/pkg/metrics/server"

	registrarv1alpha1 "github.com/example/spiffe-registrar/api/v1alpha1"
	"github.com/example/spiffe-registrar/internal/controller"
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
	utilruntime.Must(registrarv1alpha1.AddToScheme(scheme))
}

func main() {
	var metricsAddr, probeAddr, spireServer, spireSocket string
	var enableLeaderElection bool
	flag.StringVar(&metricsAddr, "metrics-bind-address", ":8080", "")
	flag.StringVar(&probeAddr, "health-probe-bind-address", ":8081", "")
	flag.BoolVar(&enableLeaderElection, "leader-elect", true, "Enable leader election.")
	flag.StringVar(&spireServer, "spire-server", "spire-server.spire-system.svc.cluster.local:8081", "")
	flag.StringVar(&spireSocket, "spire-socket", "unix:///run/spire/agent-sockets/agent.sock", "")
	flag.Parse()

	ctrl.SetLogger(zap.New())
	ctx := ctrl.SetupSignalHandler()

	// The operator's own SVID, used as an admin client to the SPIRE Entry API.
	source, err := workloadapi.NewX509Source(ctx,
		workloadapi.WithClientOptions(workloadapi.WithAddr(spireSocket)))
	if err != nil {
		setupLog.Error(err, "create X509 source")
		os.Exit(1)
	}
	defer source.Close()

	serverID := spiffeid.RequireFromString("spiffe://example.org/spire/server")
	conn, err := grpc.NewClient(spireServer,
		grpc.WithTransportCredentials(
			grpccredentials.MTLSClientCredentials(source, source, tlsconfig.AuthorizeID(serverID))))
	if err != nil {
		setupLog.Error(err, "dial SPIRE server")
		os.Exit(1)
	}
	defer conn.Close()

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:                 scheme,
		Metrics:                metricsserver.Options{BindAddress: metricsAddr},
		HealthProbeBindAddress: probeAddr,
		LeaderElection:         enableLeaderElection,
		LeaderElectionID:       "spiffe-registrar.registrar.example.com",
	})
	if err != nil {
		setupLog.Error(err, "create manager")
		os.Exit(1)
	}

	if err := (&controller.DeploymentReconciler{
		Client: mgr.GetClient(),
		Entry:  entryv1.NewEntryClient(conn),
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "set up controller")
		os.Exit(1)
	}

	_ = mgr.AddHealthzCheck("healthz", healthz.Ping)
	_ = mgr.AddReadyzCheck("readyz", healthz.Ping)

	setupLog.Info("starting manager")
	if err := mgr.Start(ctx); err != nil {
		setupLog.Error(err, "manager exited")
		os.Exit(1)
	}
}
```

## Testing

Controllers are tested against a real API server with **envtest** — it boots `etcd` and `kube-apiserver` locally, no kubelet, no nodes. The SPIRE side is a fake `EntryClient` so the test asserts what the controller *asked SPIRE to do* without a running SPIRE server. Embedding the generated interface gives no-op defaults for the methods the test doesn't exercise:

```go
type fakeEntryClient struct {
	entryv1.EntryClient
	created []*types.Entry
	deleted []string
}

func (f *fakeEntryClient) BatchCreateEntry(
	_ context.Context, in *entryv1.BatchCreateEntryRequest, _ ...grpc.CallOption,
) (*entryv1.BatchCreateEntryResponse, error) {
	f.created = append(f.created, in.Entries...)
	return &entryv1.BatchCreateEntryResponse{
		Results: []*entryv1.BatchCreateEntryResponse_Result{{
			Status: &types.Status{Code: int32(codes.OK)},
			Entry:  &types.Entry{Id: "entry-abc123", SpiffeId: in.Entries[0].SpiffeId},
		}},
	}, nil
}

func (f *fakeEntryClient) BatchDeleteEntry(
	_ context.Context, in *entryv1.BatchDeleteEntryRequest, _ ...grpc.CallOption,
) (*entryv1.BatchDeleteEntryResponse, error) {
	f.deleted = append(f.deleted, in.Ids...)
	return &entryv1.BatchDeleteEntryResponse{
		Results: []*entryv1.BatchDeleteEntryResponse_Result{{Status: &types.Status{Code: int32(codes.OK)}}},
	}, nil
}
```

The create-path test: apply a policy and a matching Deployment, reconcile, and assert SPIRE was called with the right SPIFFE ID and the finalizer was added.

```go
func TestReconcile_RegistersDeployment(t *testing.T) {
	fake := &fakeEntryClient{}
	r := &controller.DeploymentReconciler{Client: k8sClient, Entry: fake}

	// (namespace "prod" labelled spiffe.io/registrar=enabled and the policy
	// were created in TestMain via envtest's k8sClient)
	deploy := newDeployment("prod", "checkout", "checkout-sa")
	require.NoError(t, k8sClient.Create(ctx, deploy))

	_, err := r.Reconcile(ctx, reconcile.Request{
		NamespacedName: client.ObjectKeyFromObject(deploy),
	})
	require.NoError(t, err)

	require.Len(t, fake.created, 1)
	require.Equal(t, "example.org", fake.created[0].SpiffeId.TrustDomain)
	require.Equal(t, "/ns/prod/sa/checkout-sa", fake.created[0].SpiffeId.Path)

	var got appsv1.Deployment
	require.NoError(t, k8sClient.Get(ctx, client.ObjectKeyFromObject(deploy), &got))
	require.True(t, controllerutil.ContainsFinalizer(&got, "registrar.example.com/entry-cleanup"))
	require.Equal(t, "entry-abc123", got.Annotations["registrar.example.com/entry-id"])
}
```

The **update** path re-runs the same reconcile and asserts `BatchCreateEntry` is idempotent (no duplicate entry); the **delete** path sets a `deletionTimestamp`, reconciles, and asserts `fake.deleted` contains the entry ID and the finalizer is gone. Once the unit tests pass, deploy it to a real cluster, `kubectl apply` a Deployment in a labelled namespace, and watch the entry appear with `spire-server entry show` — then delete the Deployment and watch it vanish.

## Production considerations

- **Leader election — always on.** Run two or three replicas for availability, but only the leader reconciles. Without `LeaderElection: true`, every replica would race to create and delete the same SPIRE entries. It's one field; never ship without it.
- **Finalizers on objects you don't own.** Writing a finalizer onto user Deployments is what guarantees cleanup — but it also means that if the operator is down, those Deployments can't be deleted until it recovers. That's the trade-off for guaranteed de-registration. Monitor the operator's liveness, alert on it, and keep a documented break-glass for emergencies: `kubectl patch deployment X -p '{"metadata":{"finalizers":[]}}' --type=merge`.
- **Rate limiting.** `controller-runtime` queues failed reconciles through a default exponential back-off limiter (≈5ms up to ≈1000s). Returning an `error` from `Reconcile` uses it; returning `RequeueAfter` schedules a fixed retry. I use `RequeueAfter: 30 * time.Second` on SPIRE failures so a flaky server doesn't hammer itself, and a one-minute steady-state re-sync so a manually deleted entry self-heals.
- **Metrics you get for free.** The manager already exposes `controller_runtime_reconcile_total`, `controller_runtime_reconcile_errors_total` and `controller_runtime_reconcile_time_seconds` per controller — enough to alert on reconcile error rate and p99 latency. The custom `spiffe_registration_total` and `spiffe_registration_errors_total` add the domain view: registrations and failures per namespace. Scrape both from the same Prometheus you already run, and hold the operator to the same [SLOs and error budgets](/blogs/implementing-slos-and-error-budgets) as any other critical service — once workloads can't get an identity without it, it is one.

## Conclusion

Put the two posts together and you have the full picture: SPIFFE and SPIRE give every workload a short-lived, attested identity, and this operator makes that identity *automatic* — registration is a side effect of deploying, de-registration is guaranteed by a finalizer, and a human never touches `spire-server entry create` again. Manual CLI commands don't scale. Control loops do.

If you're assembling this into a platform, it sits alongside the other foundations in this series: the [SPIFFE/SPIRE identity layer](/blogs/zero-trust-workload-identity-spiffe-spire) it automates, keeping the cluster current with [zero-downtime Kubernetes upgrades](/blogs/zero-downtime-kubernetes-upgrades), and running it affordably with [Karpenter and spot instances](/blogs/reducing-kubernetes-costs-karpenter-spot).
