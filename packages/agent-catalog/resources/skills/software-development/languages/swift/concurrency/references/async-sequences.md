# Swift Async Sequences

Use this reference when the task materially affects `AsyncSequence`,
`AsyncIteratorProtocol`, `for await`, `AsyncStream`,
`AsyncThrowingStream`, repeated asynchronous values, stream cancellation,
producer/consumer lifetime, buffering, termination, or asynchronous event
pipelines.

This reference focuses on **repeated asynchronous values and their lifecycle**.

Use:

- `async-await-basics.md` for general suspension and async/await semantics.
- `tasks.md` for task ownership, cancellation, and long-running consumers.
- `actors.md` for actor-isolated producers or consumers.
- `sendable.md` for values crossing isolation boundaries.
- `memory-management.md` for stream continuation retention and ownership.
- `testing.md` for deterministic asynchronous-sequence testing.
- `async-algorithms.md` when Swift Async Algorithms is actually part of the
  project and its operators are materially involved.

Project-specific event architecture, framework lifecycle, buffering policy,
language mode, and deployment constraints take precedence over this generic
guidance.

## Async sequence baseline

### SWIFT-CONC-SEQ-001 — Use `AsyncSequence` for repeated asynchronous values

An async sequence represents values that become available over time.

Conceptually:

```text
value
  ↓
value
  ↓
value
  ↓
...
  ↓
termination
```

It is appropriate for contracts such as:

- events
- observations
- updates
- notifications
- asynchronously produced collections
- state changes
- streaming results

Do not use an async sequence for an operation that fundamentally produces one
terminal value.

Prefer:

```swift
func load() async throws -> Value
```

for a single-result operation.

Prefer an async sequence when repeated values are part of the consumer contract.

## Consumer semantics

### SWIFT-CONC-SEQ-010 — Treat `for await` as a long-lived asynchronous operation

For example:

```swift
for await value in values {
    handle(value)
}
```

can remain suspended waiting for future elements for an extended period.

Before starting such consumption, determine:

- who owns the loop
- when it should terminate
- what happens when the consumer disappears
- how cancellation stops it
- whether another consumer may also iterate
- what happens when the producer finishes

Do not treat a `for await` loop as ordinary bounded iteration unless the
sequence's lifetime is actually bounded.

## Suspension

### SWIFT-CONC-SEQ-020 — Every iteration can suspend

Conceptually:

```swift
for await value in sequence {
    ...
}
```

contains repeated suspension opportunities while waiting for the next element.

State assumptions can therefore change between elements.

Do not assume:

```text
iteration N state
```

remains valid when:

```text
iteration N+1
```

arrives.

When processing depends on current actor/session/generation state, revalidate
that ownership at the point where the value is applied.

## Termination

### SWIFT-CONC-SEQ-030 — Define how every long-lived sequence terminates

A sequence should have an understandable terminal contract.

Termination can come from:

- producer completion
- producer failure
- consumer cancellation
- owner shutdown
- resource invalidation
- replacement by a newer sequence
- upstream completion

Do not create an indefinitely suspended sequence without a path that matches
the owning component's lifecycle.

Ask:

```text
What causes next() to stop waiting?
```

If the answer is unclear, the lifecycle is incomplete.

## Normal completion

### SWIFT-CONC-SEQ-040 — Normal completion is part of the sequence contract

When iteration reaches the end:

```swift
for await value in sequence {
    ...
}

// sequence finished
```

the consumer may need to:

- stop observation
- transition state
- release resources
- begin replacement work
- do nothing

depending on the contract.

Do not assume sequence completion is always exceptional.

A finite asynchronous sequence can end successfully.

## Throwing sequences

### SWIFT-CONC-SEQ-050 — Use throwing sequences when the stream itself can fail

A throwing async sequence can model:

```text
value
value
value
error
```

where failure terminates iteration.

Consumers can use:

```swift
do {
    for try await value in sequence {
        handle(value)
    }
} catch {
    handle(error)
}
```

Use throwing semantics when failure is a meaningful terminal state of the
stream.

Do not make a stream throwing merely because an individual element can
represent failure.

If per-element failures are normal data, an element representation such as:

```swift
Result<Value, Error>
```

may express the contract more accurately.

## Terminal error versus element error

### SWIFT-CONC-SEQ-060 — Distinguish stream failure from failed events

These contracts are different:

```text
Event
Event
stream fails
(no more events)
```

and:

```text
Result.success
Result.failure
Result.success
(stream continues)
```

