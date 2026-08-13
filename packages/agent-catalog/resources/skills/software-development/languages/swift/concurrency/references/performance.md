# Swift Concurrency Performance

Use this reference when the task materially affects Swift concurrency
performance, task creation, excessive parallelism, actor contention,
serialization, executor pressure, blocking work, task groups, batching,
priority, async-sequence throughput, synchronization contention, or measured
latency and resource usage.

This reference focuses on **performance characteristics of concurrent Swift
code after correctness and ownership are established**.

Use:

- `async-await-basics.md` for suspension and sequential versus concurrent async
  work.
- `tasks.md` for task ownership, structured concurrency, task groups,
  cancellation, and detached tasks.
- `actors.md` for actor isolation and reentrancy.
- `threading.md` for locks, queues, blocking, synchronization, and contention.
- `async-sequences.md` for buffering, producer/consumer throughput, and stream
  fan-out.
- `memory-management.md` for retained tasks, buffers, and unbounded resource
  lifetime.
- `testing.md` for deterministic concurrency tests and performance validation.

Project-specific performance requirements, deployment targets, runtime
architecture, profiling tools, and framework execution contracts take
precedence over this generic guidance.

## Performance baseline

### SWIFT-CONC-PERF-001 — Correctness comes before concurrency optimization

Do not weaken:

- ownership
- actor isolation
- cancellation
- state-transition validity
- error propagation
- lifecycle
- ordering

merely to reduce suspension, task creation, or synchronization overhead.

The sequence should be:

```text
correct ownership
    ↓
correct isolation
    ↓
correct lifecycle
    ↓
measure
    ↓
optimize demonstrated cost
```

Do not use performance as justification for removing synchronization without an
equivalent safety invariant.

## Measure first

### SWIFT-CONC-PERF-010 — Optimize demonstrated concurrent cost

Before changing concurrency architecture for performance, identify the actual
cost.

Relevant evidence can include:

- wall-clock latency
- CPU utilization
- memory
- task count
- actor contention
- lock contention
- queue backlog
- excessive suspension
- repeated executor hops
- blocking waits
- downstream request concurrency
- stream buffer growth
- duplicated work

Do not infer a performance problem solely from:

```text
many await keywords
```

or:

```text
an actor exists
```

or:

```text
a lock exists
```

Measure the behavior that matters.

## Async does not mean faster

### SWIFT-CONC-PERF-020 — `async` is a control-flow model, not an optimization

Changing:

```swift
func work() -> Value
```

to:

```swift
func work() async -> Value
```

does not inherently make the operation faster.

An async function can still perform:

- expensive synchronous CPU work
- blocking I/O
- serialized state access
- redundant computation

Use async because the operation can suspend or participates in asynchronous
control flow.

Do not introduce async boundaries solely as a performance optimization.

## Concurrency versus parallelism

### SWIFT-CONC-PERF-030 — More concurrent tasks do not guarantee more parallel throughput

Concurrency allows work lifetimes to overlap.

Actual parallelism depends on:

- executor/runtime scheduling
- available cores
- actor serialization
- locks
- framework constraints
- I/O capacity
- downstream services
- resource limits

For example:

```text
100 Tasks
    ↓
one actor
    ↓
serialized mutation
```

does not create 100-way parallel execution of the actor-owned state.

Do not evaluate throughput from task count alone.

## Independent operations

### SWIFT-CONC-PERF-040 — Concurrent execution can reduce latency for genuinely independent work

For independent operations:

```text
A ─────────┐
           ├→ combined result
B ─────────┘
```

concurrent execution may reduce overall latency compared with:

```text
A
↓
B
```

when both are significant and can safely overlap.

For a fixed number of children, `async let` can express this clearly.

For dynamic children, a task group may be appropriate.

Do not parallelize operations that have:

- real data dependency
- strict ordering
- shared mutable invariants
- constrained downstream capacity

merely to reduce theoretical latency.

## Accidental serialization

### SWIFT-CONC-PERF-050 — Identify independent async work serialized by immediate awaits

For example:

```swift
let profile = try await loadProfile()
let settings = try await loadSettings()
```

is sequential.

If the operations are genuinely independent and expensive enough to matter:

```swift
async let profile = loadProfile()
async let settings = loadSettings()

return try await Result(
    profile: profile,
    settings: settings
)
```

may reduce elapsed latency.

Do not report sequential async code as a defect unless concurrency is both safe
and beneficial.

Sequential execution is often intentional.

## Excessive concurrency

### SWIFT-CONC-PERF-060 — Concurrency has overhead

Each additional concurrent unit can add:

- task allocation
- scheduling
- captured state
- synchronization
- result storage
- cancellation bookkeeping
- downstream resource pressure

Avoid creating one task for every trivial operation.

For example:

```text
10,000 tiny values
    ↓
10,000 Tasks
```

can cost more than processing them in larger units.

The appropriate granularity depends on workload cost.

## Task granularity

### SWIFT-CONC-PERF-070 — Make task work large enough to justify scheduling overhead

A task should normally represent a meaningful unit of asynchronous or
concurrent work.

Be cautious with:

```swift
for value in values {
    group.addTask {
        transformTinyValue(value)
    }
}
```

when `transformTinyValue` performs negligible work.

Possible alternatives include:

- sequential processing
- batching
- fewer worker tasks
- chunked processing

Do not batch automatically.

Measure when task overhead is material.

## Task-group fan-out

### SWIFT-CONC-PERF-080 — Bound fan-out for large or externally constrained workloads

An unbounded task group such as:

```swift
for request in requests {
    group.addTask {
        await client.send(request)
    }
}
```

can create excessive:

- memory usage
- network concurrency
- socket usage
- service load
- scheduler pressure

when `requests` can become large.

Use bounded concurrency when the workload or downstream resource has meaningful
limits.

Do not introduce a fixed concurrency limit without considering the actual
resource.

## Bound by the constrained resource

### SWIFT-CONC-PERF-090 — Choose concurrency limits according to the bottleneck

Possible constraints include:

```text
CPU cores
network connection pool
remote API rate limit
database writer capacity
memory
framework session limits
device hardware
```

Do not use one magic number such as:

```text
4 concurrent tasks
```

for every workload.

The correct limit follows the constrained resource and product behavior.

## Worker patterns

### SWIFT-CONC-PERF-100 — Use bounded workers when input can be very large

For large workloads, a design such as:

```text
input queue
   ↓
N workers
   ↓
results
```

can provide bounded concurrency without creating one active task per input
element.

This can be useful for:

- imports
- media processing
- bulk network work
- CPU-heavy transformations

Do not introduce worker infrastructure for small, naturally bounded workloads.

## Actor contention

### SWIFT-CONC-PERF-110 — Keep unrelated expensive work outside actor isolation

An actor serializes access to its isolated execution segments.

If an actor performs:

```text
capture state
expensive CPU work
commit state
```

all inside isolation, unrelated callers may wait unnecessarily.

When safe, prefer:

```text
actor
  ↓
capture independent input
  ↓
outside actor
  ↓
expensive work
  ↓
actor
  ↓
revalidate + commit
```

Account for reentrancy and stale-state correctness when re-entering.

Do not move work out of actor isolation if it actually manipulates actor-owned
mutable state.

## Actor method size

### SWIFT-CONC-PERF-120 — Minimize unnecessary actor occupancy, not source-code length

The important question is how long an operation requires actor-owned state.

A long function is not automatically a performance problem.

A short function can still block the actor if it performs expensive synchronous
work.

Optimize actor occupancy by separating:

```text
isolated state access
```

from:

```text
independent expensive work
```

where the ownership model permits it.

Do not split methods mechanically to create more suspension points.

## Suspension points

### SWIFT-CONC-PERF-130 — Do not minimize `await` count as a blanket performance rule

An `await` can involve suspension and scheduling work, but the dominant cost is
often the operation being awaited.

Removing suspension points can make code:

- block
- lose responsiveness
- combine unrelated ownership
- weaken cancellation

Do not optimize concurrency by counting `await` expressions.

Optimize actual measured latency and executor occupancy.

## Actor hops

### SWIFT-CONC-PERF-140 — Avoid unnecessary repeated isolation crossings in hot paths

Code conceptually like:

```text
caller
 ↓ await actor.propertyA
caller
 ↓ await actor.propertyB
caller
 ↓ await actor.propertyC
```

can require several actor interactions.

If the values form one coherent snapshot, an actor API such as:

```swift
func snapshot() -> Snapshot
```

may provide:

- consistency
- fewer isolation crossings
- clearer ownership

Use this when the values genuinely belong together.

Do not create broad snapshot APIs merely to eliminate `await`.

## Behavior-oriented actor APIs

### SWIFT-CONC-PERF-150 — Coherent operations can improve both correctness and isolation efficiency

Instead of:

```text
await actor.canStart()
await actor.markStarting()
await actor.incrementAttempt()
```

a single actor-owned operation:

```swift
await actor.beginAttempt()
```

may:

- preserve atomicity
- reduce actor hops
- reduce interleaving
- make ownership clearer

This is primarily an architecture/correctness improvement.

Any performance improvement is secondary.

Do not merge unrelated operations merely to reduce actor calls.

## Global actors

### SWIFT-CONC-PERF-160 — Avoid unnecessary work on highly shared global isolation domains

Broad global-actor isolation can serialize unrelated work.

For example, placing backend computation on `MainActor` can:

- delay UI work
- reduce responsiveness
- hide missing ownership boundaries

Keep only semantically owned work under the global actor.

Do not remove `MainActor` from UI-owned state merely for throughput.

Move only independent non-UI work.

## MainActor occupancy

### SWIFT-CONC-PERF-170 — Keep expensive synchronous work off MainActor when it does not require UI isolation

A useful pattern is:

```text
MainActor
   ↓
capture UI-independent input
   ↓
perform expensive work elsewhere
   ↓
MainActor
   ↓
apply result
```

provided stale results and cancellation are handled.

Do not assume simply writing an `async` MainActor method makes expensive
synchronous work non-blocking.

## Blocking work

### SWIFT-CONC-PERF-180 — Blocking is different from suspension

Suspension allows the runtime to use execution resources elsewhere.

Blocking keeps a thread occupied waiting.

Examples include:

- semaphore waits
- synchronous dispatch waits
- blocking filesystem calls
- long lock waits
- legacy synchronous network operations

Avoid introducing blocking into task-based code when the operation has a
genuine async form.

Do not classify every synchronous operation as harmful.

Small synchronous work is normal.

## Locks

### SWIFT-CONC-PERF-190 — Lock contention matters more than lock existence

A small lock protecting a tiny amount of state may be very efficient.

Do not replace a lock merely because:

```text
actors are newer
```

or:

```text
locking sounds expensive
```

Measure:

- contention frequency
- wait duration
- critical-section length
- thread count
- lock acquisition rate

Optimize when lock contention is demonstrated.

## Critical sections

### SWIFT-CONC-PERF-200 — Move unrelated work outside locks

For lock-protected state:

```text
lock
  ↓
read/update invariant
  ↓
unlock
```

is preferable to:

```text
lock
  ↓
logging
  ↓
serialization
  ↓
network preparation
  ↓
callback
  ↓
unlock
```

when those operations do not require mutual exclusion.

Keep the smallest **coherent** critical section.

Do not split a multi-property invariant merely to shorten lock duration.

## Lock granularity

### SWIFT-CONC-PERF-210 — Increase synchronization granularity complexity only with evidence

Replacing one lock with many locks can theoretically improve concurrency.

It also introduces:

- lock ordering
- more complex invariants
- greater deadlock risk
- fragmented synchronization ownership

Prefer a simple correct lock until contention demonstrates the need for more
granular synchronization.

## Serial queues

### SWIFT-CONC-PERF-220 — Serial queues can be efficient for small shared-state workloads

A serial queue is not inherently a performance problem.

For small state transitions, one queue can provide:

- low-complexity synchronization
- predictable ordering
- good enough throughput

Do not introduce concurrent queues, barriers, or actors solely to make the
architecture appear more concurrent.

Measure queue backlog and latency first.

## Queue backlog

### SWIFT-CONC-PERF-230 — Investigate why serialized work accumulates

If a serial queue or actor develops backlog, inspect whether submitted work
contains:

- expensive computation
- blocking I/O
- callbacks
- repeated redundant operations
- large transformations
- unnecessary logging
- independent work that could occur elsewhere

Do not immediately replace the serialization mechanism.

The problem may be excessive work inside the serialized boundary.

## Serialization can be desirable

### SWIFT-CONC-PERF-240 — Avoid concurrency where serialization reduces total work

Concurrent operations can create duplication.

For example:

```text
10 callers
    ↓
same expensive initialization
```

may be worse than:

```text
10 callers
    ↓
one shared initialization
    ↓
all receive result
```

Deduplication, memoization, or joining existing work can outperform parallel
duplicate work.

Do not interpret "more concurrent" as "more performant."

## Joining in-flight work

### SWIFT-CONC-PERF-250 — Reuse one active operation when callers request the same result and semantics permit it

An owner may keep an in-flight task:

```text
first caller
    ↓
start work
    ↓
store Task
second caller
    ↓
await same Task
```

when:

- requests are semantically equivalent
- sharing error/result is correct
- cancellation ownership is defined

This can prevent duplicate network or initialization work.

Do not share tasks whose callers require independent cancellation or different
request semantics.

Use `tasks.md` for lifecycle implications.

## Debouncing

### SWIFT-CONC-PERF-260 — Debounce can eliminate superseded expensive work

For input where only the latest value matters:

```text
A
AB
ABC
```

a debounce can avoid running expensive work for every intermediate state.

This is appropriate only when intermediate values are semantically disposable.

Do not debounce event streams where every event must be processed.

Use `async-sequences.md` when stream operators are involved.

## Coalescing

### SWIFT-CONC-PERF-270 — Coalesce repeated equivalent work when the domain allows it

High-frequency events may trigger identical expensive operations.

Possible strategies include:

- latest-wins replacement
- in-flight joining
- batching
- state deduplication
- debounce
- rate limiting

