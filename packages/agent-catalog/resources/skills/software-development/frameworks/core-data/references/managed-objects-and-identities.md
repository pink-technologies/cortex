# Core Data Managed Objects and Identities

Use this reference when the task materially affects `NSManagedObject`,
`NSManagedObjectID`, faults, object lifetime, cross-context identity,
snapshots, temporary IDs, context boundaries, or values derived from managed
objects.

Project-specific persistence architecture takes precedence over this generic
guidance.

## Managed-object ownership

### CORE-DATA-OBJECT-001 — A managed object belongs to its context

An `NSManagedObject` is owned and managed by the `NSManagedObjectContext` that
registered it.

Treat the pair conceptually as:

```text
managed object
      +
owning context
```

rather than treating the managed object as an independent application value.

The context owns important behavior such as:

- change tracking
- faulting
- validation
- relationship maintenance
- save participation
- conflict resolution
- lifecycle of registered objects

Do not reason about an `NSManagedObject` independently from its context when
those behaviors matter.

## Context boundaries

### CORE-DATA-OBJECT-010 — Do not transfer managed-object instances between independent context boundaries

A managed object fetched or inserted in one context should not be reused as the
managed-object instance for another context.

Conceptually:

```text
context A
    ↓
ObjectA
```

and:

```text
context B
    ↓
ObjectB
```

may represent the same persistent record while remaining different managed
object instances owned by different contexts.

Do not pass `ObjectA` into code that expects an object owned by context B.

Transfer identity or independent values instead.

### CORE-DATA-OBJECT-011 — Context confinement is not only a threading concern

Avoid reducing Core Data ownership to:

```text
"don't use this object on another thread"
```

The stronger architectural rule is:

```text
access the managed object through the execution boundary of its owning context
```

This matters even when higher-level concurrency abstractions make thread
identity less visible.

Use the Core Data context as the persistence ownership boundary.

Load Swift Concurrency guidance when actor or task isolation interacts with that
boundary.

## Cross-boundary transfer

### CORE-DATA-OBJECT-020 — Transfer identity or values instead of context-bound instances

When another context, subsystem, task, or architectural boundary needs to refer
to the same persistent entity, prefer transferring an appropriate independent
representation.

Depending on the contract, this may be:

- `NSManagedObjectID`
- a stable domain identifier
- an immutable snapshot
- a domain value
- a DTO
- another explicitly independent representation

Then resolve or reconstruct the representation inside the receiving boundary.

For example:

```text
background context
      ↓
managed-object ID
      ↓
UI context
      ↓
resolve object in UI context
```

Do not introduce a separate domain model mechanically when object IDs already
provide a sufficient and intentional boundary.

## Object identity

### CORE-DATA-ID-001 — Distinguish persistent identity from in-memory object identity

Two managed-object instances can represent the same persistent record while
being different Swift/Objective-C objects in memory.

Do not rely on:

```text
object instance identity
```

as a cross-context identity mechanism.

When the business or persistence contract requires stable identity, use an
appropriate stable identifier or managed-object identity.

### CORE-DATA-ID-002 — Use the identity appropriate to the boundary

`NSManagedObjectID` represents Core Data identity.

A domain identifier such as:

```swift
UUID
String
Int64
```

may represent business identity.

These are not automatically interchangeable concepts.

Use `NSManagedObjectID` when another Core Data context needs to locate the same
persistent object.

Use a domain identifier when consumers should not depend on Core Data identity
or when identity must survive outside the persistence implementation.

Do not expose `NSManagedObjectID` through an external API solely because it is
available internally.

## Temporary IDs

### CORE-DATA-ID-010 — Account for temporary object IDs

Newly inserted managed objects may initially have temporary object IDs.

A temporary ID is not appropriate for every boundary where another context or
long-lived consumer expects a stable persistent identity.

Before transferring a newly inserted object's identity, determine whether the
operation requires a permanent object ID.

For example, when an object will be immediately resolved by another context,
the persistence flow may need to obtain a permanent ID first.

Do not request permanent IDs mechanically for every insertion.

