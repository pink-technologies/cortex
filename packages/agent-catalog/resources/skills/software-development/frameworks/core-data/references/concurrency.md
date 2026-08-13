# Core Data Concurrency

Use this reference when the task materially affects managed-object-context
confinement, background persistence work, context execution, asynchronous
operations, callbacks, tasks, actors, isolation crossings, or concurrent access
to persisted state.

This reference owns **Core Data-specific concurrency rules**.

Use the Swift Concurrency skill for language-level reasoning about:

- actors
- `Sendable`
- tasks
- structured concurrency
- cancellation
- continuations
- strict concurrency
- executor isolation

Project-specific persistence and concurrency architecture takes precedence over
this generic guidance.

## Core principle

### CORE-DATA-CONC-001 — The managed object context is the persistence execution boundary

An `NSManagedObjectContext` owns the execution boundary for its registered
managed objects.

Access context-bound objects through that context's intended execution
mechanism.

Conceptually:

```text
managed object
      ↓
owning context
      ↓
context execution boundary
```

Do not reason only in terms of:

```text
main thread
background thread
```

Modern application code may use tasks, actors, queues, callbacks, and other
execution abstractions.

The stable Core Data rule is context confinement.

## Context execution

### CORE-DATA-CONC-010 — Perform context work through the context

For context-bound operations, use the context's supported execution mechanism.

For example:

```swift
try await context.perform {
    // Fetch, mutate, validate, or save using this context.
}
```

or an equivalent project abstraction.

Keep managed-object access inside the context operation when ownership requires
it.

Avoid:

```swift
let object = try await context.perform {
    try fetchObject()
}

object.name = "Updated"
```

when the returned managed object is then accessed outside the execution
boundary that owns it.

The asynchronous closure ending does not detach the object from its context.

### CORE-DATA-CONC-011 — Context execution and object lifetime are separate concerns

Using `context.perform` correctly for one fetch does not make the returned
managed object safe for arbitrary later access.

For example:

```text
context.perform
    ↓
fetch object
    ↓
return object
    ↓
unrelated task mutates object
```

can still violate the intended ownership model.

When data must escape the persistence boundary, return an appropriate:

- object ID
- stable identifier
- immutable snapshot
- domain value

instead of assuming the managed object itself became independent.

## Queue-based context types

### CORE-DATA-CONC-020 — Respect each context's configured concurrency model

When inspecting an existing stack, determine how the context was created and
what execution model it uses.

Do not infer its concurrency contract merely from its variable name.

A context called:

```text
backgroundContext
```

is not sufficient evidence that all current uses are safe.

Inspect the actual construction and usage.

### CORE-DATA-CONC-021 — Do not manually route context work to arbitrary queues

Avoid using a generic dispatch queue as a substitute for the context's own
execution boundary.

Do not assume:

```swift
backgroundQueue.async {
    // managed object work
}
```

is safe merely because the queue is serial or not the main queue.

The relevant question is whether the work executes through the owning managed
object context.

## Main-context work

### CORE-DATA-CONC-030 — Keep UI-facing context work bounded

A UI-facing context can legitimately perform:

- small fetches
- ordinary edits
- UI-driven saves
- relationship updates
- lightweight reads

Do not move every Core Data operation off the UI-facing context mechanically.

Move substantial work when its cost or ownership warrants a separate context.

Examples can include:

- large imports
- bulk transformations
- substantial synchronization
- large deletes
- expensive reconciliation
- large object-graph traversal

The decision should follow actual persistence cost and ownership, not a blanket
"all database work belongs in the background" rule.

## Background work

### CORE-DATA-CONC-040 — Give background persistence work its own context boundary

When background work has independent lifetime or transaction semantics, prefer
an appropriately owned background context.

Conceptually:

```text
background operation
        ↓
background context
        ↓
fetch / mutate / save
```

rather than:

```text
background task
        ↓
reuse arbitrary managed objects from UI context
```

The background operation should resolve the data it requires within its own
persistence boundary.

### CORE-DATA-CONC-041 — Do not create concurrency by sharing one context

A context is itself an isolation/serialization boundary.

