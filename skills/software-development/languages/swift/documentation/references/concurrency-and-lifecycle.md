# Swift Concurrency and Lifecycle Documentation

Use this reference when Swift DocC materially affects async operations,
cancellation, actor isolation, overlapping calls, ordering, observation,
streams, callbacks, long-lived tasks, resource lifetime, start/stop behavior,
interruption, retry, replacement, or other consumer-visible concurrency and
lifecycle contracts.

This reference focuses on **documenting how an operation or resource behaves
over time from the consumer's point of view**.

Use:

- `public-api.md` for overall consumer-facing documentation scope.
- `parameters-returns-errors.md` for invocation-level parameters, results,
  failures, preconditions, and immediate side effects.
- `symbols-and-links.md` for DocC symbol links and navigation.
- `maintenance.md` for keeping lifecycle documentation synchronized with
  implementation and API evolution.
- the Swift API-design skill for the actual concurrency, state, ownership, and
  error contracts.
- the Swift concurrency skill for implementation-level actors, tasks,
  cancellation, Sendability, streams, locks, and queues.

Project-specific lifecycle models, concurrency guarantees, supported language
mode, actor-isolation configuration, framework constraints, and repository
documentation rules take precedence over this generic guidance.

## Concurrency documentation baseline

### SWIFT-DOC-CONC-001 — Document observable concurrency semantics, not implementation machinery

A consumer may need to know:

```text
Can calls overlap?
Can two operations run at once?
Does a new call replace an old one?
Does cancellation stop the operation?
When does an async method return?
On which isolation domain are callbacks delivered?
What happens during interruption?
When are resources actually released?
```

These are useful API guarantees.

Consumers usually do not need to know:

```text
which internal Task runs
which actor owns storage
which lock is acquired
which serial queue is used
how many internal jobs exist
```

Document the semantic contract.

Keep synchronization topology internal unless it is intentionally part of the
supported API.

## Async APIs

### SWIFT-DOC-CONC-010 — Explain what successful async return means when it is not obvious

For:

```swift
try await session.start()
```

the important consumer question is:

```text
What is true after this returns?
```

Useful documentation might say:

```text
Returns after the session reaches its active state.
```

or:

```text
Returns after the start request is accepted; initialization continues
asynchronously.
```

These are materially different contracts.

Do not assume `async` communicates the completion boundary.

## Async does not mean background

### SWIFT-DOC-CONC-020 — Do not describe an async method as running "in the background" without a precise contract

Avoid:

```text
Runs in the background.
Runs on a background thread.
Executes asynchronously in the background.
```

unless the API intentionally guarantees something specific about application
background execution or execution context.

`async` means the operation can suspend.

It does not inherently communicate:

- thread
- queue
- parallelism
- application background execution

Document the behavior consumers can rely upon instead.

## Suspension

### SWIFT-DOC-CONC-030 — Do not document suspension mechanics unless callers need to account for them

Consumers normally do not need statements such as:

```text
This method suspends three times.
```

They may need to know:

```text
State can change while this operation is awaiting another dependency.
```

only if that creates a public semantic effect.

Prefer describing resulting behavior:

```text
The operation may fail if the session is replaced before processing completes.
```

rather than internal suspension implementation.

## Completion boundary

### SWIFT-DOC-CONC-040 — Make terminal completion precise for lifecycle methods

For:

```swift
await recorder.stop()
```

possible meanings include:

```text
stop requested
```

```text
capture stopped
```

```text
output fully finalized
```

```text
all resources released
```

These are not equivalent.

Document the strongest consumer-visible point guaranteed at return.

Do not write:

```text
Stops the recorder.
```

when callers need to know whether teardown has actually completed.

## Long-running operations

### SWIFT-DOC-CONC-050 — Distinguish starting an operation from awaiting its terminal result

A long-lived API can be modeled as:

```text
start
↓
active operation
↓
progress/events
↓
stop/cancel
↓
terminal result
```

Document which method owns which part of the lifecycle.

Avoid making consumers infer whether:

```swift
start()
```

returns immediately while the operation continues or waits for terminal
completion.

## Fire-and-forget

### SWIFT-DOC-CONC-060 — Avoid "fire-and-forget" as a substitute for lifecycle documentation

If an operation intentionally continues independently after the initiating call,
document:

- who owns it
- how it is stopped
- how errors are surfaced
- whether it survives the initiating object
- how consumers observe completion

Do not say only:

```text
Starts a fire-and-forget task.
```

That describes implementation style, not a consumer contract.

## Overlapping calls

### SWIFT-DOC-CONC-070 — Document overlap policy when callers can invoke an operation concurrently

For:

```swift
func process(_ asset: Asset) async throws -> Result
```

consumers may need to know whether several calls:

```text
run independently
serialize
replace each other
join existing work
are rejected
```

Document this when the distinction affects correct usage.

