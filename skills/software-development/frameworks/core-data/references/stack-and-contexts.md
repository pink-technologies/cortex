# Core Data Stack and Contexts

Use this reference when the task materially affects Core Data stack
construction, persistent stores, managed object contexts, background contexts,
context topology, save propagation, initialization, or persistence readiness.

Project-specific persistence architecture takes precedence over this generic
guidance.

## Stack ownership

### CORE-DATA-STACK-001 — Give the persistence stack an intentional owner

The object responsible for the Core Data stack should have clear ownership of
its persistent container, stores, and long-lived contexts.

Determine:

- who creates the stack
- when persistent stores are loaded
- when the stack becomes available to consumers
- which contexts are long-lived
- which contexts are operation-scoped
- who owns save coordination
- how failures during initialization are surfaced

Avoid creating independent persistence stacks accidentally for components that
are expected to operate on the same persistent state.

Multiple stacks can be valid when they intentionally represent independent
stores or persistence domains.

## Persistent container

### CORE-DATA-STACK-010 — Prefer the established stack construction

When the project uses `NSPersistentContainer`, preserve that stack unless the
task requires a different persistence topology.

Do not replace an existing container with manually assembled coordinators,
stores, and contexts merely because manual construction offers more control.

Likewise, do not force `NSPersistentContainer` onto an architecture whose
manually constructed stack deliberately provides behavior the container does
not represent.

Choose the simplest stack that satisfies the project's actual persistence
contract.

### CORE-DATA-STACK-011 — Configure the container before exposing it

Configuration that materially affects persistent-store behavior should be
established before consumers begin using the stack.

This can include:

- store descriptions
- migration options
- store URLs
- persistent-history settings
- remote-change notifications
- CloudKit configuration
- store protection or file options

Do not mutate foundational store configuration after consumers have already
begun relying on a different configuration unless the API explicitly supports
that transition.

## Persistent store loading

### CORE-DATA-STACK-020 — Treat store loading as initialization

Loading persistent stores is part of persistence-stack initialization.

Do not expose a persistence boundary as fully operational while required stores
are still unavailable unless the architecture explicitly models that state.

A valid startup model may be:

```text
create stack
    ↓
configure stores
    ↓
load stores
    ↓
validate initialization
    ↓
expose persistence services
```

Other architectures may expose explicit readiness instead.

The important property is that callers can distinguish:

```text
persistence ready
```

from:

```text
persistence not ready
```

when that distinction can affect supported behavior.

### CORE-DATA-STACK-021 — Preserve store-loading failures

Do not silently treat persistent-store loading failure as successful
initialization.

Store loading can fail for reasons such as:

- incompatible data
- migration failure
- inaccessible storage
- invalid configuration
- filesystem problems

Surface the failure to the boundary responsible for deciding recovery.

Do not delete or recreate a persistent store automatically unless destructive
recovery is explicitly part of the product contract.

### CORE-DATA-STACK-022 — Complete multi-store initialization coherently

When a stack contains multiple required persistent stores, do not report the
entire persistence layer as ready merely because one store loaded.

Establish what successful initialization means for the complete configured
stack.

If stores have different optionality or failure policies, model those policies
explicitly rather than assuming every store is equivalent.

## Context purpose

### CORE-DATA-CTX-001 — Give every context a defined role

A managed object context should have an understandable purpose.

Common roles include:

- UI-facing context
- background import context
- synchronization context
- operation-scoped context
- scratch/edit context
- writer context

These are examples, not required architecture.

Avoid creating contexts without understanding:

- what work they perform
- how long they live
- what they save into
- how their changes reach consumers
- what objects may escape their lifetime

### CORE-DATA-CTX-002 — Context names do not establish behavior

Do not infer context semantics from names such as:

```text
viewContext
backgroundContext
writerContext
childContext
```

Inspect how the context is actually configured.

Relevant properties include:

- concurrency type
- parent context
- persistent store coordinator
- transaction author
- merge policy
- automatic merging
- undo manager
- query generation
- store assignment

A variable named `backgroundContext` is not evidence by itself that all access
to it is concurrency-safe.

## UI-facing contexts

### CORE-DATA-CTX-010 — Keep substantial persistence work away from latency-sensitive contexts

When a context participates directly in UI-facing behavior, avoid performing
substantial persistence work on its execution boundary when that work can
produce noticeable latency.

Examples can include:

- large imports
- extensive transformations
- large deletions
- substantial synchronization
- expensive relationship traversal

Do not move every operation to a background context mechanically.

Small fetches and mutations can be entirely appropriate on a UI-facing context.

Choose context placement according to actual cost, ownership, and consistency
requirements.

## Background contexts

### CORE-DATA-CTX-020 — Use background contexts for independently owned background persistence work

A background context is appropriate when persistence work:

- has an independent operation lifecycle
- may be expensive
- should not block UI-facing persistence execution
- needs its own transaction boundary
- processes synchronization or imports

Give the context an explicit lifetime.

An operation-scoped context should not accidentally become a long-lived source
of managed objects for unrelated consumers.

### CORE-DATA-CTX-021 — Do not return context-bound objects beyond an incompatible lifetime

If a temporary context performs work and is then discarded, do not return its
managed objects to callers that expect those objects to remain independently
usable.

Prefer returning:

- object IDs
- stable identifiers
- immutable values
- domain representations

when the result must outlive the context or cross into another persistence
boundary.

## Context topology

### CORE-DATA-CTX-030 — Understand the actual context graph before changing save behavior