Launching many tasks that all submit work to the same context does not
necessarily make persistence work parallel.

For example:

```text
Task A ─┐
Task B ─┼── same context
Task C ─┘
```

may still serialize through the context.

Do not create large numbers of tasks solely to "parallelize Core Data" when all
work ultimately executes through one context.

Choose multiple contexts only when independent persistence transactions and
concurrency are actually appropriate.

## Parallel persistence work

### CORE-DATA-CONC-050 — Parallel contexts require conflict semantics

When independent contexts modify overlapping persistent records concurrently,
the architecture must define how competing state is reconciled.

Multiple contexts can improve throughput for independent work, but they also
introduce:

- stale reads
- overlapping edits
- merge conflicts
- ordering questions
- reconciliation requirements

Do not introduce additional contexts merely for theoretical parallelism.

Establish whether the operations are actually independent.

### CORE-DATA-CONC-051 — Partition parallel work by meaningful ownership when possible

When performing concurrent persistence operations, prefer partitions that
minimize overlapping mutation.

For example:

```text
operation A → records set A
operation B → records set B
```

is easier to reason about than:

```text
operation A → shared records
operation B → same shared records
```

when both contexts can write concurrently.

Do not artificially partition data when the operation requires one coherent
transaction.

## Managed objects crossing tasks

### CORE-DATA-CONC-060 — Do not use tasks as a transport for managed objects

Avoid patterns where a managed object is captured by unrelated asynchronous
work whose execution boundary is not aligned with the object's context.

For example:

```swift
let object = ...

Task {
    await doSomething(with: object)
}
```

requires establishing that `doSomething` uses the object through the correct
context boundary.

Creating a `Task` does not make the object independent from Core Data
confinement.

Prefer transferring identity or independent data when the task crosses an
ownership boundary.

## Swift actors

### CORE-DATA-CONC-070 — Actor isolation and Core Data confinement are distinct

An actor provides Swift isolation.

A managed object context provides Core Data confinement.

These boundaries may coexist:

```text
Swift actor
    ↓
persistence component
    ↓
managed object context
```

but one does not automatically replace the other.

Do not assume:

```text
actor-isolated code
=
all managed-object access is valid
```

The actor still needs to respect the context's execution contract.

### CORE-DATA-CONC-071 — Do not wrap Core Data in an actor without a reason

An actor can be useful when it owns broader persistence state or application
coordination.

Do not introduce one merely because Core Data has concurrency rules.

An additional actor can create two serialization boundaries:

```text
actor
   ↓
context
```

which may add complexity without improving correctness.

Use an actor when it protects a meaningful Swift-level responsibility.

Use the managed object context for Core Data object confinement.

## Custom executors

### CORE-DATA-CONC-080 — Custom executor designs require an explicit invariant

A specialized actor whose executor is intentionally aligned with Core Data can
be valid.

Such a design requires clear reasoning about:

- executor lifetime
- context lifetime
- actor isolation
- context execution
- reentrancy
- API assumptions
- framework availability
- migration complexity

Do not introduce a custom executor as a generic replacement for
`context.perform`.

Prefer the standard context execution model unless the project has a concrete
reason for deeper integration.

## `Sendable`

### CORE-DATA-CONC-090 — Do not derive Core Data safety from `Sendable`

Swift transfer safety and Core Data context ownership are separate contracts.

Do not conclude:

```text
value is Sendable
      therefore
Core Data object can be accessed from another context
```

Likewise, a Core Data identity mechanism does not by itself define Swift actor
isolation.

When a value crosses Swift isolation, use the Swift Concurrency skill to
determine its language-level requirements.

When a managed object is involved, preserve the Core Data confinement rule
independently.

### CORE-DATA-CONC-091 — Do not add unchecked sendability to managed objects mechanically

Avoid:

```swift
extension SomeManagedObject: @unchecked Sendable {}
```

solely to silence concurrency diagnostics.

First determine why the managed object is crossing the isolation boundary.

Often the appropriate boundary is:

```text
managed object
      ↓
extract identity/value
      ↓
cross isolation
      ↓
resolve/reconstruct
```

An unchecked conformance is only appropriate when the project has a proven
invariant supporting the actual use.

