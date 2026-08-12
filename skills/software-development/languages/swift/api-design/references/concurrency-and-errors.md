# Swift API Concurrency and Errors

Use this reference when a Swift API materially affects async operations,
concurrent use, actor isolation, `Sendable`, ordering, cancellation, callbacks,
streams, terminal completion, errors, retries, timeouts, or consumer-visible
execution guarantees.

This reference focuses on **the concurrency and failure contract exposed to
consumers**.

Use:

- `consumer-surface.md` for determining whether the declaration is part of the
  supported consumer API.
- `state-and-ownership.md` for operation ownership, lifecycle, handles, and
  observable state.
- `compatibility.md` when changing async/throws/isolation/cancellation/error
  behavior of an existing supported API.
- `interoperability.md` when Objective-C callbacks, delegates, selectors, or
  imported concurrency annotations materially affect the contract.
- `resilience.md` when error types or concurrency annotations affect library
  evolution or ABI.
- the Swift concurrency skill for implementation-level actors, tasks,
  Sendability, synchronization, streams, and cancellation correctness.
- the Swift documentation skill for consumer-facing async, error, and
  cancellation documentation.

Project-specific concurrency architecture, supported Swift language mode,
default actor isolation, deployment target, error taxonomy, callback policy,
and compatibility requirements take precedence over this generic guidance.

## Concurrency contract baseline

### SWIFT-API-CONC-001 — Define how consumers may call the API

For an async or concurrently usable API, determine when relevant:

- whether calls may overlap
- whether repeated calls are serialized
- whether one call replaces another
- whether duplicate calls join existing work
- whether operation ordering is guaranteed
- what state owner coordinates concurrent access
- how cancellation behaves
- what successful return means
- what terminal failure means
- whether callbacks or streams have execution guarantees

Do not rely on implementation details to accidentally define these semantics.

The consumer contract should remain understandable even if the implementation
changes from:

```text
queue
→ actor
```

or:

```text
callback
→ native async
```

internally.

## Async is consumer-visible behavior

### SWIFT-API-CONC-010 — Use `async` when suspension belongs to the operation contract

An API such as:

```swift
func export() async throws -> URL
```

communicates that completion can require asynchronous work.

This is preferable to hiding asynchronous execution behind:

```swift
func export()
```

that internally starts ownerless work when the consumer needs to know when the
operation finishes.

Do not make an API async merely because its implementation happens to use an
actor or Task internally.

The consumer operation determines the API shape.

## Async completion

### SWIFT-API-CONC-020 — Successful return should have one coherent meaning

For:

```swift
try await recorder.start()
```

the consumer should be able to answer:

```text
What became true when this returned successfully?
```

Possible valid contracts include:

```text
the recorder is fully started
```

or, less commonly:

```text
the start request has been accepted and processing continues independently
```

If the second behavior is intended, make it explicit.

Do not expose an async lifecycle API whose successful return has no stable
consumer-visible completion boundary.

## Scheduling versus completion

### SWIFT-API-CONC-030 — Do not use async APIs merely to enqueue work and immediately return unless enqueueing is the actual operation

A method named:

```swift
start()
```

usually implies more than:

```text
an internal Task was created
```

if consumers subsequently rely on the operation being started.

If the API intentionally schedules work rather than waits for it, model that
concept explicitly.

Do not make consumers reverse-engineer whether:

```swift
await start()
```

means:

```text
started
```

or:

```text
start scheduled
```

## Concurrent usability

### SWIFT-API-CONC-040 — Define whether multiple calls may overlap

Consider:

```swift
async let first = processor.process(a)
async let second = processor.process(b)
```

Can both operations execute concurrently?

Possible contracts include:

```text
independent and concurrent
```

```text
accepted concurrently but internally serialized
```

```text
second call rejected while first is active
```

```text
second replaces first
```

The API should behave consistently with the state/lifecycle model.

Do not assume an async method is automatically safe for overlapping calls.

## Overlap and state

### SWIFT-API-CONC-050 — Keep overlap policy aligned with operation ownership

A stateless processor may naturally support:

```text
process A
process B
process C
```

concurrently.

A stateful recorder may require:

```text
one active recording lifecycle
```

Do not impose global serialization on independent operations merely because the
implementation uses one shared service.

Conversely, do not advertise independent concurrency when operations mutate one
authoritative lifecycle.

## Ordering

### SWIFT-API-CONC-060 — Document ordering only when consumers can rely on it

Possible ordering guarantees include:

```text
operations execute in request order
events arrive in state-transition order
latest request wins
no ordering guarantee between independent calls
```

Do not expose internal queue FIFO behavior as an API guarantee unless consumers
need it and the product intends to preserve it.

Once documented or depended upon, ordering becomes compatibility-sensitive.

## Completion order

### SWIFT-API-CONC-070 — Do not imply completion order from invocation order unless guaranteed

Given:

```swift
async let first = service.load(firstID)
async let second = service.load(secondID)
```

either operation may complete first unless the API deliberately serializes or
orders them.

Consumer-facing documentation should not imply FIFO completion merely because
the current implementation happens to use one queue.

## Isolation

### SWIFT-API-CONC-080 — Expose actor isolation when it represents the actual consumer contract

An annotation such as:

```swift
@MainActor
public final class ViewModel {
    ...
}
```

is meaningful when consumers are expected to use that type within the
MainActor domain.

Isolation becomes part of how callers interact with the API.

Do not expose actor isolation simply because it is convenient for the current
implementation if the concept itself is not actor-bound.

## MainActor

### SWIFT-API-CONC-090 — Use MainActor only for semantically MainActor-owned API

Good candidates commonly include:

- UI state
- UI framework interactions
- UI presentation models according to project architecture

Do not put:

- networking
- persistence
- media processing
- domain services
- arbitrary shared mutable state

on `MainActor` merely to resolve concurrency diagnostics.

A public MainActor annotation is a consumer-visible execution/isolation
requirement.

## Isolation changes

### SWIFT-API-CONC-100 — Treat public isolation changes as API changes

Changing:

```swift
public func value() -> Value
```

to:

```swift
@MainActor
public func value() -> Value
```

can require existing consumers to enter or await that actor.

Likewise, removing isolation can weaken previous guarantees.

Review such changes through `compatibility.md`.

Do not classify actor annotations as implementation-only metadata on supported
public declarations.

## Type-level versus member isolation

### SWIFT-API-CONC-110 — Isolate only the surface that belongs to that execution domain

A complete type can be actor-isolated when all of its supported behavior belongs
there.

Otherwise, member-level isolation can sometimes more accurately express the
contract.

Do not annotate a complete public type solely because one method interacts with
UI or another isolated resource.

Conversely, avoid scattering member annotations when the entire abstraction
clearly has one isolation owner.

## `nonisolated`

### SWIFT-API-CONC-120 — Do not use `nonisolated` to preserve a synchronous-looking API at the cost of ownership correctness

A `nonisolated` declaration is appropriate when its behavior genuinely does not
require isolated mutable state.

It is not an API-design escape for:

```text
consumers do not want to write await
```

If consumers require synchronous access, determine whether:

- the value can be immutable
- a snapshot can be stored safely
- the abstraction should use another synchronization model
- the requirement itself is valid

Do not bypass actor ownership merely for call-site convenience.

## Sendable

### SWIFT-API-CONC-130 — Require `Sendable` because of a transfer contract, not visibility

A type does not need `Sendable` simply because it is:

```swift
public
```

Ask whether values of the type are intended to:

- cross actor boundaries
- be captured by `@Sendable` closures
- move into concurrent child work
- be shared through an API explicitly promising concurrent transfer

If yes, sendability becomes relevant.

If the type is intentionally confined to one isolation domain, `Sendable` may be
unnecessary or misleading.

## Public value models

### SWIFT-API-CONC-140 — Prefer naturally transferable values at concurrency boundaries

Consumer values such as:

```swift
public struct Request: Sendable {
    ...
}

public struct Result: Sendable {
    ...
}
```

can make async APIs easier to use safely when their stored state genuinely
supports the transfer contract.

Do not add `Sendable` as decoration.

The conformance must remain true as the type evolves.

## Public reference types

### SWIFT-API-CONC-150 — Do not promise concurrent transfer of mutable reference objects without a valid ownership model

A public class can be perfectly valid without `Sendable`.

If it must cross concurrency domains, determine whether it is:

- immutable
- actor-isolated
- internally synchronized
- otherwise safely transferable

Do not add unchecked sendability solely because consumers use the type from
async code.

## `@unchecked Sendable`

### SWIFT-API-CONC-160 — Treat public unchecked sendability as a strong contract

For:

```swift
public final class Service: @unchecked Sendable {
    ...
}
```

the SDK/library assumes responsibility for preserving the safety invariant.

This contract affects all consumers that rely on concurrent transfer.

Require a real proof such as:

```text
all mutable state is protected by one synchronization mechanism
```