Do not document concurrency limits that are merely current performance
implementation details.

## Independent operations

### SWIFT-DOC-CONC-080 — State independence only when it is a supported guarantee

If:

```text
each call to `process(_:)` is independent
```

and callers can safely run several operations concurrently, that can be useful
documentation.

Do not infer independence from implementation merely because each call creates
a new Task.

The guarantee should come from the API design.

## Serialized operations

### SWIFT-DOC-CONC-090 — Describe semantic serialization rather than internal queues

Prefer:

```text
Only one recording can be active at a time.
```

over:

```text
Recording operations are serialized on `recordingQueue`.
```

The first statement survives implementation changes.

The second unnecessarily exposes internal topology.

## Duplicate calls

### SWIFT-DOC-CONC-100 — Document repeated-call semantics when they are meaningful

For lifecycle methods such as:

```swift
start()
stop()
cancel()
resume()
```

consumers may need to know whether repeated invocation:

- succeeds as a no-op
- throws an invalid-state error
- joins an existing transition
- replaces in-progress work

Document domain behavior.

Do not use vague terms such as:

```text
safe to call multiple times
```

without explaining what actually happens.

## Idempotency

### SWIFT-DOC-CONC-110 — Use "idempotent" only when the API actually provides idempotent semantics

If:

```text
calling stop repeatedly has the same final effect and does not create additional
side effects
```

then documenting stop as idempotent can be useful.

Do not call an API idempotent merely because repeated calls currently happen not
to crash.

Use plain behavioral wording when that is clearer.

## Replacement

### SWIFT-DOC-CONC-120 — Document latest-wins or replacement behavior explicitly

If:

```text
starting a new search cancels and supersedes the previous search
```

say so.

Consumers may need to understand whether an older result can still arrive.

Example:

```text
Starting a new request cancels the previous request. Results from superseded
requests are not published.
```

Do not expose internal generation identifiers or task handles.

Document the public replacement guarantee.

## Joining existing work

### SWIFT-DOC-CONC-130 — Document deduplicated shared work when it affects callers

If several equivalent requests share one active operation:

```text
multiple callers
      ↓
one in-flight request
```

consumers may need to know whether:

- cancellation by one caller affects others
- results are shared
- repeated calls return the same handle

Document those semantics if they are supported.

Do not document an internal cache of Tasks unless the sharing behavior itself is
the contract.

## Ordering

### SWIFT-DOC-CONC-140 — Document only ordering guarantees consumers can rely on

Useful examples include:

```text
Status updates are emitted in transition order.
```

```text
Results are returned in the same order as the input assets.
```

```text
No ordering is guaranteed between independently started operations.
```

Do not promise FIFO behavior merely because the current implementation uses a
serial queue.

## Invocation order versus completion order

### SWIFT-DOC-CONC-150 — Do not imply that earlier calls complete first unless guaranteed

For concurrent operations:

```text
A starts
B starts
B completes
A completes
```

may be valid.

If consumer logic must account for this, document the lack of completion-order
guarantee or the replacement policy.

Do not imply ordering through examples that always await sequentially if the API
itself supports overlap.

## Actor isolation

### SWIFT-DOC-CONC-160 — Document isolation only when it affects how consumers call the API

If a declaration is:

```swift
@MainActor
public final class CameraViewModel
```

the annotation itself already communicates substantial information to Swift
callers.

Additional prose is useful only when semantic context matters, for example:

```text
All observable UI state is isolated to the main actor.
```

Do not explain:

```text
Swift schedules the method through MainActor's executor.
```

That is implementation/language mechanics rather than API guidance.

## MainActor

### SWIFT-DOC-CONC-170 — Do not equate MainActor with "main thread" documentation mechanically

When consumers need a UI-isolation guarantee, use the project's established
terminology.

Prefer:

```text
The callback is delivered on the main actor.
```

when that is the supported Swift contract.

Avoid adding prose such as:

```text
This always executes on thread 1.
```

unless the framework explicitly defines such a runtime requirement.

## Nonisolated APIs

### SWIFT-DOC-CONC-180 — Do not document `nonisolated` unless the distinction helps consumers

The source annotation generally communicates the compiler contract.

Documentation may clarify semantic independence when useful:

```text
The identifier is immutable and can be read without entering the session's
isolation domain.
```

Do not turn documentation into a tutorial about `nonisolated`.

## Sendability

### SWIFT-DOC-CONC-190 — Document Sendable semantics only when consumers need a stronger domain guarantee

A public type conforming to `Sendable` already communicates compiler-level
transfer capability.

Usually there is no need for:

```text
This type is Sendable.
```

Useful documentation might instead clarify domain semantics such as:

```text
Instances are immutable snapshots and can be passed between concurrent
operations independently.
```

Do not describe a mutable internally synchronized object as merely
"thread-safe" without defining supported concurrent use.

## "Thread-safe"