## Object IDs across boundaries

### CORE-DATA-CONC-100 — Prefer identity transfer for cross-context persistence work

When another context needs the same record:

```text
context A
    ↓
object ID
    ↓
context B
    ↓
resolve in B
```

is generally a clearer ownership model than transferring the managed-object
instance.

The receiving context owns the resulting managed object.

Still evaluate the Swift concurrency semantics of the value being transferred
under the project's compiler and isolation configuration.

Do not rely on a generic statement about Swift `Sendable` conformance as the
reason the persistence design is correct.

The Core Data correctness comes from resolving the identity in the receiving
context.

## Immutable snapshots

### CORE-DATA-CONC-110 — Use independent values when consumers do not need Core Data behavior

When asynchronous or concurrent consumers require data but not a live managed
object, consider exporting an immutable representation.

For example:

```swift
struct AccountSnapshot: Sendable {
    let identifier: UUID
    let name: String
}
```

This separates:

```text
persistence ownership
```

from:

```text
concurrent value transfer
```

Do not construct snapshots mechanically for every entity.

Use them when they solve a real lifetime, isolation, API, or architectural
boundary.

## Suspension points

### CORE-DATA-CONC-120 — Do not carry context assumptions across unrelated suspension points without revalidation

When an operation combines Core Data work with asynchronous external work:

```text
read state from context
        ↓
await external operation
        ↓
write based on old state
```

the persisted state may have changed during the suspension.

For example:

```swift
let snapshot = try await context.perform {
    ...
}

let result = try await service.fetch(...)

try await context.perform {
    // Revalidate before applying result.
}
```

Revalidate assumptions that may no longer hold.

This is especially important when:

- another context can modify the record
- synchronization can run concurrently
- the object can be deleted
- a newer operation can supersede the current one

Use the Swift Concurrency skill for deeper reasoning about actor reentrancy and
task ordering.

## Do not keep managed objects across long external awaits unnecessarily

### CORE-DATA-CONC-121 — Prefer stable identity across long-running asynchronous operations

If an asynchronous external operation may take substantial time, consider
capturing:

```text
stable identity
+
required immutable input
```

instead of relying on a live managed object reference throughout the operation.

Then resolve and revalidate persisted state when applying the result.

For example:

```text
context
  ↓
read ID + request data
  ↓
network await
  ↓
context
  ↓
resolve ID
  ↓
revalidate
  ↓
apply result
```

This makes stale-work behavior explicit.

## Stale asynchronous results

### CORE-DATA-CONC-130 — Prevent older work from overwriting newer persisted state

Asynchronous work can complete out of order.

For example:

```text
sync A reads record
sync B reads record
sync B completes
sync B persists newer state
sync A completes later
```

If B is authoritative, A must not blindly overwrite it.

Possible strategies can include:

- generation/version checks
- persisted revision values
- timestamps when semantically appropriate
- operation ownership
- cancellation
- conflict resolution
- revalidation before mutation

Choose according to the product's actual ordering contract.

Do not assume invocation order equals completion order.

## Context lifetime and tasks

### CORE-DATA-CONC-140 — Do not let asynchronous work accidentally outlive its persistence context

When a temporary context belongs to one operation, ensure related asynchronous
work does not continue using it after:

- operation completion
- cancellation
- teardown
- context reset
- owner destruction

The operation should have one understandable lifetime.

Do not create detached or unowned work that captures a temporary context unless
its lifetime is intentionally independent.

Use Swift Concurrency guidance for task ownership and structured concurrency.

## Cancellation

### CORE-DATA-CONC-150 — Cancellation does not automatically undo Core Data changes

Cancelling the task that owns a persistence operation does not inherently:

- roll back context mutations
- undo a completed save
- delete inserted records
- restore overwritten values

Define what cancellation means at each stage.

For example:

```text
before mutation
→ stop with no persistence change

after local mutation, before save
→ rollback/discard if contract requires

after durable save
→ persistence may already be committed
```

Do not promise transactional cancellation unless the persistence architecture
actually implements it.

### CORE-DATA-CONC-151 — Check cancellation before committing stale or unwanted work

