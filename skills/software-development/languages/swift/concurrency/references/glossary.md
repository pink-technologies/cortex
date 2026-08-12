# Swift Concurrency Glossary

Use this reference when Swift Concurrency terminology needs to be interpreted
consistently during implementation, debugging, migration, testing, or review.

This reference defines the vocabulary used by the Swift Concurrency skill and
its references.

It is not a replacement for the detailed behavioral guidance in:

- `async-await-basics.md`
- `tasks.md`
- `actors.md`
- `sendable.md`
- `threading.md`
- `async-sequences.md`
- `memory-management.md`
- `testing.md`
- `performance.md`
- `migration.md`
- `linting.md`

Project-specific terminology can extend these definitions when it does not
change the underlying Swift semantics.

## Async function

A function declared with `async`.

Example:

```swift
func load() async -> Value
```

An async function may suspend during execution.

`async` does not mean:

- concurrent
- parallel
- background
- detached
- automatically non-blocking

Those properties depend on the operation and its execution context.

## `await`

Marks a call or expression that may require asynchronous suspension.

Example:

```swift
let value = await service.load()
```

Treat an `await` as a potential suspension point.

State assumptions established before an `await` may need revalidation after
resumption when another operation can mutate that state.

`await` does not mean the operation necessarily changes physical threads.

## Suspension

A point where an asynchronous task can stop executing temporarily while waiting
for another operation.

Suspension differs from blocking.

Conceptually:

```text
task suspends
    ↓
executor can run other eligible work
    ↓
task becomes ready later
    ↓
task resumes
```

Suspension does not imply that surrounding mutable state remains unchanged.

## Blocking

Keeping a thread occupied while waiting or performing synchronous work.

Examples can include:

- semaphore wait
- synchronous dispatch wait
- long synchronous I/O
- lock contention
- expensive CPU work

Blocking and suspension are different execution behaviors.

Async code can still block if it invokes blocking synchronous operations.

## Concurrency

The ability for multiple operations to make progress during overlapping
lifetimes.

Concurrency does not require simultaneous physical execution.

Example:

```text
operation A
    ↘
      overlapping lifetime
    ↗
operation B
```

## Parallelism

Simultaneous execution of multiple operations on available execution resources.

Concurrency can enable parallelism but does not guarantee it.

For example:

```text
many tasks
    ↓
one actor
```

may remain serialized while still participating in a concurrent system.

## Task

A unit of asynchronous Swift work.

A task has behavior such as:

- lifetime
- cancellation state
- priority
- result
- inherited task context depending on creation mechanism

Task ownership must still be designed by the application.

## Current task

The task currently executing a piece of async code.

Operations such as:

```swift
Task.isCancelled
```

or task-local lookup concern the current task context.

Do not confuse the current task with any stored `Task` handle an object may
own.

## Task handle

A value representing an unstructured task and allowing interaction with its
lifecycle or result.

For example:

```swift
let task = Task {
    await operation()
}
```

The handle can be used to:

- await result
- request cancellation
- retain ownership/control

Dropping the handle does not inherently cancel the task.

## Structured concurrency

Concurrency where child work is bounded by the lexical lifetime of a parent
operation.

Common Swift constructs include:

- `async let`
- task groups

Conceptually:

```text
parent scope
 ├── child A
 └── child B
```

The parent scope cannot fully complete while its structured child lifetime
remains unresolved.

Structured concurrency provides clearer:

- lifetime
- cancellation propagation
- error propagation
- ownership

than independently created unstructured tasks.

## Structured child task

A task created through structured-concurrency constructs such as:

- `async let`
- `TaskGroup.addTask`

Its lifetime belongs to the enclosing structured operation.

Do not use the term for an arbitrary:

```swift
Task {
    ...
}
```

created inside another task.

## Unstructured task

A task created independently from structured lexical child lifetime.

Typical example:

```swift
Task {
    await work()
}
```

It may inherit aspects of the surrounding task context, but its lifetime is not
structured like an `async let` or task-group child.

Unstructured does not mean ownerless.

Its lifecycle still requires an intentional semantic owner.

## Detached task

A task created using:

```swift
Task.detached {
    ...
}
```

Detached work intentionally separates itself from significant surrounding task
context.