Do not reject `@unchecked Sendable` automatically.

Do not accept it without understanding the invariant.

## `@Sendable` closures

### SWIFT-API-CONC-170 — Require `@Sendable` when the API contract permits concurrent or cross-isolation execution

For example:

```swift
public func execute(
    operation: @escaping @Sendable () async throws -> Void
)
```

communicates capture restrictions to consumers.

Adding `@Sendable` can reject previously valid callers whose closures capture
non-Sendable mutable references.

Use it when the execution model requires the contract.

Do not add it to every closure merely because the containing method is async.

## Callback execution context

### SWIFT-API-CONC-180 — Promise callback execution context only when consumers need it

A callback API may intentionally guarantee:

```text
MainActor
specific dispatch queue
same caller context
unspecified execution context
```

If consumers must update UI or coordinate with another framework, a guarantee
may be useful.

Prefer Swift isolation terminology when that is the supported API model.

Do not expose names of internal queues in public documentation merely because
callbacks currently execute there.

## Implementation queues

### SWIFT-API-CONC-190 — Keep implementation synchronization out of the public contract

Avoid public requirements such as:

```text
This callback occurs on com.company.internal.processing.queue
```

unless that queue identity is intentionally part of interoperability behavior.

Prefer semantic guarantees:

```text
callback is delivered on MainActor
```

or:

```text
no execution context is guaranteed
```

according to the actual contract.

This allows internal synchronization to evolve.

## Callbacks versus async

### SWIFT-API-CONC-200 — Prefer one primary concurrency model for new consumer workflows

If an operation naturally has one terminal result:

```swift
func load() async throws -> Value
```

is generally clearer for Swift consumers than simultaneously introducing:

```text
callback API
delegate API
AsyncStream API
async API
```

for the same one-shot operation.

Additional forms may be justified by:

- compatibility
- Objective-C support
- repeated events
- distinct consumer needs

Do not create several equivalent public concurrency paths merely for
flexibility.

## Callback compatibility

### SWIFT-API-CONC-210 — When callback and async APIs coexist, converge on one implementation

During migration or interoperability:

```text
callback API ─┐
              ├→ authoritative operation
async API ────┘
```

should normally share:

- validation
- state
- errors
- cancellation
- resource ownership

Do not independently maintain two execution paths whose semantics can diverge.

## Exactly-once completion

### SWIFT-API-CONC-220 — One-shot APIs should produce one terminal consumer outcome

A one-shot operation can terminate through paths such as:

```text
success
failure
cancellation
timeout
```

but one invocation should not report contradictory terminal results.

For callback bridges, avoid:

```text
success callback
then error callback
```

for the same operation.

For async APIs, one invocation naturally returns or throws once; ensure
underlying callbacks preserve that contract.

## Streams

### SWIFT-API-CONC-230 — Use an asynchronous sequence for genuinely repeated values

Use a stream when the consumer contract is:

```text
zero or more values over time
```

Examples include:

- progress
- status updates
- events
- observations

Do not use `AsyncStream` for one terminal result merely because the underlying
implementation uses callbacks.

## Stream contract

### SWIFT-API-CONC-240 — Define consumer-visible stream semantics

When relevant, specify:

- initial/current value behavior
- event ordering
- duplicate semantics
- buffering/drop semantics
- normal completion
- failure
- cancellation
- multiple-subscriber behavior

Not all of these need documentation for every stream.

Document those that affect correct consumer behavior.

## State streams

### SWIFT-API-CONC-250 — Distinguish current-state observation from event delivery

A state stream answers:

```text
what state is current?
```

An event stream answers:

```text
what happened?
```

This affects:

- replay
- duplicate suppression
- buffering
- loss tolerance

Do not expose event semantics through a latest-state stream when every occurrence
matters.

Use `state-and-ownership.md` for the authoritative state relationship.

## Stream termination

### SWIFT-API-CONC-260 — Make terminal stream behavior understandable

A public sequence may:

```text
finish normally
fail
remain alive until consumer cancellation
```

according to its domain.

Consumers should not need knowledge of an internal observer object to understand
when updates stop.

Do not leave a supported stream capable of silently terminating while the
owning operation still appears active unless that is an explicitly recoverable
condition.

## Cancellation baseline

### SWIFT-API-CONC-270 — Cancellation is part of the public operation contract

For a cancellable async operation, decide what cancellation means.

Possible contracts include:

```text
throw cancellation
```

```text
stop and return partial result
```

```text
stop silently because cancellation is expected lifecycle
```

