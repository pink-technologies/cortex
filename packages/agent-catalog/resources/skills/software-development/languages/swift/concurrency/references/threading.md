# Swift Threading and Synchronization

Use this reference when the task materially affects threads, dispatch queues,
locks, synchronous synchronization, thread affinity, callbacks arriving on
specific queues, legacy concurrency mechanisms, or interaction between those
mechanisms and Swift Concurrency.

This reference focuses on **execution and synchronization mechanisms below or
alongside Swift structured concurrency**.

Use:

- `actors.md` for actor isolation, global actors, and reentrancy.
- `tasks.md` for task ownership, cancellation, task groups, and detached tasks.
- `sendable.md` for values crossing concurrency isolation boundaries.
- `async-await-basics.md` for suspension and async control flow.
- `memory-management.md` for ownership through callbacks, tasks, and long-lived
  synchronization infrastructure.
- `performance.md` for contention, blocking, oversubscription, and scheduling
  cost.
- framework-specific guidance when a framework requires a particular queue,
  thread, or executor.

Project-specific synchronization architecture, deployment target, Swift
language mode, framework contracts, and toolchain configuration take precedence
over this generic guidance.

## Threading baseline

### SWIFT-CONC-THREAD-001 — Identify the synchronization owner before choosing a primitive

Before changing concurrent code, determine:

```text
what mutable state exists
        ↓
who owns it
        ↓
which operations must be atomic
        ↓
which execution boundary protects it
```

Possible boundaries include:

```text
actor
serial queue
lock
framework-owned executor
immutable/value ownership
```

Do not begin by selecting a primitive such as:

```text
DispatchQueue
NSLock
actor
```

before identifying the state and invariant it must protect.

Synchronization is an ownership decision first.

## One authoritative synchronization boundary

### SWIFT-CONC-THREAD-010 — Protect one logical invariant through one authoritative mechanism

Prefer:

```text
mutable state
     ↓
one synchronization boundary
```

over:

```text
same state
 ├── actor
 ├── lock
 └── serial queue
```

unless each mechanism has a distinct and necessary responsibility.

Multiple independent synchronization mechanisms protecting the same state can
create:

- inconsistent access rules
- lock ordering problems
- redundant serialization
- hidden unsynchronized paths
- difficult lifecycle reasoning

Do not preserve several mechanisms merely because they accumulated historically.

## Synchronization scope

### SWIFT-CONC-THREAD-020 — Protect complete invariants, not individual property accesses

This pattern can still be incorrect:

```text
lock → read A
unlock

lock → read B
unlock

if A and B satisfy condition
    mutate state
```

if another execution path can change the state between those operations.

When:

```text
check
+
decision
+
mutation
```

form one invariant, protect the complete operation through the same
synchronization boundary.

For example:

```swift
lock.lock()
defer { lock.unlock() }

guard state == .ready else {
    return
}

state = .running
```

is conceptually stronger than independently synchronized getters and setters.

Do not turn synchronization into a property-wrapper exercise when correctness
depends on relationships between properties.

## Locks

### SWIFT-CONC-THREAD-030 — Use locks for small synchronous critical sections when they fit the ownership model

A lock can be appropriate when:

- shared mutable state is accessed synchronously
- operations are small
- callers cannot or should not enter an actor
- the type exposes internally synchronized synchronous behavior
- framework integration requires synchronous access

Keep the protected section focused on the invariant.

Do not hold a lock around unrelated expensive work.

Conceptually:

```text
prepare independent input
        ↓
lock
        ↓
read/update protected state
        ↓
unlock
        ↓
perform independent work
```

is preferable when the expensive work does not require protection.

## Lock coverage

### SWIFT-CONC-THREAD-040 — Every access participating in the invariant must follow the same synchronization contract

A lock provides no protection if some paths use it and others access the same
state directly.

When reviewing lock-protected state, identify:

```text
all reads
all writes
all compound operations
all callbacks
all escape paths
```

and verify they obey the synchronization boundary.

Do not conclude a type is thread-safe merely because it contains an `NSLock`.

The proof comes from complete access coverage.