It should not be treated as:

```text
background Task
```

or:

```text
faster Task
```

or:

```text
escape hatch from actor isolation
```

Use detached work only when the independence is semantically required.

## Child task

In this skill, use "child task" primarily for work participating in structured
concurrency.

Avoid calling every task created by another task a child task, because that can
hide important lifetime differences.

## Parent task

The enclosing structured task whose lifetime owns structured child work.

Parent-child relationships matter for:

- lifetime
- cancellation
- error propagation

They should not be inferred merely from source-code nesting.

## `async let`

A structured-concurrency construct for starting a fixed number of child
operations whose results remain within the enclosing scope.

Example:

```swift
async let profile = loadProfile()
async let settings = loadSettings()

let result = try await (profile, settings)
```

Use when the number of child operations is known statically and their lifetimes
belong to the current operation.

## Task group

A structured-concurrency mechanism for creating and managing a dynamic number
of child tasks.

Examples include:

- `withTaskGroup`
- `withThrowingTaskGroup`

A task group owns child lifetime for the duration of its scope.

Result completion order should not automatically be assumed to match task
submission order.

## Discarding task group

A task group where individual child result values do not need to be collected.

The work remains structured.

"Discarding" results does not mean:

```text
fire and forget
```

The enclosing scope still owns the child lifecycle.

## Cancellation

A cooperative request for asynchronous work to stop.

Calling:

```swift
task.cancel()
```

marks cancellation.

It does not forcibly terminate arbitrary Swift execution.

The operation must observe and respond to cancellation according to its
contract.

## Cancellation propagation

The way cancellation state is communicated through a task relationship.

Structured child tasks participate in parent cancellation according to Swift
structured-concurrency semantics.

Unstructured tasks require separate lifetime reasoning.

Cancellation propagation does not imply immediate termination.

## Cooperative cancellation

The model where code responds to cancellation at meaningful boundaries.

Examples include:

```swift
try Task.checkCancellation()
```

or:

```swift
Task.isCancelled
```

or cancellation-aware awaited operations.

Cancellation should be checked where continuing work would violate the
operation contract or waste meaningful resources.

## Cancellation checkpoint

A location where an operation intentionally observes cancellation.

Useful checkpoints can occur:

- before expensive work
- after long suspension
- before state commit
- before another expensive stage
- inside long-running loops

Do not interpret every `await` as requiring an explicit cancellation check.

## `CancellationError`

A standard representation commonly associated with task cancellation.

Application APIs may choose their own cancellation contract.

Do not assume every cancelled operation must expose exactly
`CancellationError`, nor convert cancellation into ordinary failure without a
reason.

## Actor

A reference type that protects actor-isolated mutable state through Swift's
actor isolation model.

Conceptually:

```text
many callers
    ↓
actor
    ↓
isolated mutable state
```

An actor does not make an entire async method atomic across suspension points.

## Actor isolation

The rule that actor-isolated state and behavior are accessed through the actor's
isolation domain.

External access to isolated declarations may require:

```text
actor hop
+
await
```

depending on context.

Actor isolation protects state access.

It does not by itself define complete operation ordering across `await`.

## Actor hop

Transitioning execution into an actor's isolation domain.

An actor hop can introduce suspension.

Repeated actor hops can also matter for API clarity and performance, but should
not be removed if they represent real ownership boundaries.

## Actor reentrancy

The ability for another task to execute actor-isolated work while an earlier
actor method is suspended.

Example:

```text
operation A enters actor
A reaches await
A suspends
operation B enters actor
B mutates state
A resumes later
```

This means state assumptions spanning `await` may no longer be valid.

## Reentrancy

More generally, execution entering a component again before a previous logical
operation has fully completed.

Swift actor reentrancy is specifically associated with suspension in actor
methods.

Synchronous callback reentrancy through delegates/locks is a different
mechanism and should be analyzed separately.

## Global actor

A globally shared actor-isolation domain.

`MainActor` is the most common example.

A global actor should represent semantic ownership shared by its annotated
declarations.

It should not be used merely to silence concurrency diagnostics.

## MainActor

Swift's global actor commonly associated with main-thread/UI-owned state and
operations.

Use it when behavior semantically belongs to that isolation domain.