Choose according to whether the error terminates the producer.

Do not convert every failed event into stream termination if later events remain
valid.

Likewise, do not hide a terminal producer failure as one ordinary event when
the stream cannot continue.

## `AsyncStream`

### SWIFT-CONC-SEQ-070 — Use `AsyncStream` to adapt nonthrowing repeated asynchronous callbacks or producers

`AsyncStream` is useful when an existing producer emits zero or more values over
time and completion is nonthrowing.

Conceptually:

```text
callback/event producer
        ↓
AsyncStream
        ↓
async consumer
```

Use it when the underlying contract is genuinely multi-value.

Do not wrap a one-shot callback in `AsyncStream` when an async return or
continuation expresses the operation more directly.

## `AsyncThrowingStream`

### SWIFT-CONC-SEQ-080 — Use `AsyncThrowingStream` when the producer can terminate with an error

For example:

```text
producer
  ├── yield values
  ├── finish successfully
  └── finish with error
```

maps naturally to a throwing stream.

Do not use a throwing stream merely to transport arbitrary errors as data when
the producer remains healthy afterward.

## Continuation ownership

### SWIFT-CONC-SEQ-090 — Give stream continuations an explicit owner

An `AsyncStream` continuation represents the producer's ability to:

- yield
- finish
- react to consumer termination

Determine:

- who stores it
- how long it may be retained
- when it is replaced
- when it is released
- what happens if producer setup fails
- what happens when the consumer stops

Do not store continuations indefinitely without tying them to producer
lifecycle.

## Finish exactly once conceptually

### SWIFT-CONC-SEQ-100 — Every producer lifecycle should have one coherent terminal outcome

A stream may receive attempts to terminate from several paths:

```text
success
failure
cancellation
owner stop
replacement
underlying callback termination
```

Coordinate these paths so the producer has one understandable terminal state.

Do not allow one path to report failure while another simultaneously treats the
same producer as active.

Even where repeated finish attempts are tolerated by the API, the surrounding
component should still have one coherent lifecycle model.

## Yielding after termination

### SWIFT-CONC-SEQ-110 — Do not keep producing values after the stream is logically finished

Once the producer has reached its terminal lifecycle, callbacks or background
work should no longer continue treating the stream as active.

Prevent:

```text
finish
  ↓
later callback
  ↓
attempt to yield stale value
```

through appropriate producer shutdown or lifecycle validation.

Do not rely solely on ignored yields to clean up an upstream producer.

Stop the upstream resource as well.

## `onTermination`

### SWIFT-CONC-SEQ-120 — Use termination handling to release producer-side resources

A stream consumer can disappear because of:

- cancellation
- breaking iteration
- task termination
- stream deallocation/lifecycle
- other terminal behavior

When producer resources should stop with the consumer, termination handling can
be used to:

- remove observer
- cancel subscription
- stop callback source
- close producer
- cancel owned task
- release retained registration

For example conceptually:

```swift
continuation.onTermination = { _ in
    producer.stop()
}
```

Do not treat `onTermination` only as a logging hook when actual resources depend
on stream lifetime.

## Termination ownership

### SWIFT-CONC-SEQ-130 — Do not make cleanup depend only on producer deinitialization

If the producer is retained by:

```text
producer
→ continuation
→ termination closure
→ producer
```

or by another long-lived callback chain, waiting for `deinit` may never trigger
cleanup.

Define explicit stop/termination semantics where needed.

Use `memory-management.md` for deeper ownership analysis.

## Consumer cancellation

### SWIFT-CONC-SEQ-140 — Cancellation should stop sequence consumption according to the contract

A task consuming:

```swift
for await value in sequence {
    ...
}
```

may be cancelled.

The sequence implementation and consuming loop must cooperate with that
cancellation appropriately.

Do not assume cancelling the consuming task automatically stops every upstream
producer.

The producer may need explicit cleanup through termination handling or another
owned cancellation mechanism.

## Upstream cancellation

### SWIFT-CONC-SEQ-150 — Propagate consumer termination upstream when the producer exists only for that consumer

If a callback registration, polling task, socket, or observation exists solely
to serve one stream consumer, consumer termination should normally stop that
resource.

Conceptually:

```text
consumer ends
    ↓
stream termination
    ↓
producer stops
```

Do not keep producing discarded values after all relevant consumers are gone.

If the producer is shared independently by other consumers, do not stop it
merely because one stream iteration ends.

Ownership determines the behavior.

