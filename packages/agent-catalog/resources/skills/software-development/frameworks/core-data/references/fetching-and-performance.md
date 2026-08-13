# Core Data Fetching and Performance

Use this reference when the task materially affects Core Data fetches, query
design, faulting, relationship prefetching, batching, counts, large datasets,
imports, memory usage, save frequency, batch operations, or measured persistence
performance.

Project-specific persistence architecture and performance requirements take
precedence over this generic guidance.

## Performance baseline

### CORE-DATA-PERF-001 — Optimize from the persistence boundary

Before introducing caching, parallelism, custom executors, duplicate models, or
other architectural complexity, determine where the persistence cost actually
occurs.

Relevant dimensions can include:

- number of fetches
- number of rows fetched
- objects materialized
- relationships faulted
- data copied into memory
- predicate complexity
- sort cost
- save frequency
- context registered-object growth
- store contention
- UI-facing persistence work
- batch size
- repeated refetching

Do not optimize Core Data based solely on the number of lines in a fetch or the
presence of a relationship.

Measure or establish a concrete expensive path when the proposed optimization
adds meaningful complexity.

### CORE-DATA-PERF-002 — Prefer query improvements before architectural workarounds

When a fetch is expensive, first ask whether the store is being asked the right
question.

Prefer improving:

- predicate
- fetch limit
- sort descriptors
- result type
- fetched properties
- batching
- prefetching
- indexing where appropriate

before introducing duplicate caches or synchronization layers.

A poorly scoped fetch wrapped in a cache remains a poorly scoped persistence
contract.

## Fetch according to the consumer contract

### CORE-DATA-FETCH-001 — Fetch only the records the operation needs

Push filtering into the persistent query when Core Data can express the
required condition reliably.

Prefer:

```text
store
  ↓ predicate
required records
```

over:

```text
fetch all records
      ↓
filter in Swift
```

when the dataset can grow materially.

For example, prefer an appropriate predicate:

```swift
request.predicate = NSPredicate(
    format: "status == %@",
    Status.active.rawValue
)
```

over fetching every entity and filtering afterward when persistence owns the
filterable value.

Do not move trivial filtering into Core Data when the in-memory collection is
small, already loaded, and the additional fetch would make the design worse.

### CORE-DATA-FETCH-002 — Keep fetch scope aligned with ownership

A repository or persistence operation should not fetch unrelated data merely
because it is convenient to have the complete object graph available.

Fetch the data required by the supported operation.

Broader fetches are appropriate when the consumer genuinely owns or needs the
complete result.

Avoid creating one enormous "load everything" persistence boundary that forces
all consumers to pay for unrelated data.

## Fetch limits

### CORE-DATA-FETCH-010 — Use fetch limits when the contract has a bounded result

When the consumer requires:

```text
first matching record
latest record
top N records
existence
```

avoid fetching an unbounded result set and discarding the rest.

Use an appropriate fetch limit when it preserves the intended semantics.

For example:

```swift
request.fetchLimit = 1
```

can be appropriate when the operation intentionally needs at most one result.

Do not add arbitrary fetch limits to hide large datasets when the consumer
actually requires the complete result.

## Existence queries

### CORE-DATA-FETCH-020 — Do not materialize objects merely to determine existence

When the only question is:

```text
does any matching record exist?
```

prefer a query strategy that does not unnecessarily materialize an entire
result set.

Likewise, for:

```text
how many matching records exist?
```

prefer a count-oriented operation when object materialization is unnecessary.

Do not turn an existence check into:

```text
fetch thousands of objects
        ↓
isEmpty
```

when the store can answer the narrower question.

## Count queries

### CORE-DATA-FETCH-030 — Keep count semantics explicit

A count query should represent the same predicate and store scope as the
consumer's actual question.

Do not substitute an in-memory collection count when that collection may be:

- filtered differently
- stale
- partially loaded
- scoped to another context
- missing externally persisted changes

Likewise, do not query the store again when the consumer intentionally asks
about the already loaded in-memory collection.

Distinguish:

```text
persisted matching record count
```

from:

```text
currently loaded collection count
```

## Result types

### CORE-DATA-FETCH-040 — Fetch the representation the operation requires

Not every query requires fully realized `NSManagedObject` instances.

Depending on the contract, useful results may include:

- managed objects
- managed-object IDs
- dictionaries/projections
- counts
- aggregate results