Do not interpret `MainActor` as:

- generic serialization
- background-work scheduler
- universal concurrency fix

## Default actor isolation

Compiler/project configuration that can change the isolation semantics of
otherwise unannotated declarations.

Always interpret source under the actual project's:

- Swift version
- language mode
- default isolation settings

before making assumptions about an unannotated declaration.

## `isolated`

A Swift isolation feature allowing a declaration or parameter to execute within
an actor's isolation domain according to language rules.

Use it to express real isolation ownership.

Do not add it merely to reduce the number of explicit actor hops.

## `nonisolated`

A declaration that is not actor-isolated in the usual way despite being declared
within an actor-isolated context.

Use it only when the behavior genuinely does not depend on protected mutable
state.

Do not interpret it as:

```text
ignore actor rules
```

## Unsafe isolation escape

Any mechanism that bypasses or weakens normal compiler isolation guarantees.

Such mechanisms create a proof obligation.

The application must establish why runtime behavior remains correct even though
the compiler cannot prove it.

## Isolation domain

A conceptual boundary within which mutable state is accessed according to one
isolation contract.

Examples can include:

- actor
- global actor
- serial queue
- lock-protected owner
- framework-confined context

Not every isolation domain is a Swift actor.

## Executor

A Swift concurrency execution abstraction that determines where eligible jobs
can run.

Reason primarily in terms of:

- actor isolation
- executor ownership
- suspension

rather than assuming one executor equals one physical thread.

## Serial executor

An executor that provides serialized execution according to its contract.

Actor execution commonly uses serial-executor semantics.

Serialization of execution segments does not imply that an async actor method
runs atomically from entry to return.

## Custom executor

A specialized execution mechanism integrated with Swift's concurrency model.

Use custom executor behavior only when a concrete subsystem requires it.

It is not a general performance optimization.

## Thread

An operating-system execution thread.

Swift tasks are not permanently bound one-to-one to threads.

Do not assume:

```text
Task == Thread
```

or that the same physical thread exists before and after every `await`.

## Thread affinity

A requirement that certain operations execute on a particular thread.

Some frameworks have explicit thread-affinity contracts.

Thread affinity is not automatically equivalent to actor isolation.

Preserve framework requirements where relevant.

## Dispatch queue

A Grand Central Dispatch execution mechanism.

Queues can provide:

- serialization
- asynchronous submission
- callback ordering
- framework affinity

Swift Concurrency does not make queues universally obsolete.

Use the primitive that correctly represents the subsystem boundary.

## Serial queue

A dispatch queue executing submitted work serially.

A serial queue can protect shared mutable state or preserve callback ordering.

Do not assume queue-based state can automatically become actor-isolated without
behavioral analysis.

## Concurrent queue

A dispatch queue that can allow several submitted operations to execute
concurrently.

Barrier operations may provide exclusive sections when configured correctly.

Use concurrency only when workload and ownership justify the added complexity.

## Lock

A synchronous mutual-exclusion primitive protecting shared mutable state.

Locks are appropriate for some small synchronous state.

They are not inherently inferior to actors.

Do not hold ordinary synchronous locks across `await`.

## Critical section

The portion of code executed while a synchronization primitive protects an
invariant.

A critical section should be:

```text
small enough to avoid unnecessary contention
+
large enough to preserve the complete invariant
```

Do not optimize lock scope so aggressively that check-and-act behavior becomes
non-atomic.

## Atomic operation

An operation observed as one indivisible state transition relative to relevant
competing operations.

Several individually synchronized reads and writes do not necessarily form one
atomic compound operation.

For example:

```text
read
then decide
then write
```

must often be protected as one operation.

## Atomic primitive

A low-level operation/value providing specific atomic memory semantics.

Atomics can be appropriate for narrow independent state such as:

- counters
- flags
- versions

They should not fragment a multi-property invariant simply to avoid a lock or
actor.

## Data race

Unsynchronized concurrent access to shared mutable memory where at least one
access mutates and the access pattern violates the synchronization model.

Do not use "data race" as a synonym for every concurrency bug.

## Race condition

A broader correctness problem where behavior depends incorrectly on relative
operation timing or ordering.

A race condition can occur even when there is no low-level data race.