```text
cancel request but preserve already committed side effects
```

Do not let cancellation behavior emerge accidentally from whichever dependency
happens to throw first.

## Cooperative cancellation

### SWIFT-API-CONC-280 — Do not promise immediate cancellation unless the operation can provide it

Calling:

```text
cancel
```

may only request that asynchronous work stop.

Underlying dependencies may need time to observe cancellation.

Document strong timing guarantees only when they are actually supported.

Do not imply:

```text
cancel() returned
→ all underlying activity is already gone
```

unless that is the contract.

## Cancellation and successful return

### SWIFT-API-CONC-290 — Define what happens when cancellation races completion

A possible race is:

```text
operation nearly completes
consumer cancels
operation completes
```

The abstraction needs coherent terminal semantics.

Depending on the domain, it may:

- treat committed completion as success
- honor cancellation before commit
- report cancellation while preserving irreversible side effects

Do not let caller-observable result depend on uncontrolled callback order when
the domain requires one deterministic policy.

## Cancellation and state

### SWIFT-API-CONC-300 — Keep cancellation result aligned with lifecycle state

Avoid contradictions such as:

```text
method throws CancellationError
```

while:

```text
operation.status == .failed
```

if the public contract distinguishes failure from cancellation.

Likewise, do not publish:

```text
completed
```

after cancellation when the operation did not actually complete.

Use one coherent domain interpretation across:

- thrown result
- operation state
- callbacks
- events
- persisted status

## Cancellation as failure

### SWIFT-API-CONC-310 — Do not classify cancellation as ordinary failure unless consumers should treat it that way

Cancellation is often an expected control-flow outcome.

Consumers may need different behavior for:

```text
user cancelled
```

versus:

```text
network failed
```

If both map to one public error category, confirm that consumers genuinely do
not need the distinction.

Do not make cancellation `.unknown` or `.operationFailed` merely because it
arrived through `catch`.

## Cancellation propagation

### SWIFT-API-CONC-320 — Preserve cancellation through abstraction layers when the public operation promises it

If:

```text
consumer Task cancelled
        ↓
public operation
        ↓
network/media/framework operation
```

and the lower layer provides real cancellation, the abstraction should normally
connect those lifetimes.

Do not claim a cancellable async API while allowing expensive underlying work to
continue indefinitely without a domain reason.

## Cancellation handles

### SWIFT-API-CONC-330 — Prefer domain cancellation over exposing Swift Task

If consumers need to cancel a long-lived operation:

```swift
upload.cancel()
```

is generally more stable than exposing:

```swift
public let task: Task<...>
```

The domain operation can coordinate:

- state
- persistence
- cleanup
- result
- retry
- observation

Do not leak the implementation task solely to provide cancellation.

## Error baseline

### SWIFT-API-ERR-001 — Model failures consumers can act upon

A useful public error taxonomy distinguishes materially different consumer
responses.

Examples may include:

```text
invalid input
permission unavailable
unsupported operation
resource unavailable
authentication required
network/transient failure
invalid lifecycle state
cancellation
```

when those distinctions actually matter to the product.

Do not expose one generic:

```text
operationFailed
```

when consumers need different recovery actions.

## Domain errors

### SWIFT-API-ERR-010 — Express failures in consumer-domain terms

Prefer:

```text
cameraPermissionDenied
unsupportedCodec
recordingUnavailable
```

when those are stable product concepts.

Avoid forcing consumers to interpret implementation failures such as:

```text
AVError code X
transport engine error Y
database exception Z
```

unless direct passthrough is intentionally part of the API.

The public error vocabulary should match consumer decisions.

## Do not over-model errors

### SWIFT-API-ERR-020 — Create distinct error cases only for meaningful consumer distinctions

A public error enum should not necessarily mirror every internal failure.

If several implementation failures all require:

```text
show operation failed
allow retry
```

one stable public category may be sufficient while preserving the underlying
cause internally.

Do not expose internal topology through dozens of error cases consumers cannot
meaningfully distinguish.

## Throwing APIs

### SWIFT-API-ERR-030 — Use `throws` when failure belongs to the operation result

For:

```swift
func load() async throws -> Value
```

throwing communicates that the operation may fail before producing the requested
result.

This is often preferable to:

```swift
func load() async -> Value?
```

when `nil` would erase the reason for failure.

Do not use throwing merely for internal assertions or impossible states that
consumers cannot recover from.

## Nonthrowing APIs

### SWIFT-API-ERR-040 — Do not hide meaningful failures to keep an API nonthrowing