When cancellation should prevent persistence, check it at a meaningful boundary
before applying or saving the result.

Do not rely only on cancellation near the beginning of a long-running
operation.

However, do not add arbitrary cancellation checks inside tiny synchronous
context blocks where cancellation cannot materially change behavior.

Use the Swift Concurrency skill for task-level cancellation propagation.

## Callbacks

### CORE-DATA-CONC-160 — Re-enter the owning context from external callbacks

External callbacks can arrive on execution contexts unrelated to Core Data.

Do not mutate managed objects directly from a callback merely because the
callback currently appears to arrive on a convenient queue.

Prefer:

```text
external callback
      ↓
capture independent result
      ↓
context.perform
      ↓
resolve/mutate managed state
```

This keeps framework callback execution separate from persistence ownership.

## Continuations

### CORE-DATA-CONC-170 — Bridge callbacks at the operation boundary, not around managed-object ownership

When adapting a callback API to async/await, the continuation should represent
the external asynchronous operation.

It should not be used to bypass Core Data confinement.

For example:

```text
callback operation
      ↓
continuation returns independent result
      ↓
context.perform
      ↓
persist result
```

is clearer than returning a managed object from a callback and assuming async
adaptation made the object safe everywhere.

Use Swift Concurrency guidance for exactly-once continuation semantics.

## Notifications

### CORE-DATA-CONC-180 — Treat notification delivery and context mutation as separate boundaries

Core Data or application notifications may arrive on execution contexts
different from the context that must consume the change.

Do not directly mutate a context-bound object from notification delivery unless
that delivery is already guaranteed to execute through the owning context's
boundary.

Route persistence work through the context deliberately.

Also ensure notification lifetime and removal are owned by the relevant
component.

## Background imports

### CORE-DATA-CONC-190 — Keep import parsing and persistence responsibilities separable

Large imports often involve work that does not require Core Data confinement,
such as:

- decoding
- parsing
- validation of independent input
- transformation into intermediate values

That work may execute independently from the managed object context.

Then perform persistence mutation through the context.

Conceptually:

```text
decode/transform
       ↓
independent values
       ↓
background context
       ↓
fetch/create/update/save
```

Do not keep a context occupied with unrelated CPU work when that work does not
require managed objects.

Likewise, do not create concurrency around trivial transformations without a
measured need.

## Batch processing

### CORE-DATA-CONC-200 — Bound persistence work rather than creating unbounded asynchronous fan-out

Avoid designs such as:

```text
10,000 records
     ↓
10,000 Tasks
     ↓
same context
```

This usually adds scheduling and memory overhead while the context remains a
serialized boundary.

For large datasets, consider:

- bounded batches
- controlled task groups for independent preprocessing
- one or more intentionally partitioned contexts
- batch persistence APIs
- save/reset checkpoints

according to the actual workload.

Do not introduce parallel contexts unless concurrent persistence provides a
demonstrable benefit and conflict behavior is defined.

## Background contexts and autorelease/memory

### CORE-DATA-CONC-210 — Control object graph growth during large background operations

Long-running background contexts can accumulate registered managed objects and
temporary references.

When memory growth is material, consider:

- batch-sized context work
- releasing external references
- intentional save checkpoints
- context reset when no retained objects depend on it
- object-ID or value-based boundaries

Do not reset the context in the middle of work whose managed objects are still
required.

Memory optimization must preserve object lifetime correctness.

## Save ordering

### CORE-DATA-CONC-220 — Define ordering when independent contexts can save related state

When correctness depends on which write becomes authoritative, make ordering
explicit.

Do not rely on:

```text
Task A started first
```

to imply:

```text
Context A saves first
```

or:

```text
Context A should win
```

If ordering matters, encode it through:

- serialization
- operation ownership
- versioning
- conflict policy
- dependency between operations

according to the architecture.

## Independent reads

### CORE-DATA-CONC-230 — Concurrent reads can still observe different snapshots of state

Different contexts may legitimately observe different versions of persisted
state depending on their lifecycle and synchronization behavior.

Do not assume:

```text
two contexts fetch at approximately the same time
```

means:

```text
they must observe identical in-memory state
```