Example:

```text
A reads valid state
B changes state
A acts on stale state
```

while all individual accesses may still be synchronized.

## Check-then-act race

A race where validation and mutation occur as separate operations:

```text
check condition
        ↓
another operation changes state
        ↓
act on old condition
```

Keep related validation and mutation inside one authoritative isolation boundary
when they form one invariant.

## Stale state

State that was valid when read but has since been replaced or changed.

Stale state commonly appears across suspension:

```text
read state
await
state changes elsewhere
resume with old assumption
```

Revalidate where correctness depends on current state.

## Stale result

The output of an older asynchronous operation that completes after a newer
operation has become authoritative.

Example:

```text
request A starts
request B starts
B completes
A completes
```

A may need to be discarded if B represents the current request.

Common protections include:

- cancellation
- generation
- request identity
- state revalidation

## Generation

A monotonically changing or otherwise unique value used to identify the current
logical operation/state generation.

Example:

```text
generation 4 starts work
generation changes to 5
old generation 4 result arrives
result rejected
```

A generation is one possible stale-work mechanism.

Do not add one when simpler ownership already prevents stale commits.

## Operation identity

A stable identifier distinguishing one asynchronous operation from another.

Useful when:

- operations can be replaced
- old completion can arrive late
- cleanup must not affect a replacement

It can serve a role similar to a generation while retaining per-operation
identity.

## Serialization

Ensuring relevant operations execute or mutate state in an ordered,
non-overlapping way according to an isolation/synchronization contract.

Serialization can be provided by:

- actor
- serial queue
- lock around critical section
- explicit async operation queue
- another owner

Serialization of state access does not necessarily imply strict whole-workflow
FIFO when operations suspend.

## Ordering

A consumer-visible or internal requirement concerning relative event/operation
sequence.

Examples:

```text
start before finish
pause before resume
request B supersedes A
```

Do not infer required ordering from scheduler behavior.

Encode required ordering explicitly.

## FIFO

First-in, first-out ordering.

Some queue abstractions provide FIFO submission semantics.

Do not assume actor async-method completion is FIFO simply because actor
execution is serialized.

Suspension and reentrancy can alter whole-operation completion ordering.

## Priority

Scheduling intent associated with a task.

Priority is not a correctness ordering guarantee.

Do not depend on:

```text
higher priority executes first
```

for domain behavior.

## Priority inversion

A condition where higher-priority work is delayed by lower-priority work holding
a required resource or synchronization boundary.

Diagnose the dependency/resource relationship before changing priorities.

## Task local

A value scoped through task execution context.

Useful for context such as:

- trace identifiers
- request metadata

Task-local values are not a replacement for explicit business dependencies or
shared state ownership.

## `Sendable`

A Swift concurrency transfer contract indicating that values of a type can
cross isolation boundaries safely according to the concurrency model.

`Sendable` does not mean:

```text
arbitrarily thread-safe mutable object
```

or:

```text
every operation is atomic
```

## Implicit Sendable conformance

Sendability the compiler can infer for eligible types under the current
language/toolchain rules.

Do not rely on memory of exact compiler inference behavior when the configured
Swift version matters.

Use the actual compiler/toolchain contract.

## `@unchecked Sendable`

A manual assertion that a type satisfies the Sendable contract even though the
compiler cannot verify it fully.

This transfers responsibility to the programmer.

Use only with an explicit safety invariant.

It is not:

```text
disable Sendable checking
```

## `@Sendable`

A closure transfer contract indicating the closure is suitable for concurrency
boundaries according to Swift's rules.

Captured values must satisfy the relevant ownership/transfer requirements.

`@Sendable` does not itself specify:

- actor isolation
- task lifetime
- execution thread

## Transfer

Moving or sharing a value across a concurrency isolation boundary.

Before making a type Sendable, ask whether the value should cross that boundary
at all.

Often preferable transfer representations include:

- immutable value
- identifier
- snapshot
- message

rather than mutable shared references.

## Snapshot

An independent representation of state at one point in time.

Snapshots can safely communicate actor/framework-owned state when consumers do
not need direct access to the mutable owner.

A snapshot may become stale later.

It is not live shared state.

## Immutable value