Choose according to domain semantics.

Do not coalesce correctness-critical distinct events merely because they look
similar.

## Cancellation and performance

### SWIFT-CONC-PERF-280 — Stop obsolete work before it consumes more resources

Cancellation is a correctness/lifecycle mechanism that can also reduce waste.

For expensive superseded operations, useful checkpoints may exist:

- before expensive CPU stage
- before next network operation
- before next batch
- before generating large output

Do not add cancellation checks so frequently that checking dominates tiny work.

Use meaningful boundaries.

## Stale work

### SWIFT-CONC-PERF-290 — Preventing stale commits does not automatically stop stale computation

A generation check at the end:

```text
perform expensive work
        ↓
generation changed
        ↓
discard result
```

protects correctness but may still waste resources.

If obsolete work is expensive, combine stale-result validation with appropriate
cancellation or earlier invalidation when possible.

Do not compromise correctness just to avoid discarded work.

## Cancellation-insensitive dependencies

### SWIFT-CONC-PERF-300 — Identify operations that cannot stop promptly

Some work cannot be cancelled once started.

Examples may include:

- blocking legacy calls
- framework operations without cancellation
- expensive synchronous computation without checkpoints

If such work frequently becomes obsolete, consider whether:

- it should start later
- requests should be coalesced
- work should be chunked
- underlying API has a cancellable alternative

Do not advertise responsive cancellation when the dependency cannot provide it.

## Detached tasks

### SWIFT-CONC-PERF-310 — Do not use detached tasks as a performance switch

`Task.detached` does not mean:

```text
faster
```

or:

```text
run on a dedicated background thread
```

Use detached tasks only when the ownership and isolation semantics require
independence.

Do not choose them to "get work off the actor" without first designing the
value-transfer boundary.

## CPU-bound work

### SWIFT-CONC-PERF-320 — Avoid excessive parallelism for CPU-bound work

CPU-heavy work generally cannot benefit indefinitely from more tasks than the
system can execute efficiently.

Too much parallel CPU work can cause:

- scheduler overhead
- cache contention
- thermal pressure
- reduced responsiveness
- energy cost

Bound parallelism according to workload and platform characteristics.

Do not assume one task per input item is appropriate.

## I/O-bound work

### SWIFT-CONC-PERF-330 — I/O workloads can tolerate more concurrency but remain externally constrained

I/O-bound work can often overlap effectively because tasks spend time suspended.

Still account for:

- connection limits
- service rate limits
- memory
- server load
- file descriptor limits
- API quotas

Do not use CPU-count-based concurrency limits blindly for remote I/O.

The bottleneck may be external.

## Mixed workloads

### SWIFT-CONC-PERF-340 — Separate CPU and I/O stages when their optimal concurrency differs

A pipeline may contain:

```text
network fetch
    ↓
CPU decode
    ↓
persist
```

Each stage can have different constraints.

One global concurrency limit may be inefficient.

When performance matters, consider where each stage is actually constrained.

Do not build a complex staged pipeline unless representative measurements
justify it.

## Batching

### SWIFT-CONC-PERF-350 — Batch work when per-operation overhead is material

Batching can reduce:

- task creation
- synchronization
- network calls
- persistence transactions
- actor hops

For example:

```text
1000 individual requests
```

may be more expensive than:

```text
10 batches of 100
```

when the downstream API supports equivalent semantics.

Do not batch when it changes:

- ordering
- failure isolation
- latency requirements
- cancellation granularity

without accounting for those tradeoffs.

## Batch size

### SWIFT-CONC-PERF-360 — Choose batch size from workload behavior

Larger batches can reduce overhead but increase:

- latency to first result
- memory
- retry cost
- transaction size
- cancellation granularity

Smaller batches increase coordination overhead.

Do not embed a universal batch-size constant into generic infrastructure without
evidence.

## AsyncSequence throughput

### SWIFT-CONC-PERF-370 — Diagnose producer/consumer imbalance

For:

```text
producer
   ↓
buffer
   ↓
consumer
```

performance problems can come from:

- producer too fast
- consumer too slow
- expensive per-element processing
- oversized buffering
- task-per-element work
- redundant values
- contention in shared consumer state

Inspect the entire pipeline.

Do not assume buffering alone is the performance defect.

## Buffer growth

### SWIFT-CONC-PERF-380 — Unbounded buffering converts throughput problems into memory problems

If:

```text
producer rate > consumer rate
```

for long enough, an unbounded buffer can grow indefinitely.

Choose an explicit strategy:

- bounded buffer
- latest-value semantics
- drop policy
- producer throttling
- batching
- backpressure-capable abstraction

according to event semantics.

Do not discard correctness-critical events solely to control memory.

## Task-per-element streams