## Breaking iteration

### SWIFT-CONC-SEQ-160 — `break` is a lifecycle event for single-consumer stream adapters

Consider:

```swift
for await value in sequence {
    if isDone(value) {
        break
    }
}
```

The consumer has intentionally stopped reading.

If the upstream resource is owned specifically by that iteration, ensure it can
be cleaned up.

Do not assume only task cancellation matters.

Consumers can stop iteration normally.

## Buffering

### SWIFT-CONC-SEQ-170 — Choose buffering policy from producer/consumer behavior

A producer may emit values faster than the consumer processes them.

This creates a buffering question:

```text
producer rate
    >
consumer rate
```

Possible policies can include:

- retain all values
- retain bounded newest values
- retain bounded oldest values
- drop values
- apply backpressure through a different abstraction

Choose according to whether every event matters.

Do not accept an unbounded buffer by default for a potentially high-volume or
long-lived stream.

## Unbounded buffers

### SWIFT-CONC-SEQ-180 — Treat unbounded buffering as a resource decision

An unbounded stream can grow indefinitely if:

```text
producer continues
+
consumer is slow/stalled
```

This can create:

- memory growth
- stale events
- large latency
- resource exhaustion

Unbounded buffering can be valid when:

- event volume is strictly bounded
- events must never be dropped
- consumer speed is guaranteed
- producer lifetime is short

Do not use it merely because it avoids deciding which events can be discarded.

## Dropping values

### SWIFT-CONC-SEQ-190 — Drop values only when the semantic contract permits it

Some streams represent latest state:

```text
orientation changed
network status changed
progress changed
```

and intermediate values may be safely discarded.

Other streams represent durable events:

```text
transaction
command
audit event
state-machine transition
```

where dropping one can break correctness.

Before choosing a dropping buffer, ask:

```text
Is this stream state or events?
```

Do not apply latest-value behavior to an event stream whose elements must all be
processed.

## State versus event streams

### SWIFT-CONC-SEQ-200 — Model latest state differently from ordered events

A latest-state stream often means:

```text
consumer cares about current value
```

while an event stream means:

```text
consumer cares that every event occurred
```

This distinction affects:

- buffering
- replay
- duplicates
- initial value
- cancellation
- subscriber count

Do not choose one buffering policy for both categories by habit.

## Initial values

### SWIFT-CONC-SEQ-210 — Decide whether a new consumer should receive current state immediately

For state-like streams, a new consumer may need:

```text
current state
then future updates
```

For event streams, replaying a previous event may be incorrect.

Define whether subscription means:

```text
observe from now
```

or:

```text
receive current snapshot then updates
```

Do not inject an initial value solely because it simplifies UI setup if the
stream's contract is event-only.

## Multiple consumers

### SWIFT-CONC-SEQ-220 — Define whether the sequence supports one or many consumers

An `AsyncSequence` abstraction does not automatically define shared broadcast
semantics.

Before exposing one sequence to multiple callers, determine:

- does each consumer get every value?
- do consumers compete for elements?
- is a new producer created per iteration?
- is one shared producer broadcast?
- does one consumer terminating affect the others?

Do not assume an async stream behaves like Combine's `PassthroughSubject` or
another broadcast primitive.

Design multi-consumer semantics explicitly.

## Per-subscriber streams

### SWIFT-CONC-SEQ-230 — A fresh stream per subscriber can simplify ownership

One design is:

```text
consumer A → stream A → registration A
consumer B → stream B → registration B
```

Each consumer owns an independent observation.

This can simplify termination but may duplicate upstream work.

Use it when independent subscriptions are appropriate.

Do not choose it when the upstream resource must be globally shared or is
expensive to duplicate.

## Shared producers

### SWIFT-CONC-SEQ-240 — Shared producers require subscriber lifecycle management

A broadcast-like architecture can look like:

```text
shared producer
     ↓
subscriber registry
 ├── consumer A
 ├── consumer B
 └── consumer C
```

Then the owner must define:

- registration
- removal
- buffering per subscriber
- slow consumers
- producer startup
- producer shutdown when subscriber count reaches zero
- concurrent mutation of subscriber registry

Do not implement shared stream broadcasting as a dictionary of continuations
without an explicit synchronization and cleanup model.

## Continuation registries

### SWIFT-CONC-SEQ-250 — Protect continuation collections under one authoritative isolation boundary

When storing multiple continuations, registry operations such as:

```text
add
remove
yield to subscribers
finish all
replace
```

