---
name: swift-concurrency
description: "Applies reusable Swift Concurrency guidance for implementation, refactoring, debugging, testing, migration, and review. Use when async/await, actors, tasks, Sendable, isolation, cancellation, continuations, AsyncSequence, shared mutable state, data races, or Swift strict-concurrency diagnostics are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Swift, Concurrency, Async-Await, Actors, Sendable, Structured-Concurrency]
    related_skills: [swift, code-review-diff]
---

# Swift Concurrency Engineering

Use this skill as specialized Swift Concurrency guidance.

Combine it with the Swift language skill when general Swift language,
ownership, API, or compatibility behavior is materially involved.

This skill does not define the task workflow, repository architecture, review
format, severity model, or project-specific concurrency architecture.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  files before relying on this generic guidance.
- Preserve the project's established concurrency, isolation, task-ownership,
  synchronization, lifecycle, and error-handling model when explicitly defined
  and correct for the supported behavior.
- Treat Swift language mode, compiler settings, package manifests, Xcode build
  settings, deployment targets, strict-concurrency configuration, upcoming
  features, and project diagnostics as executable sources of truth.
- Do not introduce actors, `@MainActor`, `Sendable`, locks, detached tasks, or
  other concurrency mechanisms merely because they are available.
- Do not replace a valid established synchronization model without a concrete
  correctness, safety, compatibility, or maintainability reason.

## Establish concurrency context

Concurrency behavior depends heavily on compiler and project configuration.

Before migration-sensitive or diagnostic-sensitive guidance, determine when
materially relevant:

- Swift language mode.
- Swift compiler/toolchain version.
- SwiftPM tools version when SwiftPM is used.
- Default actor isolation.
- Strict-concurrency checking level.
- Enabled upcoming language features.
- Deployment targets.
- Whether the module is an application, package, library, SDK, or framework.
- Whether callers cross module, actor, executor, queue, thread, or language
  boundaries.

For SwiftPM, inspect applicable package configuration such as:

- `swift-tools-version`
- default isolation configuration
- upcoming features
- strict-concurrency compiler settings

For Xcode projects, inspect applicable settings such as:

- `SWIFT_DEFAULT_ACTOR_ISOLATION`
- `SWIFT_STRICT_CONCURRENCY`
- `SWIFT_UPCOMING_FEATURE_*`
- Swift language-version settings

Do not infer concurrency semantics from a diagnostic without accounting for the
configuration under which it is produced.

## Load related skills

- Use the Swift language skill for general ownership, errors, APIs,
  interoperability, or compatibility concerns.
- Load framework-specific skills when concurrency interacts materially with a
  framework lifecycle or isolation contract.
- Load methodology skills such as code review, debugging, or testing only when
  the current task requires that workflow.
- Do not load this skill merely because an `async` function exists. Use it when
  concurrency semantics materially affect correctness, ownership, lifecycle,
  migration, diagnostics, or performance.

## Load references

Read only references that materially apply to the task:

- `references/async-await-basics.md` for suspension, sequential async work,
  `async let`, and foundational async/await behavior.
- `references/tasks.md` for task lifecycle, structured concurrency,
  task groups, priorities, cancellation, and unstructured tasks.
- `references/actors.md` for actor isolation, global actors, `@MainActor`,
  reentrancy, isolated parameters, and custom isolation.
- `references/sendable.md` for isolation crossings, `Sendable`,
  `@Sendable`, region-based isolation, and unchecked conformance.
- `references/threading.md` for the relationship between tasks, executors,
  threads, queues, and isolation domains.
- `references/async-sequences.md` for `AsyncSequence`, `AsyncStream`,
  `AsyncThrowingStream`, producers, consumers, and termination.
- `references/memory-management.md` for task lifetime, captures, ownership,
  cancellation, and asynchronous retain cycles.
- `references/testing.md` for deterministic testing of asynchronous,
  actor-isolated, cancellation, and ordering behavior.
- `references/performance.md` for concurrency profiling, parallelism,
  suspension behavior, contention, and performance investigation.