Use a narrower representation when the operation only needs:

```text
identity
selected fields
aggregate data
```

and managed-object behavior is unnecessary.

Do not replace managed-object fetches mechanically with dictionaries merely for
performance.

The narrower representation should serve a real consumer or performance need.

## Object IDs

### CORE-DATA-FETCH-050 — Prefer object IDs when identity is sufficient

When an operation needs to locate, transfer, delete, or later resolve records
without using their current properties, fetching object IDs can reduce
unnecessary object materialization.

This is especially useful at context boundaries.

Conceptually:

```text
fetch matching identities
        ↓
transfer/partition
        ↓
resolve only where needed
```

Do not fetch IDs first if every result will immediately be materialized in the
same context and the additional complexity provides no benefit.

## Properties and projections

### CORE-DATA-FETCH-060 — Project only required persisted values when object behavior is unnecessary

Some operations need a small subset of persisted fields rather than managed
objects.

Examples can include:

```text
aggregate calculation
export identifiers
build lightweight index
compare timestamps
produce diagnostic counts
```

A projection can reduce object graph materialization.

Do not use projections when consumers require:

- relationship behavior
- managed-object mutation
- lifecycle observation
- context-managed identity behavior

Choose the result representation according to the operation.

## Sorting

### CORE-DATA-FETCH-070 — Sort where the authoritative query owns ordering

When the consumer contract requires persisted results in a known order, express
the order as part of the fetch when practical.

Prefer:

```text
predicate
+
sort descriptors
+
fetch
```

over fetching a large dataset and sorting it afterward when the store can
perform the operation efficiently.

In-memory sorting can still be appropriate for:

- small bounded data
- values already loaded for another reason
- ordering that cannot be represented by the store query
- presentation-only ordering

Do not assume store-side sorting is always cheaper without considering the
actual workload.

## Predicates

### CORE-DATA-FETCH-080 — Keep predicates store-evaluable when persistence performance matters

Predicates used for persistent fetches should express conditions Core Data and
the underlying store can evaluate reliably.

Avoid designing queries that require fetching broad data merely because the
actual filtering logic exists only in arbitrary Swift code.

When a frequently queried property is hidden inside:

- opaque serialized data
- transformable values
- computed-only state

consider whether the persistence model matches the query requirement.

Do not remodel the schema for hypothetical queries.

## Indexes

### CORE-DATA-FETCH-090 — Add indexes for demonstrated query patterns

Indexes can improve repeated queries on appropriate persisted properties.

They also have costs:

- additional storage
- write overhead
- migration implications
- schema complexity

Do not index every searchable attribute mechanically.

Prioritize properties involved in demonstrated high-value query patterns such
as:

- frequent filtering
- sorting
- uniqueness/search keys

Validate the improvement with representative data when performance matters.

## Fetch batching

### CORE-DATA-FETCH-100 — Use batching to bound object materialization for large results

When a fetch legitimately returns many records, batching can reduce the amount
of object data materialized at one time.

Use an appropriate batch size when:

- result sets can become large
- consumers process results progressively
- memory pressure is observed or expected from representative volume

Do not assume `fetchBatchSize` changes the logical result count.

Batching primarily influences how Core Data materializes data while the result
is consumed.

### CORE-DATA-FETCH-101 — Do not use batching as a substitute for query scope

If the consumer only needs 20 records, do not fetch 100,000 records with a batch
size of 20 and treat that as equivalent.

Prefer:

```text
correct predicate/limit
        ↓
batching if result is still large
```

Batching addresses materialization behavior.

It does not make an unnecessarily broad query correct.

## Faulting

### CORE-DATA-FAULT-001 — Preserve faulting unless the access pattern justifies materialization

Faulting allows Core Data to defer loading data until it is needed.

Do not disable faulting globally merely to avoid occasional lazy access.

Faulting is useful for keeping large object graphs from being fully loaded
without need.

Optimize the actual access pattern instead.

### CORE-DATA-FAULT-002 — Account for fault firing in repeated loops

A loop that appears inexpensive at the Swift level can trigger persistent-store
work when each property or relationship access fires a fault.

For example:

```text
fetch parent objects
      ↓
for each parent
      ↓
access unloaded relationship
```

can produce repeated persistence work.

When this is a demonstrated hot path, consider:

- relationship prefetching
- narrower projections
- different fetch shape
- batching
- restructuring the query