## `defer`

### SWIFT-CONC-THREAD-050 — Pair lock acquisition and release reliably

For ordinary scoped locking, prefer a structure that ensures unlocking across
early returns and throwing paths.

For example:

```swift
lock.lock()
defer { lock.unlock() }

guard isEnabled else {
    return
}

state += 1
```

or an equivalent scoped-lock API supported by the project.

Do not duplicate unlock calls manually across several branches when a scoped
structure can express ownership more safely.

## Lock duration

### SWIFT-CONC-THREAD-060 — Keep critical sections as small as correctness permits

Lock duration directly affects contention.

Avoid holding a lock while performing unrelated:

- network work
- filesystem work
- expensive computation
- callbacks into unknown code
- logging with potentially complex sinks
- blocking framework calls

unless those operations must participate in the protected invariant.

Do not minimize lock scope so aggressively that one atomic operation becomes
several unsafe check-then-act operations.

Correctness determines the minimum coherent critical section.

Performance determines whether that section needs redesign.

## Locks and `await`

### SWIFT-CONC-THREAD-070 — Do not carry an ordinary lock across a suspension point

A suspension point can allow unrelated work to execute while the suspended
operation still conceptually owns the lock.

Avoid patterns conceptually equivalent to:

```swift
lock.lock()

let result = await operation()

lock.unlock()
```

Holding synchronous locking state across `await` can create:

- deadlock
- starvation
- executor blocking
- ownership that cannot be reasoned about locally

Instead, capture or mutate the required state synchronously, release the lock,
perform asynchronous work, then reacquire/revalidate when needed.

Conceptually:

```text
lock
  ↓
capture state/version
  ↓
unlock
  ↓
await work
  ↓
lock
  ↓
revalidate + commit
  ↓
unlock
```

Use an actor or another asynchronous serialization abstraction when an
operation fundamentally needs async-aware ownership.

## Revalidation after asynchronous work

### SWIFT-CONC-THREAD-080 — A lock does not preserve state while it is released for async work

Consider:

```text
lock
  ↓
validate state
  ↓
unlock
  ↓
await external operation
  ↓
lock
  ↓
apply result
```

Another operation may mutate state during the await.

When correctness depends on the original state remaining authoritative, use:

- version/generation checks
- operation identity
- explicit transitional state
- cancellation
- another appropriate ownership mechanism

Do not assume using the same lock before and after an `await` makes the entire
workflow atomic.

## Recursive locks

### SWIFT-CONC-THREAD-090 — Do not introduce recursive locking merely to tolerate unclear call structure

A recursive lock can permit the same thread to acquire the lock repeatedly.

That can be useful for a deliberately recursive synchronous contract.

It can also hide architecture where:

```text
locked method
    ↓
calls another locked method
    ↓
calls another locked method
```

without clear ownership.

Prefer understanding and simplifying the critical-section structure before
switching to recursive locking.

Use recursive behavior only when reentrant synchronous access is intentional.

## Deadlocks

### SWIFT-CONC-THREAD-100 — Look for circular waiting between synchronization boundaries

A deadlock can arise when execution paths acquire resources in incompatible
orders.

For example:

```text
Task A:
lock A
  ↓
wait for lock B
```

while:

```text
Task B:
lock B
  ↓
wait for lock A
```

Neither can progress.

When several locks or serial resources interact, establish one consistent
acquisition order where possible.

Do not diagnose deadlock merely because code contains more than one lock.

Trace an actual cycle of waiting.

## Lock ordering

### SWIFT-CONC-THREAD-110 — Make multi-lock ordering explicit

If one operation must hold several locks, define a stable order:

```text
A → B → C
```

and preserve it across every path that can acquire more than one of them.

Avoid another path using:

```text
C → A
```

without a proven reason.

When lock ordering becomes difficult to maintain, consider whether the state
should share one higher-level owner instead.

Multiple fine-grained locks are not automatically better architecture.

## Calling external code under a lock

### SWIFT-CONC-THREAD-120 — Avoid invoking unknown callbacks while holding internal locks

A callback may:

- call back into the same object
- acquire another lock
- perform blocking work
- execute arbitrary consumer code

This can produce reentrancy or deadlock.

Prefer:

```text
lock
  ↓
capture callback + required value
  ↓
unlock
  ↓
invoke callback
```

when callback execution is not itself part of the protected invariant.

Do not blindly move callbacks outside locks if the API requires atomic
notification relative to state mutation.

Define that contract intentionally.

## Serial queues

### SWIFT-CONC-THREAD-130 — A serial queue can be a valid synchronous or callback-oriented isolation boundary

Serial dispatch queues remain useful when:

- integrating queue-based frameworks
- protecting synchronous legacy state
- maintaining callback ordering
- supporting APIs already designed around dispatch
- interacting with Objective-C code whose contract is queue-based

Do not replace an established serial queue with an actor solely for stylistic
modernization.

Likewise, do not add a serial queue to new async code when actor isolation
expresses the ownership model more naturally.

Choose the boundary that matches the architecture and API contract.

## Queue-owned state

### SWIFT-CONC-THREAD-140 — Keep queue-protected state on the queue

If a serial queue is the authoritative isolation mechanism:

```text
all protected state access
        ↓
serial queue
```

must remain true.

Do not occasionally access the same mutable properties directly because:

```text
this caller is probably already on the queue
```

unless that condition is explicitly established by the architecture.

Hidden queue assumptions make safety difficult to verify.

## `sync` versus `async`

### SWIFT-CONC-THREAD-150 — Choose dispatch operation semantics from caller requirements

Conceptually:

```text
queue.sync
→ caller waits until work finishes
```

while:

```text
queue.async
→ work is submitted and caller continues
```

Use synchronous dispatch when the caller truly requires the result before
continuing and the call cannot create a synchronization cycle.

Use asynchronous dispatch when work owns a later lifecycle.

Do not convert `sync` to `async` merely to avoid a deadlock without preserving
the caller's required ordering or return semantics.

Fix the ownership problem causing the deadlock.

## Synchronous dispatch to the same serial queue

### SWIFT-CONC-THREAD-160 — Avoid synchronously dispatching onto a serial queue that already owns the current execution

A pattern conceptually equivalent to:

```text
serial queue executing
       ↓
queue.sync
       ↓
wait for same queue
```

cannot make progress.

Before using synchronous dispatch, establish whether the current path can
already execute under the target queue's ownership.

Do not add queue-detection hacks broadly when a cleaner API can make queue
ownership explicit.

## Queue reentrancy

### SWIFT-CONC-THREAD-170 — Do not assume a serial queue supports arbitrary synchronous reentrancy

Serial execution means one submitted block executes at a time.

It does not imply code can synchronously redispatch to that queue from inside
itself.

Design queue-isolated APIs so internal implementation can access state directly
once already inside the queue boundary, while external entry points perform the
required dispatch.

Avoid layers of public/private helpers that repeatedly redispatch without
knowing current ownership.

## Concurrent queues and barriers

### SWIFT-CONC-THREAD-180 — Use concurrent read/exclusive write designs only when they provide real benefit

A concurrent queue with barrier writes can model:

```text
many concurrent reads
exclusive writes
```

for some workloads.

This architecture increases synchronization complexity.

Use it when:

- reads materially dominate
- reads are expensive enough to benefit
- state can be read safely concurrently
- writes are relatively uncommon
- measurement justifies the design

Do not introduce barrier-based synchronization for small state where one lock
or actor would be simpler.

## Atomicity

### SWIFT-CONC-THREAD-190 — Atomic individual operations do not automatically create atomic workflows

Suppose these are each synchronized:

```text
read status
write status
increment counter
```

A caller performing:

```text
if readStatus() == ready {
    writeStatus(running)
}
```

can still race if another caller changes status between those calls.

When operations belong together, expose one synchronized operation.

For example:

```swift
func beginIfReady() -> Bool
```

can preserve the invariant more strongly than independent getters/setters.

## Thread-safe containers

### SWIFT-CONC-THREAD-200 — A thread-safe property does not make the aggregate type thread-safe