### SWIFT-DOC-CONC-200 — Replace vague thread-safety claims with concrete guarantees

Avoid:

```text
This class is thread-safe.
```

Prefer specific statements such as:

```text
`process(_:)` may be called concurrently.
```

```text
Only one active recording is supported per controller.
```

```text
State updates are main-actor isolated.
```

```text
Configuration must not be mutated after the session starts.
```

Concrete contracts are easier to test and maintain.

## Cancellation baseline

### SWIFT-DOC-CONC-210 — Document the semantic effect of cancellation

Consumers may need to know:

```text
What stops?
What remains?
What result is produced?
What resources are released?
Does already-committed work remain?
```

Example:

```text
Cancelling the export stops remaining processing and removes incomplete output.
```

or:

```text
Cancellation stops local observation but does not revoke media already accepted
by the server.
```

Do not document only:

```text
The method supports cancellation.
```

## Cooperative cancellation

### SWIFT-DOC-CONC-220 — Do not promise immediate termination unless supported

If cancellation is cooperative, avoid language such as:

```text
Calling cancel immediately terminates all work.
```

when dependencies may take time to stop.

Prefer:

```text
Calling `cancel()` requests cancellation. The operation transitions to its
terminal cancelled state after active processing stops.
```

if that reflects the contract.

## Task cancellation

### SWIFT-DOC-CONC-230 — Document task-cancellation behavior only when the public async operation participates meaningfully

For an async function, consumers may need to know that cancelling the calling
Task:

```text
cancels the underlying operation
```

or:

```text
only stops waiting while the underlying operation continues
```

if those semantics materially differ.

Do not state:

```text
Supports Swift cancellation.
```

without explaining the observable consequence when that consequence is
non-obvious.

## Explicit cancellation API

### SWIFT-DOC-CONC-240 — Explain how explicit cancellation relates to task cancellation

If an operation supports both:

```swift
task.cancel()
```

and:

```swift
operation.cancel()
```

clarify their semantic relationship when consumers need both models.

For example:

```text
Cancelling the awaiting task does not cancel the shared upload. Call
``UploadTask/cancel()`` to stop the upload itself.
```

This distinction is crucial for shared or manager-owned work.

## Cancellation races

### SWIFT-DOC-CONC-250 — Document terminal precedence only when consumers can observe the race

An operation can race:

```text
completion
vs
cancellation
```

If the API guarantees one outcome after commit, document it.

Example:

```text
Cancellation has no effect after the upload reaches its completed state.
```

Do not explain internal callback race resolution unless it affects public
terminal behavior.

## Partial work after cancellation

### SWIFT-DOC-CONC-260 — State whether partial output remains when that matters

Cancellation can leave:

- partial file
- remote side effect
- persisted record
- temporary cache
- no output

Consumers need this information when cleanup/retry depends on it.

Document ownership of remaining resources.

Do not imply rollback if only best-effort cleanup occurs.

## Lifecycle baseline

### SWIFT-DOC-LIFE-001 — Document semantic lifecycle rather than ARC lifetime

For stateful resources, describe:

```text
created
prepared
active
paused
stopped
completed
failed
cancelled
```

according to supported domain concepts.

Avoid describing lifecycle only as:

```text
object initialized
object deallocated
```

when resource activity has an independent semantic lifetime.

## Construction

### SWIFT-DOC-LIFE-010 — Clarify whether initialization activates the resource

For:

```swift
let session = Session(configuration: configuration)
```

consumers may need to know whether construction:

```text
only creates configuration/state
```

or:

```text
also starts hardware/network observation
```

Document this distinction when it affects usage.

Do not force consumers to inspect initializer implementation.

## Start

### SWIFT-DOC-LIFE-020 — Document the state reached after a successful start

For:

```swift
try await session.start()
```

say what successful return establishes when not obvious.

Examples:

```text
Returns after capture begins.
```

```text
Returns after the connection is established and ready to send data.
```

Do not document internal preparation stages unless exposed publicly.

## Stop

### SWIFT-DOC-LIFE-030 — Document whether stop waits for teardown

For:

```swift
await session.stop()
```

possible guarantees include:

- no additional data will be produced
- callbacks have stopped
- resources have been released
- output has been finalized

State the meaningful completion boundary.

Do not imply full teardown if cleanup can still continue.

## Close

### SWIFT-DOC-LIFE-040 — Distinguish terminal close from reusable stop

If:

```text
stop
→ resource may start again
```

but:

```text
close
→ resource cannot be reused
```

document that distinction.

Do not use `stop`, `close`, and `cancel` interchangeably in prose when the API
assigns different semantics.

## Restart

### SWIFT-DOC-LIFE-050 — Document restart support only when callers can rely on it

If a stopped resource may later be started again, say so when non-obvious.

If the object is one-shot after terminal completion, state that where consumers
would otherwise reasonably attempt reuse.