Avoid patterns where:

```swift
func save() async
```

silently catches:

- transport failure
- persistence failure
- invalid state

if consumers need to know the operation did not succeed.

A nonthrowing API is appropriate when failure is:

- impossible by contract
- deliberately absorbed as internal behavior
- communicated through another explicit supported state/event mechanism

Do not discard errors solely for call-site simplicity.

## Optional results

### SWIFT-API-ERR-050 — Use optional return only when absence is the result

For example:

```swift
func item(id: ID) async throws -> Item?
```

can naturally mean:

```text
lookup succeeded
item does not exist
```

while errors represent:

```text
lookup itself failed
```

Do not use `nil` to combine:

```text
not found
permission denied
network failure
invalid input
```

when consumers need those distinctions.

## `Result`

### SWIFT-API-ERR-060 — Do not wrap async throwing APIs in `Result` without a reason

Usually:

```swift
func load() async throws -> Value
```

provides a natural Swift call site.

Returning:

```swift
func load() async -> Result<Value, Error>
```

can be useful when failure is data that must be stored, forwarded, or processed
without throwing control flow.

Do not choose `Result` merely because the old callback used it.

## Typed throws

### SWIFT-API-ERR-070 — Use typed throws only when a closed failure type improves the supported contract

When the configured Swift/toolchain supports the required language feature, a
typed error contract can be useful if consumers benefit from knowing that the
operation produces one stable error domain.

Do not adopt typed throws merely because it is available.

Consider:

- whether underlying errors need preservation
- public compatibility
- generic constraints
- interoperability
- future error evolution

The project/toolchain and consumer contract determine whether typed throws is
appropriate.

## Error type stability

### SWIFT-API-ERR-080 — Treat public error types as supported API

A public error enum can become part of:

```text
switch error {
case ...
}
```

consumer code.

Adding, removing, renaming, or changing cases can affect consumers.

Use `compatibility.md` when evolving supported error types.

Do not expose unstable implementation errors as public enum cases if they are
likely to churn with internal architecture.

## Error context

### SWIFT-API-ERR-090 — Preserve useful underlying failure context

When translating:

```text
framework error
→ domain error
```

retain enough information for:

- debugging
- telemetry
- support
- retry decisions
- diagnostic inspection

when appropriate.

Do not replace a useful underlying error with only:

```swift
.operationFailed
```

and destroy all cause/context unless the public boundary intentionally requires
that abstraction.

## Stable surface versus diagnostic cause

### SWIFT-API-ERR-100 — Separate stable public categorization from detailed underlying cause when useful

An error can conceptually provide:

```text
stable domain category
+
underlying diagnostic cause
```

without exposing the entire implementation as the consumer contract.

For example:

```text
UploadError.transportFailure
    caused by lower-level URL/network error
```

can give consumers stable switching behavior while preserving diagnostics.

Do not force the internal error type itself to become the public abstraction.

## Privacy

### SWIFT-API-ERR-110 — Do not preserve error context that exposes sensitive data

Underlying errors or diagnostics can contain:

- credentials
- authorization headers
- file paths
- personal information
- internal server details

Preserve actionable context without leaking sensitive data through public
descriptions, logs, or telemetry.

Error-context preservation is not a requirement to expose every raw detail.

## Error descriptions

### SWIFT-API-ERR-120 — Do not make localized human-readable text the programmatic error contract

Consumers should make logic decisions using:

- error types
- error cases
- structured properties

rather than parsing:

```text
"The operation could not start because..."
```

Descriptions can support diagnostics or presentation.

They should not replace structured semantics.

## Recovery

### SWIFT-API-ERR-130 — Distinguish recoverable and terminal conditions when consumers need to react differently

Examples:

```text
temporary connectivity problem
```

may allow retry.

```text
unsupported capability
```

may require changing configuration.

```text
invalid API usage
```

may require correcting the caller.

Do not collapse every failure into a terminal component state if recovery is
supported.

## Retryable failures

### SWIFT-API-ERR-140 — Expose retry semantics only when consumers own retry policy

If the SDK internally owns retry, consumers may only need the final outcome.

If consumers decide whether to retry, the public error model should provide
enough stable information for that decision.

Do not expose internal attempt errors merely because retries occur inside the
implementation.

## Retry ownership

### SWIFT-API-ERR-150 — Avoid two independent retry owners

Problematic:

```text
SDK automatically retries 5 times
+
consumer receives each transient failure and also retries
```

unless intentionally designed.

Determine whether retry policy belongs to:

- implementation
- configuration
- consumer