For example:

```text
locked property A
locked property B
```

does not make an invariant involving both values atomic.

Likewise:

```text
thread-safe dictionary
```

does not automatically make:

```text
check key
then perform external work
then insert
```

atomic.

Protect the business/state invariant rather than assuming composition of
thread-safe primitives provides aggregate safety.

## Locks versus actors

### SWIFT-CONC-THREAD-210 — Choose between locks and actors based on API and ownership semantics

A lock is often a good fit for:

```text
small synchronous state
+
synchronous API
```

An actor is often a good fit for:

```text
shared mutable state
+
async/concurrent consumers
+
isolation expressed in Swift's type system
```

Neither is universally superior.

Consider:

- synchronous callers
- async callers
- framework callbacks
- public API shape
- latency requirements
- reentrancy requirements
- compatibility
- existing architecture

Do not rewrite lock-based code into actor code without accounting for changed
API and suspension semantics.

## Locks versus serial queues

### SWIFT-CONC-THREAD-220 — Do not switch synchronization mechanisms without preserving behavior

A serial queue can provide both:

- serialization
- asynchronous submission/order

A lock provides:

- synchronous mutual exclusion

Migrating between them can change:

- caller blocking
- execution ordering
- callback timing
- thread affinity
- reentrancy
- lifecycle

Do not treat:

```text
serial queue
↔
lock
```

as an implementation-only substitution without examining observable behavior.

## Main thread and `MainActor`

### SWIFT-CONC-THREAD-230 — Distinguish thread affinity from actor isolation

Legacy and framework APIs may express requirements in terms of:

```text
main thread
main dispatch queue
specific queue
```

Swift Concurrency may express ownership through:

```text
MainActor
another actor
```

These concepts interact, but they are not interchangeable abstractions for
every API.

When framework correctness depends on a documented thread or queue requirement,
preserve that requirement.

When Swift API correctness depends on actor isolation, preserve the actor
contract.

Do not replace one concept with the other merely because both often lead to
similar execution in a particular environment.

## UI execution

### SWIFT-CONC-THREAD-240 — Use the framework's UI isolation contract

UI frameworks generally have specific execution requirements.

When UI state is modeled with `MainActor`, use actor isolation consistently.

When integrating older callback APIs that document main-thread delivery or
require main-thread invocation, preserve that framework contract as well.

Do not scatter:

```swift
DispatchQueue.main.async {
    ...
}
```

through actor-isolated code merely as defensive habit.

First determine whether the surrounding declaration is already correctly
isolated.

Use the applicable UI framework skill for framework-specific behavior.

## Thread checks

### SWIFT-CONC-THREAD-250 — Do not use runtime thread checks as the primary synchronization model

Checks such as:

```text
am I on the main thread?
```

can be useful for:

- diagnostics
- assertions
- integration with genuinely thread-affine APIs

They are not a replacement for ownership and isolation.

Avoid architecture like:

```text
if on expected thread
    access state
else
    dispatch and try again
```

when the type can instead expose a clear synchronization boundary.

## Callback execution

### SWIFT-CONC-THREAD-260 — Establish callback execution semantics before mutating shared state

Callbacks from:

- Objective-C frameworks
- delegates
- notifications
- dispatch sources
- C APIs
- networking libraries
- media frameworks

may arrive on framework-defined or configurable execution contexts.

Before mutating synchronized state from a callback, determine:

```text
where callback arrives
        ↓
where state is owned
        ↓
how callback enters that boundary
```

Do not assume a callback arrives on the same queue as the call that registered
it.

## Callback normalization

### SWIFT-CONC-THREAD-270 — Normalize external callbacks into the owning isolation boundary

A useful pattern is:

```text
framework callback
       ↓
capture independent callback data
       ↓
authoritative queue/actor/lock owner
       ↓
validate + mutate state
```

Do not let every callback choose its own synchronization mechanism.

One owner should coordinate the resulting state changes.

## Delegate callbacks

### SWIFT-CONC-THREAD-280 — Do not hold internal synchronization while invoking consumer delegates unless required

Consumer delegate code is external code.