Do not promise restart because current implementation happens to allow it.

## Pause and resume

### SWIFT-DOC-LIFE-060 — Explain what state is preserved during pause

Consumers may need to know whether pause preserves:

- accumulated output
- session identity
- configuration
- progress
- resources
- connection state

Document only the domain-visible behavior.

Do not describe which internal Task is suspended.

## Interruption

### SWIFT-DOC-LIFE-070 — Distinguish expected interruption from failure

For APIs affected by:

- audio session interruptions
- application lifecycle
- device/resource loss
- connectivity

consumers may need to understand:

```text
interrupted
≠ necessarily failed
```

Document whether the operation:

- pauses
- resumes automatically
- requires explicit recovery
- becomes terminal

according to the supported policy.

## Automatic recovery

### SWIFT-DOC-LIFE-080 — Document automatic recovery behavior when callers need to coordinate with it

Example:

```text
When an interruption ends, the session automatically attempts to resume if it
was recording before the interruption.
```

If recovery can fail, document the resulting public state/error behavior.

Do not expose internal retry loops or recovery tasks.

## Manual recovery

### SWIFT-DOC-LIFE-090 — Make required consumer recovery actions explicit

If consumers must call:

```swift
resume()
```

or:

```swift
restart()
```

after interruption, documentation should make that obligation clear.

Do not require consumers to infer recovery from status names alone.

## Failure lifecycle

### SWIFT-DOC-LIFE-100 — Explain whether failure is terminal or recoverable

A `.failed` state can mean:

```text
object permanently unusable
```

or:

```text
operation failed, but another attempt may start
```

These are different lifecycle contracts.

Document recoverability where consumers must decide what to do next.

## Terminal state

### SWIFT-DOC-LIFE-110 — Make terminal states distinguishable from active/transitional states

Consumers may need to know when:

```text
no more callbacks will arrive
no additional state transitions occur
resources have been released
```

Document this for operation handles or streams when terminality is not obvious.

Do not leave an active-looking public status after work has terminated.

## Transitional states

### SWIFT-DOC-LIFE-120 — Document transitional states only when consumers can act on them

For:

```text
starting
pausing
resuming
finishing
```

useful documentation may clarify:

- operation in progress
- temporarily unavailable actions
- expected next stable state

Do not expose internal micro-states through DocC when consumers cannot meaningfully
react to them.

## Operation validity

### SWIFT-DOC-LIFE-130 — Explain valid lifecycle operations at the relevant member

For:

```swift
resume()
```

documentation may say:

```text
Call this method only while the session is paused.
```

or:

```text
Throws an operation-state error when the session is not paused.
```

according to the actual contract.

Do not reproduce the entire transition table in each method.

Link to state/type-level lifecycle documentation where appropriate.

## State-machine overview

### SWIFT-DOC-LIFE-140 — Use type-level documentation for shared lifecycle rules

If several methods participate in one state machine, type documentation can
summarize:

```text
ready → running → paused → running → completed
```

or another simplified consumer-level lifecycle.

Member comments then document operation-specific conditions.

Do not duplicate the same lifecycle explanation across every method.

## Ownership

### SWIFT-DOC-LIFE-150 — Document who owns long-lived work when release behavior is not obvious

Consumers may need to know whether:

```text
manager owns operation
handle owns operation
consumer owns resource
resource survives handle release
```

Example:

```text
The upload continues even if the returned handle is released. Use the manager
to retrieve the operation by identifier.
```

or the opposite contract.

Do not make ARC behavior an undocumented lifecycle mechanism.

## Handle lifetime

### SWIFT-DOC-LIFE-160 — Explain whether releasing a handle stops anything

For operation/subscription handles, clarify when relevant:

```text
releasing handle
→ no effect on operation
```

or:

```text
releasing handle
→ ends observation
```

or:

```text
explicit cancel required
```

Do not rely on consumers guessing from class/reference semantics.

## Manager-owned operations

### SWIFT-DOC-LIFE-170 — Document persistence beyond individual consumer references

If a manager owns long-lived operations:

```text
UploadManager
    ↓
UploadTask
```

consumer documentation may explain:

```text
Uploads remain active until terminal completion or explicit cancellation,
independent of individual task-handle retention.
```

Do not expose the internal registry implementation.

## Consumer-owned resources

### SWIFT-DOC-LIFE-180 — Document explicit cleanup obligations

If callers must:

```swift
close()
stop()
cancel()
invalidate()
```

before releasing a resource, make that responsibility discoverable.

Do not rely only on examples to teach mandatory cleanup.

## `deinit`

### SWIFT-DOC-LIFE-190 — Avoid documenting deinitialization as primary lifecycle unless ARC ownership is intentionally the contract

Weak:

```text
The session stops when deinitialized.
```

for a resource requiring deterministic stop.

Better:

```text
Call `stop()` when the session is no longer needed.
```