form shared mutable state.

Protect them through:

- actor
- lock
- serial queue
- another established synchronization boundary

according to the architecture.

Do not allow termination callbacks and producer callbacks to mutate the same
registry independently without synchronization.

## Subscriber identity

### SWIFT-CONC-SEQ-260 — Give subscriptions stable identity when removal must target one consumer

A shared producer may need to remove precisely the continuation belonging to
one terminated consumer.

Use an appropriate subscription identity.

Do not remove:

```text
all continuations
```

when one subscriber terminates unless the entire producer contract is
single-consumer.

Likewise, do not rely on closure/reference identity accidentally if the
subscription already has a clearer identifier.

## Race during registration

### SWIFT-CONC-SEQ-270 — Register before events can be lost when the consumer contract requires every subsequent event

Consider:

```text
read current state
      ↓
register observer
```

An event can occur between those operations.

If the contract is:

```text
current state + all later events
```

that gap may lose an update.

Depending on the architecture, use:

- one isolated registration/snapshot operation
- versioning
- framework-supported observation semantics
- replay/current-value mechanism

Do not assume initialization and observation are atomic when they occur through
separate boundaries.

## Race during termination

### SWIFT-CONC-SEQ-280 — Coordinate producer callbacks with subscriber removal

A termination path can race with a producer yielding a new element.

Ensure the continuation registry or producer state handles:

```text
yield
vs
remove/finish
```

through one synchronization model.

Do not rely on timing such as:

```text
termination usually happens after callbacks stop
```

if both paths can actually overlap.

## Callback adaptation

### SWIFT-CONC-SEQ-290 — Preserve callback cardinality when adapting to AsyncSequence

Before adapting a callback API, establish whether the callback:

- emits once
- emits repeatedly
- emits until explicit unregister
- has separate failure callback
- has completion callback
- can emit after unregister request
- has documented queue/executor behavior

Use async sequence only when repeated values are part of the real callback
contract.

Do not turn an accidental duplicate callback bug into a legitimate sequence
simply because `AsyncStream` accepts multiple values.

## Delegate adaptation

### SWIFT-CONC-SEQ-300 — Do not assume one delegate maps to one stream automatically

A delegate may contain several logically distinct event channels:

```text
statusChanged
didReceiveData
didFail
didFinish
```

Decide whether they form:

- one event enum stream
- several specialized streams
- one terminal sequence
- a state owner with derived streams

according to consumer needs.

Do not collapse unrelated delegate callbacks into a loosely typed stream merely
to expose one AsyncSequence.

## Event enums

### SWIFT-CONC-SEQ-310 — Use an event enum when several callbacks form one ordered event domain

For example:

```swift
enum SessionEvent: Sendable {
    case started
    case value(Value)
    case interrupted
    case finished
}
```

can preserve event ordering when those events belong to one lifecycle.

This is often clearer than multiple streams when consumers must understand
their relative order.

Do not create a giant event enum combining unrelated subsystem concerns.

## Stream APIs and state APIs

### SWIFT-CONC-SEQ-320 — Do not force consumers to observe a stream merely to read current state

If a component owns authoritative state, it can be useful to expose both:

```text
current value
```

and:

```text
future updates
```

when consumers legitimately need both.

For example conceptually:

```swift
func status() -> Status
func statusUpdates() -> AsyncStream<Status>
```

or an equivalent isolation-aware API.

Do not require a consumer to start a stream and wait indefinitely simply to know
the current state if the component can provide it directly.

Likewise, avoid duplicating state ownership between the property and stream.

The stream should derive from the same authoritative state.

## Duplicate values

### SWIFT-CONC-SEQ-330 — Decide whether duplicate elements are meaningful

For some state streams:

```text
ready
ready
```

may be redundant.

For event streams, repeated identical values may represent distinct events.

Do not automatically deduplicate every async sequence.

Deduplication changes observable semantics.

Apply it only when identity/equality semantics establish that the repeated value
is genuinely redundant.

## Ordering

### SWIFT-CONC-SEQ-340 — Preserve event ordering when it is part of correctness

If a producer guarantees:

```text
started
value
finished
```

do not introduce independent tasks that can reorder publication:

```swift
Task { continuation.yield(.started) }
Task { continuation.yield(.finished) }
```

Task scheduling may not preserve the intended event order.

Publish related events through one authoritative serialization boundary.

Do not equate callback arrival order with consumer observation order after
introducing new asynchronous hops.