### SWIFT-CONC-PERF-390 — Avoid unstructured task fan-out from high-frequency streams

This pattern:

```swift
for await event in events {
    Task {
        await process(event)
    }
}
```

can produce unbounded concurrent work.

It can also:

- reorder completion
- retain many events
- overwhelm downstream dependencies

Use sequential processing or intentional bounded concurrency.

Do not create a task per element without a throughput and ordering design.

## Event deduplication

### SWIFT-CONC-PERF-400 — Suppress redundant state updates only when equality semantics make them truly redundant

A high-frequency state stream may repeatedly emit the same value.

If consumer work is expensive, deduplication can reduce:

- actor hops
- UI updates
- processing
- logging

Do not deduplicate event streams where repeated equal values represent distinct
occurrences.

## Priority

### SWIFT-CONC-PERF-410 — Use task priority as scheduling intent, not throughput tuning

Task priority can influence runtime scheduling.

Do not adjust priority as the first response to poor performance.

First inspect:

- blocking
- contention
- excess work
- actor backlog
- dependency latency
- excessive task creation

Priority cannot compensate for fundamentally inefficient work.

## Priority inversion

### SWIFT-CONC-PERF-420 — Investigate resource ownership when high-priority work waits on lower-priority work

Potential relationships include:

```text
high-priority task
       ↓ waits
lock/resource
       ↑ owned
lower-priority task
```

or other dependency chains.

Do not solve the symptom by increasing every task's priority.

Understand the blocking dependency.

Use `threading.md` for synchronization-level reasoning.

## Task-local values

### SWIFT-CONC-PERF-430 — Keep propagated task context lightweight

Task-local metadata can flow through task hierarchies.

Avoid storing large object graphs or expensive mutable context solely for
convenience.

Typical task-local values should be small execution context such as:

- trace ID
- request ID
- diagnostic metadata

Do not use task locals as a performance cache.

## Allocation pressure

### SWIFT-CONC-PERF-440 — Task proliferation can create memory pressure before CPU becomes the bottleneck

Each active/suspended task retains:

- task metadata
- closure captures
- intermediate values
- continuation state
- child relationships

Large numbers of suspended tasks can consume substantial memory even if little
CPU is active.

When memory grows, inspect active task count and captured state.

Do not look only for ARC cycles.

## Captured data

### SWIFT-CONC-PERF-450 — Avoid unnecessarily retaining large values across suspension

An async operation can hold captured or local values across an `await`.

For example:

```swift
let hugeBuffer = ...
let response = await remoteOperation()
use(hugeBuffer, response)
```

may keep `hugeBuffer` alive throughout the suspension because it is still
needed afterward.

When memory is material, consider whether data can be:

- processed earlier
- reduced
- released
- moved into a narrower scope
- recreated more cheaply later

Do not contort ordinary code for negligible memory savings.

Measure representative pressure.

## Long-lived tasks

### SWIFT-CONC-PERF-460 — Long-lived tasks should not accumulate transient state indefinitely

Polling loops, observers, and service tasks can remain alive for the entire
application/session lifecycle.

Ensure each iteration releases temporary:

- buffers
- results
- child tasks
- accumulated arrays
- callback state

when no longer needed.

Do not mistake bounded task lifetime for bounded task memory.

## Result accumulation

### SWIFT-CONC-PERF-470 — Stream or group consumers should not retain every historical result unless required

For example:

```swift
var results: [Result] = []

for await value in stream {
    results.append(value)
}
```

can grow indefinitely for an infinite sequence.

Determine whether the consumer needs:

- latest value
- bounded history
- aggregate
- all results

Do not accumulate history by default.

## Error retries

### SWIFT-CONC-PERF-480 — Unbounded retry can create both load and latency problems

Retry loops can amplify failures.

Define:

- maximum attempts
- retryable errors
- delay/backoff
- cancellation
- jitter when relevant to distributed systems
- terminal failure

Do not immediately retry indefinitely at full speed.

That can overwhelm both device and service.

## Retry storms

### SWIFT-CONC-PERF-490 — Coordinate repeated callers around shared failing dependencies

If many tasks independently retry the same unavailable dependency:

```text
100 callers
  ↓
100 retry loops
```

the system may amplify an outage.

Depending on architecture, consider:

- shared state
- centralized retry
- backoff
- circuit/state coordination
- request deduplication

Do not introduce distributed-systems machinery for a small local operation
without evidence.

## Timeouts

### SWIFT-CONC-PERF-500 — A timeout does not reduce resource consumption unless losing work actually stops

A caller returning after a deadline while the underlying operation continues can
still consume:

- CPU
- network
- memory
- file handles
- server resources

When resource control matters, connect timeout to real cancellation where
possible.

Do not treat "caller stopped waiting" as equivalent to "operation stopped."

## Logging

