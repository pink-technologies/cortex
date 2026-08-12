# Swift Async/Await Basics

Use this reference when the task materially affects Swift `async` functions,
`await`, suspension points, sequential versus concurrent async work,
`async let`, async error propagation, or migration from callback-based APIs.

This reference covers the fundamental semantics of Swift async/await.

Use:

- `tasks.md` for `Task`, child-task ownership, unstructured tasks, detached
  tasks, priority, and task lifetime.
- `actors.md` for actor isolation and reentrancy.
- `sendable.md` for values crossing isolation boundaries.
- `async-sequences.md` for asynchronous streams and iteration.
- `migration.md` for broader Swift concurrency migrations.

Project-specific Swift language mode, isolation configuration, availability,
and API conventions take precedence over this generic guidance.

## Async functions

### SWIFT-CONC-ASYNC-001 — Use `async` when an operation can suspend

An `async` function represents an operation that may suspend before producing
its result.

For example:

```swift
func loadUser() async throws -> User {
    ...
}
```

Calling code must enter an asynchronous context and use `await` at suspension
points as required by Swift.

Do not add `async` merely because an implementation internally uses a queue or
because making an API asynchronous appears more modern.

The API should be asynchronous when its consumer-facing operation genuinely
requires asynchronous execution or suspension.

## Suspension

### SWIFT-CONC-ASYNC-010 — Treat `await` as a potential suspension point

An `await` indicates that the current async function may suspend while waiting
for another asynchronous operation.

For example:

```swift
let user = try await repository.user(id: id)
```

Code before and after the `await` belongs to the same logical operation, but
the surrounding mutable state may not remain unchanged while execution is
suspended.

Do not reason about:

```swift
check state
await operation
use previous state assumption
```

as one atomic operation when another task can mutate that state during the
suspension.

Revalidate assumptions after suspension when correctness depends on them.

Use `actors.md` for deeper actor-reentrancy reasoning.

### SWIFT-CONC-ASYNC-011 — `await` does not imply background execution

Do not treat:

```swift
await operation()
```

as meaning:

```text
execute operation on a background thread
```

`async`/`await` models suspension and asynchronous control flow.

Executor selection and actor isolation are separate concerns.

The resumed code may execute according to actor or executor rules applicable to
the operation.

Do not introduce `await` as a strategy for moving expensive synchronous work
away from a latency-sensitive executor.

## Sequential async work

### SWIFT-CONC-ASYNC-020 — Consecutive awaited operations are sequential when each result is awaited before starting the next

For example:

```swift
let user = try await loadUser()
let settings = try await loadSettings(for: user)
let profile = try await buildProfile(
    user: user,
    settings: settings
)
```

`loadSettings` begins only after `loadUser` has produced the value required by
the next operation.

Sequential execution is appropriate when:

```text
operation B requires result from A
```

or when ordering is intentionally part of the behavior.

Do not introduce concurrency between operations that have a real dependency.

### SWIFT-CONC-ASYNC-021 — Do not serialize independent work accidentally

When several operations are independent:

```swift
let profile = try await loadProfile()
let settings = try await loadSettings()
```

may unnecessarily serialize them if the second operation cannot begin until
the first awaited call returns.

When concurrency provides meaningful benefit and the operations belong to the
same structured scope, consider an appropriate structured-concurrency
mechanism such as `async let` or a task group.

Do not parallelize independent operations mechanically.

Concurrency introduces additional considerations around:

- resource consumption
- cancellation
- error propagation
- ordering
- external-service limits

Use concurrency when the operation contract and expected cost justify it.

## `async let`

### SWIFT-CONC-ASYNC-030 — Use `async let` for a fixed set of child operations

`async let` is useful when a known number of independent child operations can
begin concurrently and belong to the lifetime of the enclosing async scope.

For example:

```swift
async let user = loadUser()
async let settings = loadSettings()

let result = try await Profile(
    user: user,
    settings: settings
)
```

The child operations participate in Swift structured concurrency.

Prefer `async let` when:

```text
fixed number of child operations
+
shared parent lifetime
+
results needed within current scope
```

Use a task group when the number of child operations is dynamic or when the
operation requires task-group-specific result handling.

### SWIFT-CONC-ASYNC-031 — Declare `async let` before the point where concurrency should begin

An `async let` child begins as part of the declaration rather than waiting for
the eventual explicit `await` of its value.

For example:

```swift
async let profile = loadProfile()
async let settings = loadSettings()

let result = try await (profile, settings)
```

allows both child operations to make progress concurrently.

This differs from:

```swift
let profile = try await loadProfile()
let settings = try await loadSettings()
```

which is sequential.

Place the declaration where starting the child operation is semantically valid.

Do not start work earlier merely to maximize overlap if later validation or
state must be established first.