Calling it while holding an internal lock can create:

- lock inversion
- reentrancy
- long critical sections
- deadlock

Prefer capturing the required notification under synchronization and invoking
the delegate afterward when the contract permits.

If atomic callback ordering relative to state mutation matters, define that
behavior explicitly.

## Notifications

### SWIFT-CONC-THREAD-290 — Notification delivery does not establish receiver isolation

A notification can be delivered according to the posting mechanism and
framework contract.

Receiving a notification does not by itself mean the handler runs under the
receiver's actor, queue, or lock ownership.

Route state mutation through the receiver's authoritative synchronization
boundary.

Do not infer safety from:

```text
notification handler is synchronous
```

alone.

## Legacy completion handlers

### SWIFT-CONC-THREAD-300 — Preserve callback queue guarantees when bridging legacy APIs

An API may guarantee that its completion executes on:

```text
main queue
specific callback queue
internal serial queue
unspecified queue
```

That behavior can matter to existing consumers.

When migrating or wrapping the API with async/await, determine whether the
queue guarantee is:

- part of the supported API contract
- only an implementation detail
- superseded by actor isolation in the new API

Do not accidentally promise the old callback queue semantics for a new async
API unless that guarantee remains intentional.

## Async bridging

### SWIFT-CONC-THREAD-310 — Do not wrap dispatch in continuations merely to make synchronous code look async

Avoid patterns conceptually equivalent to:

```swift
await withCheckedContinuation { continuation in
    queue.async {
        let value = synchronousOperation()
        continuation.resume(returning: value)
    }
}
```

unless moving that operation to the queue is itself part of an established
execution contract.

A continuation adapts asynchronous callback completion.

It is not automatically the right abstraction for arbitrary synchronous work.

Understand whether the code needs:

- queue confinement
- background execution
- actor isolation
- structured asynchronous ownership

before choosing the bridge.

## Blocking

### SWIFT-CONC-THREAD-320 — Avoid blocking concurrency executors unnecessarily

Operations such as:

- waiting on semaphores
- synchronous dispatch
- blocking I/O
- long lock waits
- condition waits

can occupy threads that Swift concurrency could otherwise use for progress.

This does not make every blocking primitive forbidden.

Some framework or synchronous boundaries legitimately require them.

Avoid introducing blocking waits into async code when the dependency can be
represented asynchronously.

## Semaphores

### SWIFT-CONC-THREAD-330 — Do not use semaphores to force async code back into synchronous shape without a strong boundary reason

Be cautious with:

```text
start async work
      ↓
semaphore.wait()
      ↓
callback signals
```

This can:

- block executor threads
- create deadlocks
- lose cancellation
- obscure task lifetime
- violate actor assumptions

Prefer propagating asynchrony through the API when possible.

A semaphore can still be valid for lower-level synchronous coordination where
its ownership and blocking behavior are intentional.

## Conditions and waiting

### SWIFT-CONC-THREAD-340 — Match waiting primitives to synchronous ownership

Condition variables and related primitives can coordinate synchronous threads
around shared state.

They require careful handling of:

- predicate checks
- spurious/early wake behavior according to primitive semantics
- lock ownership
- shutdown
- timeout
- resource lifetime

Do not introduce them into task-based code when an asynchronous signaling
primitive fits the architecture better.

## Thread-local state

### SWIFT-CONC-THREAD-350 — Do not use thread identity for task-local semantics

Swift tasks may suspend and resume according to executor/runtime scheduling.

State that logically belongs to:

```text
request
task
operation
```

should not generally be modeled as arbitrary thread-local state.

Use task-local values or explicit operation context when that is the actual
ownership model.

Thread-local storage remains appropriate when integrating APIs whose contract is
genuinely thread-bound.

## Thread identity across `await`

### SWIFT-CONC-THREAD-360 — Do not assume the same physical thread before and after suspension

An async operation should not usually rely on:

```text
thread before await
==
thread after await
```

unless the relevant executor/framework contract explicitly provides such
behavior.

Reason in terms of actor/executor/isolation semantics rather than incidental
thread identity.