A value whose observable state cannot mutate after creation.

Be careful with:

```swift
let reference: MutableClass
```

because the reference binding is immutable while the referenced object may
still mutate.

## Shared mutable state

State reachable and mutable from more than one concurrently executing boundary.

This state requires a clear ownership/synchronization model.

Shared mutable state is the central concern behind many concurrency defects.

## Confinement

A framework or architectural rule requiring a value/resource to remain within a
particular execution or ownership boundary.

Examples include:

- actor-owned state
- queue-confined objects
- managed-object contexts
- framework sessions

Swift `Sendable` does not override framework-level confinement rules.

## Ownership

The semantic responsibility for:

- mutable state
- resource lifetime
- asynchronous work
- cleanup
- cancellation

Ownership is broader than ARC retention.

For example, one service can semantically own a task even if another object
temporarily retains its handle.

## ARC ownership

Swift reference-counting relationships such as:

- strong
- weak
- unowned

ARC determines memory lifetime of reference objects.

It does not by itself define semantic task/resource ownership.

## Strong capture

A closure capture retaining a referenced object.

Strong captures can be correct for finite operations that should keep an owner
alive.

Do not classify every strong Task capture as a retain cycle defect.

## Weak capture

A non-owning closure reference, commonly written:

```swift
[weak self]
```

Weak capture answers:

```text
Should this closure retain the object?
```

It does not answer:

```text
Should the asynchronous operation continue?
```

That is a separate lifecycle/cancellation question.

## Weak-to-strong promotion

Binding a weak reference to a strong local value.

Example:

```swift
guard let self else {
    return
}
```

The strong local can remain alive across suspension for the scope in which it is
needed.

A weak capture therefore does not guarantee the owner can deallocate during
every `await`.

## Retain cycle

A strong-reference graph preventing objects from reaching their intended
deallocation point.

Example:

```text
owner
  ↓
task
  ↓
owner
```

A cycle-shaped graph is not necessarily a practical leak if one edge is
guaranteed to disappear when finite work completes.

Analyze both graph and lifetime.

## Resource leak

A resource remaining active/retained beyond intended lifecycle.

Resources can include more than ARC objects:

- tasks
- observers
- sockets
- files
- continuations
- streams
- buffers
- subscriptions
- framework resources

## Semantic lifecycle

The domain lifecycle of a component independent from ARC lifetime.

Examples:

```text
session starts → session stops
camera starts → camera stops
user logs in → user logs out
screen active → screen inactive
```

Long-running work should often follow semantic lifecycle rather than waiting
only for `deinit`.

## `deinit`

ARC deinitialization executed when reference ownership reaches the appropriate
terminal state.

`deinit` can perform fallback cleanup.

It cannot break a strong cycle that prevents the object from reaching
deinitialization.

## Async sequence

A sequence whose next element can become available asynchronously.

Conforms conceptually to:

```text
zero or more asynchronous values
then termination
```

Use for repeated-value contracts.

## Async iterator

The iteration state responsible for asynchronously producing the next element
of an `AsyncSequence`.

Do not assume concurrent calls to `next()` are supported unless the sequence
contract explicitly permits it.

## `AsyncStream`

A standard-library abstraction commonly used to adapt nonthrowing repeated
callback/event producers into AsyncSequence.

It requires explicit reasoning about:

- producer lifetime
- buffering
- termination
- cancellation
- subscriber semantics

## `AsyncThrowingStream`

A stream that can terminate with an error.

Use when producer failure is a terminal stream state.

Do not use terminal stream failure to represent an ordinary per-element error
when the stream should continue.

## Stream continuation

The producer-side handle used by `AsyncStream` or `AsyncThrowingStream` to:

- yield values
- finish
- observe termination

Continuation ownership must remain tied to producer/subscriber lifecycle.

## Yield

Publishing an element to an asynchronous stream.

Yielding does not necessarily mean:

```text
consumer processed value immediately
```

Buffering and consumer scheduling are separate concerns.

## Buffering

Holding produced stream values until the consumer can receive them.

Buffering policy can affect:

- memory
- latency
- dropped values
- event semantics

## Backpressure

A mechanism where producer behavior responds to consumer capacity.

Backpressure is not equivalent to:

```text
bounded buffer that drops elements
```

Dropping and slowing production are different policies.

## Event stream

A sequence where each emitted occurrence can be semantically important.

Examples:

```text
transaction occurred
command received
state transition occurred
```

Dropping equal/intermediate events may be incorrect.

## State stream

A sequence primarily representing current state over time.

Examples:

```text
connectivity
progress
status
```

Intermediate values may sometimes be disposable depending on the contract.

State and event semantics should influence buffering/replay design.

## Replay

Delivering previously produced state/events to a new subscriber.

A current-state stream may legitimately replay its latest value.

An event stream may not.

Do not assume every stream should replay.

## Producer

The source generating asynchronous stream values or callback events.

Examples:

- framework observer
- polling task
- delegate bridge
- network connection
- notification registration

Producer lifetime may or may not be owned by one consumer.

## Consumer

The task or component iterating or receiving asynchronous values.

A consumer stopping does not automatically mean an independently owned producer
must stop.

Ownership determines propagation.

## Subscription

The logical relationship connecting one consumer to an asynchronous producer.

A subscription can require:

- identity
- registration
- removal
- buffering policy
- cleanup

especially with multiple consumers.

## Continuation

A Swift mechanism adapting callback-style single-result asynchronous operations
into async/await.

Continuations should be used for true bridging boundaries.

They require correct terminal behavior.

## Checked continuation

A continuation form providing runtime diagnostics for some continuation misuse.

Checked does not remove the programmer's obligation to preserve:

- exactly-once completion
- cancellation
- lifetime
- error contract

## Resume

Completing a continuation with:

- value
- error
- terminal result

Each reachable operation instance must satisfy the continuation completion
contract.

## Exactly-once completion

A contract where one asynchronous operation produces one and only one terminal
result.

Relevant to:

- continuations
- callbacks
- request completion
- task lifecycle

Competing success/failure/cancellation callbacks must not create multiple
terminal consumer outcomes.

## Timeout

A policy where an operation exceeds a permitted deadline.

A timeout is not inherently equivalent to cancellation.

A caller may time out while underlying work continues unless cancellation is
actually propagated and honored.

## Deadline

A point in time after which an operation should no longer be treated as
successfully completing under the timeout policy.

Deadline behavior should not be inferred from arbitrary test delays.

## Polling

Repeatedly performing work at intervals to detect new state or results.

Polling requires explicit:

- lifetime
- delay
- cancellation
- failure
- overlap policy

## Debounce

A policy that delays emission/work until activity has been quiet for a
specified interval.

Conceptually:

```text
A
AB
ABC
    ↓ quiet
emit ABC
```

Debounce normally assumes intermediate values can be discarded.

## Throttle

A policy restricting how frequently values or operations are allowed through.

Throttle changes timing and potentially which values are observed.

Use only when those semantics are acceptable.

## Fan-out

Starting many concurrent child operations from one source operation.

Example:

```text
1000 items
    ↓
1000 child tasks
```

Fan-out may require bounding when input or downstream capacity is large.

## Bounded concurrency

Restricting the maximum number of operations active simultaneously.

The limit should follow the constrained resource when possible.

Examples:

- CPU
- network
- database
- service rate limit
- memory

## Contention

Multiple operations competing for one execution or synchronization resource.

Examples:

- actor
- lock
- serial queue
- database writer

Contention should be measured or demonstrated before introducing more complex
synchronization.

## Oversubscription

Creating more concurrently active work than the underlying resources can handle
efficiently.

Possible symptoms include:

- scheduling overhead
- thread growth
- memory pressure
- downstream overload
- lower throughput

## Task explosion

Uncontrolled creation of large numbers of tasks.

Common examples include:

- one Task per high-frequency event
- one child task per massive input collection
- duplicate start creating duplicate infinite consumers

Task count should follow meaningful work granularity.

## Actor contention

Several operations waiting to execute through one actor's isolation domain.

The actor may be correctly designed but still become a performance bottleneck
if too much unrelated or expensive synchronous work occurs inside isolation.

## Lock contention

Several threads/execution paths waiting for the same lock.

Lock existence alone is not evidence of meaningful contention.

Critical-section cost and acquisition frequency matter.

## Priority inversion