When snapshot consistency matters, establish an appropriate transaction/query
generation strategy or application-level synchronization contract.

Do not add synchronization merely because values can differ temporarily when
that staleness is acceptable.

## Transactions spanning asynchronous work

### CORE-DATA-CONC-240 — Do not pretend a context transaction remains isolated across unrelated external awaits

A workflow like:

```text
fetch
↓
await network
↓
mutate
↓
save
```

is not automatically one isolated transaction with respect to other contexts or
external writers.

Another writer may change the underlying data during the await.

When correctness depends on the original assumptions:

- capture the required version/identity
- re-resolve the object
- revalidate
- handle conflict intentionally

Do not hold conceptual locks through long external operations unless the
architecture explicitly provides such a mechanism.

## Testing concurrency

### CORE-DATA-CONC-250 — Test context boundaries intentionally

When a defect involves Core Data concurrency, construct a test that exercises
the actual competing boundaries.

For example:

```text
context A writes
context B writes
ordering controlled
save/merge
assert final persistent state
```

Do not attempt to reproduce a context-confinement bug by adding arbitrary
`sleep` calls and hoping scheduler timing produces the issue.

Use controlled synchronization where practical.

### CORE-DATA-CONC-251 — Test stale-result protection

When production behavior protects against stale asynchronous work, test the
relevant ordering explicitly.

For example:

```text
operation A starts
operation B starts
B persists
A completes later
```

Assert that A cannot overwrite B when B is authoritative.

### CORE-DATA-CONC-252 — Test cancellation at meaningful persistence boundaries

When cancellation is part of the operation contract, verify the expected
persistent outcome.

Examples can include:

```text
cancel before mutation → nothing persisted
cancel before save → local changes discarded
cancel after save → committed data remains
```

according to the actual product semantics.

Do not assert generic "task was cancelled" behavior when the important contract
is persisted state.

## Debugging concurrency issues

### CORE-DATA-CONC-260 — Trace both Swift execution and Core Data ownership

When diagnosing a concurrency problem, identify both:

```text
Swift execution/isolation
```

and:

```text
Core Data context ownership
```

Inspect:

- task or callback source
- actor isolation when applicable
- owning managed object context
- context execution mechanism
- managed object crossing points
- suspension points
- save ordering
- merge behavior
- stale work
- cancellation
- object lifetime

Do not classify every persistence race as a Swift actor problem.

Likewise, do not classify every strict-concurrency diagnostic as a Core Data
bug.

Determine which boundary is actually violated.

## Avoid compatibility annotations as architecture

### CORE-DATA-CONC-270 — Treat concurrency suppression as evidence requiring explanation

Be cautious with changes involving mechanisms such as:

```text
@unchecked Sendable
nonisolated
preconcurrency imports
unsafe isolation escapes
```

when Core Data types or contexts are involved.

These language mechanisms may sometimes be appropriate.

They do not change Core Data's context ownership model.

Before adding one, establish:

- what is crossing the isolation boundary
- why that transfer is valid
- which context owns any managed object involved
- what guarantees the architecture provides

Use the Swift Concurrency skill for the language-level proof.

## Validation checklist

When Core Data concurrency behavior changes, verify when applicable:

- managed objects are accessed through their owning context
- context execution uses the context rather than arbitrary queue assumptions
- managed objects do not escape into unrelated tasks or contexts
- identity/value transfer is used at cross-context boundaries when appropriate
- actor isolation is not being confused with Core Data confinement
- additional contexts have clear transaction and conflict semantics
- long external awaits revalidate persistence assumptions before mutation
- stale asynchronous results cannot overwrite newer authoritative state
- temporary contexts cannot be used after their owning operation ends
- cancellation has an explicit persistence outcome
- callbacks re-enter the appropriate context before managed-state mutation
- imports separate independent transformation work from context-bound mutation
- large workloads use bounded concurrency rather than unbounded task fan-out
- save ordering is explicit when correctness depends on it
- unchecked concurrency annotations do not bypass Core Data ownership
- tests control the relevant competing context/order conditions

Do not treat absence of compiler concurrency warnings as proof that Core Data
context ownership is correct.