Deinitialization can be fallback behavior.

Do not make consumers manage critical resources by setting references to `nil`
unless that is explicitly the API design.

## Observation baseline

### SWIFT-DOC-OBS-001 — Document what an observation API represents

For:

```swift
func statusUpdates() -> AsyncStream<Status>
```

consumers may need to know:

- whether current state is emitted immediately
- whether only future changes are emitted
- whether duplicates can occur
- when the stream terminates
- whether multiple observers are supported

Document the relevant semantics.

Do not merely say:

```text
Returns a stream of status updates.
```

when lifecycle behavior matters.

## Current state and updates

### SWIFT-DOC-OBS-010 — Clarify relationship between snapshot/current state and observation

If the API provides:

```swift
var status: Status
func statusUpdates() -> AsyncStream<Status>
```

document whether subscription:

```text
first emits current status
```

or:

```text
only emits subsequent changes
```

Consumers otherwise risk race-prone patterns such as:

```text
read state
then subscribe
```

without knowing whether an update can be missed.

## State streams

### SWIFT-DOC-OBS-020 — Document state semantics as current truth

A state stream typically represents:

```text
what is true now
```

Intermediate states may or may not all matter.

Document:

- initial value
- duplicate behavior
- terminal behavior

when relevant.

Do not describe a state stream as an event log unless every occurrence is
preserved.

## Event streams

### SWIFT-DOC-OBS-030 — Document occurrence semantics for events

An event stream represents:

```text
what happened
```

Consumers may need every event.

If the API can drop events under buffering pressure, that is potentially
consumer-visible and should be documented.

Do not describe events as "latest state" if occurrences are independently
meaningful.

## Stream lifetime

### SWIFT-DOC-OBS-040 — Explain when observation ends

Possible terminal conditions include:

```text
owner stops
owner deinitializes
operation completes
consumer cancels iteration
stream explicitly finishes
```

Document what consumers can rely upon.

Do not leave a stream silently ending for reasons unrelated to the documented
resource lifecycle.

## Infinite streams

### SWIFT-DOC-OBS-050 — Make long-lived observation ownership clear

For effectively unbounded streams, consumers should know how to stop observing.

Examples:

```text
Cancel the consuming task to end observation.
```

or:

```text
The sequence finishes when the session closes.
```

Do not encourage indefinitely retained consumer tasks without a lifecycle.

## Multiple consumers

### SWIFT-DOC-OBS-060 — Document multicast semantics only when supported

Questions include:

```text
Can several callers subscribe?
Does each receive all updates?
Do subscribers share one producer?
Does one subscriber cancelling affect another?
```

Document these only when consumers need to coordinate around them.

Do not assume `AsyncStream` syntax communicates multicast behavior.

## Replay

### SWIFT-DOC-OBS-070 — State replay behavior when a new subscriber may receive historical/current values

Possible contracts:

```text
current value only
bounded history
all historical events
no replay
```

These affect correctness.

Do not describe replay as implementation buffering.

Describe what a new consumer receives.

## Buffering

### SWIFT-DOC-OBS-080 — Document dropped-value behavior when loss is observable and significant

If the API may drop updates:

```text
keeps newest status only
drops oldest progress values
```

say so if consumers depend on completeness.

Do not expose buffer capacity numbers unless they are supported behavior.

Prefer semantic descriptions such as:

```text
Intermediate progress values may be coalesced.
```

## Backpressure

### SWIFT-DOC-OBS-090 — Do not claim backpressure unless the producer actually responds to consumer capacity

A bounded stream that drops values is not necessarily backpressure.

Avoid documentation such as:

```text
The stream applies backpressure.
```

unless the API provides a meaningful producer-throttling contract.

Use concrete behavior instead.

## Callbacks

### SWIFT-DOC-OBS-100 — Document callback cardinality and terminal behavior

For a one-shot completion:

```text
called exactly once
```

may be part of the supported contract.

For progress:

```text
called zero or more times before completion
```

may be more accurate.

Do not call repeated event callbacks "completion handlers."

## Callback execution context

### SWIFT-DOC-OBS-110 — Document semantic execution context when consumers can rely on it

Examples:

```text
The completion handler is invoked on the main actor.
```

```text
No specific execution context is guaranteed.
```

Avoid naming private queues.

Do not make promises based only on current implementation scheduling.

## Callback ordering

### SWIFT-DOC-OBS-120 — Document relationship between state updates and callbacks when callers may read state inside callbacks

If the contract is:

```text
status updated
→ callback delivered
```

and consumers rely on that, document or test it as appropriate.

Do not promise sequencing that is merely incidental.

## Delegate lifecycle

### SWIFT-DOC-OBS-130 — Explain delegate callback lifetime when non-obvious

Consumers may need to know:

- when callbacks begin
- when they stop
- whether delegate is retained
- whether callbacks can occur after stop
- execution/isolation context

