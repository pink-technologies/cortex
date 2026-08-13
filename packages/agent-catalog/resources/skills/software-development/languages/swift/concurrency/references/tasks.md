# Swift Tasks

Use this reference when the task materially affects Swift `Task`, task handles,
structured child tasks, task groups, unstructured tasks, detached tasks,
cancellation, priority, task lifetime, task ownership, or task result
propagation.

This reference focuses on creating, owning, and coordinating units of
asynchronous work.

Use:

- `async-await-basics.md` for suspension, `async let`, sequential versus
  concurrent async work, and fundamental async/await semantics.
- `actors.md` for actor isolation and reentrancy.
- `sendable.md` for values crossing isolation boundaries.
- `memory-management.md` for deeper ownership and retain-cycle analysis.
- `testing.md` for deterministic concurrency testing.
- `performance.md` for task creation, fan-out, contention, and concurrency
  performance.
- the applicable framework skill for framework-owned task lifecycles such as
  SwiftUI view tasks.

Project-specific Swift language mode, isolation configuration, runtime
architecture, and task-management conventions take precedence over this generic
guidance.

## Task baseline

### SWIFT-CONC-TASK-001 — Give every unstructured task an intentional owner

A task created with:

```swift
Task {
    ...
}
```

creates asynchronous work whose lifetime is not automatically bounded by the
lexical scope that created it.

Before creating an unstructured task, determine:

- why a new task is required
- who owns it
- whether duplicate tasks are allowed
- who may cancel it
- whether its result matters
- where its error goes
- when its work becomes stale
- whether it may outlive the caller

Do not use `Task { ... }` merely as syntax for calling an async function.

When work naturally belongs to an existing async operation, prefer structured
concurrency.

## Entering async work

### SWIFT-CONC-TASK-010 — Use `Task` when a synchronous boundary genuinely needs to initiate asynchronous work

A synchronous entry point cannot directly `await`.

For example:

```swift
func refresh() {
    refreshTask = Task {
        await performRefresh()
    }
}
```

can be appropriate when the synchronous API intentionally starts an
asynchronous lifecycle.

Creating the task also creates ownership responsibility.

Do not hide that responsibility behind:

```swift
Task {
    await operation()
}
```

without deciding what happens when:

- `refresh()` is called again
- the owner disappears
- the operation fails
- the operation must stop
- a newer request supersedes it

### SWIFT-CONC-TASK-011 — Do not create a Task when the current context can already await

Inside an existing async function, prefer:

```swift
let value = try await operation()
```

over:

```swift
let task = Task {
    try await operation()
}

let value = try await task.value
```

when the new task provides no independent ownership or concurrency requirement.

The latter introduces an unnecessary unstructured task boundary.

Create a task because the work needs a distinct task lifetime, not merely
because the operation is asynchronous.

## Task handles

### SWIFT-CONC-TASK-020 — Retain a task handle when the owner needs lifecycle control

A task handle allows the owning boundary to:

- cancel work
- await completion
- retrieve a result
- coordinate replacement
- track an active operation

For example:

```swift
final class Loader {
    private var loadTask: Task<Value, Error>?

    func load() {
        loadTask?.cancel()

        loadTask = Task {
            try await loadValue()
        }
    }

    func cancel() {
        loadTask?.cancel()
        loadTask = nil
    }
}
```

Storing a handle is not universally required.

Retain one when the surrounding architecture needs explicit task ownership.

### SWIFT-CONC-TASK-021 — Dropping a task handle does not mean cancelling the task

Do not assume:

```swift
Task {
    await work()
}
```

is automatically cancelled because no handle is retained.

An unstructured task can continue executing after the caller loses its handle.

Therefore:

```text
no stored handle
```

does not mean:

```text
no lifecycle responsibility
```

Fire-and-forget work must still have intentional:

- lifetime
- failure handling
- resource ownership
- stale-result behavior

## Structured versus unstructured work

