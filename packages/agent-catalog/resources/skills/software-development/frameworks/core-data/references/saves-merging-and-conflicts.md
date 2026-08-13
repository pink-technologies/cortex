# Core Data Saves, Merging, and Conflicts

Use this reference when the task materially affects `NSManagedObjectContext`
saving, save propagation, background writes, context merging, merge policies,
conflicts, stale state, persistent history, or synchronization between
contexts.

Project-specific persistence and synchronization architecture takes precedence
over this generic guidance.

## Save semantics

### CORE-DATA-SAVE-001 — Understand what a context save actually commits

A context save commits the context's pending changes to its configured parent or
persistent store coordination boundary.

Do not assume every:

```swift
try context.save()
```

means:

```text
data is durably persisted to disk
```

The result depends on the context topology.

For a child context:

```text
child.save()
    ↓
changes move into parent context
```

The parent may still need to save before the changes reach the persistent
store.

Always establish the actual context graph before evaluating save behavior.

### CORE-DATA-SAVE-002 — Treat save as a transaction boundary

A save should correspond to an intentional persistence boundary.

Depending on the architecture, a save can represent:

- completion of one operation
- a batch checkpoint
- a synchronization transaction
- a user-confirmed edit
- a parent-context handoff
- a durable persistence boundary

Do not save after every mutation mechanically.

Likewise, do not accumulate unsaved changes indefinitely when the product
contract requires durability.

The correct save frequency follows the transaction semantics.

## Save ownership

### CORE-DATA-SAVE-010 — Give save responsibility one clear owner

Determine which boundary owns the decision to save.

Avoid situations where:

```text
repository saves
managed object saves
caller saves
background worker saves
```

all independently attempt to persist the same operation without an intentional
contract.

Multiple layers may participate in save propagation, but one boundary should
own the logical persistence transaction.

### CORE-DATA-SAVE-011 — Do not hide save behavior inside unrelated helpers

A helper that mutates Core Data should not unexpectedly save the entire context
unless saving is explicitly part of its contract.

For example:

```swift
func updateName(_ name: String)
```

should not necessarily imply:

```text
persist every pending context change
```

when the caller owns the transaction.

Make save ownership understandable at the call site or architectural boundary.

## Conditional saving

### CORE-DATA-SAVE-020 — Use `hasChanges` according to intent

Checking:

```swift
context.hasChanges
```

can avoid unnecessary saves.

Do not treat it as mandatory for correctness.

A save with no changes and a skipped save can both be valid depending on the
project's behavior and instrumentation.

Use `hasChanges` when it clarifies an intentional persistence decision or
avoids meaningful unnecessary work.

Do not obscure transaction semantics merely to avoid calling `save()`.

## Save failure

### CORE-DATA-SAVE-030 — Preserve failed-save state intentionally

When a save fails, determine what happens to the context's pending changes.

A failed save does not automatically mean:

```text
all local changes were reverted
```

The context may still contain inserted, updated, or deleted objects.

The owner must decide whether to:

- retry
- correct invalid data
- roll back
- reset
- surface failure while retaining edits
- discard the operation

Do not assume catch-and-return leaves the system in a safe terminal state.

### CORE-DATA-SAVE-031 — Preserve actionable save errors

Do not broadly replace Core Data save errors with an opaque failure when useful
cause information is required for diagnosis or recovery.

Save failures may include:

- validation failures
- merge conflicts
- constraint conflicts
- store errors
- filesystem errors

Translate errors only at the boundary that owns the consumer-facing contract.

Preserve the original failure as underlying diagnostic context when appropriate.

### CORE-DATA-SAVE-032 — Do not silently convert failed persistence into success

If an operation promises persisted state, a failed save is part of that
operation's failure contract.

Do not:

```swift
try? context.save()
```

or:

```swift
do {
    try context.save()
} catch {
    return success
}
```

unless persistence failure is intentionally non-fatal for that operation.

The caller should not believe durable persistence succeeded when it did not.

## Rollback

### CORE-DATA-SAVE-040 — Use rollback when discarding the context transaction is the intended recovery

Rollback can restore a context's unsaved changes toward its previously committed
state.

Use it when:

```text
current unsaved transaction
        ↓
must be discarded
```

Do not invoke rollback automatically after every save failure.

The application may need to:

- inspect validation errors
- correct values
- retry
- preserve user edits

before deciding to discard state.

### CORE-DATA-SAVE-041 — Understand rollback scope

Rollback affects pending changes throughout the context.

Do not use it as a targeted undo for one object if the same context contains
other unrelated pending work that must remain.

If operations require independent rollback semantics, reconsider transaction or
context boundaries.

## Save propagation