Do not document every delegate method independently if type-level delegate
documentation can establish the shared lifecycle.

## Subscription tokens

### SWIFT-DOC-OBS-140 — Explain what retaining or releasing a subscription token does

If:

```swift
let observation = object.observe(...)
```

then consumers need a clear contract:

```text
retain token to continue observation
```

or:

```text
explicit cancel required
```

or another supported lifetime.

Do not let token behavior remain an ARC accident.

## Progress

### SWIFT-DOC-OBS-150 — Document progress semantics, not emission frequency

Useful information includes:

- range
- units
- monotonicity
- terminal value
- whether intermediate values can be skipped

Avoid promises such as:

```text
progress is emitted every 100 ms
```

unless that cadence is intentionally guaranteed.

## Retry

### SWIFT-DOC-LIFE-200 — Document retry ownership when consumers need to act

If retry is automatic and entirely internal, consumers may only need final
result behavior.

If consumers can configure or trigger retry, document:

- what is retried
- whether operation identity remains the same
- which failures are retryable
- whether progress/state resets

Do not expose each internal attempt unless attempts are themselves consumer
concepts.

## Automatic retry

### SWIFT-DOC-LIFE-210 — Do not promise exact attempt count unless it is part of the supported API

Prefer:

```text
The operation may retry transient transport failures according to the configured
retry policy.
```

over:

```text
The SDK retries exactly three times.
```

unless exact count/configuration is intentionally part of the public contract.

## Timeout

### SWIFT-DOC-LIFE-220 — Explain what reaching a timeout means to operation lifetime

Consumers may need to know whether timeout:

```text
cancels underlying work
```

or:

```text
only stops waiting
```

and what state/output remains.

Use `parameters-returns-errors.md` for error categorization.

Use this reference for the lifecycle consequence.

## Resource acquisition

### SWIFT-DOC-LIFE-230 — Clarify when resources are acquired if it affects consumer behavior

A session may acquire:

- camera
- microphone
- network connection
- file writer

during:

```text
initialization
prepare
start
first operation
```

Document the semantic acquisition point only when callers need to coordinate
with it.

Do not expose internal object allocation.

## Resource release

### SWIFT-DOC-LIFE-240 — Document deterministic release boundaries

Consumers may need to know when:

```text
camera no longer in use
microphone released
file closed
observer removed
network operation stopped
```

if another subsystem depends on the same resource.

Document this at `stop`, `close`, or terminal completion as appropriate.

## Application lifecycle

### SWIFT-DOC-LIFE-250 — Document app foreground/background behavior only when the API guarantees it

Examples:

```text
Recording pauses when the application becomes inactive.
```

```text
Uploads continue according to the platform's background execution policy.
```

These can be important consumer behaviors.

Do not promise background execution simply because an internal Task continues
while the app is active.

## Framework interruptions

### SWIFT-DOC-LIFE-260 — Describe framework-driven lifecycle changes in domain terms

Instead of:

```text
AVAudioSession posts interruption notification.
```

prefer:

```text
An audio interruption transitions the recording to the interrupted state.
```

unless the underlying framework notification is itself part of the integration
contract.

Consumers need the SDK behavior.

## State publication

### SWIFT-DOC-LIFE-270 — Document state timing only when callers need sequencing guarantees

For:

```swift
try await start()
```

a useful contract may be:

```text
The status is `.recording` before the method returns.
```

if consumers can rely on that.

Do not document every intermediate status update.

## Terminal callback after stop

### SWIFT-DOC-LIFE-280 — State whether callbacks can arrive after stop/close when this affects safe teardown

If:

```text
stop returns
→ no more callbacks
```

is guaranteed, that can simplify consumers.

If callbacks may still arrive during finalization, document the supported
window.

Do not let consumers release dependencies based on a false assumption.

## Lifecycle examples

### SWIFT-DOC-LIFE-290 — Use examples to clarify multi-step workflows

For example:

```swift
let session = RecordingSession(configuration: configuration)

try await session.start()

for await status in session.statusUpdates() {
    // React to lifecycle changes.
}

let recording = try await session.stop()
```

when this accurately represents the API.

Keep examples focused on the lifecycle concept.

Do not embed internal task/actor management unless consumers actually own it.

## Documentation of unavailable operations

### SWIFT-DOC-LIFE-300 — Explain rejected operations through the public state model

For:

```swift
resume()
```

prefer:

```text
Throws when the session is not paused.
```

over:

```text
Fails because `interruptionRecoveryState` is not pending.
```

The latter leaks internal state.

Use consumer-visible state and errors.

## Documentation and state capability APIs

### SWIFT-DOC-LIFE-310 — Keep `canX` properties aligned with operation documentation

If the API exposes:

```swift
canResume
```

and:

```swift
resume()
```

their documentation should not contradict one another.

Remember that capability values can become stale between observation and action.