and make the contract coherent.

Do not create hidden nested retry loops.

## Partial results

### SWIFT-API-ERR-160 — Model partial success explicitly when it is meaningful

A batch or multi-stage operation may produce:

```text
some successful results
+
some failures
```

Possible contracts include:

```swift
BatchResult
```

or:

```text
throw and discard all results
```

or transactional rollback.

Choose according to domain semantics.

Do not return partially committed data through an API that implies all-or-nothing
success without documenting it.

## Side effects before failure

### SWIFT-API-ERR-170 — Define what remains committed when an operation throws

An operation can fail after producing side effects:

```text
file created
record persisted
remote upload started
```

If those effects remain after error, consumers may need to know the recovery
contract.

Do not imply:

```text
throws
→ nothing happened
```

when partial effects can remain.

## Rollback

### SWIFT-API-ERR-180 — Promise rollback only when the API can actually provide it

A transactional API may guarantee:

```text
failure
→ no externally visible mutation
```

This is a strong contract.

Do not document rollback semantics when cleanup is only best-effort.

If partial state can remain, describe or model the relevant behavior.

## Error precedence

### SWIFT-API-ERR-190 — Preserve the primary operation failure when cleanup also fails

Consider:

```text
operation fails with A
cleanup fails with B
```

Consumers generally need the primary failure A unless the API explicitly models
compound failure.

Keep cleanup failure available for diagnostics where appropriate.

Do not replace the original actionable failure with a secondary teardown error
accidentally.

## Timeouts

### SWIFT-API-ERR-200 — Treat timeout as its own semantic policy when consumers care

A timeout means:

```text
operation did not reach the required completion boundary by the deadline
```

It may or may not imply that underlying work stopped.

If consumers need to distinguish timeout from ordinary failure, model that
explicitly.

Do not silently map every timeout to generic cancellation or generic network
failure when recovery differs.

## Timeout and cancellation

### SWIFT-API-ERR-210 — Define whether timeout cancels underlying work

Possible contract:

```text
deadline reached
→ underlying work cancelled
→ timeout returned
```

or:

```text
caller stops waiting
→ underlying operation continues
```

These have very different resource and state implications.

Do not use "timeout" ambiguously.

## Permissions

### SWIFT-API-ERR-220 — Distinguish permission state when consumers have a supported recovery action

For APIs requiring permission, consumers may need to differentiate:

```text
not determined
denied
restricted
unavailable
```

only when those distinctions are relevant to supported behavior.

Do not mirror every framework authorization enum automatically.

Map to the consumer decisions your API supports.

## Unsupported capability

### SWIFT-API-ERR-230 — Do not represent unsupported environment as arbitrary runtime failure

If an operation cannot work because:

```text
hardware capability absent
codec unsupported
feature unavailable on platform
```

provide a stable capability/error contract when consumers can encounter and
respond to it.

Do not expose a low-level initialization error when the real domain condition
is simply unsupported capability.

## Invalid state

### SWIFT-API-ERR-240 — Use lifecycle errors when the consumer invoked an operation outside its valid state

For example:

```text
resume when not paused
start when already running
```

can produce an operation-not-allowed error if the API is not defined as
idempotent.

The error should communicate the consumer mistake/domain condition.

Do not leak the internal state-machine implementation unnecessarily.

## Programmer errors

### SWIFT-API-ERR-250 — Distinguish invalid API use from runtime environmental failure

Some invalid input may be:

- statically prevented by types
- rejected with throwing validation
- asserted/preconditioned when violating an explicit programmer-only invariant

Choose according to whether supported runtime input can legitimately produce
the condition.

Do not crash for normal environmental or user-driven failures.

Do not turn every programmer contract into a recoverable runtime error either.

## Validation errors

### SWIFT-API-ERR-260 — Reject invalid input before mutating resources when practical

Given:

```text
validate configuration
        ↓
acquire resources
        ↓
execute
```

is generally clearer than:

```text
mutate several resources
        ↓
discover configuration invalid
        ↓
attempt rollback
```

when validation can be performed beforehand.

This reduces partial-failure state and gives consumers more predictable errors.

## Error ownership across layers

### SWIFT-API-ERR-270 — Translate errors at meaningful abstraction boundaries

A lower-level error should remain lower-level while still inside its owning
implementation.

Translate when crossing into a consumer abstraction that promises different
domain semantics.

Avoid chains such as:

```text
SystemError
→ EngineError
→ ServiceError
→ ManagerError
→ SDKError
```