### SWIFT-CONC-ASYNC-032 — Keep `async let` dependencies explicit

Do not use concurrent child operations when one operation logically requires
another's result.

For example:

```swift
let user = try await loadUser()

async let posts = loadPosts(userID: user.id)
async let followers = loadFollowers(userID: user.id)

let result = try await (posts, followers)
```

expresses:

```text
load user
    ↓
then
    ├── posts
    └── followers
```

more accurately than attempting to start all three operations concurrently.

Model the dependency graph according to actual behavior.

## Structured lifetime

### SWIFT-CONC-ASYNC-040 — Keep `async let` children inside the parent scope

An `async let` child belongs to the structured scope in which it is declared.

Its result should not be treated as independently owned work that can outlive
the parent operation.

If work must continue independently from the current operation, `async let` is
not the appropriate ownership model.

Use `tasks.md` to reason about explicit unstructured task ownership.

### SWIFT-CONC-ASYNC-041 — Do not use `async let` as fire-and-forget work

An `async let` declaration represents child work whose lifetime belongs to the
current operation.

Do not use it for:

```text
start work
ignore result
intentionally let work continue independently
```

If a side effect is intentionally independent, establish its actual task owner
and failure behavior explicitly.

## Awaiting `async let`

### SWIFT-CONC-ASYNC-050 — Await child results at the boundary where they are required

For example:

```swift
async let profile = loadProfile()
async let permissions = loadPermissions()

let viewState = try await ViewState(
    profile: profile,
    permissions: permissions
)
```

keeps creation and consumption of the child work within one structured
operation.

Do not scatter awaits for the same conceptual operation across unrelated
lifecycle boundaries.

### SWIFT-CONC-ASYNC-051 — Preserve error and cancellation semantics when combining child results

If child operations can fail, design the parent operation's behavior around
that failure.

Do not assume all sibling work necessarily completes successfully after one
required child fails.

Structured child work remains governed by the lifetime and cancellation
semantics of the enclosing operation.

When exact cancellation or failure ordering matters, inspect the specific
control flow rather than relying on a simplified rule such as:

```text
one child throws
→ every other child immediately stops
```

Cancellation in Swift is cooperative.

A child that receives cancellation may continue until its implementation
observes and responds to it.

Use `tasks.md` for deeper cancellation behavior.

## Error propagation

### SWIFT-CONC-ASYNC-060 — Preserve errors through async boundaries

An asynchronous function that can fail should propagate or intentionally
translate that failure.

For example:

```swift
func loadProfile() async throws -> Profile {
    let data = try await client.fetchProfile()
    return try decoder.decode(Profile.self, from: data)
}
```

Do not use broad suppression such as:

```swift
try? await operation()
```

when the caller needs to distinguish failure from absence or success.

Translate errors only at the boundary that owns the translated contract.

### SWIFT-CONC-ASYNC-061 — Keep cancellation distinct when the API contract requires it

An async operation may terminate because of cancellation rather than an
ordinary operational failure.

Do not convert cancellation into an unrelated error merely because both travel
through throwing control flow.

Likewise, do not swallow cancellation when later work must stop.

Use `tasks.md` for detailed cancellation guidance.

## `async throws`

### SWIFT-CONC-ASYNC-070 — Model asynchronous failure directly in the function signature

When asynchronous work can fail:

```swift
func fetchConfiguration() async throws -> Configuration
```

usually communicates the operation more clearly than encoding ordinary failure
through a callback or sentinel result.

Do not make a function throwing merely because one internal dependency throws
if the public operation intentionally absorbs that condition.

The function's error contract should represent behavior its caller needs to
handle.

## Typed throws

### SWIFT-CONC-ASYNC-080 — Use typed throws only when the project and API contract benefit from it

When supported by the configured Swift language mode, typed throws can make a
function's error contract more specific.

For example:

```swift
enum LoadError: Error {
    case unavailable
    case invalidResponse
}

func load() async throws(LoadError) -> Value {
    ...
}
```

Do not introduce typed throws mechanically into async code.

Consider:

- project language mode
- existing error conventions
- source compatibility
- interoperability
- whether callers benefit from the narrower error contract

Typed throws is a Swift error-modeling concern that can apply to both
synchronous and asynchronous APIs.

Do not treat it as required concurrency style.

## Returning values

### SWIFT-CONC-ASYNC-090 — Prefer direct async return values over completion plumbing when the API is fundamentally single-result

For an operation that produces one terminal result, an async API can express:

```swift
func loadUser() async throws -> User
```

instead of:

```swift
func loadUser(
    completion: @escaping (Result<User, Error>) -> Void
)
```

when compatibility and framework constraints permit.

Direct return values can make:

- success
- error propagation
- sequencing
- cancellation integration