- `references/migration.md` for Swift 6 and strict-concurrency migration.
- `references/linting.md` when concurrency-related linter diagnostics are
  materially involved.
- `references/async-algorithms.md` only when the AsyncAlgorithms package or
  equivalent asynchronous sequence operators are materially involved.
- `references/glossary.md` when terminology clarification is useful.

Load only references relevant to the affected behavior. Do not load a reference
solely because it exists.

Framework-specific references should eventually live with their corresponding
framework skill rather than being treated as universal Swift Concurrency rules.

## Engineering baseline

- Identify the isolation boundary before changing concurrent code.
- Prefer structured concurrency when child work belongs to a parent operation.
- Give every unstructured or long-lived task an explicit owner.
- Make cancellation behavior part of the operation contract.
- Revalidate mutable assumptions after suspension when concurrent work can
  invalidate them.
- Treat actor reentrancy as part of actor correctness.
- Require `Sendable` based on real isolation crossings or concurrent-use
  contracts, not declaration visibility.
- Keep related state validation and mutation within the same isolation boundary
  when they form one atomic operation.
- Keep blocking synchronization out of asynchronous suspension paths.
- Ensure continuations and asynchronous streams have explicit terminal behavior.
- Prefer compiler-enforced isolation over undocumented synchronization
  assumptions when it accurately models ownership.
- Do not add unsafe concurrency annotations without a demonstrable invariant.
- Optimize concurrency only after understanding whether the problem is
  isolation, contention, scheduling, unnecessary serialization, excessive
  parallelism, or ordinary computation cost.

## Isolation

Before proposing a concurrency fix, determine what owns the mutable state.

Possible boundaries include:

- actor instance isolation
- a global actor
- `@MainActor`
- another serial executor
- a serial dispatch queue
- a lock-protected critical section
- immutable or otherwise safely transferred state

Do not recommend `@MainActor` as a blanket fix.

Use main-actor isolation when the state or operation genuinely belongs to a
main-actor contract, such as UI state or another explicitly main-isolated
boundary.

Do not move unrelated computation to the main actor merely to silence a
compiler diagnostic.

Likewise, do not introduce an actor solely because shared state exists. First
determine the required ownership, synchronization, call semantics, and
compatibility constraints.

## Actor reentrancy

Actor isolation prevents simultaneous actor-isolated access, but an actor can
process other work while a function is suspended.

Whenever code:

1. reads actor-isolated state,
2. performs `await`,
3. then relies on the earlier state,

determine whether another operation may have changed the assumption during the
suspension.

When correctness depends on the assumption:

- re-read or revalidate state after suspension,
- restructure the operation so the invariant does not span suspension,
- or encode an appropriate generation, token, state-machine, or ownership
  mechanism.

Do not assume actor isolation makes an entire async method atomic.

## Structured concurrency

Prefer structured concurrency when work belongs to the operation that starts it.

Use:

- ordinary `await` for sequential dependent work,
- `async let` for a fixed number of independent child operations,
- task groups for dynamic child operations.

Structured child work should inherit the lifecycle and cancellation semantics of
its parent where appropriate.

Do not create an unstructured `Task` merely to avoid making an API async or to
hide an ownership problem.

## Unstructured tasks

An unstructured task requires an explicit reason and owner.

For every long-lived or stored task, establish:

- who creates it,
- whether multiple instances are allowed,
- who retains it,
- who cancels it,
- what happens when it finishes,
- what happens when it fails,
- what happens when it is replaced,
- what happens when its owner stops or deinitializes.

A weak capture is not a lifecycle strategy.

`[weak self]` can alter ownership, but it does not define cancellation,
duplicate prevention, terminal cleanup, or operation lifetime.

Determine whether the operation should:

- retain its owner until completion,
- terminate when the owner disappears,
- or be owned independently.

## Detached tasks

Use `Task.detached` only when intentionally creating work independent from the
current task context.

Before using it, account for the loss or change of inherited context such as:

- actor isolation,
- task-local values,
- priority,
- cancellation relationship.

Do not use `Task.detached` as a generic mechanism for "running in the
background."

## Cancellation

Cancellation is cooperative.

When cancellation materially affects correctness:

- propagate cancellation through structured operations,
- check cancellation at meaningful boundaries,
- ensure expensive loops or long-running operations observe cancellation,
- stop committing results after cancellation when those results are no longer
  valid,
- release lifecycle-bound resources,
- and preserve state consistency.

Do not convert cancellation into ordinary failure unless the API contract
explicitly requires that representation.

Do not swallow cancellation when doing so allows invalid subsequent state
mutations.

Do not assume cancelling a `Task` automatically stops every underlying
operation.

## Sendable and isolation crossings

Require `Sendable` when a value actually crosses an isolation boundary or when
an API explicitly promises safe concurrent transfer or use.

Do not require `Sendable` merely because:

- a type is public,
- a function is async,
- a declaration lives in a concurrency-related module.

For value types:

- inspect stored values that participate in transfer.

For reference types:

- determine whether the type is immutable,
- internally synchronized,
- actor-isolated,
- or otherwise protected by a valid invariant.

Treat the following as explicit proof obligations:

- `@unchecked Sendable`
- `nonisolated(unsafe)`
- `@preconcurrency`
- other mechanisms that weaken compiler-enforced concurrency guarantees

Before accepting `@unchecked Sendable`, establish the invariant that makes all
supported concurrent access safe.

Do not use unchecked conformance solely to silence the compiler.

## Unsafe and migration annotations

Unsafe or compatibility-oriented annotations may be appropriate, but their
purpose must be explicit.

For:

```swift
@unchecked Sendable
@preconcurrency
nonisolated(unsafe)
```

determine whether the annotation represents:

- a permanent, intentionally enforced boundary,
- compatibility with a framework that cannot express the invariant,
- or a temporary migration workaround.

When temporary, keep the workaround narrow and record an appropriate removal
path according to project policy.

When permanent, the safety invariant must be understandable and enforceable.

## Continuations

When bridging callback APIs using continuations:

- ensure every reachable terminal path resumes exactly once,
- ensure no path forgets to resume,
- ensure cancellation does not race into a second terminal completion,
- preserve error semantics,
- preserve callback cardinality,
- and understand which executor or isolation domain owns the surrounding state.

Prefer checked continuations during normal development unless a demonstrated
requirement justifies otherwise.

Do not use a continuation when an existing native async API already expresses
the required operation.

## AsyncSequence and streams

When using `AsyncSequence`, `AsyncStream`, or `AsyncThrowingStream`:

- define who owns the producer,
- define who owns the consumer,
- define termination behavior,
- handle cancellation,
- release retained continuations,
- avoid unintentionally unbounded buffering,
- and define behavior for duplicated, stale, or out-of-order events when
  relevant.

If the sequence is conceptually infinite, its lifetime must still be bounded by
an owner or explicitly independent service lifetime.

Ensure replacing a stream or consumer terminates or disconnects the previous
one when required.

## Locks and synchronous synchronization

Synchronous synchronization remains valid for small synchronous critical
sections.

However:

- do not hold a traditional lock across an `await`,
- do not use semaphores to synchronously block waiting for async work,
- define lock ordering when multiple locks may be acquired,
- keep critical sections small,
- and ensure every access to protected mutable state follows the same
  synchronization invariant.

Do not assume replacing a correct lock with an actor automatically improves
correctness or performance.

Choose the isolation model that best matches the required API and ownership
semantics.

## Bridging callbacks and framework code

When bridging delegates, notifications, completion handlers, dispatch queues, or
Objective-C APIs:

- determine the executor or queue on which callbacks can arrive,
- do not assume callback isolation solely from where registration occurred,
- explicitly cross to the required actor when necessary,
- preserve callback cardinality and ordering,
- and prevent stale callbacks from mutating newer state.

Load the corresponding framework skill when framework-specific lifecycle or
threading contracts materially affect the behavior.

## Ordering and stale work

Concurrent correctness often depends on more than race freedom.

Determine whether the operation requires:

- first-wins,
- latest-wins,
- ordered processing,
- serialization,
- cancellation of previous work,
- dropping duplicate work,
- generation checking,
- or unrestricted parallelism.