where each layer only renames the same failure without adding useful meaning.

## Avoid generic wrapper errors

### SWIFT-API-ERR-280 — Do not create wrapper error types solely to hide another error type

Weak pattern:

```swift
enum ServiceError: Error {
    case failed(Error)
}
```

when every failure becomes `.failed(error)` and the wrapper adds no stable
consumer meaning.

A wrapper is useful when it provides:

- meaningful category
- context
- compatibility boundary
- privacy boundary

not merely another type name.

## Error exhaustiveness

### SWIFT-API-ERR-290 — Consider how consumers switch over public error enums

Consumers may write:

```swift
switch error {
case .permissionDenied:
    ...
case .unsupported:
    ...
}
```

A public error taxonomy therefore creates evolution constraints.

Use `compatibility.md` and `resilience.md` when adding or changing supported
cases.

Do not make the taxonomy more granular than the product can support stably.

## Error equality

### SWIFT-API-ERR-300 — Add `Equatable` only when equality is meaningful to consumers or tests

Errors containing:

- underlying errors
- dynamic context
- timestamps
- arbitrary diagnostics

may not have useful total equality semantics.

Do not conform public errors to `Equatable` merely to simplify tests.

Tests can often pattern-match the meaningful category instead.

## Cancellation error taxonomy

### SWIFT-API-ERR-310 — Decide whether cancellation belongs inside the domain error enum

Possible APIs may use:

```text
CancellationError
```

directly, or:

```swift
OperationError.cancelled
```

when domain-specific switching is useful.

Either can be valid.

Choose based on:

- public error model
- compatibility
- consumer recovery
- interoperability

Do not duplicate cancellation into several simultaneous public representations
without a reason.

## Error state and thrown error

### SWIFT-API-ERR-320 — Avoid contradictory error channels

If an operation both:

```text
throws error
```

and:

```text
stores lastError
```

define why both exist.

A persistent operation object may legitimately need:

```text
thrown immediate failure
+
later retrievable terminal status
```

A stateless one-shot function often does not need duplicated state.

Do not add `lastError` merely because the operation throws.

## Error history

### SWIFT-API-ERR-330 — Expose historical errors only when consumers need operation history

A long-lived operation may retain:

- terminal failure
- attempt history
- diagnostics

depending on domain requirements.

Do not turn internal telemetry/debug history into public API without a consumer
need.

## Documentation

### SWIFT-API-ERR-340 — Document errors by condition and recovery meaning

Useful documentation explains:

```text
Throws `permissionDenied` when camera access is unavailable.
```

rather than:

```text
Throws if something goes wrong.
```

Document consumer-relevant conditions.

Do not attempt to enumerate internal implementation errors that are intentionally
translated behind the boundary.

## Documentation of cancellation

### SWIFT-API-CONC-340 — Document cancellation when behavior is not obvious

Relevant points may include:

- operation is cancellation-aware
- cancellation throws
- partial work remains
- output is deleted/preserved
- stop/cancel is idempotent
- underlying operation may take time to terminate

Do not repeat generic Swift cancellation documentation when the API has no
special behavior.

## Documentation of isolation

### SWIFT-API-CONC-350 — Document semantic guarantees, not implementation mechanics

Prefer:

```text
Calls that mutate UI state are MainActor-isolated.
```

over:

```text
The method dispatches to queue X before entering internal queue Y.
```

Public DocC should describe what consumers may rely on.

Keep synchronization topology internal.

## Compatibility

### SWIFT-API-CONC-360 — Treat async/throws/cancellation/isolation changes as compatibility-sensitive

Changes such as:

```text
sync → async
nonthrowing → throwing
callback → async
ordinary closure → @Sendable closure
nonisolated → MainActor
concurrent → serialized
serialized → concurrent
```

can materially affect existing consumers.

Use `compatibility.md`.

Do not evaluate only source spelling; behavioral concurrency changes can break
consumers even when signatures remain source-compatible.

## Error compatibility

### SWIFT-API-ERR-350 — Error behavior can break consumers without changing the signature

For example:

```text
previously permission failure → .permissionDenied
now permission failure → .operationFailed
```

can break recovery logic while:

```swift
func start() async throws
```

remains unchanged.

Treat documented or established error categorization as behavior.

## Default changes

### SWIFT-API-CONC-370 — Concurrency-related defaults are behavioral API

Examples include changes to:

- retry enabled by default
- automatic cancellation
- timeout
- buffering
- concurrent operation limit
- automatic resume
- callback executor

These can alter consumer behavior without changing source compatibility.