### CORE-DATA-SAVE-050 — Distinguish local save from consumer visibility

A successful save and another context observing those changes are separate
events.

Conceptually:

```text
background context
    ↓ save
persistent store
    ↓
UI context still has its own registered state
```

Do not assume a background save immediately updates every long-lived context.

Define how saved changes are propagated or observed.

### CORE-DATA-SAVE-051 — Trace the full save path

When persistence requires several levels, validate the complete path.

For example:

```text
child
  ↓ save
parent
  ↓ save
persistent store
```

or:

```text
background context
  ↓ save
persistent store
  ↓ merge
view context
```

A partial path can produce behavior that appears correct locally but fails for
the final consumer.

## Merging

### CORE-DATA-MERGE-001 — Treat merging as synchronization between context-local views

Each context maintains its own registered object state.

Merging incorporates changes from another persistence event into that local
view.

Do not treat merge as equivalent to save.

The concepts are:

```text
save
→ commit changes outward
```

and:

```text
merge
→ incorporate changes inward
```

They solve different parts of synchronization.

### CORE-DATA-MERGE-002 — Define which contexts need incoming changes

Not every context must automatically merge every external change.

Identify the consumers that require updated state.

Long-lived contexts commonly need synchronization.

Short-lived operation contexts may not.

Avoid global merge behavior without understanding:

- local unsaved edits
- conflict policy
- frequency of background writes
- UI update behavior
- synchronization sources

## Automatic merging

### CORE-DATA-MERGE-010 — Enable automatic merging only when its semantics match the architecture

Automatic merging can simplify propagation from persistent-store changes into a
long-lived context.

Before enabling it, understand:

- which changes are eligible to merge
- how local unsaved changes interact
- the context's merge policy
- whether UI observers expect those updates
- whether multiple writers exist

Do not treat automatic merging as a universal configuration default.

### CORE-DATA-MERGE-011 — Automatic merging does not remove conflict policy

Even when changes are merged automatically, overlapping edits can still require
a conflict-resolution strategy.

Do not assume:

```text
automaticallyMergesChangesFromParent = true
```

means:

```text
conflicts no longer matter
```

Merge policy and application semantics remain relevant.

## Explicit merging

### CORE-DATA-MERGE-020 — Merge explicit change information at the consuming context

When the architecture uses explicit notifications or change payloads, perform
the merge through the context that will consume the changes.

Avoid mutating objects in the receiving context directly from another context's
objects.

Prefer identity-oriented or Core Data-provided change representations.

### CORE-DATA-MERGE-021 — Do not retain foreign managed objects from save notifications

A notification describing another context's save can contain managed objects
owned by the saving context.

Do not retain those objects and later use them from a different context.

Use the notification to:

- merge through the appropriate context API
- extract supported identity information
- trigger an intentional refetch

according to the architecture.

## Merge policies

### CORE-DATA-CONFLICT-001 — Choose merge policy from product semantics

A merge policy determines how Core Data resolves competing values during
conflict.

Do not select a policy merely because it suppresses save errors.

First determine which outcome the product requires.

Conceptual choices may include:

```text
persisted store wins
local object wins
property-level resolution
explicit application resolution
```

The correct strategy depends on ownership and authority.

### CORE-DATA-CONFLICT-002 — Define the authoritative side

Before choosing a conflict policy, identify which state should win.

Examples:

```text
server synchronization is authoritative
local user edit is authoritative
newest operation is authoritative
field-level ownership differs
```

Do not use `object wins` or `store wins` as a generic default without defining
why that side owns the truth.

### CORE-DATA-CONFLICT-003 — Avoid silent data loss

A conflict strategy that makes `save()` succeed can still be incorrect if it
silently drops meaningful user or remote changes.

Evaluate:

- which values were overwritten
- whether the overwrite is expected
- whether conflict should be surfaced
- whether reconciliation is required

Success at the persistence API level is not sufficient evidence of correct
business behavior.

## Uniqueness conflicts

### CORE-DATA-CONFLICT-010 — Treat uniqueness conflicts as identity reconciliation

When uniqueness constraints detect two records representing the same unique
value, determine whether the intended behavior is:

- reject duplicate creation
- merge records
- update existing record
- prefer local data
- prefer existing persisted data

Do not select a merge policy solely to avoid the uniqueness error.

Uniqueness conflicts often indicate an identity decision, not merely a
technical save problem.

## Optimistic locking

### CORE-DATA-CONFLICT-020 — Account for stale edits when multiple writers modify the same record

When one context edits an older version while another writer commits newer
state, a save can create an optimistic-locking conflict depending on the
configuration and changes.

Determine whether the correct response is:

- overwrite
- reject
- merge fields
- reload and retry
- surface conflict

Do not retry automatically without understanding whether retrying would discard
another writer's meaningful changes.

## Local unsaved changes

### CORE-DATA-MERGE-030 — Protect intentional local edits during incoming merges

A long-lived context can have unsaved local changes while incoming persisted
changes arrive.

Before changing merge behavior, determine:

- whether local edits should survive
- whether remote/store edits should override them
- whether properties have different authority
- whether conflicts should be surfaced

Do not enable aggressive store-wins behavior when the user expects unsaved
local edits to remain.

Likewise, do not always preserve local state when server or shared persistence
is authoritative.

## Stale state

### CORE-DATA-MERGE-040 — Define acceptable staleness

Not every context needs immediate synchronization.

Some systems intentionally accept:

```text
snapshot at operation start
```

while others require:

```text
near-live shared state
```

Choose merge/refetch behavior according to the consumer contract.

Do not add continuous merging simply because another context can write data.

### CORE-DATA-MERGE-041 — Refetch when query membership can change

A saved change may alter not only object properties but whether an object
belongs in a particular query result.

For example, a background update may change:

```text
status = active
```

to:

```text
status = archived
```

Consumers relying on a filtered result may need more than a property-level
assumption.

Ensure the observation/fetch mechanism reflects membership changes according to
its contract.

## External writers

### CORE-DATA-MERGE-050 — Distinguish same-process context writes from external persistent-store changes

Changes can originate from:

- another context in the same process
- another process
- CloudKit
- app extensions
- batch operations
- external synchronization mechanisms

Not every source propagates through the same notification path.

Identify the actual writer before selecting a merge strategy.

Do not assume same-process save notification handling is sufficient for
cross-process or persistent-history scenarios.

## Persistent history

### CORE-DATA-HISTORY-001 — Use persistent history when durable change tracking solves a real synchronization problem

Persistent history can help consumers process changes that occurred in the
persistent store over time.

It may be useful when:

- multiple processes write the store
- app extensions share persistence
- CloudKit synchronization is involved
- changes must be processed incrementally
- consumers can miss live notifications
- reconciliation must survive process restarts

Do not introduce persistent history for simple same-process context
synchronization when ordinary merging already satisfies the contract.

### CORE-DATA-HISTORY-002 — Treat history tokens as synchronization state

When processing persistent history incrementally, the last processed token is
part of the synchronization contract.

Define:

- who owns the token
- where it is stored
- when it advances
- what happens after processing failure
- how pruning interacts with consumers

Do not advance synchronization state before the corresponding history
transaction has been processed successfully.

### CORE-DATA-HISTORY-003 — Make history processing idempotent when reprocessing can occur

If a crash or failure can cause the same history transaction to be observed
again, processing should tolerate replay where practical.

Avoid designs where replay automatically duplicates external side effects.

If processing is not idempotent, persist enough progress to avoid ambiguous
re-execution.

## Batch operations

### CORE-DATA-MERGE-060 — Reconcile contexts after store-level batch operations

Batch updates and deletes can modify the persistent store without passing each
registered managed object through ordinary context mutation.

After such operations, long-lived contexts may contain stale registered state.

Define how they become consistent.

Possible strategies include:

- merging returned object-ID changes
- refreshing affected objects
- resetting an appropriate context
- refetching
- consuming persistent history

Do not assume registered objects automatically reflect a successful store-level
batch operation.

## Deletions

### CORE-DATA-MERGE-070 — Propagate deletions intentionally

When another context deletes a record, consumers holding that record need an
intentional way to become consistent.

Relevant consumers can include:

- view contexts
- fetched-result observers
- caches
- feature state
- object-ID holders

Do not continue treating a deleted record as active merely because another
context has not yet reconciled its state.

Handle deletion according to the chosen merge/refetch architecture.

## Retry

### CORE-DATA-SAVE-060 — Retry only failures that are meaningfully retryable

Do not retry every save failure.

A retry may make sense for some transient operational failures.

It usually does not solve:

- deterministic validation failure
- incompatible model
- unresolved uniqueness conflict
- invalid relationship state

Classify the failure before retrying.

### CORE-DATA-SAVE-061 — Revalidate before retry

State may change between the original save attempt and a later retry.

If retry depends on assumptions about:

- object existence
- conflict ownership
- remote state
- user edits
- context lifecycle

revalidate those assumptions first.

Do not replay stale mutation blindly.

## Cancellation

### CORE-DATA-SAVE-070 — Define cancellation around the owning operation, not by assuming `save()` is reversible

An application-level operation can support cancellation even though persistence
work may already have reached a save boundary.

Determine the cancellation contract:

```text
cancel before mutation
cancel before save
cancel after save
```

These may have different outcomes.

Do not claim cancellation restored previous persistent state unless the
architecture explicitly performs compensation or rollback before durability.

Use the Swift concurrency skill when tasks and cancellation materially affect
the operation.

## Transaction composition

### CORE-DATA-SAVE-080 — Avoid splitting one logical transaction unintentionally

If several persistence mutations must succeed together as one logical unit,
avoid independently saving each step unless partial persistence is explicitly
supported.

For example:

```text
create order
create items
update inventory
```

may require one transaction boundary if partial state would be invalid.

Do not split the save merely to simplify individual functions.

Likewise, do not force unrelated operations into one transaction when they have
independent failure and durability contracts.

## Multiple contexts and one operation

### CORE-DATA-SAVE-090 — Be cautious when one logical transaction spans multiple independent contexts

Independent contexts saving separately do not automatically provide one atomic
transaction across all changes.

If correctness requires all-or-nothing behavior, design the persistence
operation around an appropriate common transaction boundary.

Do not simulate atomicity through:

```text
save context A
save context B
if B fails, hope to undo A
```

unless compensating behavior is explicitly part of the design.

## Save notifications

### CORE-DATA-MERGE-080 — Observe save events only when they are the correct synchronization boundary

Save notifications can support context synchronization and diagnostics.

Do not add observers mechanically when automatic merging, fetched-result
observation, persistent history, or another established mechanism already owns
the propagation.

Every observer should have:

- a clear purpose
- correct filtering
- an intentional lifetime
- cleanup ownership

Avoid duplicate synchronization paths.

## Duplicate merging

### CORE-DATA-MERGE-090 — Maintain one authoritative change-propagation strategy

Avoid combining several overlapping mechanisms such as:

```text
automatic merging
+
manual save-notification merging
+
manual refetch
+
persistent-history replay
```

for the same change stream without a clear division of responsibility.

Duplicate propagation can cause:

- repeated UI work
- redundant fetches
- confusing event order
- stale versus fresh races
- unnecessary complexity

Choose the minimum set of mechanisms needed by the actual synchronization
contract.

## Observation

### CORE-DATA-MERGE-100 — Distinguish persistence synchronization from presentation observation

Core Data merge behavior determines context state.

UI observation determines how consumer presentation reacts to that state.

Do not add persistence-level merging solely because a view is not updating
without first determining whether the issue is:

```text
store → context synchronization
```

or:

```text
context → observer/UI propagation
```

These are different boundaries.

Use the applicable framework skill when UI observation semantics are involved.

## Conflict diagnostics

### CORE-DATA-CONFLICT-030 — Preserve conflict evidence before resolving automatically

When diagnosing save conflicts, inspect enough information to establish:

- affected object
- conflicting properties
- persisted values
- local pending values
- writer/source
- merge policy

Do not log sensitive property contents indiscriminately.

Preserve structural conflict information sufficient to diagnose the ownership
problem.

## Testing save and merge behavior

### CORE-DATA-TEST-001 — Test the complete synchronization path

When behavior depends on multiple contexts, a single-context unit test does not
prove the contract.

A useful test may model:

```text
context A writes
    ↓
save
    ↓
store
    ↓
context B merges/refetches
    ↓
consumer observes expected state
```

Test the path that production actually uses.

### CORE-DATA-TEST-002 — Test conflict semantics, not just save success

When merge policy changes, create competing edits and assert which values
survive.

Do not assert only:

```text
save did not throw
```

if the important contract is:

```text
which writer wins
```

### CORE-DATA-TEST-003 — Test stale-state behavior intentionally

When a bug concerns stale objects, use multiple contexts or representative
external writes to reproduce the state divergence.

Do not simulate stale-state bugs by directly mutating the same managed-object
instance from one context.

## Validation checklist

When save, merge, or conflict behavior changes, verify when applicable:

- the context save reaches the intended persistence boundary
- parent-context saves are propagated when required
- save ownership is clear
- failed saves leave context state intentionally handled
- persistence failure is not silently reported as success
- long-lived contexts receive relevant external changes
- automatic and explicit merge mechanisms do not duplicate responsibility
- local unsaved edits follow the intended conflict policy
- merge policy represents actual product authority
- uniqueness conflicts are resolved according to identity semantics
- store-level batch changes are reconciled into active contexts
- deletion propagation reaches supported consumers
- persistent-history progress is advanced safely
- retries occur only for appropriate failures
- multi-context operations do not claim atomicity they do not provide
- tests exercise the real save-and-merge path

Do not treat a successful `context.save()` as proof that every consumer now
holds correct and current state.