easier to reason about.

Do not rewrite callback APIs mechanically when callbacks represent a genuinely
different contract such as:

- repeated values
- delegates
- event streams
- externally controlled lifecycle
- compatibility surface

Use `async-sequences.md` when repeated asynchronous values are involved.

## Bridging from synchronous code

### SWIFT-CONC-ASYNC-100 — Create a task only when a synchronous boundary genuinely needs to enter async work

A synchronous caller cannot simply use `await`.

A task may provide the bridge:

```swift
Task {
    try await refresh()
}
```

but creating that task introduces ownership and lifetime questions.

Before doing so, determine:

- who owns the task
- whether it should be cancelled
- whether duplicate tasks are allowed
- what happens to errors
- whether ordering matters

Do not treat `Task { ... }` as boilerplate required whenever an async function
is called from synchronous code.

Use `tasks.md` for task ownership.

## Bridging legacy callbacks

### SWIFT-CONC-ASYNC-110 — Prefer native async APIs when available

When a framework or dependency already exposes a suitable async API, prefer
using that API rather than wrapping its callback alternative unnecessarily.

For example:

```text
native async API
```

is generally preferable to:

```text
callback API
    ↓
custom continuation wrapper
```

when both represent the same supported contract.

Custom bridging introduces additional responsibility for:

- exactly-once completion
- cancellation
- isolation
- lifetime
- error translation

### SWIFT-CONC-ASYNC-111 — Preserve callback semantics when migrating to async/await

When adapting an existing callback API, first determine its actual contract.

Identify whether it:

- completes once
- can complete multiple times
- may never complete
- has separate success and error callbacks
- has explicit cancellation
- has callback execution guarantees
- exposes progress separately

A callback that emits many values should not be mechanically converted into one
async return value.

Likewise, a callback operation with externally managed lifetime may require a
different abstraction.

Use continuations only when the underlying operation genuinely maps to a
single asynchronous result.

## Continuations

### SWIFT-CONC-ASYNC-120 — Use continuations to bridge callback boundaries, not to redesign ordinary async code

Continuations are appropriate when integrating callback-based APIs into an async
contract.

Conceptually:

```text
legacy callback operation
        ↓
continuation
        ↓
async result
```

Do not use continuations when the operation already has a native async form.

Every reachable terminal path must satisfy the continuation contract.

Use `tasks.md` or the applicable concurrency guidance for cancellation and
lifetime behavior around the bridge.

## Suspension and captured state

### SWIFT-CONC-ASYNC-130 — Revalidate mutable assumptions after suspension

Consider:

```swift
guard status == .ready else {
    return
}

let value = try await loadValue()

apply(value)
```

If another operation can change `status` while `loadValue()` is suspended, the
original validation may no longer be sufficient.

When correctness depends on the state remaining valid:

```swift
guard status == .ready else {
    return
}

let value = try await loadValue()

guard status == .ready else {
    return
}

apply(value)
```

or another appropriate ownership/version mechanism may be required.

Do not add repeated guards mechanically.

Revalidation is needed only when another execution path can actually invalidate
the assumption.

## Stale async results

### SWIFT-CONC-ASYNC-140 — Do not let older async work overwrite newer authoritative state

Async operations can complete in a different order from which they started.

For example:

```text
request A starts
request B starts
request B completes
request A completes
```

If B represents the newer authoritative request, A must not commit stale state.

Possible strategies include:

- task cancellation
- generation identifiers
- request identity
- latest-wins coordination
- actor-isolated validation
- explicit serialization

Choose according to the actual behavior contract.

Do not assume `await` preserves request ordering across independent operations.

## Sequential versus concurrent intent

### SWIFT-CONC-ASYNC-150 — Express dependency rather than maximizing concurrency

Prefer code that communicates the logical dependency graph.

Sequential:

```swift
let token = try await authenticate()
let profile = try await loadProfile(token: token)
```

Concurrent:

```swift
async let configuration = loadConfiguration()
async let featureFlags = loadFeatureFlags()

let startup = try await StartupState(
    configuration: configuration,
    featureFlags: featureFlags
)
```

Mixed:

```swift
let user = try await authenticate()

async let profile = loadProfile(for: user)
async let permissions = loadPermissions(for: user)

return try await Session(
    user: user,
    profile: profile,
    permissions: permissions
)
```

Do not serialize merely because async syntax reads naturally top-to-bottom.

Do not parallelize merely because operations appear syntactically independent.

Use data dependency, ordering semantics, resource cost, and ownership to choose
the execution shape.

## Async does not imply concurrency

### SWIFT-CONC-ASYNC-160 — Distinguish asynchronous execution from concurrent execution

An async function can execute entirely sequentially.

For example:

```swift
let first = try await firstOperation()
let second = try await secondOperation(first)
```