### SWIFT-CONC-TASK-030 — Prefer structured concurrency when child work belongs to the parent operation

Structured concurrency expresses:

```text
parent operation
    ↓
child work
    ↓
parent cannot complete until child lifetime is resolved
```

Common mechanisms include:

```text
async let
task groups
```

Use structured concurrency when child work:

- exists only to serve the parent operation
- should not intentionally outlive it
- participates in parent cancellation
- contributes to the parent's result or side effects

Structured lifetime makes cancellation, error propagation, and completion easier
to reason about.

### SWIFT-CONC-TASK-031 — `Task {}` is unstructured even when created inside another task

Do not assume:

```swift
Task {
    Task {
        await childWork()
    }
}
```

creates the same parent-child relationship as:

```swift
async let child = childWork()
```

or:

```swift
await withTaskGroup { group in
    group.addTask {
        await childWork()
    }
}
```

A `Task {}` creates unstructured work.

It can inherit context from where it is created, but its lifetime is not
structured as a lexical child operation in the same way as `async let` or a
task-group child.

If cancellation and completion should follow the parent operation
automatically, use structured concurrency.

## Unstructured tasks

### SWIFT-CONC-TASK-040 — Use unstructured tasks for independently owned asynchronous lifecycles

An unstructured task can be appropriate when work belongs to an owner rather
than one lexical async call.

Examples can include:

```text
controller-owned operation
service-owned listener
session-owned observation
replaceable request
application-level worker
```

In these cases, store or otherwise explicitly manage the task according to that
owner's lifecycle.

Do not confuse:

```text
unstructured
```

with:

```text
unmanaged
```

Unstructured tasks need stronger ownership reasoning precisely because the
compiler does not impose the same lexical lifetime as structured children.

### SWIFT-CONC-TASK-041 — Define duplicate-task behavior

When an operation can start more than once, determine whether new work should:

```text
coexist
replace
cancel previous
join existing
deduplicate
serialize
```

For example, replaceable work may use:

```swift
task?.cancel()

task = Task {
    await refresh()
}
```

But cancellation alone does not guarantee the previous operation has already
stopped.

If stale results matter, the implementation may also need:

- request identity
- generation checking
- state revalidation
- serialization

Do not assume replacing the stored task handle makes the old task unable to
commit state.

## Task ownership

### SWIFT-CONC-TASK-050 — Align task lifetime with semantic ownership

A task should normally be owned by the component whose behavior it performs.

For example:

```text
session owns session observation task
controller owns controller operation task
service owns long-lived polling task
request owns structured child work
```

Avoid storing unrelated tasks in a general-purpose global task bag merely
because they all support cancellation.

A collection of tasks can be useful when they genuinely share one owner and
lifecycle.

### SWIFT-CONC-TASK-051 — Define terminal task cleanup

When a stored task completes, determine whether the owner should clear its
handle.

For example:

```swift
task = Task { [weak self] in
    defer {
        // Clear through the appropriate isolation boundary when needed.
    }

    ...
}
```

may be appropriate when the handle represents only currently active work.

Do not clear a replacement task accidentally when an older task finishes after
newer work has started.

When replacement can occur, use identity or another ownership mechanism to
ensure one task cannot clear another task's state.

## Task captures

### SWIFT-CONC-TASK-060 — Do not use weak captures mechanically

A task capturing its owner strongly is not automatically wrong.

Ask:

```text
Should the operation keep the owner alive until it completes?
```

If yes, a strong capture can be intentional.

If the operation should terminate when the owner disappears, the lifetime must
be designed accordingly.

Do not add:

```swift
[weak self]
```

solely because a closure is asynchronous.

### SWIFT-CONC-TASK-061 — A weak capture does not by itself solve task lifetime

For example:

```swift
Task { [weak self] in
    guard let self else {
        return
    }

    await longRunningOperation()
}
```

promotes `self` to a strong reference for the lifetime of that scope.

If the operation can run indefinitely, the object may still remain alive.

Likewise:

```swift
while let self {
    await nextValue()
}
```

can accidentally retain the owner across each suspension depending on the
structure of the loop.

Reason about:

```text
owner
→ stored task
→ task closure
→ owner
```

and the actual task termination path.

Use `memory-management.md` for deeper lifetime analysis.

## Stored task cycles

### SWIFT-CONC-TASK-070 — Distinguish finite retention from an indefinite cycle

A stored task may temporarily create:

```text
owner
  ↓
task
  ↓
owner
```

If the task is guaranteed to finish promptly and release its closure, the
retention may be intentional and bounded.

If the task can:

- wait indefinitely
- consume an infinite sequence
- poll forever
- remain suspended permanently

then the cycle can retain the owner indefinitely.

Do not report every stored task capturing `self` as a leak.

Establish whether there is a terminal path that actually breaks the ownership
chain.

## Cancellation

### SWIFT-CONC-TASK-080 — Cancellation is cooperative

Calling:

```swift
task.cancel()
```

marks the task as cancelled.

It does not forcibly terminate arbitrary Swift code.

The task and the asynchronous operations it awaits must cooperate with
cancellation.

Possible mechanisms include:

```swift
try Task.checkCancellation()
```

or:

```swift
guard !Task.isCancelled else {
    return
}
```

or calling cancellation-aware child APIs.

Do not assume:

```text
cancel requested
=
task has already stopped
```

### SWIFT-CONC-TASK-081 — Check cancellation at meaningful boundaries

Useful cancellation checkpoints may occur:

- before expensive work
- after a long suspension
- before committing a result
- before beginning another expensive stage
- while processing a long loop
- before irreversible or consumer-visible side effects

For example:

```swift
func process() async throws -> Output {
    try Task.checkCancellation()

    let data = try await loadData()

    try Task.checkCancellation()

    return try transform(data)
}
```

Do not add cancellation checks after every trivial statement.

The checkpoint should protect an actual operation invariant or avoid meaningful
unwanted work.

## Cancellation result

### SWIFT-CONC-TASK-090 — Define what cancellation means to the operation

Cancellation can produce different legitimate contracts.

For example:

```text
throw CancellationError
return without updating state
return partial result
finish stream
perform cleanup then terminate
```

Choose according to the owning API.

Do not accidentally convert cancellation into:

```text
generic failure
```

if callers distinguish the two.

Do not swallow cancellation and continue committing state when cancellation
should terminate the operation.

## Parent and child cancellation

### SWIFT-CONC-TASK-100 — Structured children participate in parent cancellation

Structured child work created through constructs such as:

```text
async let
task group child
```

belongs to the enclosing operation.

When the parent operation is cancelled, cancellation is propagated through that
structured task tree.

Children still participate cooperatively.

Do not assume every operation instantly terminates at the moment cancellation
is signalled.

### SWIFT-CONC-TASK-101 — Do not assume cancellation automatically propagates into unrelated unstructured tasks

An unstructured:

```swift
Task {
    ...
}
```

does not become a structured child merely because another task created it.

If the new task must stop with another owner's cancellation, connect that
lifecycle explicitly or use structured concurrency instead.

This distinction is particularly important when code refactors:

```text
async let
```

into:

```text
Task { ... }
```

because the lifetime semantics change.

## Cancellation and stale work

### SWIFT-CONC-TASK-110 — Cancellation alone may not prevent stale commits

Consider:

```text
task A starts
task A is cancelled
task B starts
task A ignores cancellation
task A finishes later
```

If A can still mutate state, simply calling:

```swift
taskA.cancel()
```

is insufficient.

When stale work can violate correctness, combine cancellation with an
appropriate authoritative check such as:

- task identity
- generation identifier
- state validation
- request token
- isolation-bound replacement state

Cancellation communicates intent.

Authoritative state determines whether the result may still commit.

## Cancellation handlers

### SWIFT-CONC-TASK-120 — Use cancellation handlers for cleanup that must react to cancellation