Review them as supported contract changes.

## Tests

### SWIFT-API-CONC-380 — Test consumer-visible concurrency behavior

Relevant tests can include:

- calls may overlap
- duplicate start rejected
- one operation replaces another
- latest result wins
- ordering guaranteed
- callback isolation
- stream termination
- cancellation
- stale work rejected

Do not test an actor/lock/queue implementation solely because it exists.

Test the promised behavior.

## Error tests

### SWIFT-API-ERR-360 — Test meaningful failure categories

For a public error contract, verify representative conditions such as:

```text
invalid input
permission failure
unsupported capability
dependency failure
cancellation
```

where materially supported.

Do not require one test per internal error code if those errors map to the same
public category.

## Cancellation tests

### SWIFT-API-CONC-390 — Test cancellation at the public boundary

A cancellation regression test should assert relevant outcomes such as:

- returned/thrown result
- final status
- output cleanup
- absence of stale commit
- operation lookup state
- observation termination

Do not assert only that an internal Task received `cancel()`.

## Callback tests

### SWIFT-API-CONC-400 — Verify callback cardinality and execution guarantees when public

If an API promises:

```text
completion exactly once
on MainActor
```

test both properties where feasible.

Do not test a specific private dispatch queue when the public contract only
promises MainActor.

## Stream tests

### SWIFT-API-CONC-410 — Test stream behavior consumers rely upon

Depending on the contract, verify:

- initial value
- ordering
- repeated values
- normal completion
- terminal error
- cancellation cleanup
- multiple subscriptions

Do not over-specify buffer internals if consumers only rely on observable
results.

## Review checklist

When Swift concurrency or error API changes, verify when applicable:

- async is used because the operation has a real suspension/completion contract
- successful async return has a clear consumer-visible meaning
- APIs do not silently create asynchronous work whose completion consumers
  cannot observe
- overlapping-call behavior is defined where concurrency matters
- serialization follows authoritative state ownership rather than incidental
  implementation
- invocation order is not confused with completion order
- actor/global-actor isolation reflects semantic ownership
- public isolation changes are treated as consumer-visible API changes
- `nonisolated` is not used merely to preserve synchronous call syntax
- `Sendable` is required because a value crosses an isolation boundary, not
  merely because it is public
- public mutable reference types do not promise transfer safety without a valid
  model
- `@unchecked Sendable` has a maintained synchronization/immutability proof
- `@Sendable` closure requirements reflect actual execution semantics
- callback execution guarantees are semantic rather than tied to private queue
  names
- callback and async variants converge on one authoritative implementation
- one-shot operations produce one coherent terminal result
- streams are used only for genuine repeated-value contracts
- stream ordering, buffering, termination, and subscription semantics are
  documented when consumers rely on them
- cancellation has a defined domain meaning
- cancellation is not automatically classified as ordinary failure
- cancellation state/result remain consistent across throwing APIs, operation
  state, callbacks, and streams
- underlying cancellation is propagated when the public contract promises it
- implementation Task handles do not leak solely to provide cancellation
- public errors describe meaningful consumer recovery categories
- internal implementation errors are not exposed without a product reason
- error taxonomy is not more granular than consumers can act upon
- meaningful failures are not converted to `nil` or silently swallowed
- `Result` is used only when failure-as-value semantics improve the API
- typed throws is adopted only when it provides a useful stable contract
- public error types are treated as compatibility-sensitive
- underlying error context is preserved when useful without leaking sensitive
  data
- consumers do not need to parse localized descriptions programmatically
- recoverable and terminal failures remain distinguishable when necessary
- SDK and consumer do not independently own conflicting retry policies
- partial results and side effects after failure are modeled when relevant
- cleanup failure does not accidentally replace the primary actionable error
- timeout semantics specify whether underlying work is cancelled when relevant
- permissions, unsupported capabilities, and invalid lifecycle state map to
  stable domain semantics
- error translation occurs at meaningful abstraction boundaries rather than at
  every layer
- thrown errors and persistent error state are not duplicated without distinct
  responsibilities
- documentation describes consumer-visible concurrency, cancellation, and error
  behavior without leaking synchronization topology
- async/throws/isolation/order/error behavior changes receive compatibility
  review
- tests validate public concurrency and failure semantics rather than private
  concurrency primitives

Do not treat `async`, `throws`, `Sendable`, actor isolation, `@MainActor`,
`@Sendable`, cancellation support, a typed error enum, or an AsyncSequence as
proof that the consumer concurrency and failure contract is complete.