Higher-priority work waiting on a resource controlled by lower-priority work.

Treat as a resource dependency issue before treating it as merely a priority
configuration problem.

## Async migration

Changing an existing API/implementation toward async/await or other Swift
Concurrency constructs.

Migration should preserve or intentionally evolve:

- ownership
- ordering
- errors
- cancellation
- lifecycle
- public compatibility

It should not be a mechanical syntax conversion.

## Strict concurrency

Compiler checking intended to enforce increasingly strong Swift concurrency
rules according to the configured language mode and compiler settings.

Interpret diagnostics using the project's actual configuration.

Strict checking does not replace runtime ownership reasoning.

## Migration suppression

A mechanism used to bypass or defer concurrency checking during migration.

Examples can include:

- `@preconcurrency`
- `@unchecked Sendable`
- unsafe isolation assertions

Such mechanisms require explicit justification.

## `@preconcurrency`

A compatibility mechanism used around APIs/modules whose concurrency contract
predates or cannot fully express current Swift concurrency checking.

It does not make runtime behavior safe.

Keep it near the compatibility boundary.

## Compiler isolation diagnostic

A compiler message indicating code crosses or violates an isolation contract.

The correct response is determined by ownership.

Possible root causes include:

- wrong actor
- wrong transfer boundary
- protocol mismatch
- imported legacy API
- inappropriate nonisolated access

## Compiler Sendable diagnostic

A compiler message indicating a value crossing a concurrency boundary does not
satisfy the required transfer contract.

Do not automatically fix it by adding `Sendable`.

First ask whether the value should cross.

## Proof obligation

A concurrency guarantee that the compiler cannot fully verify and therefore
must be established by architecture, implementation, documentation, and
sometimes tests.

Examples include:

```text
@unchecked Sendable
unsafe isolation escape
external framework thread guarantee
manual lock-protected state
```

A proof obligation should be concrete and maintainable.

## Isolation escape

Code intentionally bypassing the normal isolation model.

This is not automatically incorrect.

It requires stronger evidence that the runtime invariant remains valid.

## Handoff

The explicit transition between execution/ownership domains.

Examples:

```text
framework callback queue
        ↓
immutable event
        ↓
actor
```

or:

```text
MainActor
    ↓
independent request value
    ↓
background service
```

Clear handoffs are preferable to mutable objects being simultaneously owned by
several domains.

## One authoritative owner

The component responsible for a given mutable state or lifecycle.

Examples:

```text
actor owns session state
context owns managed object
controller owns replaceable operation
service owns polling task
```

Concurrency architecture is easier to reason about when authority is not split
between unrelated mechanisms.

## One authoritative execution path

A design where old and new concurrency implementations do not independently
execute the same behavior.

During migration:

```text
old callback API
new async API
```

should preferably converge on one implementation.

Avoid maintaining duplicate paths that can diverge.

## Terminal state

The state reached when a logical asynchronous operation has finished.

Possible terminal reasons include:

- success
- failure
- cancellation
- timeout
- replacement
- explicit stop

An operation should not publish contradictory terminal outcomes.

## Transitional state

A state representing an operation currently moving between stable states.

Examples:

```text
starting
stopping
pausing
resuming
```

Transitional state can be important when operations suspend and other callers
need to understand who currently owns the transition.

## Stable state

A state representing an externally coherent condition where no transition is
currently in progress.

What counts as stable depends on the subsystem.

Do not infer stability merely from enum naming.

## Idempotent lifecycle operation

An operation that can be invoked repeatedly without changing the valid result
after the first successful application.

Examples can include:

```text
stop
cleanup
unregister
```

when the API deliberately defines them that way.

Do not assume every lifecycle API should be idempotent.

## Stale cleanup

Cleanup from an older operation that executes after a replacement operation has
already become authoritative.

Example:

```text
task A active
task B replaces A
A finishes later
A clears shared activeTask
```

This can corrupt B's ownership state.

Use identity/generation checks where replacement can overlap old completion.

## Semantic cancellation

The domain meaning assigned to task cancellation.

Examples:

```text
cancel upload → stop producing new work
cancel search → ignore pending result
cancel transition → restore previous state
```

Swift only provides the cancellation mechanism.