When cancellation requires explicit cleanup or signalling to another subsystem,
use the language's cancellation-handler mechanism where appropriate.

Conceptually:

```text
task cancellation
      ↓
cancellation handler
      ↓
cancel underlying operation / release owned resource
```

The handler should perform cancellation-safe cleanup.

Do not use a cancellation handler as a substitute for normal `defer` cleanup
that must occur on every terminal path.

Use:

```text
defer
```

for unconditional scope cleanup.

Use cancellation-specific handling for work specifically triggered by
cancellation.

## Task results

### SWIFT-CONC-TASK-130 — Await task results when the caller depends on completion

A task handle exposes completion through its result/value API.

For example:

```swift
let task = Task {
    try await loadValue()
}

let value = try await task.value
```

Awaiting the task establishes:

```text
caller
    ↓ depends on
task completion
```

Do not create a task and immediately await its value when no independent task
lifetime or concurrency is needed.

In that case, call the async operation directly.

### SWIFT-CONC-TASK-131 — Do not discard meaningful task failures

A throwing task whose result is never observed can lose an error that the
system expected someone to handle.

For example:

```swift
Task {
    try await upload()
}
```

requires an intentional answer to:

```text
Who owns upload failure?
```

Possible contracts include:

- caller awaits the handle
- task catches and reports the error
- owner transitions state
- telemetry records terminal failure
- failure is explicitly irrelevant

Do not silently discard a meaningful failure because the task is
fire-and-forget.

## Task groups

### SWIFT-CONC-TASK-140 — Use a task group for a dynamic set of structured child operations

A task group is useful when the number of child operations is determined at
runtime.

For example:

```swift
let results = await withTaskGroup(
    of: Result.self,
    returning: [Result].self
) { group in
    for item in items {
        group.addTask {
            await process(item)
        }
    }

    var results: [Result] = []

    for await result in group {
        results.append(result)
    }

    return results
}
```

All group children belong to the task-group scope.

Use `async let` when a small fixed number of children is known statically and a
group provides no additional value.

### SWIFT-CONC-TASK-141 — Keep task-group mutation within its owning scope

The task-group value represents structured task management for the closure in
which it exists.

Do not pass the group to unrelated concurrent work and mutate it from arbitrary
tasks.

Add, cancel, and consume group tasks through the scope that owns the group.

The child operations may execute concurrently.

The group itself remains part of one structured orchestration boundary.

## Throwing task groups

### SWIFT-CONC-TASK-150 — Observe child errors through the group contract

For throwing child operations:

```swift
try await withThrowingTaskGroup(of: Value.self) { group in
    for input in inputs {
        group.addTask {
            try await process(input)
        }
    }

    for try await value in group {
        consume(value)
    }
}
```

child failures become observable as the group results are consumed.

Do not assume the presence of `withThrowingTaskGroup` alone defines the
application's complete failure semantics.

Decide whether the operation should:

- stop on first observed error
- collect independent failures
- convert each child result into `Result`
- cancel remaining work
- allow partial success

according to the parent operation's contract.

### SWIFT-CONC-TASK-151 — Do not assume cancellation means siblings have already stopped

When a throwing group or the parent cancels remaining children, cancellation is
still cooperative.

A child performing cancellation-insensitive work can continue until it reaches
a cancellation-aware boundary or completes naturally.

Do not design resource ownership around the assumption that `cancelAll()` is
instantaneous termination.

## Task-group result ordering

### SWIFT-CONC-TASK-160 — Group results follow completion, not submission, unless you restore ordering explicitly

Consider:

```swift
for item in items {
    group.addTask {
        await process(item)
    }
}
```

Iterating the group's results should not be assumed to reproduce `items` order.

If the consumer requires original ordering, attach an index or identity:

```swift
let indexed = await withTaskGroup(
    of: (Int, Value).self,
    returning: [(Int, Value)].self
) { group in
    for (index, item) in items.enumerated() {
        group.addTask {
            (index, await process(item))
        }
    }

    var values: [(Int, Value)] = []

    for await value in group {
        values.append(value)
    }

    return values
}

let ordered = indexed
    .sorted { $0.0 < $1.0 }
    .map(\.1)
```