## Avoid task-per-yield

### SWIFT-CONC-SEQ-350 — Do not create a new unstructured task for every element unless a real isolation hop requires it

A pattern like:

```swift
Task {
    continuation.yield(value)
}
```

for every callback can:

- reorder values
- create unbounded task fan-out
- obscure producer lifetime
- complicate cancellation

If yielding is already safe under the producer's synchronization contract, do
it directly.

If an isolation transition is required, route events through one ordered owner
rather than arbitrary independent tasks.

## Slow consumers

### SWIFT-CONC-SEQ-360 — Define what happens when consumers cannot keep up

Possible contracts include:

```text
buffer everything
drop oldest
drop newest
latest state only
slow producer
disconnect consumer
```

The correct behavior depends on the event semantics.

Do not leave slow-consumer behavior to accidental memory growth.

For shared producers, consider whether one slow subscriber should affect other
subscribers.

## Backpressure

### SWIFT-CONC-SEQ-370 — Do not assume `AsyncStream` inherently provides backpressure

A producer using continuation-based yielding can often continue producing
without synchronously waiting for the consumer to finish processing each
element.

If producer rate must be constrained by consumer demand, choose an abstraction
or design that actually expresses that requirement.

Do not use bounded buffering and assume it automatically means producer
backpressure.

Dropping values and slowing production are different policies.

## Cancellation during element processing

### SWIFT-CONC-SEQ-380 — Consumer cancellation can occur while processing an element

A loop may be cancelled after receiving a value but before completing its side
effects.

For example:

```swift
for await event in events {
    await process(event)
}
```

If `process(event)` suspends, cancellation and replacement can occur during that
work.

When stale processing can mutate authoritative state, validate operation
ownership before committing.

Do not assume consuming one element is atomic.

## Concurrent element processing

### SWIFT-CONC-SEQ-390 — Preserve sequential processing unless parallelism is intentional

A straightforward:

```swift
for await value in sequence {
    await process(value)
}
```

processes values sequentially from the consumer's perspective.

Changing it to:

```swift
for await value in sequence {
    Task {
        await process(value)
    }
}
```

changes the contract to overlapping unstructured work and can reorder
completion.

Do not parallelize stream processing merely for throughput when event ordering
or shared state matters.

If concurrent processing is required, define:

- concurrency limit
- ordering
- error behavior
- cancellation
- result aggregation

explicitly.

## Streams as state-machine inputs

### SWIFT-CONC-SEQ-400 — Serialize related event streams before mutating one state machine

If several async sequences feed one authoritative state:

```text
stream A ─┐
stream B ─┼→ state machine
stream C ─┘
```

independent consumer tasks can produce interleaving behavior.

Route resulting transitions through one authoritative isolation boundary.

Do not allow each consumer task to mutate state independently without defining
ordering and transition validity.

## Multiple observation tasks

### SWIFT-CONC-SEQ-410 — Give each long-lived consumer task ownership

A component consuming several streams may own several tasks:

```text
owner
 ├── status observation task
 ├── connectivity observation task
 └── events observation task
```

This can be valid when each stream has an independent lifecycle.

Define:

- when all are started
- whether duplicate start is allowed
- when they stop
- whether failure of one affects others
- teardown behavior

Do not create observation tasks repeatedly without cancelling/replacing prior
consumers.

Use `tasks.md` for lifecycle management.

## Streams and actor isolation

### SWIFT-CONC-SEQ-420 — Re-enter the actor that owns mutable state

A sequence can be consumed from a task while each event updates an actor-owned
component.

Ensure mutations occur through the actor's isolation.

Do not assume the stream itself serializes all other access to that state.

The stream orders its own elements.

The actor owns the complete mutable state.

## Values crossing isolation

### SWIFT-CONC-SEQ-430 — Sequence elements must respect transfer semantics

Values emitted across task/actor boundaries should have a valid transfer model.

Prefer:

- immutable values
- identifiers
- snapshots
- other safely transferable representations

when crossing isolation domains.

Do not use a stream as a mechanism for exporting mutable framework-confined
objects into arbitrary tasks.

Use `sendable.md` and applicable framework guidance when element types are
ownership-sensitive.

## Stream producer tasks

### SWIFT-CONC-SEQ-440 — If a stream starts an internal producer task, own that task explicitly

For example, a stream adapter might start:

```text
producer task
    ↓
poll
    ↓
yield values
```

Then termination should generally stop that task when the task exists solely
for the stream.

Avoid:

```text
stream created
→ producer Task starts
→ consumer disappears
→ producer continues forever
```

Store or otherwise connect the task to stream termination.

Use `tasks.md` for task lifecycle details.

## Polling streams

### SWIFT-CONC-SEQ-450 — Polling sequences need cancellation, delay, and failure policy

A polling producer should define:

- interval
- cancellation
- transient failure
- terminal failure
- backoff if applicable
- duplicate state behavior
- owner lifecycle

Do not implement:

```swift
while true {
    continuation.yield(await load())
}
```

without termination and resource policy.

## Errors during polling

### SWIFT-CONC-SEQ-460 — Decide whether a polling error terminates the stream

Depending on the product contract:

```text
one fetch fails
```

may mean:

```text
stream terminates
```

or:

```text
emit failure event / retry later
```

or:

```text
ignore transient failure and continue
```

Choose explicitly.

Do not automatically make every transient network failure terminal merely
because the producer uses `AsyncThrowingStream`.

## Resource adapters

### SWIFT-CONC-SEQ-470 — Tie external registrations to stream lifecycle

When adapting:

- notification observation
- delegate subscription
- socket callbacks
- filesystem observation
- framework listeners

ensure the registration is removed when the stream no longer needs it.

Conceptually:

```text
create stream
    ↓
register producer
    ↓
yield
    ↓
consumer terminates
    ↓
unregister producer
```

Do not leave registrations alive after stream termination.

## Async iterators

### SWIFT-CONC-SEQ-480 — Treat iterator state as part of sequence semantics

Custom `AsyncIteratorProtocol` implementations own state involved in producing
the next element.

If iterator state is mutable and can be accessed concurrently, define its
isolation.

Do not assume consumers will safely call `next()` concurrently unless the
sequence explicitly supports such usage.

Keep iterator behavior consistent with the sequence's documented consumption
contract.

## Custom AsyncSequence implementations

### SWIFT-CONC-SEQ-490 — Prefer `AsyncStream` for straightforward callback adaptation

A custom `AsyncSequence` is useful when the sequence needs specialized:

- iteration behavior
- laziness
- state
- resource management
- backpressure
- transformation

Do not implement custom sequence/iterator types merely because `AsyncSequence`
is extensible.

For simple callback-to-values adaptation, `AsyncStream` or
`AsyncThrowingStream` often provides a clearer contract.

## Transformation

### SWIFT-CONC-SEQ-500 — Keep sequence transformations semantically explicit

Operations such as:

```text
map
filter
compactMap
debounce
throttle
merge
combine
```

can alter:

- timing
- buffering
- ordering
- cancellation
- failure
- duplicate behavior

When using standard-library or package-provided transformations, reason about
those semantics.

Do not treat async transformations as equivalent to their synchronous
collection counterparts when timing and lifetime matter.

Load `async-algorithms.md` when the Swift Async Algorithms package provides the
operators involved.

## Debounce

### SWIFT-CONC-SEQ-510 — Debounce represents latest-after-quiet-period semantics

A debounced event pipeline typically means:

```text
events continue
→ previous pending emission replaced
→ quiet period occurs
→ latest value emitted
```

Use it for contracts such as user-input stabilization or repeated state
changes.

Do not debounce events that must all be observed.

Debouncing intentionally discards intermediate timing events.

## Throttle

### SWIFT-CONC-SEQ-520 — Throttle represents rate-limited observation

Throttling limits how frequently values are delivered according to its selected
policy.

This can be useful for high-frequency state such as:

- progress
- sensor-like updates
- UI refresh signals

Do not throttle correctness-critical event streams unless dropping or delaying
events is explicitly safe.

## Merge

### SWIFT-CONC-SEQ-530 — Merging streams creates an ordering problem

When two asynchronous sources are merged:

```text
sequence A ─┐
            ├→ merged sequence
sequence B ─┘
```

relative ordering between simultaneously available values may depend on runtime
completion.

Do not assume deterministic cross-source ordering unless the merge abstraction
explicitly guarantees it.

If domain ordering matters, include:

- sequence numbers
- timestamps with defined semantics
- one authoritative producer
- explicit serialization

according to the contract.

## Stream replacement

### SWIFT-CONC-SEQ-540 — Stop old consumption when switching to a replacement source

Consider:

```text
observe session A
session replaced by B
observe session B
```

The consumer of A must not continue mutating state belonging to B.

When replacing streams:

- cancel old consumer
- terminate old producer if owned
- establish new generation/session identity
- reject stale values when necessary