This is one reason thread-local assumptions and manual thread checks can be
fragile inside async workflows.

## Queue affinity across `await`

### SWIFT-CONC-THREAD-370 — Do not assume a dispatch queue remains the execution context across arbitrary async suspension

Legacy queue-confined code and Swift async code use different execution
abstractions.

If state must remain queue-confined, explicitly re-enter or otherwise preserve
that queue contract according to the subsystem design.

Do not reason:

```text
async function started from queue X
therefore
everything after await still executes on queue X
```

unless the specific API/executor arrangement guarantees it.

## Bridging queue-confined subsystems

### SWIFT-CONC-THREAD-380 — Keep legacy queue confinement behind an intentional adapter

When a subsystem already has a correct queue ownership model, an async facade
can preserve it internally:

```text
async consumer
     ↓
adapter
     ↓
queue-confined subsystem
```

The adapter owns:

- queue entry
- result bridging
- cancellation behavior where supported
- value transfer out of the queue boundary

Do not expose queue mechanics throughout new async consumers merely because the
implementation remains queue-based.

## Queue-confined objects

### SWIFT-CONC-THREAD-390 — Transfer independent values out of queue-confined owners

When an object is only valid on one queue, avoid returning that mutable object
to arbitrary concurrent consumers.

Prefer:

```text
queue-confined object
       ↓
extract snapshot / identifier / result
       ↓
consumer
```

when consumers do not need direct ownership.

This follows the same general principle as actor and framework confinement.

Sendability does not override a framework's queue-affinity contract.

## Interacting isolation mechanisms

### SWIFT-CONC-THREAD-400 — Define the handoff when actor and queue ownership meet

Some systems legitimately contain:

```text
Swift actor
    ↓
queue-based framework
```

or:

```text
framework queue
    ↓
MainActor UI state
```

Identify the transition explicitly.

For example:

```text
framework callback queue
        ↓
independent event value
        ↓
actor
        ↓
state mutation
```

Do not let shared mutable objects remain simultaneously owned by both
boundaries without a clear synchronization contract.

## Actor-to-queue deadlock reasoning

### SWIFT-CONC-THREAD-410 — Be cautious with synchronous cycles between actors and blocking queues

A design can deadlock or stall when one isolation boundary synchronously waits
for another that needs the first boundary to make progress.

Conceptually:

```text
actor operation
    ↓
queue.sync
    ↓
callback needs actor
```

or similar dependency cycles deserve scrutiny.

Prefer asynchronous handoffs where the operation does not require synchronous
return.

Do not report a deadlock merely because actor and queue code interact.

Trace the full waiting cycle.

## Locks and callbacks into actors

### SWIFT-CONC-THREAD-420 — Release synchronous locks before awaiting actor work

Do not:

```text
acquire lock
    ↓
await actor
    ↓
release lock
```

The synchronous lock should not span the suspension.

Capture the required state, release the lock, then interact with the actor.

If the result must later update lock-protected state, reacquire and revalidate.

## Reentrancy

### SWIFT-CONC-THREAD-430 — Distinguish synchronous reentrancy from actor reentrancy

Synchronous reentrancy can occur when code calls outward and receives a nested
call back into itself before the original call finishes.

Actor reentrancy occurs around suspension points where another operation can
enter the actor while the first is suspended.

They are related ownership concerns but different mechanisms.

Do not apply actor-specific explanations to a lock/delegate reentrant callback
without tracing the actual execution path.

## Lock-free assumptions

### SWIFT-CONC-THREAD-440 — Do not claim lock-free or atomic behavior without a defined memory-synchronization mechanism

Ordinary property reads and writes should not be treated as synchronization
simply because a primitive value appears small.

If correctness requires concurrent access guarantees, use a synchronization
mechanism whose contract supports them.

Do not rely on:

```text
this assignment is probably atomic on this CPU
```

as an application concurrency model.

Language/framework contracts matter more than incidental hardware behavior.

## Atomics

### SWIFT-CONC-THREAD-450 — Use atomic primitives for narrow state operations, not as a substitute for ownership design

Atomic operations can efficiently protect appropriate state such as:

```text
counter
flag
version
single atomic reference/value
```

when supported by the project's libraries and toolchain.

They become harder to reason about when several atomic values jointly form one
invariant.

Do not decompose a coherent state machine into many independent atomics merely
to avoid a lock or actor.

If correctness requires several values to change together, use a synchronization
boundary capable of expressing that operation coherently.

## Memory visibility

### SWIFT-CONC-THREAD-460 — Synchronization must establish visibility as well as mutual exclusion

Concurrent correctness is not only:

```text
two writers do not execute simultaneously
```

but also:

```text
readers observe state according to the synchronization contract
```

Use supported synchronization primitives rather than informal flags or timing
assumptions.

Do not use arbitrary delays as a memory-visibility mechanism.

## Polling shared state

### SWIFT-CONC-THREAD-470 — Do not busy-wait on unsynchronized mutable state

Avoid:

```swift
while !finished {
    // spin
}
```

when `finished` is concurrently mutated without an appropriate synchronization
mechanism.

Busy waiting can also waste CPU even when synchronization is correct.

Prefer:

- async signaling
- condition/lock primitives where synchronous waiting is required
- task completion
- streams/events
- another project-appropriate coordination mechanism

according to the architecture.

## Queue labels and names

### SWIFT-CONC-THREAD-480 — Do not treat queue labels as synchronization proof

A queue label helps:

- debugging
- diagnostics
- profiling

It does not establish that all state accesses actually occur on that queue.

When verifying queue confinement, inspect call paths rather than relying on
naming.

## Ownership during teardown

### SWIFT-CONC-THREAD-490 — Stop producers before releasing synchronization-owned resources

Long-lived synchronization infrastructure may coordinate:

- dispatch sources
- callback producers
- observers
- timers
- queues
- worker objects

During teardown, define an order such as:

```text
prevent new work
      ↓
stop/cancel producers
      ↓
finish or discard queued work
      ↓
release resources
```

according to the subsystem contract.

Do not deallocate state while callbacks can still arrive and mutate it.

## Queue shutdown

### SWIFT-CONC-THREAD-500 — Define what queued work means after logical shutdown

A serial queue itself may continue to exist after an owner considers the
subsystem stopped.

If callbacks can still submit work, use authoritative lifecycle state to decide
whether that work should:

```text
execute
be ignored
fail
be cancelled upstream
```

Do not rely on queue deallocation as the subsystem's only shutdown mechanism.

## Performance and contention

### SWIFT-CONC-THREAD-510 — Measure contention before increasing synchronization complexity

A simple lock or serial queue may be entirely sufficient for small state.

Do not replace it with:

- several fine-grained locks
- concurrent queue barriers
- atomics
- custom executors

without evidence that contention is material.

More concurrency can decrease performance through:

- coordination cost
- cache contention
- context switching
- complex retries
- duplicated work

Use `performance.md` for deeper analysis.

## Priority inversion

### SWIFT-CONC-THREAD-520 — Investigate blocking relationships before treating priority as the fix

A high-importance operation can be delayed by lower-priority work that owns a
resource it needs.

When diagnosing priority-related stalls, inspect:

```text
who owns resource
who waits
how long critical section lasts
what scheduler/executor is involved
```

Do not simply raise priorities until the symptom disappears.

The underlying resource ownership may be the real problem.

## Debugging threading problems

### SWIFT-CONC-THREAD-530 — Trace state, execution boundary, and waiting relationship

For a suspected concurrency issue, identify:

```text
mutable state
owner
all readers
all writers
synchronization primitive
callback execution context
suspension points
blocking waits
resource acquisition order
```

Then determine whether the failure is:

```text
data race
check-then-act race
deadlock
reentrancy
stale result
wrong thread/queue affinity
blocking/performance
lifecycle
```

Do not label every asynchronous bug a "race condition" without identifying the
competing operations.

## Diagnostics

### SWIFT-CONC-THREAD-540 — Use runtime diagnostics as evidence, not substitutes for ownership analysis

Tools such as race/thread diagnostics can reveal problematic execution paths.