Encode the required policy explicitly.

Do not rely on incidental task completion order.

Prevent earlier asynchronous work from mutating state that belongs to a newer
operation, session, request, generation, or owner.

## Swift 6 and strict-concurrency migration

Treat migration as a correctness exercise, not a warning-suppression exercise.

When migrating:

1. determine language and compiler settings,
2. identify the actual isolation boundaries,
3. classify diagnostics by root cause,
4. fix ownership and isolation where the model is wrong,
5. use compatibility annotations only where the existing invariant is valid,
6. keep migration changes reviewable,
7. validate behavior after each meaningful migration step.

Avoid broad annotations that silence large surfaces without proving their
safety.

Do not mechanically add:

```swift
@MainActor
@unchecked Sendable
@preconcurrency
Task { ... }
```

to make diagnostics disappear.

The target is an explicit concurrency model, not merely a clean compiler log.

## Performance

Do not assume more concurrency means better performance.

When performance is the reason for a change:

- determine whether operations are actually independent,
- identify unnecessary serialization,
- identify excessive task creation,
- identify contention,
- identify unnecessary actor hops,
- identify blocking work,
- distinguish CPU-bound from I/O-bound work,
- and profile when the performance claim is material.

Do not minimize suspension points as a blanket optimization.

Suspension is a semantic property of async work; removing or restructuring it
is useful only when evidence shows that the current design causes meaningful
overhead, contention, ordering complexity, or unnecessary executor switching.

Avoid unbounded parallelism.

For dynamic concurrent work, consider whether concurrency must be limited based
on resource, memory, server, or platform constraints.

## Testing concurrency

Tests should prove behavior rather than scheduler luck.

When concurrency behavior is materially changed, consider tests for:

- successful completion,
- failure,
- cancellation,
- ordering,
- duplicate events,
- stale completion,
- actor-isolated behavior,
- lifecycle termination,
- stream completion,
- continuation cardinality,
- concurrent callers,
- race-sensitive state transitions.

Prefer deterministic coordination mechanisms over arbitrary sleeps.

Do not use timing delays as the primary synchronization mechanism when the test
can wait for an event, state transition, expectation, clock, or controlled
dependency.

A concurrency test that passes repeatedly is not proof of race freedom if it
does not exercise the relevant isolation contract.

## Diagnostics and linting

Treat compiler diagnostics as authoritative for the configuration that produced
them.

Treat linter diagnostics according to the project's configured rules.

Do not change runtime behavior merely to silence a stylistic lint.

For warnings such as an async function with no suspension point:

- determine whether `async` is required by a protocol, override, abstraction,
  or future-facing contract,
- remove it when unnecessary,
- or use the project's narrow suppression mechanism when the signature is
  intentionally required.

Do not insert fake `await` operations solely to satisfy a diagnostic.

## Use with other skills

Examples:

```text
Review Swift concurrency change
→ code-review-diff
→ languages/swift
→ languages/swift/concurrency
→ project guidance
```

```text
Implement actor-isolated service
→ languages/swift
→ languages/swift/concurrency
→ applicable framework skills
→ project guidance
```

```text
Debug asynchronous lifecycle issue
→ debugging
→ languages/swift
→ languages/swift/concurrency
→ applicable framework skills
→ project guidance
```

```text
Implement asynchronous SwiftUI feature
→ languages/swift
→ languages/swift/concurrency
→ frameworks/swiftui
→ project guidance
```

When another skill defines the workflow, output contract, severity model,
validation strategy, or change methodology, preserve that contract and use this
skill only as specialized concurrency guidance.

## Validation

When execution tools are available, prefer the project's own validation
commands and configuration.

Depending on the task, relevant validation may include:

- Swift compilation.
- Strict-concurrency diagnostics.
- SwiftPM or Xcode builds.
- Unit and integration tests.
- Concurrency-sensitive tests.
- Lifecycle and cancellation verification.
- Thread Sanitizer when supported and relevant.
- Instruments or equivalent profiling for demonstrated performance issues.

Run only checks relevant to the task and supported by the available
environment.

Do not claim a check passed unless it was executed successfully.