Do not rely only on replacing a stored sequence variable.

An existing consumer task may still be running.

## Stale values

### SWIFT-CONC-SEQ-550 — Validate values against the current owning generation when replacement can race termination

Cancellation is cooperative.

An old sequence consumer may receive or process an element after replacement
has begun.

If that element can corrupt newer state, check:

```text
session ID
generation
source identity
operation token
```

or another authoritative owner marker before committing it.

Do not assume `cancel()` synchronously guarantees that no more consumer-side
code executes.

## Stream ownership in APIs

### SWIFT-CONC-SEQ-560 — Make sequence creation semantics clear to callers

An API like:

```swift
func updates() -> AsyncStream<Update>
```

should have understandable semantics around whether each call creates:

- a new independent subscription
- another subscriber to one shared producer
- a replay/current-state stream
- a single-consumer sequence

Do not expose ambiguous stream factories whose repeated invocation accidentally
duplicates listeners or work.

## One method versus stored sequence

### SWIFT-CONC-SEQ-570 — Prefer an API shape matching subscription lifecycle

A method:

```swift
func updates() -> AsyncStream<Update>
```

can communicate:

```text
calling creates/obtains a subscription
```

A stored property:

```swift
let updates: AsyncStream<Update>
```

can imply one stable sequence object.

Either may be appropriate.

Choose based on whether iteration/subscription semantics are:

- repeatable
- single-consumer
- shared
- recreated

Do not select API shape solely from syntactic preference.

## Public sequence APIs

### SWIFT-CONC-SEQ-580 — Document lifecycle and buffering for supported sequence APIs

When consumers depend on a public async sequence, document relevant behavior
such as:

- what elements mean
- whether current state is emitted initially
- ordering guarantees
- duplicate behavior
- buffering/drop behavior
- terminal success/failure
- cancellation
- multiple-subscriber semantics

Do not expose a public stream whose correctness depends on undocumented
implementation timing.

Use the Swift documentation and API-design skills when the surface is
consumer-facing.

## Memory management

### SWIFT-CONC-SEQ-590 — Trace producer, continuation, task, and owner references

A long-lived stream architecture can contain:

```text
owner
 ↓
consumer task
 ↓
sequence
 ↓
continuation
 ↓
termination closure
 ↓
producer / owner
```

or other cycles.

Do not assume `[weak self]` at one closure resolves the complete lifecycle.

Trace:

- who retains the continuation
- who retains the consumer task
- who retains producer callbacks
- what terminal event breaks each path

Use `memory-management.md` for deeper analysis.

## Infinite sequences

### SWIFT-CONC-SEQ-600 — Infinite sequences require explicit lifecycle ownership

A sequence that conceptually never completes can be correct for:

- application notifications
- session events
- hardware events
- state observation

But its consumer should not be ownerless.

Define:

```text
start
stop
replacement
cancellation
owner teardown
```

Do not rely on natural sequence completion when the producer is designed to
continue forever.

## Finite sequences

### SWIFT-CONC-SEQ-610 — Do not add long-lived lifecycle infrastructure to naturally finite sequences

Some async sequences represent bounded asynchronous production:

```text
page 1
page 2
page 3
finished
```

If completion is naturally guaranteed, avoid unnecessary stored task and stop
infrastructure unless callers need explicit cancellation/control.

Lifecycle complexity should match the producer.

## Testing

### SWIFT-CONC-SEQ-620 — Test elements, ordering, and termination separately when relevant

A stream test may need to prove:

```text
expected values emitted
+
correct order
+
correct terminal behavior
```

These are distinct properties.

Do not consider:

```text
received one expected value
```

sufficient coverage when the regression concerns termination or ordering.

### SWIFT-CONC-SEQ-621 — Control producer events deterministically

Prefer a test producer that lets the test explicitly:

```text
yield value A
yield value B
finish
```

and then assert consumer behavior.

Do not depend on arbitrary delays to wait for real background events.

### SWIFT-CONC-SEQ-622 — Test consumer cancellation cleanup

When consumer cancellation must release producer resources, verify:

```text
start subscription
    ↓
cancel consumer
    ↓
producer unregisters/stops
```

Do not test only that the consuming task reports cancellation.

The important contract may be upstream cleanup.

### SWIFT-CONC-SEQ-623 — Test replacement and stale-event rejection

When a component replaces one observation source with another, test:

```text
source A active
source B replaces A
late A event arrives
```