Do not accidentally make completion order part of the consumer contract.

## Bounded concurrency

### SWIFT-CONC-TASK-170 — Do not create unbounded child-task fan-out for large workloads

This:

```swift
for item in millionsOfItems {
    group.addTask {
        await process(item)
    }
}
```

can create excessive:

- task overhead
- memory pressure
- downstream concurrency
- network requests
- database contention

when the input is large.

When the workload is meaningfully unbounded or large, use a controlled
concurrency strategy.

Possible approaches include:

- bounded task-group scheduling
- chunking
- worker tasks
- an async semaphore or rate limiter provided by the project
- domain-specific batching

Do not add a concurrency limit mechanically for a small bounded collection.

Match concurrency to the resource being consumed.

## Adding tasks conditionally

### SWIFT-CONC-TASK-180 — Stop creating new group work when cancellation makes it irrelevant

When a task group is already cancelled, creating additional expensive child
work may be unnecessary.

Use cancellation-aware group APIs or explicit checks when this materially
avoids work.

Do not rely solely on the child eventually noticing cancellation if thousands
of additional tasks would otherwise be created.

## Discarding task groups

### SWIFT-CONC-TASK-190 — Use discarding task groups when child results are intentionally irrelevant

A discarding task group can be useful when:

```text
structured child lifetime matters
+
individual result values do not
```

For example, several independent side effects may all need to complete before
the parent operation finishes.

The group still provides structured lifetime.

"Discarding" means the result values do not need collection.

It does not mean:

```text
fire and forget
```

The parent scope still owns the child work.

### SWIFT-CONC-TASK-191 — Preserve error semantics for throwing discarding groups

When child side effects can fail, use the throwing form if failure should
terminate or fail the parent operation.

Do not choose a nonthrowing discarding group merely because there are no return
values.

Result-value ownership and error ownership are separate concerns.

## `Task.detached`

### SWIFT-CONC-TASK-200 — Use detached tasks only when independence is intentional

A detached task deliberately separates work from significant surrounding task
context.

Use it only when the operation should not rely on inherited surrounding actor
isolation or structured task lifetime.

Typical reasons may include work that is genuinely independent from the
initiating actor or request.

Do not use:

```swift
Task.detached {
    ...
}
```

merely as a way to:

- "move work off the main thread"
- silence actor-isolation diagnostics
- bypass `Sendable` errors
- escape an inconvenient actor boundary
- obtain more parallelism

Those are signs that the underlying isolation or execution design should be
understood first.

### SWIFT-CONC-TASK-201 — Detached tasks intentionally lose surrounding context

When choosing `Task.detached`, account for the task context that is no longer
implicitly inherited in the same way as an ordinary `Task` created from the
current context.

This can include concerns such as:

- actor isolation
- task-local values
- priority inheritance
- cancellation relationship
- structured lifetime

Specify or reconstruct required context intentionally.

Do not assume a detached task behaves like:

```swift
Task {
    ...
}
```

except on another thread.

## Detached task ownership

### SWIFT-CONC-TASK-210 — Detached does not mean ownerless

Even genuinely detached work needs a system-level owner.

Ask:

- who observes failure?
- what stops the operation?
- how long may it run?
- what resources does it retain?
- what happens during shutdown?
- can the work be duplicated?
- can it mutate state that has since been replaced?

A detached task with no answer to those questions is unmanaged background work.

## Task priorities

### SWIFT-CONC-TASK-220 — Treat priority as scheduling intent, not correctness

Task priority communicates the relative importance of work to the concurrency
runtime.

Do not make correctness depend on:

```text
higher priority task executes first
```

Priority is not an ordering mechanism.

If operation A must happen before operation B, encode that dependency
explicitly.