### SWIFT-CONC-PERF-510 — Be cautious with high-volume logging inside hot concurrent paths

Logging from every:

- stream element
- actor transition
- lock acquisition
- task creation

can distort measured performance and create synchronization of its own.

Keep diagnostics sufficient for understanding behavior.

Use high-volume tracing selectively during investigation.

Do not remove required diagnostics solely for speed without evidence that they
are materially expensive.

## Continuations

### SWIFT-CONC-PERF-520 — Prefer native async APIs over unnecessary callback bridges

Custom continuation wrappers add:

- callback allocation
- state management
- cancellation integration
- error conversion

When an equivalent native async API exists, using it can simplify both behavior
and overhead.

Do not rewrite a correct callback integration merely for theoretical
continuation overhead when no native alternative exists.

## Abstraction overhead

### SWIFT-CONC-PERF-530 — Do not prematurely flatten useful abstractions

Concurrency architecture can include:

```text
controller
→ actor/service
→ async API
→ framework adapter
```

Each boundary may be semantically valuable.

Do not collapse architecture solely to remove function calls or `await`s unless
profiling demonstrates meaningful cost.

Correct ownership boundaries usually matter more than tiny call overhead.

## Avoid global serialization

### SWIFT-CONC-PERF-540 — Do not route unrelated work through one global actor/queue/lock for convenience

One global synchronization boundary can become a bottleneck.

For example:

```text
network cache ─┐
analytics     ─┼→ one global actor
image work    ─┘
```

may serialize unrelated domains.

Split ownership when the state is genuinely independent.

Do not fragment one coherent invariant merely to increase parallelism.

## Isolation granularity

### SWIFT-CONC-PERF-550 — Align isolation with state ownership boundaries

The best concurrency granularity often follows:

```text
one logical mutable state owner
→ one isolation boundary
```

Too coarse:

```text
unrelated domains serialized
```

Too fine:

```text
one invariant spread across many isolated owners
```

which can require repeated hops and complex coordination.

Optimize ownership architecture before low-level scheduling.

## Custom executors

### SWIFT-CONC-PERF-560 — Introduce custom executor behavior only for specialized requirements

Custom executor designs can sometimes improve integration with:

- framework-owned queues
- specialized scheduling
- existing execution infrastructure

They also increase complexity around:

- isolation correctness
- lifetime
- availability
- testing
- portability

Do not introduce a custom executor as a generic performance optimization.

Use it when the project has a concrete executor-level requirement.

## Thread pool assumptions

### SWIFT-CONC-PERF-570 — Do not tune Swift tasks as if each task owns a dedicated thread

Swift's concurrency runtime schedules tasks independently from a one-task/
one-thread model.

Avoid assumptions such as:

```text
100 tasks require 100 threads
```

or:

```text
Task.detached gives me a private background thread
```

Reason in terms of tasks, executors, suspension, blocking, and resource
constraints.

## Physical thread identity

### SWIFT-CONC-PERF-580 — Do not optimize around incidental thread identity

An async task can suspend and later resume according to executor/runtime
scheduling.

Thread IDs are useful diagnostics when investigating:

- blocking
- framework thread affinity
- thread explosion

They should not become the application-level ownership model unless the
underlying API is genuinely thread-affine.

## Thread explosion

### SWIFT-CONC-PERF-590 — Blocking concurrent workloads can force excessive thread growth

If many tasks enter blocking operations simultaneously, the runtime/system may
need additional threads to maintain progress.

Symptoms can include:

- high thread count
- context switching
- memory growth
- latency
- scheduler overhead

Investigate blocking dependencies rather than simply limiting task creation if
the real problem is synchronous waiting.

## Cache synchronization

### SWIFT-CONC-PERF-600 — Cache performance includes synchronization cost

A shared cache may reduce expensive computation but introduce:

- lock contention
- actor contention
- memory
- invalidation work

Measure total system cost.

A cache that avoids a cheap operation but serializes every caller can reduce
performance.

Do not add caches solely because async work appears repeated.

## Memoized async work

### SWIFT-CONC-PERF-610 — Distinguish cached values from cached in-flight operations

These solve different problems.

```text
cached value
→ reuse completed result
```

versus:

```text
cached Task
→ join currently executing operation
```

An in-flight task can prevent duplicate concurrent work without retaining
results forever.

A value cache can serve later requests without recomputation.

Choose according to actual lifecycle and freshness requirements.

## Producer allocation

### SWIFT-CONC-PERF-620 — Avoid recreating expensive producers for every stream consumer unintentionally

An API:

```swift
func events() -> AsyncStream<Event>
```

may create a new upstream resource per call.

That can be correct.

It can also accidentally duplicate:

- observers
- sockets
- polling tasks
- hardware subscriptions

when many consumers exist.

Determine whether producer cost should be:

```text
per subscriber
```

or:

```text
shared
```

Use `async-sequences.md` for multi-subscriber semantics.

## Shared producers

### SWIFT-CONC-PERF-630 — Sharing can reduce producer cost but adds coordination cost

A shared producer can avoid duplicate upstream work.

It also requires:

- subscriber registry
- synchronization
- buffering policy
- per-consumer cleanup
- startup/shutdown rules

Do not centralize a cheap producer merely to reduce a small number of
registrations.

Measure or reason from known resource cost.

## Initialization

### SWIFT-CONC-PERF-640 — Prevent duplicate expensive initialization when initialization is logically singleton per owner

Concurrent callers can race to initialize the same resource.

A correct owner can often ensure:

```text
first caller starts initialization
other callers await same initialization
```

rather than starting duplicates.

This improves both correctness and resource usage.

Do not globally singletonize resources whose lifetime should remain scoped.

## Lazy initialization

### SWIFT-CONC-PERF-650 — Make lazy concurrent initialization one coherent operation

Avoid:

```text
if resource == nil
    await build resource
    resource = result
```

without handling concurrent callers.

Several callers may all see `nil` and build duplicate resources.

Use actor/lock/task ownership or another appropriate mechanism to define
initialization concurrency.

The performance problem and the race often share one root cause.

## Duplicate side effects

### SWIFT-CONC-PERF-660 — Avoid speculative parallelism for non-idempotent operations

Running duplicate work concurrently can be dangerous and expensive for:

- uploads
- purchases
- writes
- resource creation
- persistent mutation

Do not race multiple equivalent side effects merely to use the fastest result.

Only speculative execution of safe/idempotent work should be considered, and
only when the product justifies the resource cost.

## Energy

### SWIFT-CONC-PERF-670 — Consider energy and thermal cost on client devices

Maximizing concurrent throughput can increase:

- CPU utilization
- radio/network activity
- memory
- thermal load
- battery consumption

For background or non-urgent work, lower concurrency may provide better overall
product behavior.

Do not optimize only for benchmark completion time when the application runs on
resource-constrained mobile hardware.

## Latency versus throughput

### SWIFT-CONC-PERF-680 — Know which metric the operation optimizes

These goals differ:

```text
lowest latency for one request
highest throughput across many requests
lowest memory
lowest energy
UI responsiveness
```

A design optimized for maximum throughput can harm interactive latency.

A design optimized for one request can overwhelm the system at scale.

Choose based on the product workload.

## Backpressure

### SWIFT-CONC-PERF-690 — Add backpressure where resource production must respond to consumer capacity

If producers can generate work indefinitely while consumers fall behind,
buffering only delays the problem.

Depending on the abstraction, backpressure can mean:

- producer awaits capacity
- bounded work queue
- request admission control
- rate limiting
- chunked production

Do not call dropping events "backpressure" unless production itself is being
regulated.

## Benchmarking

### SWIFT-CONC-PERF-700 — Benchmark representative workloads

Concurrency behavior can change significantly with:

- input size
- device hardware
- number of simultaneous operations
- network latency
- framework implementation
- debug versus optimized builds

Use representative workloads.

Do not conclude a concurrency architecture scales because a benchmark used one
small operation.

## Warm versus cold behavior

### SWIFT-CONC-PERF-710 — Distinguish initialization cost from steady-state cost

First execution may include:

- lazy initialization
- caches
- framework startup
- connection setup
- model loading

Repeated execution may behave differently.

When measuring a hot path, decide whether the product concern is:

```text
cold start
```

or:

```text
steady state
```

Do not mix them into one number without interpretation.

## Instrumentation overhead

### SWIFT-CONC-PERF-720 — Account for diagnostic tooling when interpreting results

Race detection, sanitizers, extensive logging, debug builds, and profiling can
change concurrent scheduling and timing.

Use them to identify behavior, but interpret absolute performance numbers under
the relevant configuration.

Do not use sanitizer-enabled timings as production performance baselines.

## Signposts and tracing

### SWIFT-CONC-PERF-730 — Instrument semantic operations, not every suspension

Useful measurement boundaries can include:

```text
request start → result
import start → completion
actor queueing delay
media operation start → finish
stream processing batch
```

Prefer semantic intervals over manually timing every `await`.

The goal is to locate the expensive stage.

## Optimize the root cause

### SWIFT-CONC-PERF-740 — Prefer eliminating unnecessary work over scheduling it more aggressively

The largest improvement often comes from:

```text
do less work
```

rather than:

```text
execute same work concurrently
```

Examples include:

- deduplicate requests
- reduce data size
- avoid repeated parsing
- avoid repeated fetch
- cache appropriate results
- suppress obsolete operations
- batch work

Do not reach for parallelism before checking whether the work is necessary.