and assert A cannot mutate B-owned state.

Control the ordering deliberately.

Do not rely on timing races.

## Debugging

### SWIFT-CONC-SEQ-630 — Trace both producer and consumer lifecycle

When a sequence:

- stops unexpectedly
- never stops
- duplicates values
- leaks
- reorders events
- grows memory

inspect:

```text
producer creation
continuation storage
yield paths
buffering policy
finish paths
onTermination
consumer task
consumer cancellation
replacement
upstream resource
```

Do not investigate only the `for await` loop.

The defect may live entirely on the producer side.

## Common failure: silent termination

### SWIFT-CONC-SEQ-640 — Do not allow an observation stream to terminate while the owner still reports active observation

If a component's state says:

```text
observing
```

but the consumer task or sequence has already ended, the system can silently
stop receiving updates.

When observation is required for active state, decide whether unexpected stream
completion should:

- transition state
- restart
- surface failure
- be considered normal

Do not leave lifecycle state claiming active work that no longer exists.

## Common failure: duplicate observation

### SWIFT-CONC-SEQ-650 — Prevent repeated start from creating duplicate consumers

Calling:

```text
startObservation()
startObservation()
```

should have defined behavior.

Possible contracts include:

```text
second call ignored
old observation replaced
multiple subscribers intentionally created
```

Do not accidentally create multiple consumer tasks that all apply the same
events.

Duplicate observation can cause:

- repeated callbacks
- duplicate mutations
- inconsistent state transitions
- unnecessary resource use

## Common failure: producer survives consumer

### SWIFT-CONC-SEQ-660 — Stop orphaned producers

If a sequence owns:

- observer token
- delegate bridge
- polling task
- callback registration
- socket/event source

and the consumer disappears, ensure that producer does not remain active
without purpose.

Do not mistake:

```text
nobody reads the continuation anymore
```

for:

```text
upstream producer stopped
```

Those are separate lifecycle events.

## Common failure: consumer survives owner

### SWIFT-CONC-SEQ-670 — Stop long-lived consumption when its semantic owner ends

An owner can disappear logically before deallocation:

```text
session stopped
feature closed
controller replaced
logout
resource disconnected
```

Stop observation at that semantic boundary.

Do not wait only for `deinit` when the object can remain retained or reused
after its active lifecycle ends.

## Common failure: sequence used as synchronization primitive

### SWIFT-CONC-SEQ-680 — Do not assume stream consumption makes unrelated mutable state safe

A sequence orders values produced by that sequence.

It does not automatically serialize:

- other tasks
- direct method calls
- other streams
- callbacks
- shared mutable references

If several paths mutate one state owner, route them through an actor, lock,
queue, or other authoritative isolation boundary.

Do not call a type thread-safe simply because updates arrive through
`AsyncStream`.

## Validation checklist

When async-sequence behavior changes, verify when applicable:

- repeated asynchronous values are the correct API contract
- single-result operations are not modeled as streams unnecessarily
- long-lived consumer loops have an explicit owner
- every producer has coherent normal/error/cancellation termination
- consumer termination releases producer resources when ownership requires it
- continuations do not remain retained indefinitely
- stale callbacks do not yield after logical producer termination
- throwing versus nonthrowing semantics match whether stream failure is
  terminal
- per-element failures are not confused with terminal stream failures
- buffering policy matches event semantics and expected producer rate
- potentially unbounded streams do not accumulate unbounded memory accidentally
- state streams and event streams use appropriate replay/drop semantics
- multiple-consumer semantics are explicitly defined
- shared continuation registries have one synchronization boundary
- subscriber termination removes only the correct subscription
- registration does not lose events across snapshot/subscription races when all
  updates matter
- callback adaptation preserves actual callback cardinality
- event ordering is not accidentally changed by task-per-yield publication
- concurrent element processing is introduced only when ordering semantics
  permit it
- old stream consumers cannot mutate replacement-owner state
- public sequence APIs document lifecycle, buffering, ordering, and
  subscription behavior when these are consumer-visible
- producer tasks terminate with their owned stream
- observation state cannot remain active after the underlying sequence has
  terminated unexpectedly
- repeated start does not create unintended duplicate consumers
- tests control producer events, termination, cancellation, and replacement
  deterministically

Do not treat `AsyncStream`, `AsyncThrowingStream`, `for await`, or a successful
yield as proof that buffering, cancellation, producer lifetime, ordering,
multi-subscriber behavior, and cleanup are correct.