If the object remains entirely inside its current insertion and save lifecycle,
the temporary identity may be sufficient until Core Data naturally replaces it.

### CORE-DATA-ID-011 — Do not confuse permanent object identity with durable persistence

Obtaining a permanent object ID does not by itself mean the object's changes
have been durably saved to the persistent store.

Keep these concepts separate:

```text
permanent Core Data identity
```

and:

```text
durably persisted state
```

A caller that requires durable persistence still needs the appropriate save
boundary to complete successfully.

## Resolving object IDs

### CORE-DATA-ID-020 — Resolve IDs in the consuming context

When a context receives an object ID, resolve it through that context.

The resulting managed object belongs to the consuming context.

Do not resolve an object in one context and then forward that managed object
instance into another context.

Conceptually:

```text
objectID
  ├── context A → managed object A
  └── context B → managed object B
```

This keeps ownership explicit.

### CORE-DATA-ID-021 — Choose resolution semantics intentionally

Different object-resolution APIs can have different behavior regarding whether
the object is known to exist or whether accessing it may later discover that
the underlying record is missing.

When correctness depends on existence, choose a resolution path that matches the
required contract and handle failure appropriately.

Do not assume every object ID received from another boundary still points to an
existing persistent record.

Records may have been:

- deleted
- invalidated
- removed by a batch operation
- removed by another process
- changed during migration or synchronization

Treat identity transfer and object existence as separate concerns.

## Registered objects

### CORE-DATA-OBJECT-030 — Registered objects are part of context-local state

A context maintains its own registered object graph.

This can include objects that are:

- faults
- realized
- inserted
- updated
- deleted
- unsaved

Do not assume another context sees the same in-memory representation or pending
mutations.

A context can represent an older or different view of the same persistent
record until its state is refreshed or merged.

## Unsaved changes

### CORE-DATA-OBJECT-040 — Unsaved managed-object state belongs to the owning context

Changes made to a managed object before saving are part of that context's local
transactional state.

Another context should not be expected to observe those unsaved values.

Conceptually:

```text
context A
  object.title = "New"
  not saved
```

does not imply:

```text
context B
  same record.title == "New"
```

If cross-context visibility is required, define the save and merge path
explicitly.

Use the saves/merging reference for deeper behavior.

## Faults

### CORE-DATA-FAULT-001 — A fault is a managed object with deferred materialization

Core Data may represent an object or relationship as a fault until its data is
needed.

Do not treat a fault as an error by default.

Faulting is part of Core Data's normal memory and loading behavior.

Avoid code that assumes:

```text
all fetched managed objects
=
all property data permanently resident in memory
```

Property access can cause Core Data to fulfill a fault.

### CORE-DATA-FAULT-002 — Do not trigger faults unintentionally in expensive paths

Be careful when code:

- logs entire managed objects
- serializes large object graphs
- maps large fetches
- traverses relationships recursively
- renders large collections
- computes descriptions from many relationships

Such operations can materialize large portions of the object graph.

Do not disable faulting globally as a first response.

Instead, understand the access pattern and use appropriate fetches,
prefetching, batching, or independent value projections where justified.

### CORE-DATA-FAULT-003 — Fault state is an implementation detail unless the boundary depends on it

Avoid exposing whether a managed object is currently a fault as part of domain
behavior unless the persistence architecture explicitly needs that information.

Consumers should generally reason about data availability and ownership rather
than Core Data's internal materialization state.

## Refreshing objects

### CORE-DATA-OBJECT-050 — Treat refresh as a state replacement operation

Refreshing a managed object can discard or replace context-local values
depending on how it is performed.

Before refreshing, determine whether the object has:

- unsaved edits
- pending relationship changes
- consumer-visible local state

Do not refresh objects mechanically as a generic stale-data fix.

Use refresh when the required contract is intentionally to reconcile with
another authoritative persisted state.

## Staleness

### CORE-DATA-OBJECT-060 — Managed objects can become stale relative to the store

A long-lived context can retain values that no longer match newer changes
written by another context or process.

Do not assume:

```text
managed object exists in memory
```

means:

```text
managed object reflects the newest store state
```