### SWIFT-CONC-TASK-221 — Prefer inherited/default priority unless the product has a meaningful reason to override it

Set explicit priority when the operation's urgency differs materially from its
surrounding context.

Examples can include:

- immediate user-triggered work
- utility/background processing
- prefetching

Do not annotate every task with a priority.

Over-specifying priority can make scheduling intent harder to maintain and can
fight runtime priority propagation.

### SWIFT-CONC-TASK-222 — Do not use priority to solve isolation or starvation bugs blindly

When a task appears slow, first determine whether the cause is:

- blocking synchronous work
- actor contention
- serialization
- excessive fan-out
- external I/O
- lock contention
- priority inversion
- unrelated resource limits

Increasing priority does not fix those causes automatically.

Use `performance.md` and `threading.md` when execution behavior requires deeper
analysis.

## Task-local values

### SWIFT-CONC-TASK-230 — Treat task-local values as scoped execution context

Task-local values are appropriate for context that should flow through a task
hierarchy rather than become ordinary mutable global state.

Examples can include contextual metadata such as:

```text
request identifier
trace identifier
operation metadata
```

when the architecture deliberately uses task-local propagation.

Do not use task-local values as a hidden dependency mechanism for core business
state.

Important behavior should remain understandable from the owning API and
architecture.

### SWIFT-CONC-TASK-231 — Account for task boundaries when relying on task-local values

Structured children and ordinary unstructured tasks can preserve different
pieces of surrounding task context from detached work.

Do not introduce `Task.detached` into code that relies on task-local metadata
without verifying whether that context must be propagated explicitly.

## `Task.sleep`

### SWIFT-CONC-TASK-240 — Use task sleep for intentional suspension, not synchronization guesses

A task sleep can express actual time-based behavior such as:

- debounce interval
- retry delay
- polling interval
- rate limit
- timeout competitor

For example:

```swift
try await Task.sleep(for: .milliseconds(300))
```

when supported by the project's deployment environment.

Do not use sleep to wait for another asynchronous operation that has a real
completion signal.

Avoid:

```swift
try await Task.sleep(for: .seconds(1))
// Assume background work is done now.
```

Use deterministic operation completion instead.

### SWIFT-CONC-TASK-241 — Account for cancellation when sleeping

Cancellation-aware task sleep can terminate by throwing when the sleeping task
is cancelled.

Do not broadly catch and ignore the error if cancellation should terminate the
owning operation.

For a debounce operation, cancellation may intentionally mean:

```text
new request replaced old request
→ old debounce ends silently
```

That contract should be explicit.

## `Task.yield`

### SWIFT-CONC-TASK-250 — Treat `Task.yield()` as a scheduling hint, not deterministic synchronization

`Task.yield()` gives other eligible work an opportunity to run.

It does not guarantee:

- which task runs next
- how many other tasks run
- that a particular callback completes
- that one actor reaches a desired state
- deterministic test ordering

Do not use repeated `yield()` calls as a replacement for explicit
synchronization.

It can be appropriate when a cooperative algorithm deliberately wants to give
other work scheduling opportunity.

### SWIFT-CONC-TASK-251 — Avoid using `yield()` to repair flaky tests

A test such as:

```swift
await Task.yield()
await Task.yield()
await Task.yield()
```

does not establish a deterministic concurrency contract.

If correctness depends on ordering, control the relevant suspension or event
explicitly.

Use `testing.md` for appropriate synchronization patterns.

## Timeout patterns

### SWIFT-CONC-TASK-260 — A timeout is a race between operation and deadline with explicit cancellation semantics

A structured timeout can conceptually race:

```text
operation
    ↘
      first terminal result
    ↗
deadline
```

For example, a task-group-based implementation may start:

- the real operation
- a timeout child

then use the first terminal result and cancel the remaining child.

However, the timeout contract must account for cooperative cancellation.

### SWIFT-CONC-TASK-261 — Structured timeout cannot forcibly terminate cancellation-insensitive child work

This is a critical property.