Do not label every relationship access an N+1 problem without evidence that
repeated store access actually occurs.

## Relationship prefetching

### CORE-DATA-FETCH-110 — Prefetch relationships when the consumer will predictably use them

Relationship prefetching can reduce repeated fault fulfillment when a fetch is
known to consume related data immediately.

Conceptually:

```text
fetch parent
+
known required relationship
        ↓
bounded query plan
```

instead of:

```text
fetch parents
        ↓
each parent triggers related loading
```

Use prefetching when the relationship access pattern is known and meaningful.

Do not prefetch large relationship graphs "just in case."

Over-prefetching can increase:

- memory usage
- initial query cost
- object materialization
- unnecessary data loading

### CORE-DATA-FETCH-111 — Prefetch the smallest relationship graph needed

Avoid prefetch chains that eagerly load a large portion of the persistence
graph.

For example:

```text
orders.customer.addresses.country...
```

should be justified by a real consumer path.

If only the customer's name is required, do not load unrelated relationships.

Optimize for actual data consumption.

## N+1-style persistence behavior

### CORE-DATA-PERF-010 — Diagnose repeated persistence work from the access path

An N+1-style issue can occur when:

```text
1 fetch
+
N relationship/property fetches
```

are triggered while processing the result.

Before reporting or correcting it, establish:

- whether the relationship is already loaded
- whether Core Data batches fault fulfillment
- whether the result size is material
- whether the store is actually queried repeatedly
- whether prefetching would reduce total cost

Do not identify N+1 solely from nested Swift loops.

Reason about persistence behavior, not syntax alone.

## Large result sets

### CORE-DATA-PERF-020 — Avoid retaining an entire large object graph without need

When processing many records, consider whether each managed object must remain
registered and retained for the whole operation.

Possible strategies include:

- process in bounded groups
- release external references
- save at intentional checkpoints
- reset an operation-scoped context when safe
- fetch IDs first
- use batch APIs
- use value projections

Do not reset contexts holding objects still required by active consumers.

## Imports

### CORE-DATA-IMPORT-001 — Separate independent transformation work from persistence work

Large imports often consist of:

```text
decode
normalize
validate independent input
map
persist
```

Only the persistence portion necessarily requires a managed-object context.

When transformation is substantial, perform independent work outside the
context when doing so preserves the operation contract.

Then submit bounded persistence mutations through the context.

This can reduce time spent occupying the context execution boundary.

Do not split trivial work into multiple concurrency layers without a measured
benefit.

### CORE-DATA-IMPORT-002 — Fetch existing records efficiently during reconciliation

An import that repeatedly asks:

```text
does record X already exist?
```

for each incoming record can become expensive at scale.

When appropriate, consider querying existing identities in a bounded set and
building an in-memory lookup for the current import batch.

Conceptually:

```text
incoming IDs
    ↓
fetch existing matching IDs
    ↓
build lookup
    ↓
insert/update
```

Do not load an application's entire persistence identity space for a small
import.

Scope reconciliation to the data actually being processed.

## Bulk mutation

### CORE-DATA-BATCH-001 — Use batch APIs when object-level behavior is unnecessary and scale justifies them

Store-level batch update/delete operations can be appropriate when a large
number of records must change and ordinary managed-object materialization would
be unnecessarily expensive.

They trade ordinary managed-object lifecycle behavior for store-level
efficiency.

Before using them, account for:

- active contexts
- stale registered objects
- validation bypass
- object lifecycle callbacks
- merge/reconciliation
- affected relationships
- consumer observation

Do not replace ordinary object mutation with a batch operation merely because a
batch API exists.

### CORE-DATA-BATCH-002 — Reconcile active contexts after store-level mutation

A successful batch operation can leave existing managed objects stale.

Define how active contexts incorporate the changes.

Possible mechanisms can include:

- object-ID-based merge information
- refresh
- reset when safe
- refetch
- persistent history

Do not report the batch operation complete at the application level when
supported consumers still observe obsolete state.

## Batch inserts

### CORE-DATA-BATCH-010 — Use batch insertion for genuinely large insertion workloads

Batch insertion can reduce managed-object overhead when importing large
amounts of data.

Before using it, determine whether the operation needs ordinary managed-object:

- validation
- custom lifecycle behavior
- relationship construction
- in-memory observation

Store-level insertion may not exercise those behaviors the same way as normal
managed-object insertion.

Use the simplest insertion mechanism that satisfies correctness and scale.