When fresh data matters, establish the project's intended synchronization
mechanism.

Possible mechanisms can include:

- automatic merging
- explicit merging
- refetching
- refreshing
- persistent history
- context replacement

Use the saves/merging reference for deeper synchronization rules.

## Deletion

### CORE-DATA-OBJECT-070 — Treat deletion as a lifecycle transition

After a managed object is deleted in its context, callers must not continue
treating it as an ordinary active domain object.

Consider when relevant:

- pending unsaved deletion
- saved deletion
- another context still holding an older representation
- UI state retaining the object
- relationships affected by delete rules

Do not assume deletion becomes immediately visible in every context.

### CORE-DATA-OBJECT-071 — Handle stale references to deleted records

A context or consumer may still hold an identifier referring to a record that
has been deleted elsewhere.

When resolving an ID from another boundary, handle the possibility that the
record no longer exists.

Do not convert missing data into a newly inserted record unless that behavior is
part of the operation contract.

## Invalidated objects

### CORE-DATA-OBJECT-080 — Do not use objects after their context invalidates their registration

Operations such as context reset or certain lifecycle transitions can invalidate
registered managed objects.

Do not retain and continue using those objects after their owning context has
discarded them.

If consumers need durable independent data beyond the context lifetime, export
an independent value representation before the context is invalidated.

## Values and snapshots

### CORE-DATA-VALUE-001 — Use immutable values when persistence ownership should not escape

A value representation can be useful when callers need data without retaining
Core Data's context relationship.

For example:

```swift
struct UserSnapshot: Sendable {
    let id: UUID
    let displayName: String
}
```

can safely represent consumer data independently from the managed object's
lifetime.

This can be especially useful across:

- actor boundaries
- background tasks
- networking boundaries
- public APIs
- caches
- long-lived UI models

Do not duplicate entire entities into snapshots without a consumer need.

Export only the data required by the boundary.

### CORE-DATA-VALUE-002 — Decide whether snapshots are point-in-time values

An immutable representation is typically a snapshot of state at a particular
time.

Consumers should not assume it updates automatically when the Core Data object
changes.

If the architecture needs live updates, use an intentional observation or
query mechanism instead of repeatedly pretending snapshots are authoritative
live objects.

## Managed objects as application models

### CORE-DATA-OBJECT-090 — Direct managed-object use can be valid

Do not require a separate domain layer solely because an application uses Core
Data.

Using managed objects directly can be appropriate when:

- consumers operate within one well-defined context boundary
- persistence lifetime matches application lifetime
- external abstraction is unnecessary
- context ownership remains clear

A separate representation is more valuable when:

- data crosses isolation boundaries
- data leaves persistence modules
- consumers should be independent from Core Data
- public API stability matters
- values must outlive the context
- testing requires persistence independence
- serialization is external to Core Data

Choose based on architecture, not doctrine.

## Generated managed-object subclasses

### CORE-DATA-OBJECT-100 — Respect generated-code ownership

When managed-object subclasses or properties are generated from the model,
treat the model/generator as the source of truth.

Do not hand-edit generated files when regeneration will overwrite those edits.

If custom behavior belongs on the managed-object type, use the extension or
manual-generation strategy established by the project.

Do not switch generation strategy casually because it can alter:

- declarations
- module membership
- class names
- interoperability
- source ownership

## Value semantics

### CORE-DATA-OBJECT-110 — Do not assume value semantics for managed objects

`NSManagedObject` instances are reference-backed persistence objects with
context-managed mutation.

Passing a reference does not create an independent snapshot.

For example:

```swift
let a = object
let b = a
```

does not create two independent persistence values.

If independent immutable state is required, construct an explicit value.

## Hashing and equality

### CORE-DATA-OBJECT-120 — Do not invent business identity from object instance equality

When collections, caches, or domain logic require equality semantics, determine
which identity actually matters:

- managed-object instance
- Core Data object identity
- business identifier
- full value equality

Do not assume those concepts are interchangeable.

Use domain identity when the business contract depends on business identity.

Use Core Data identity when the persistence contract depends on the persistent
record.

## Relationships