## Avoid micro-optimizing concurrency syntax

### SWIFT-CONC-PERF-750 — Source-level brevity does not predict runtime efficiency

Do not optimize based on preferences such as:

```text
fewer Task objects looks faster
fewer awaits looks faster
actor looks slower than lock
lock looks slower than atomic
```

These claims require workload context.

Choose architecture from ownership/correctness and measure performance under
representative conditions.

## Performance regressions after migration

### SWIFT-CONC-PERF-760 — Compare behavior before and after concurrency migrations

A migration from:

```text
queue → actor
callback → async/await
lock → actor
operation queue → task group
```

can change:

- serialization
- scheduling
- ordering
- parallelism
- allocation
- memory
- latency

If performance is important, compare equivalent representative workloads before
and after.

Do not assume modern concurrency syntax preserves performance characteristics
automatically.

## Actor migration

### SWIFT-CONC-PERF-770 — Watch for accidental global serialization when adopting actors

A migration can accidentally move previously independent operations behind one
actor.

For example:

```text
resource A
resource B
resource C
```

previously independent, but now:

```text
global ResourceActor
```

serializes all three.

This may be correct if state is actually shared.

If state is independent, split ownership accordingly.

Do not split actors solely for performance if they jointly protect one invariant.

## Queue migration

### SWIFT-CONC-PERF-780 — Preserve framework-specific queue efficiency when adopting Swift Concurrency

Some frameworks already provide optimized queue-confined execution.

An actor wrapper that repeatedly hops:

```text
actor
 ↓
framework queue
 ↓
actor
 ↓
framework queue
```

can add coordination without changing underlying serialization.

Keep the framework boundary clear.

Do not layer concurrency abstractions redundantly unless they protect different
state.

## Testing performance

### SWIFT-CONC-PERF-790 — Separate deterministic correctness tests from performance measurements

A concurrency correctness test should not normally assert:

```text
operation completes under 20 ms
```

because scheduler and CI variation can make it fragile.

Use dedicated performance/benchmark tests for latency and throughput.

Correctness tests should prove:

- ordering
- cancellation
- final state
- resource limits

without depending on exact timing unless timing is the contract.

## Concurrency-limit tests

### SWIFT-CONC-PERF-800 — Test bounded concurrency structurally

When maximum concurrency is an intentional contract, a test can use a controlled
dependency that records:

```text
active operations
maximum observed active operations
```

while operations remain suspended.

Then verify the maximum does not exceed the intended limit.

This is more deterministic than measuring how many operations happen to overlap
under normal scheduling.

## Performance test inputs

### SWIFT-CONC-PERF-810 — Use realistic input volume

Task overhead that is irrelevant for:

```text
10 elements
```

may dominate:

```text
100,000 elements
```

Actor contention visible under:

```text
1 caller
```

may emerge under:

```text
100 concurrent callers
```

Match tests/benchmarks to expected production scale.

## Review checklist

When concurrency performance changes, verify when applicable:

- correctness and ownership remain primary
- the performance problem has evidence or a clear structural cause
- async boundaries are not being treated as automatic speed improvements
- independent work is concurrent only when overlap provides real value
- dependent work remains ordered
- task creation granularity is appropriate for workload cost
- large task groups do not create uncontrolled fan-out
- concurrency limits follow actual constrained resources
- expensive independent work does not unnecessarily occupy actor isolation
- repeated actor hops are reduced only when operations form one coherent
  boundary
- MainActor does not contain unrelated expensive synchronous work
- blocking operations are distinguished from suspension
- lock/queue contention is measured before replacing synchronization mechanisms
- critical sections include only the coherent protected invariant
- duplicate expensive work is joined, coalesced, or cancelled when semantics
  permit it
- stale-result protection is paired with cancellation when obsolete work is
  expensive
- CPU-bound workloads do not create excessive parallelism
- I/O concurrency respects downstream limits
- batching preserves required latency, ordering, failure, and cancellation
  semantics
- stream producers cannot grow buffers indefinitely because consumers are slow
- high-frequency streams do not spawn uncontrolled tasks
- task priority is not being used to compensate for architectural contention
- suspended tasks are not retaining excessive data or creating memory pressure
- retry loops are bounded and do not amplify failures
- timeout behavior actually stops underlying work when resource control requires
  it
- global isolation does not serialize unrelated domains accidentally
- custom executors are introduced only for concrete specialized needs
- performance measurements distinguish latency, throughput, memory, energy, and
  responsiveness
- profiling uses representative workloads and configurations
- performance improvements reduce unnecessary work before increasing scheduling
  complexity
- correctness tests and performance benchmarks remain separate

Do not treat more tasks, more parallelism, fewer `await`s, fewer locks, actors,
detached tasks, or faster local execution as proof of better Swift concurrency
performance.