The application defines the behavioral meaning.

## Fire-and-forget

Work started without the initiating caller awaiting a result.

The phrase should not imply ownerless work.

Even true fire-and-forget operations require intentional:

- lifetime
- failure handling
- resource ownership

Prefer describing the actual semantic owner instead of using the phrase when
ownership matters.

## Latest wins

A concurrency policy where the newest operation is authoritative and older
results are discarded.

Typical mechanisms include:

- cancellation
- generation
- request identity

Cancellation alone may not guarantee latest-wins if older work ignores
cancellation.

## Join existing work

A policy where several callers await one already-active operation rather than
starting duplicates.

Useful for:

- initialization
- identical fetches
- shared expensive computation

Cancellation semantics for individual callers still require design.

## Replace existing work

A policy where starting a new operation supersedes an older one.

Usually requires reasoning about:

- cancellation
- stale completion
- task-handle replacement
- final state ownership

## Coalescing

Combining equivalent or superseded operations so fewer actual operations need to
execute.

May improve performance when the domain allows it.

Do not coalesce distinct correctness-critical events.

## Serialization boundary

The component/mechanism responsible for ensuring a set of related mutations
does not execute concurrently.

Examples:

- actor
- serial queue
- lock
- operation scheduler

The boundary should normally align with the state invariant it protects.

## Framework confinement

An execution/ownership restriction imposed by a framework independently from
Swift's type-level concurrency model.

Examples may include:

- queue-confined framework objects
- context-confined persistence objects
- session-owned resources

Do not use `Sendable` or actor annotations to bypass a framework confinement
contract.

## Concurrency configuration

The compiler/project configuration affecting how Swift interprets concurrency
code.

Relevant settings can include:

- Swift language mode
- strict concurrency
- default actor isolation
- upcoming language features
- SDK/toolchain version

Always reason from the configured environment rather than assumptions from
another project.

## Behavioral validation

Evidence that concurrency behavior works according to its contract.

Examples include tests proving:

- stale results cannot commit
- one initialization wins
- cancellation stops side effects
- stream termination cleans up
- conflicting state transitions are rejected

Behavioral validation complements compiler checking.

## Structural concurrency reasoning

Reasoning from:

```text
state
owner
isolation
transfer
task lifetime
cancellation
```

rather than relying only on runtime stress.

It is required because many concurrency errors may not reproduce reliably in a
test run.

## Deterministic concurrency test

A test that explicitly controls the ordering needed to exercise a concurrency
scenario.

Example:

```text
A starts
A reaches controlled suspension
B mutates state
A resumes
assert invariant
```

Prefer this over hoping scheduler timing produces the desired interleaving.

## Stress test

A test repeatedly exercising concurrent behavior to increase the chance of
observing timing-sensitive issues.

Stress tests are supplemental evidence.

Passing them does not prove concurrency safety.

## Concurrency performance

The resource and latency behavior resulting from:

- task count
- actor contention
- locks
- queues
- suspension
- blocking
- fan-out
- buffering
- cancellation
- duplicate work

Optimize measured or structurally demonstrated cost after correctness.

## Core distinction summary

Keep these distinctions explicit:

```text
async
≠ concurrent

concurrent
≠ parallel

await
≠ background execution

suspension
≠ blocking

Task
≠ Thread

Task { }
≠ structured child task

Task.detached
≠ background optimization

actor isolation
≠ whole async method atomicity

actor
≠ thread

MainActor
≠ generic synchronization

Sendable
≠ arbitrary thread safety

@unchecked Sendable
≠ safety

weak capture
≠ cancellation

cancel()
≠ immediate termination

serial execution
≠ whole-workflow FIFO

AsyncStream
≠ automatic broadcast

bounded buffering
≠ backpressure

priority
≠ ordering

compiler-clean
≠ concurrency-correct

stress-test passing
≠ race-free

deinit cleanup
≠ lifecycle ownership

one lock per property
≠ atomic aggregate state
```

When terminology becomes ambiguous during implementation or review, prefer
describing the concrete:

```text
state
owner
execution boundary
suspension point
value transfer
task lifetime
terminal behavior
```

rather than relying on imprecise labels such as "background", "thread-safe", or
"async-safe".