Before modifying how a context saves, determine whether it:

```text
context
    ↓
persistent store coordinator
```

or:

```text
child context
    ↓
parent context
    ↓
persistent store coordinator
```

or participates in another established topology.

A save has different persistence implications depending on that relationship.

Do not assume:

```text
context.save()
```

always means:

```text
changes are durably written to the persistent store
```

A child context may only push changes into its parent.

### CORE-DATA-CTX-031 — Do not introduce child contexts without a behavioral reason

Parent/child contexts can support useful workflows, but they also introduce
additional save propagation and conflict semantics.

Use them when they solve a concrete requirement such as:

- isolated editing
- staged changes
- explicit transaction boundaries
- an established writer architecture

Do not introduce child contexts merely as a generic Core Data optimization.

Sibling contexts connected to the same store may provide a simpler model for
many background operations.

## Saving through context hierarchies

### CORE-DATA-CTX-040 — Save all required levels intentionally

When persistence depends on a context hierarchy, determine which context saves
are required to reach the intended durability boundary.

For example:

```text
child save
    ↓
parent receives changes
    ↓
parent save
    ↓
persistent store
```

If the product contract requires durable persistence, stopping after the child
save may be incomplete.

Conversely, do not automatically propagate every child save to disk when the
architecture intentionally stages multiple changes in the parent.

The save boundary should match the intended transaction contract.

## Context creation

### CORE-DATA-CTX-050 — Prefer centralized context configuration when contexts share policy

When many contexts require the same important configuration, keep that policy
consistent through an intentional creation boundary.

Potential shared configuration includes:

- merge policy
- transaction author
- undo behavior
- automatic merge behavior
- naming or diagnostics
- store selection

Do not duplicate significant configuration ad hoc across many creation sites
when divergence would produce inconsistent persistence semantics.

Avoid introducing a context factory solely for stylistic symmetry when context
creation is already centralized and simple.

## Context lifetime

### CORE-DATA-CTX-060 — Match context lifetime to its responsibility

A context may be:

```text
application-lived
feature-lived
session-lived
operation-lived
```

depending on the architecture.

Avoid retaining operation-scoped contexts indefinitely.

Likewise, avoid repeatedly recreating a context that intentionally owns
long-lived UI state without understanding the consequences for:

- registered objects
- pending changes
- faults
- observation
- fetched results
- merge behavior

Context lifetime is part of persistence ownership.

## Resetting contexts

### CORE-DATA-CTX-070 — Treat `reset()` as an ownership event

Resetting a context invalidates its registered managed objects and discards
pending changes.

Before resetting, determine whether callers or UI state still retain objects
from that context.

Do not use context reset as a generic memory cleanup strategy when consumers
still expect its objects to remain valid.

For intentionally temporary contexts, reset can be useful after bounded batches
when no external consumer retains their managed objects.

## Store access

### CORE-DATA-STORE-001 — Keep store selection intentional

When a coordinator manages multiple stores, determine which entities or
operations belong to which store.

Do not assume Core Data will choose the desired store when the architecture
depends on explicit store assignment.

Preserve project-specific store routing and configuration.

## In-memory stores

### CORE-DATA-STORE-010 — Treat in-memory stores as a testing or architectural choice, not a behavioral equivalent by assumption

In-memory persistent stores can be useful for:

- fast tests
- isolated persistence environments
- ephemeral application data

Do not assume an in-memory store reproduces every behavior of the production
store.

Behavior involving:

- filesystem persistence
- migration
- SQLite-specific characteristics
- process restarts
- store corruption
- external store files

requires a representative persistent-store setup.

Use the testing reference for deeper test-environment selection.

## Persistence readiness

### CORE-DATA-READY-001 — Make asynchronous initialization explicit when consumers can race it

When persistence initialization can overlap consumer work, establish one
intentional policy:

```text
await initialization
```

or:

```text
gate operations until ready
```

or:

```text
expose explicit readiness/failure state
```

Do not allow callers to infer readiness from timing.

Avoid arbitrary delays intended to "give Core Data time to load."

Synchronization should follow the actual initialization contract.

## Recovery

### CORE-DATA-RECOVERY-001 — Keep destructive recovery explicit

When a store cannot load or migrate, deleting it and starting over may be valid
for caches or explicitly disposable data.

It is not a universal Core Data recovery strategy.

Before destructive recovery, establish:

- whether persisted data is authoritative
- whether data can be recreated
- whether the user would lose meaningful information
- whether another migration/recovery path is supported

Do not silently convert data incompatibility into data loss.

## Diagnostics

### CORE-DATA-DIAG-001 — Preserve enough stack context to diagnose persistence failures

When store initialization or context saves fail, preserve useful diagnostic
context such as:

- operation
- store role
- model/version context when appropriate
- underlying error

Do not include sensitive persisted values in diagnostics unless the project's
security policy explicitly permits them.

Avoid logging entire managed objects or persistent payloads merely for
convenience.

## Validation checklist

When stack or context topology changes, verify when applicable:

- required stores load successfully
- readiness cannot race consumer operations
- contexts have the expected store/coordinator relationship
- parent-child saves reach the intended durability boundary
- background work uses the intended context
- managed objects do not escape incompatible context lifetimes
- merge behavior still reaches long-lived consumers
- initialization failures remain observable
- teardown/reset does not invalidate objects still in supported use
- tests use a persistence topology representative of the contract being tested

Do not claim stack behavior is correct solely because an empty store can be
created.