is asynchronous but not concurrent between those two operations.

Likewise, two async functions do not execute concurrently merely because both
are declared `async`.

Concurrency requires a structure that allows their lifetimes to overlap.

This distinction matters when reasoning about:

- ordering
- performance
- shared state
- cancellation
- races

## Async does not make synchronous work non-blocking

### SWIFT-CONC-ASYNC-170 — Avoid hiding heavy synchronous work inside an async function

This:

```swift
func process() async -> Result {
    expensiveSynchronousWork()
}
```

does not inherently make `expensiveSynchronousWork()` cooperative or move it to
a suitable executor.

If expensive CPU-bound or blocking work matters, determine the appropriate
execution strategy separately.

Do not add `async` solely to make blocking work appear asynchronous.

Use `threading.md` or framework-specific guidance when executor/thread behavior
is material.

## Cancellation cooperation

### SWIFT-CONC-ASYNC-180 — Async operations should honor cancellation according to their contract

Cancellation in Swift is cooperative.

An async function may need to:

- call cancellation-aware child APIs
- check cancellation before expensive work
- check cancellation before committing stale results
- clean up owned resources
- propagate cancellation

depending on the operation.

Do not add `Task.checkCancellation()` at every suspension point mechanically.

Check or propagate cancellation where continuing after cancellation would
violate the operation contract.

Use `tasks.md` for deeper cancellation guidance.

## Side effects

### SWIFT-CONC-ASYNC-190 — Keep side effects ordered according to the operation contract

Concurrent execution is safest when child operations are independent.

Be cautious when concurrent operations mutate:

- shared state
- the same file
- the same database record
- the same external resource
- one consumer-visible sequence

If order or atomicity matters, encode that requirement rather than relying on
completion timing.

Use actors, another serialization boundary, or explicit sequencing according to
the architecture.

## API migration

### SWIFT-CONC-ASYNC-200 — Migrate callback APIs from the consumer contract inward

When converting a single-result callback API to async/await, determine first:

```text
old consumer contract
```

including:

- success value
- failure
- cancellation
- callback cardinality
- callback isolation
- lifecycle

Then design the async equivalent.

Do not begin by mechanically replacing:

```text
completion(...)
```

with:

```text
return
```

without checking the rest of the behavior.

### SWIFT-CONC-ASYNC-201 — Preserve compatibility only when required

For a supported public API, migration may require temporarily maintaining both:

```swift
func load(
    completion: @escaping (Result<Value, Error>) -> Void
)
```

and:

```swift
func load() async throws -> Value
```

through one authoritative implementation.

For internal APIs whose callers can be migrated atomically, maintaining both
forms can create unnecessary duplicate surface.

Use the Swift API-design skill when source or binary compatibility matters.

## Avoid unnecessary async boundaries

### SWIFT-CONC-ASYNC-210 — Keep synchronous work synchronous when suspension is unnecessary

Do not make pure, immediate work asynchronous without a contract reason.

For example:

```swift
func normalizedName(_ value: String) -> String
```

should not become:

```swift
func normalizedName(_ value: String) async -> String
```

merely because its caller is already async.

Unnecessary async boundaries can:

- obscure ownership
- introduce suspension expectations
- complicate callers
- broaden API contracts

Use async where the operation genuinely needs it.

## Testing async behavior

### SWIFT-CONC-ASYNC-220 — Await observable completion rather than elapsed time

Tests for async functions should synchronize with the operation itself.

Prefer:

```swift
let result = try await subject.load()
XCTAssertEqual(result, expected)
```

or the project's equivalent async test mechanism.

Avoid arbitrary sleeps intended to give async work time to finish.

When testing ordering or cancellation, control the relevant suspension points
or dependencies deliberately.

Use `testing.md` for deeper concurrency-test guidance.

## Review checklist

When async/await behavior changes, verify when applicable:

- `async` represents a genuine asynchronous boundary
- each `await` is treated as a possible suspension point
- mutable assumptions spanning suspension remain valid or are revalidated
- independent work is not accidentally serialized when concurrency is required
- dependent work is not parallelized incorrectly
- `async let` is used only for child work belonging to the current scope
- child failure and cancellation semantics match the parent contract
- errors remain observable at the appropriate boundary
- cancellation is not accidentally converted into ordinary failure
- callback migration preserves cardinality and lifecycle semantics
- native async APIs are preferred over unnecessary continuation wrappers
- stale async results cannot overwrite newer authoritative state
- heavy synchronous work is not assumed to become non-blocking merely because
  it lives in an async function
- compatibility is preserved when required
- tests await actual completion rather than relying on timing

Do not treat the presence of `async` and `await` as evidence that an operation
is correctly concurrent, isolated, cancellable, or non-blocking.