The operation remains authoritative.

Do not imply:

```text
if `canResume` was true once, `resume()` cannot fail
```

unless that is actually guaranteed.

## Documentation and state streams

### SWIFT-DOC-LIFE-320 — Keep current-state and stream descriptions consistent

If type documentation says:

```text
status always represents current state
```

and stream documentation says:

```text
emits future state transitions
```

make clear how consumers obtain the initial/current value.

Avoid creating two conflicting authoritative descriptions.

## Errors and lifecycle

### SWIFT-DOC-LIFE-330 — Align terminal error documentation with public lifecycle state

If:

```text
CancellationError
```

leads to:

```text
.cancelled
```

say so only if consumers need that relationship.

Do not document:

```text
operation enters `.failed`
```

if cancellation actually produces a separate cancelled state.

Errors, state, callbacks, and streams should describe one coherent lifecycle.

## Documentation and memory ownership

### SWIFT-DOC-LIFE-340 — Document semantic ownership rather than retain-cycle mechanics

Useful:

```text
The controller retains the observer until observation is cancelled.
```

when consumer responsibility depends on it.

Not useful as public API:

```text
The implementation captures self weakly to avoid a retain cycle.
```

ARC strategy is implementation detail unless it changes observable lifetime.

## Weak delegates

### SWIFT-DOC-LIFE-350 — State weak delegate retention only when consumers must retain the delegate themselves

For example:

```text
The session does not retain its delegate. Keep a strong reference to the delegate
for as long as callbacks are required.
```

This is consumer-relevant.

Do not document weak storage merely because the property declaration already
makes it obvious to Swift consumers unless Objective-C/interoperability or usage
makes the requirement non-obvious.

## Operation identity

### SWIFT-DOC-LIFE-360 — Explain identity persistence when long-lived handles survive retries or retrieval

Consumers may need to know whether:

```text
retry preserves the same operation identifier
```

or:

```text
each retry creates a new operation
```

Document this only when callers correlate or persist identity.

Do not expose internal task identifiers.

## Process restart

### SWIFT-DOC-LIFE-370 — Document persistence across application/process restart only when supported

If an operation can be retrieved after restart:

```text
operation identity and persisted state survive process termination
```

may be part of the API contract.

Clarify whether active execution itself survives/restarts or only its record is
restored.

Do not imply persisted state means the original runtime task continues.

## Background persistence

### SWIFT-DOC-LIFE-380 — Distinguish persisted operation state from active runtime ownership

Useful wording can be:

```text
The manager restores persisted upload records when initialized. Operations that
were active when the process terminated are reconciled before being reported as
active.
```

when that is the product contract.

Avoid exposing persistence schema.

## Documentation and performance

### SWIFT-DOC-CONC-270 — Do not document implementation concurrency limits as performance promises unless supported

Avoid:

```text
Uses four worker tasks.
Processes on eight threads.
```

when those numbers can change.

If consumers configure:

```text
maximumConcurrentOperations
```

then document the semantic effect of that public setting.

## Bounded concurrency

### SWIFT-DOC-CONC-280 — Explain public concurrency limits in terms of active operations

For example:

```text
At most four uploads are active simultaneously. Additional uploads remain
queued.
```

if that is an intentional supported contract.

Do not document internal worker count if it differs from consumer-visible
operation concurrency.

## Priority

### SWIFT-DOC-CONC-290 — Avoid promising execution order from task priority

If the API exposes priority, describe it as scheduling preference unless the
domain provides a stronger guarantee.

Do not say:

```text
High-priority work always runs before normal-priority work.
```

unless the product explicitly enforces that ordering independently of Swift task
priority.

## Documentation tests

### SWIFT-DOC-CONC-300 — Verify concurrency documentation against observable tests where practical

Useful contracts to validate include:

- stop waits for teardown
- duplicate start rejected
- latest operation replaces previous
- status stream emits initial value
- cancellation removes incomplete output
- callbacks stop after close
- multiple observers remain independent

Do not test private queue/actor implementation just because documentation
mentions concurrency.

Prefer behavioral tests matching the documented guarantee.

## Documentation review

### SWIFT-DOC-CONC-310 — Treat stronger concurrency wording as an API change candidate

Changing documentation from:

```text
The callback may occur on any executor.
```

to:

```text
The callback always occurs on MainActor.
```

creates a materially stronger guarantee.

Likewise:

```text
stop requests shutdown
```

to:

```text
stop waits for all teardown
```

is a stronger lifecycle contract.

Verify implementation and compatibility before accepting such documentation.

## Avoid accidental guarantees in examples

### SWIFT-DOC-CONC-320 — Examples should not imply unsupported ordering or concurrency guarantees

For example:

```swift
let first = try await load(a)
let second = try await load(b)
```

shows sequential usage.

It should not be interpreted as saying the API cannot run concurrently.

Conversely:

```swift
async let first = load(a)
async let second = load(b)
```

should only be shown if overlapping calls are supported.

Examples are part of consumer guidance.

## Concurrency wording

### SWIFT-DOC-CONC-330 — Prefer precise terms

Prefer:

```text
concurrent
serialized
isolated
cancelled
suspended
active
terminal
```

when they accurately describe the API.

Avoid vague phrases such as:

```text
async-safe
thread-friendly
background-safe
fully concurrent
automatically synchronized
```

unless the project defines them precisely.

## Lifecycle wording

### SWIFT-DOC-LIFE-390 — Use consistent lifecycle terms across the surface

If the API uses:

```text
start
stop
pause
resume
cancel
complete
fail
interrupt
```

documentation should preserve those terms.

Do not alternate arbitrarily between:

```text
terminate
end
close
finish
stop
```

if those words could imply different lifecycle semantics.

## Documentation checklist

When documenting Swift concurrency and lifecycle behavior, verify when
applicable:

- async documentation explains meaningful successful completion boundaries
- async is not described generically as background execution
- suspension implementation is not exposed unless consumers need its semantic
  consequence
- start/stop/close documentation makes resource state after return clear
- long-running work has discoverable ownership and terminal behavior
- "fire-and-forget" is not used instead of actual lifetime semantics
- overlapping-call policy is documented when callers can invoke work
  concurrently
- duplicate invocation behavior is defined for lifecycle methods
- idempotency is claimed only when semantically guaranteed
- replacement/latest-wins behavior is explicit where applicable
- shared in-flight work documents relevant shared cancellation/result semantics
- ordering guarantees are stated only when consumers can rely on them
- invocation order is not confused with completion order
- actor isolation is documented semantically rather than through executor
  internals
- `Sendable` conformance is not redundantly described as vague thread safety
- concrete concurrent-use guarantees replace broad "thread-safe" claims
- cancellation documentation explains what stops, what remains, and the terminal
  result when relevant
- cancellation is not described as instantaneous unless guaranteed
- explicit cancellation and task cancellation are distinguished when they have
  different ownership semantics
- cancellation/completion races have coherent public terminal behavior
- partial output after cancellation has documented ownership when necessary
- semantic resource lifecycle is distinguished from object ARC lifetime
- initialization documents whether resources become active immediately
- successful start establishes a clear state
- stop/close documents whether teardown/finalization has completed
- pause/resume documentation explains preserved consumer state when relevant
- interruptions are distinguished from failures
- automatic versus manual recovery is discoverable
- failed states clarify recoverability when consumers must choose next actions
- public terminal states correspond to actual cessation of work
- transitional states are documented only at consumer-relevant granularity
- valid operation/state relationships are discoverable without reproducing
  internal state-machine implementation
- type-level lifecycle documentation owns shared lifecycle rules
- long-lived work clearly identifies manager/handle/consumer ownership
- releasing handles has defined semantics when non-obvious
- explicit cleanup requirements are documented
- `deinit` is not presented as the primary resource-control API unless ARC
  lifetime intentionally owns the resource
- observation APIs document initial-value behavior when it matters
- state and event streams are described according to their actual semantics
- stream termination and consumer cancellation behavior are clear
- multiple-subscriber semantics are documented when supported
- replay and dropped-value behavior are documented only when consumer-visible
- buffering is not mislabeled as backpressure
- callback cardinality and terminal behavior are precise
- callback execution guarantees are semantic rather than tied to private queues
- delegate/subscription lifetime is documented when retention matters
- progress documentation focuses on semantic range/monotonicity rather than
  implementation cadence
- retry ownership and operation identity remain understandable
- timeout documentation explains whether underlying work continues
- resource acquisition/release boundaries are documented where other consumer
  behavior depends on them
- application lifecycle/background behavior is promised only when actually
  supported
- framework interruptions are translated into domain lifecycle behavior
- state publication timing is documented only when callers can rely on it
- callbacks after stop/close are either prohibited by contract or their allowed
  window is clear
- capability properties and operation methods do not imply contradictory
  guarantees
- current-state and observation documentation share one authoritative model
- error/cancellation documentation agrees with lifecycle state
- memory-management implementation details are not exposed as consumer
  lifecycle
- process-restart persistence distinguishes stored state from active runtime work
- public concurrency limits are described as domain behavior rather than worker
  implementation
- task priority is not documented as deterministic ordering
- concurrency/lifecycle documentation is validated against observable behavior
- stronger documentation guarantees receive implementation and compatibility
  review
- examples do not accidentally imply unsupported ordering or concurrency
- terminology remains precise and consistent across the API

Do not treat `async`, `@MainActor`, `Sendable`, a `cancel()` method, a state enum,
an AsyncSequence, or a long-lived handle as proof that concurrency and lifecycle
are documented adequately. Consumers need the observable semantics connecting
those pieces.