## Save frequency

### CORE-DATA-PERF-030 — Choose save frequency from transaction and resource behavior

Frequent saves can increase persistence overhead.

Very infrequent saves can increase:

- unsaved state
- memory usage
- recovery scope
- transaction size

For large operations, choose intentional checkpoints based on:

- transaction semantics
- data volume
- recovery behavior
- memory pressure
- durability requirements

Do not save every record individually without a contract requiring that
durability granularity.

Do not defer all persistence to the end when losing the entire batch on failure
is unacceptable.

## Context reset during batches

### CORE-DATA-PERF-040 — Reset operation-scoped contexts only after their objects are no longer required

For large persistence operations, resetting a temporary context after a
completed batch can release registered object state.

Only do so when:

- the batch has reached the intended save boundary
- no external consumer retains those managed objects
- later work can re-resolve required identities

Do not reset a long-lived consumer context as a generic optimization.

Context reset is a lifecycle operation, not merely a memory API.

## Autorelease and temporary allocations

### CORE-DATA-PERF-050 — Bound temporary allocation in large synchronous processing

Large import or mapping loops may create substantial temporary Objective-C and
Foundation allocations.

When profiling demonstrates temporary-object accumulation, use an appropriate
bounded processing strategy.

Do not add manual autorelease management mechanically to ordinary Swift/Core
Data code.

First establish whether temporary allocation is a real contributor to memory
pressure.

## Registered objects

### CORE-DATA-PERF-060 — Monitor registered-object growth in long-running contexts

A context that processes large volumes of data can accumulate registered
objects, especially when external strong references keep them alive.

When memory grows unexpectedly, inspect:

- `registeredObjects`
- inserted/updated/deleted objects
- external references
- relationship traversal
- fault materialization
- batch lifecycle

Do not assume the context itself is leaking merely because many managed objects
remain registered.

Trace which references and operations keep them relevant.

## Refresh and refaulting

### CORE-DATA-PERF-070 — Use refresh/refaulting only when it matches state semantics

Turning realized objects back into faults can reduce memory in some workflows.

Do not refault objects while consumers still rely on unsaved or local state that
would be discarded.

Memory optimization must not change the supported transaction contract.

## Derived and aggregate queries

### CORE-DATA-FETCH-120 — Let the store compute aggregates when full object materialization is unnecessary

For operations such as:

```text
count
minimum
maximum
sum
average
```

consider an aggregate fetch or expression-based query when supported by the
model and store.

Avoid loading thousands of managed objects merely to calculate an aggregate in
Swift when the persistence layer can answer the query efficiently.

In-memory aggregation remains appropriate when:

- the values are already loaded
- the dataset is small
- the calculation uses application logic not representable by the store
- the consumer intentionally operates on local unsaved state

## Unsaved state and query semantics

### CORE-DATA-FETCH-130 — Know whether the query must include local unsaved state

A store-oriented optimization can change behavior if the existing operation
depends on unsaved changes in the context.

Before replacing a managed-object fetch with:

- batch API
- store-level aggregate
- another lower-level query

determine whether current unsaved inserted, updated, or deleted objects must
participate in the result.

Performance improvements must preserve the intended visibility contract.

## Fetched results and observation

### CORE-DATA-FETCH-140 — Avoid duplicate querying when an observation mechanism already owns the result

If an established fetched-results or query-observation mechanism maintains a
consumer's dataset, avoid independently refetching the same data after every
mutation unless the observation contract requires it.

First determine whether the problem lies in:

```text
store → context merge
```

or:

```text
context → observed result
```

Do not compensate for a broken synchronization path by adding repeated fetches
throughout the UI.

## Pagination

### CORE-DATA-FETCH-150 — Define pagination semantics explicitly

When a consumer requests incremental results, distinguish:

```text
UI pagination
```

from:

```text
fetch batching
```

They are not the same thing.

`fetchBatchSize` controls materialization behavior for a fetch result.

Application pagination controls which logical records belong to each requested
page/window.

When pagination is required, define stable ordering and boundaries so records
are not unpredictably duplicated or skipped as data changes.

Do not assume fetch batching automatically provides consumer pagination.

## Caching

### CORE-DATA-PERF-080 — Do not add a second cache without identifying the missing property of Core Data

Core Data already provides:

- registered-object management
- faulting
- identity
- persistence
- context-local snapshots

A separate application cache can still be useful for:

- derived expensive data
- remote-response policy
- non-persistent values
- cross-session requirements
- specialized read models

Before adding one, identify what the new cache provides that the existing
persistence/context boundary does not.

Every additional cache introduces invalidation and ownership responsibilities.

### CORE-DATA-PERF-081 — Define cache invalidation before relying on cached persistence-derived state

If a cache duplicates information derived from Core Data, define how it reacts
to:

- local saves
- background saves
- deletes
- migrations
- synchronization
- batch operations

Do not improve read latency by creating stale authoritative state accidentally.

## Threading and parallelism

### CORE-DATA-PERF-090 — Do not treat more contexts or tasks as automatic performance improvements

Additional contexts and concurrent tasks can introduce:

- merge cost
- conflict handling
- store contention
- scheduling overhead
- increased memory
- more complex ordering

Measure whether the workload benefits from parallel persistence work.

One well-scoped background context may outperform many contexts competing for
the same store.

Use the concurrency reference for ownership and correctness.

## UI responsiveness

### CORE-DATA-PERF-100 — Diagnose what blocks the user-facing path

When UI responsiveness is poor, establish whether the cost comes from:

- fetch execution
- fault fulfillment
- relationship traversal
- object mapping
- sorting
- save work
- merge processing
- UI rendering after persistence changes

Do not automatically move the fetch to another context if the expensive work is
actually rendering or mapping afterward.

Optimize the boundary producing the latency.

## Diagnostics

### CORE-DATA-PERF-110 — Use representative data

Performance behavior against:

```text
10 records
```

may not predict behavior against:

```text
100,000 records
```

When scale matters, profile with representative:

- entity counts
- relationship sizes
- store history
- query patterns
- synchronization behavior

Do not claim a persistence path is scalable solely because development data is
small.

### CORE-DATA-PERF-111 — Separate correctness diagnostics from performance diagnostics

An inefficient query is not automatically incorrect.

A stale context or missing merge is not merely a performance problem.

Classify the issue according to the violated contract:

```text
correctness
performance
memory
latency
scalability
```

This helps avoid architectural changes aimed at the wrong problem.

## Avoid speculative optimization

### CORE-DATA-PERF-120 — Do not optimize for hypothetical scale without evidence

Avoid adding:

- custom caching
- complex batch orchestration
- multiple writer contexts
- custom executors
- duplicated read models
- aggressive prefetching
- premature schema denormalization

solely because the application might eventually contain more data.

Prefer a design that is correct and structurally capable of measurement.

Optimize when:

- profiling identifies cost
- expected data scale is an explicit requirement
- a known operation is structurally unbounded
- the current query clearly performs unnecessary work

## Testing performance-sensitive persistence behavior

### CORE-DATA-TEST-001 — Keep correctness tests separate from performance measurements

A functional persistence test should not fail merely because a timing threshold
varies across machines unless timing itself is the product contract.

Use dedicated performance or benchmark tests for:

- fetch latency
- import throughput
- large-delete behavior
- memory-sensitive workflows

Keep correctness assertions focused on behavior.

### CORE-DATA-TEST-002 — Use representative stores for persistence performance tests

An empty in-memory store does not represent production persistence performance.

When meaningful, test with:

- representative row counts
- realistic relationships
- the relevant production store type
- representative predicates and indexes

Do not use production user data.

Generate or sanitize representative fixtures according to project policy.

## Validation checklist

When fetching or persistence performance changes, verify when applicable:

- predicates reduce data at the store when appropriate
- fetch limits match bounded consumer contracts
- existence/count operations do not unnecessarily materialize objects
- result types match what consumers actually require
- sorting occurs at the appropriate boundary
- fetch batching is not being confused with logical query limits
- relationship prefetching matches demonstrated access patterns
- faulting is not disabled broadly without evidence
- large operations bound registered-object and temporary-memory growth
- import reconciliation does not issue one avoidable fetch per record
- batch operations reconcile active contexts afterward
- save frequency matches transaction and resource requirements
- store-level optimizations preserve required unsaved-state semantics
- additional caches have explicit ownership and invalidation
- parallel contexts/tasks provide demonstrated value rather than speculative
  concurrency
- performance claims use representative data or profiling evidence
- correctness is not weakened solely for lower persistence cost

Do not treat fewer lines of persistence code, more background tasks, or a
successful fetch as evidence that the resulting Core Data path is performant.