### CORE-DATA-OBJECT-130 — Relationship objects remain context-bound

Objects obtained through relationships belong to the same managed-object
context as the owning relationship graph.

Do not traverse a relationship in one context and pass those managed objects
into another context as if they were independent values.

Transfer IDs or independent representations when crossing the boundary.

## Cross-context comparisons

### CORE-DATA-ID-030 — Compare stable identity, not instance references, across contexts

If two contexts may represent the same record, compare the appropriate stable
identity.

For Core Data identity, that can mean comparing their object IDs.

For domain identity, compare the domain identifier.

Avoid:

```text
context A object === context B object
```

as a persistence identity test.

Those instances belong to different contexts and need not be the same reference.

## Isolation boundaries

### CORE-DATA-OBJECT-140 — Separate Core Data confinement from Swift `Sendable`

Whether a Swift value satisfies a concurrency transfer rule and whether a Core
Data object may be used from another context are separate questions.

Do not reason:

```text
compiler accepts transfer
    therefore
managed object is valid in another context
```

or:

```text
Core Data object has stable identity
    therefore
managed object instance should cross actor boundaries
```

The persistence contract remains:

```text
managed object belongs to its context
```

Transfer independent identity or value representations when the architecture
crosses isolation domains.

Use the Swift concurrency skill for the language-level transfer contract.

## Avoid unchecked escape hatches

### CORE-DATA-OBJECT-150 — Do not make managed objects broadly `Sendable` to bypass ownership

Do not add broad unchecked concurrency conformance merely to pass managed-object
instances across tasks or actors.

First ask:

```text
Why does this boundary need the managed object itself?
```

Often the correct transfer is:

```text
object ID
```

or:

```text
immutable value
```

When a project intentionally uses a more specialized concurrency design, its
invariant must be explicit and validated.

Do not weaken the language's concurrency checks without understanding both the
Swift and Core Data ownership models.

## Long-lived references

### CORE-DATA-OBJECT-160 — Be deliberate about retaining managed objects for long periods

Long-lived references can keep objects registered and can make stale-state,
memory, and synchronization behavior harder to reason about.

This does not mean managed objects should never be retained.

Long-lived UI contexts commonly retain active objects intentionally.

Consider whether a long-lived consumer really needs:

```text
managed object instance
```

or only:

```text
identifier/value
```

when:

- the object is rarely used
- the context may reset
- the record may be deleted
- freshness matters
- memory pressure matters
- the reference crosses subsystem boundaries

## Memory pressure

### CORE-DATA-OBJECT-170 — Bound large registered object graphs intentionally

Large imports or traversals can cause a context to register many managed
objects.

When memory growth becomes material, consider appropriate techniques such as:

- smaller batches
- operation-scoped contexts
- releasing external strong references
- saving at intentional checkpoints
- resetting temporary contexts when safe
- using object IDs or value projections
- using batch operations when appropriate

Do not reset a context that still owns objects required by active consumers.

Measure actual memory behavior before adding complexity.

## Debugging identity problems

### CORE-DATA-DIAG-001 — Diagnose identity issues from context + object identity together

When investigating unexpected duplicate/stale objects, inspect:

- owning context
- object ID
- insertion/deletion state
- pending changes
- whether the ID is temporary
- save history
- merge behavior
- whether another context represents the same record

Do not conclude that Core Data duplicated persistent records merely because two
different managed-object instances exist.

Different contexts normally produce different instances for the same record.

## Validation checklist

When managed-object identity or lifetime behavior changes, verify when
applicable:

- managed objects are only accessed through their owning context
- managed-object instances are not crossing incompatible context boundaries
- transferred object IDs are appropriate for the required lifetime
- temporary IDs do not escape when a permanent identity is required
- object existence is handled when resolving stale IDs
- values intended to outlive contexts are independent from managed objects
- reset or teardown does not leave consumers using invalid objects
- deletions do not leave unsupported stale references
- snapshots are not treated as live updating state
- generated managed-object code is not being edited at the wrong source
- concurrency annotations do not bypass the Core Data ownership model

Do not treat compiler success alone as evidence that managed-object lifetime and
context ownership are correct.