A clean run does not prove synchronization is correct.

Likewise, one diagnostic should be traced to the actual ownership defect rather
than fixed with arbitrary queue dispatch.

Use tooling together with structural reasoning.

## Testing

### SWIFT-CONC-THREAD-550 — Test synchronized behavior through deterministic competing operations

When testing a synchronization invariant, control the relevant operations.

For example:

```text
operation A acquires/reads state
operation B attempts competing mutation
release controlled boundary
assert resulting invariant
```

Do not depend on:

```text
run both many times
hope they race
```

as the only concurrency test.

Stress tests can supplement deterministic tests.

They do not replace them.

### SWIFT-CONC-THREAD-551 — Avoid sleeps as synchronization in tests

Do not use:

```swift
Thread.sleep(...)
```

or:

```swift
Task.sleep(...)
```

to guess that another queue has completed.

Synchronize through:

- task completion
- callback completion
- explicit test gate
- expectation/event
- another deterministic project-supported primitive

according to the API under test.

## Migration from queues to actors

### SWIFT-CONC-THREAD-560 — Preserve semantics before changing the synchronization mechanism

A queue-based type may currently guarantee:

- FIFO callback ordering
- synchronous getters
- asynchronous mutations
- specific callback queue
- reentrant behavior
- queue-affine framework access

Moving that type to an actor can change those properties.

Before migration, establish:

```text
current observable synchronization contract
```

Then determine which parts must remain.

Do not perform:

```text
queue.async → Task
queue.sync → await actor
```

mechanically.

The models have different semantics.

## Migration from locks to actors

### SWIFT-CONC-THREAD-570 — Account for synchronous API changes

A lock can expose:

```swift
func value() -> Value
```

synchronously.

Actor isolation may require callers outside the actor to use:

```swift
await actor.value()
```

That is a consumer-visible API change.

For internal implementations, migration may still be useful.

For supported APIs, evaluate compatibility with the Swift API-design skill.

Do not choose actors solely because they are newer than locks.

## Avoid partial migrations

### SWIFT-CONC-THREAD-580 — Do not leave old and new synchronization paths active for the same state

A risky migration can result in:

```text
old queue path
+
new actor path
+
direct state access
```

all manipulating the same logical state.

When replacing a synchronization boundary:

1. identify every access path
2. route them through the new owner
3. remove the superseded path
4. validate absence of direct accesses

A concurrency migration is incomplete while two mechanisms independently own
the same invariant.

## Review checklist

When threading or synchronization behavior changes, verify when applicable:

- the shared mutable state and its owner are identified
- one authoritative synchronization boundary protects each logical invariant
- check-and-act operations are atomic when required
- every protected read/write follows the same locking or queue contract
- lock release is reliable across early return and throwing paths
- critical sections do not include unrelated expensive work
- synchronous locks do not span `await`
- state is revalidated after asynchronous work when needed
- recursive locking is not hiding unclear reentrant structure
- multi-lock acquisition follows a safe intentional order
- external callbacks are not invoked under locks without a contract reason
- serial queue state is not accessed directly from unowned paths
- synchronous dispatch cannot target a serial queue already waiting on itself
- concurrent/barrier queues are justified by actual workload
- individual synchronized properties are not mistaken for aggregate atomicity
- migration between actor/lock/queue mechanisms preserves observable behavior
- thread affinity and actor isolation are not treated as interchangeable
- callback execution context is established before state mutation
- blocking waits are not unnecessarily introduced into async execution
- semaphores are not used merely to force async APIs into synchronous form
- thread-local state is not used for task-owned semantics
- code does not depend on physical-thread identity across `await`
- queue-confined and actor-confined state have an explicit handoff
- atomic primitives protect appropriate independent state rather than fragmented
  invariants
- teardown prevents callbacks from mutating released state
- performance changes are based on contention evidence
- tests coordinate competing operations deterministically
- synchronization migrations remove superseded access paths

Do not treat a lock, serial queue, `DispatchQueue.main`, atomic primitive, or
successful stress test as proof that ownership, atomicity, lifecycle, and
ordering are correct.