Even if a timeout child wins and the group calls:

```swift
group.cancelAll()
```

structured concurrency must still resolve the lifetime of the remaining child
before the task-group scope can fully finish.

Therefore, if the timed operation ignores cancellation or blocks in
non-cancellable work, a task-group timeout may not return at the desired
deadline.

Do not advertise a helper as a strict timeout unless the underlying operation
can actually honor the required cancellation semantics.

### SWIFT-CONC-TASK-262 — Distinguish timeout from cancellation

A caller may need to distinguish:

```text
caller cancelled operation
```

from:

```text
operation exceeded deadline
```

If the API owns a timeout error, preserve that distinction.

Do not convert all cancellation into timeout or all timeout into generic
cancellation.

## Polling

### SWIFT-CONC-TASK-270 — Give polling tasks termination conditions

A polling loop such as:

```swift
while !Task.isCancelled {
    await refresh()
    try await Task.sleep(for: interval)
}
```

needs an explicit lifetime.

Determine:

- who owns the polling task
- who cancels it
- what happens on transient failure
- whether backoff is required
- whether polling can overlap itself
- how application shutdown/teardown ends it

Do not create an infinite polling task without a reliable cancellation path.

## Long-running loops

### SWIFT-CONC-TASK-280 — Add cooperative cancellation to boundedly long synchronous work

A task executing a long CPU loop without suspension may need explicit
cancellation checks.

For example:

```swift
for item in items {
    try Task.checkCancellation()
    process(item)
}
```

can be appropriate when each iteration is expensive enough that cancellation
otherwise would be delayed materially.

Do not add a cancellation check to every tiny iteration of a hot loop without
considering its cost.

Choose a meaningful granularity.

## Task replacement

### SWIFT-CONC-TASK-290 — Protect replacement state from older task completion

Consider an owner storing:

```swift
var task: Task<Void, Never>?
```

and replacing it:

```swift
task?.cancel()
task = Task {
    await work()
}
```

An older task may still reach its cleanup after the new task has been stored.

Avoid:

```swift
defer {
    task = nil
}
```

when the old task could clear the handle belonging to the replacement task.

Use task identity, generation state, or another isolation-safe ownership check.

This same principle applies to:

- loading indicators
- active request identifiers
- terminal state
- cached results

## One terminal result

### SWIFT-CONC-TASK-300 — Ensure task-owned operations reach one coherent terminal state

When a task represents an operation with lifecycle state, competing paths can
include:

```text
success
failure
cancellation
replacement
timeout
owner teardown
```

Do not allow more than one path to publish contradictory terminal outcomes.

Centralize or coordinate terminal mutation through the authoritative owner.

A task finishing does not by itself define what the surrounding component's
state should become.

## Task cleanup

### SWIFT-CONC-TASK-310 — Clean up resources on every relevant terminal path

Task-owned resources can include:

- subscriptions
- observations
- files
- streams
- continuation registrations
- temporary resources
- child processes
- framework operations

Use `defer` when cleanup must happen regardless of success, error, or
cancellation.

Use cancellation handlers when cancellation specifically needs to signal an
underlying operation.

Do not rely exclusively on task deallocation as cleanup.

## Avoid Task as a synchronization primitive

### SWIFT-CONC-TASK-320 — Do not use task creation itself to serialize shared state

This:

```swift
Task {
    mutateState()
}
```

does not establish an authoritative serialization boundary merely because the
task contains one operation.

Multiple tasks can overlap.

Shared mutable state still needs appropriate isolation through:

- actor
- global actor
- lock
- serial executor/boundary
- another project-specific synchronization mechanism

Use `actors.md` or `threading.md` for deeper isolation reasoning.

## Avoid unnecessary task nesting

### SWIFT-CONC-TASK-330 — Do not nest tasks without a distinct lifetime reason

Avoid:

```swift
Task {
    await first()

    Task {
        await second()
    }
}
```

when `second()` belongs to the first operation.

Prefer:

```swift
Task {
    await first()
    await second()
}
```

or structured child concurrency when overlap is required.

The nested unstructured task changes:

- completion
- error
- cancellation
- actor/context
- lifetime

semantics.

Create that boundary only intentionally.

## Avoid task proliferation

### SWIFT-CONC-TASK-340 — Do not use one task per trivial operation by default

Creating tasks has runtime and reasoning cost.

Avoid architectures where every:

```text
property update
callback
event
small helper
```

creates a new unstructured task simply to cross asynchronous code.

Task creation can:

- alter ordering
- lose caller cancellation
- create stale work
- broaden lifetime
- increase scheduling overhead

Use the current async context or established serialization boundary when
possible.

## Framework-owned tasks

### SWIFT-CONC-TASK-350 — Prefer framework lifecycle mechanisms when they express the required ownership

Some frameworks provide task APIs that tie work to framework lifecycle.

When such an API is materially involved, load the applicable framework skill
and use its lifecycle semantics.

Do not duplicate framework-owned cancellation with a second independent task
owner unless the design requires additional control.

This generic reference intentionally does not define framework-specific
mechanisms such as SwiftUI view task behavior.

## Error handling

### SWIFT-CONC-TASK-360 — Handle errors at the task ownership boundary

For:

```swift
Task<Value, Error>
```

determine who consumes the error.

Possible designs include:

```text
caller awaits task.value
task translates failure into owner state
task reports failure through an event
task handles a deliberately ignorable error
```

Do not wrap every throwing operation inside:

```swift
Task {
    try? await operation()
}
```

merely to satisfy the compiler.

Suppressed errors should be intentionally irrelevant to the operation's
contract.

## Task groups versus many unstructured tasks

### SWIFT-CONC-TASK-370 — Prefer task groups when dynamically created work belongs to one operation

Compare:

```swift
var tasks: [Task<Value, Error>] = []

for item in items {
    tasks.append(
        Task {
            try await process(item)
        }
    )
}
```

with:

```swift
try await withThrowingTaskGroup(of: Value.self) { group in
    for item in items {
        group.addTask {
            try await process(item)
        }
    }

    ...
}
```

When all work belongs to one parent operation, the task group communicates that
ownership directly.

A collection of unstructured task handles is appropriate when each task truly
has an independently managed lifetime.

Do not use the less structured form merely because it appears simpler locally.

## Validation checklist

When task behavior changes, verify when applicable:

- a new task boundary is actually necessary
- unstructured tasks have explicit semantic ownership
- dropping a task handle is not being mistaken for cancellation
- repeated operations define replace/coexist/join/serialize behavior
- structured child work uses `async let` or task groups when appropriate
- `Task {}` is not incorrectly treated as a structured child task
- task handles are retained when cancellation or completion control is required
- stored tasks cannot clear or overwrite replacement-task state
- captures reflect intended owner lifetime
- stored-task ownership cycles have bounded or explicit termination
- cancellation is treated as cooperative
- cancellation checks exist at meaningful boundaries when needed
- stale cancelled work cannot commit newer-invalid state
- meaningful task errors are observed or intentionally handled
- task-group result ordering is not assumed to match submission order
- large task groups do not create uncontrolled fan-out
- detached tasks are used only for intentionally independent work
- detached tasks are not being used to bypass actor or `Sendable` diagnostics
- priority is not being used as an ordering mechanism
- task-local context is preserved or intentionally absent across boundaries
- `Task.sleep` expresses actual time behavior rather than synchronization guesswork
- `Task.yield` is not being used as deterministic synchronization
- timeout helpers account for cooperative cancellation
- polling and long-running tasks have termination ownership
- task nesting does not accidentally change lifetime semantics
- framework lifecycle tasks defer to the appropriate framework-specific guidance
- tests exercise task completion and ordering deterministically

Do not treat the presence of `Task`, `cancel()`, a task handle, or a task group
as evidence that lifecycle, cancellation, ordering, isolation, and error
ownership are correct.