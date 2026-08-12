---
name: swift-review
description: Reviews Swift changes for language correctness, ARC ownership, retain cycles, concurrency safety, lifecycle management, error handling, source and binary compatibility, platform availability, hardening, and tests. Use when a change set materially affects Swift files, Swift packages, Xcode targets, or public APIs exposed from Swift.
---

# Swift Review

Apply this skill alongside the generic diff-review process and applicable
project instructions.

Use project-specific Swift rules when they conflict with generic Swift
preferences. Preserve mandatory host safety and output requirements.

## Establish the Swift context

Before reporting findings:

- Determine the Swift language version, supported platform versions, and
  relevant compiler settings.
- Inspect `Package.swift`, Xcode build settings, module boundaries, availability
  annotations, and library-evolution settings when materially affected.
- Determine whether the module is an application, internal library, distributed
  SDK, binary framework, or mixed Swift/Objective-C module.
- Inspect materially affected protocols, conformances, extensions, call sites,
  and public declarations.
- Load available framework-specific skills when imports and changed behavior
  make them relevant, including SwiftUI, UIKit, AVFoundation, Combine,
  persistence, or networking skills.
- Do not load framework skills merely because the dependency exists somewhere
  in the repository.

## Review Swift correctness

- Check optional handling, force unwraps, forced casts, and assumptions about
  collection indices or empty values.
- Report forced operations only when supported inputs can violate the assumed
  invariant.
- Check value and reference semantics when mutations cross ownership boundaries.
- Check copying behavior for mutable reference-backed values and
  copy-on-write implementations.
- Check `Equatable` and `Hashable` consistency when identities or mutable fields
  change.
- Check `Codable` changes for compatibility, missing defaults, renamed keys,
  and decoding of previously persisted values.
- Check escaping closures and callback cardinality.
- Verify completions, continuations, and delegates are invoked exactly as their
  contracts require.
- Check that `defer` and cleanup behavior still execute across throwing and
  early-return paths.
- Check that platform availability matches deployment targets and every call
  site.

## Review ARC and ownership

When the change affects references or long-lived work:

- Trace strong ownership between objects, closures, tasks, delegates,
  observers, subscriptions, timers, streams, and continuations.
- Check for cycles such as owner → stored task or closure → owner.
- Check closures stored by objects already owned by the captured instance.
- Check indefinitely running tasks or sequences that strongly retain their
  owner.
- Check block-based notification observations and whether their tokens are
  released.
- Check Combine subscriptions and whether cancellables intentionally share the
  owner’s lifecycle.
- Check timers, display links, callbacks, and run-loop sources that retain their
  targets or closures.
- Check `AsyncStream` and `AsyncThrowingStream` continuation termination and
  cancellation behavior.
- Verify delegates are weak when the ownership contract requires it.
- Verify `unowned` references cannot outlive the referenced object.
- Do not recommend `[weak self]` mechanically.
- Determine whether the operation should retain its owner until completion or
  stop when the owner disappears.
- Account for promotion of weak references to strong references across
  suspension points.
- Verify stored tasks, observers, subscriptions, and streams are cancelled or
  terminated on stop, replacement, failure, and deinitialization.
- Report a retain cycle only when the full ownership path and lifetime
  consequence can be demonstrated.

## Review Swift concurrency

When the change affects async/await, actors, tasks, callbacks, queues, locks,
streams, continuations, or shared state:

- Identify the actor, executor, serial queue, or lock responsible for each
  mutable state transition.
- Keep related validation and mutation within the same isolation boundary.
- Check for check-then-act races across actor hops or separate queue operations.
- Check actor reentrancy when state assumptions span an `await`.
- Revalidate state after suspension when another task can change it.
- Check whether callbacks from Objective-C or system frameworks arrive on the
  expected executor.
- Check isolation when bridging delegates, notifications, dispatch queues, and
  completion handlers into async code.
- Verify UI state and UI framework operations execute on `MainActor` when
  required.
- Check `Sendable` conformance for mutable reference types and captured values.
- Treat `@unchecked Sendable`, `nonisolated`, unsafe isolation escapes, and
  compiler-suppression annotations as explicit proof obligations.
- Check whether `Task.detached` incorrectly discards actor context, task-local
  values, priority, or cancellation.
- Check whether unstructured tasks are owned, cancellable, and bounded by an
  appropriate lifecycle.
- Prefer structured concurrency when child work belongs to the parent
  operation.
- Verify cancellation is checked and propagated at meaningful boundaries.
- Do not convert cancellation into failure unless the API contract requires it.
- Do not swallow cancellation when it must stop later state mutations.
- Check for locks held across suspension points.
- Check lock ordering when multiple locks can be acquired.
- Verify continuations resume exactly once on every reachable path.
- Verify stream termination releases continuations, producers, and consumers.
- Verify event ordering when independent tasks consume related events.
- Consider Swift strict-concurrency behavior appropriate to the configured
  language mode and deployment targets.
- Do not assume an actor, serial queue, or lock makes a multi-step operation
  atomic when the operation leaves that isolation boundary.

## Review lifecycle and state

When the change affects a controller, service, session, recorder, manager, or
other stateful component:

- Enumerate valid stable and transitional states materially affected by the
  change.
- Verify each public operation validates and transitions state atomically.
- Check success, failure, cancellation, interruption, retry, and cleanup
  transitions.
- Check repeated calls, out-of-order events, duplicate callbacks, and stale
  asynchronous responses.
- Verify stale work cannot mutate a replacement session, signed-out state, new
  generation, or completed operation.
- Check whether terminal failures can incorrectly recover into active states.
- Check whether expected interruptions preserve enough state for safe recovery.
- Verify stop and teardown behavior is idempotent when callers may invoke it
  repeatedly.
- Verify partially completed configuration is rolled back or reconciled.
- Verify observation begins early enough to capture events required for
  configuration and recovery.
- Verify observation cannot silently terminate while the owner continues
  reporting an active state.

## Review errors and cancellation

- Preserve the original error when callers require its domain and context.
- Check broad `catch`, empty `catch`, `try?`, and error replacement for swallowed
  failures.
- Verify translated errors preserve actionable cause and operation context.
- Avoid moving the owner into a terminal failure state for recoverable or
  expected conditions.
- Verify rollback failures do not hide the primary error.
- Verify cancellation leaves state and resources consistent.
- Check that callbacks and continuations do not report both cancellation and a
  later success or failure.
- Verify retry logic distinguishes transient, permanent, and cancelled
  operations.
- Check that public throwing and non-throwing behavior remains compatible with
  documented contracts.

## Review Swift API and ABI compatibility

When public or package-facing declarations change:

- Check source compatibility for names, argument labels, generic constraints,
  overload resolution, return types, async/throws behavior, and isolation.
- Check protocol requirement additions and conformer impact.
- Check enum case additions when exhaustive consumers or frozen enums are
  relevant.
- Check access-level changes and do not use naming conventions as access
  control.
- Check `public`, `open`, `package`, SPI, and implementation-only boundaries
  against the intended consumers.
- Check Objective-C representability when the API must remain available to
  Objective-C callers.
- Check selectors, nullability, inherited exposure, and generated bridging
  behavior when relevant.
- Check availability annotations against supported operating systems.
- When library evolution is enabled, inspect ABI and resilience implications.
- Treat `@frozen`, `@inlinable`, `@usableFromInline`, exported imports, and
  stored-layout changes as compatibility-sensitive.
- Verify public documentation describes actual behavior, defaults, errors,
  cancellation, ownership, and availability.
- Require public API tests or baselines when the project uses them and the
  change materially affects the surface.

## Review Swift hardening

- Check malformed, missing, duplicated, stale, and out-of-order callback data.
- Check repeated delegate events, notifications, stream elements, and completion
  invocations.
- Check partial configuration and partial resource-acquisition failures.
- Verify timeout and retry behavior does not leave abandoned tasks.
- Verify stale responses cannot update newer authentication, session, or
  configuration state.
- Check unbounded arrays, buffers, streams, caches, logs, and retained payloads.
- Check sensitive values before they enter logs, telemetry, errors, or
  attachments.
- Verify diagnostic events include useful operation context without exposing
  credentials or personal information.
- Verify deinitialization is not the only required cleanup mechanism when the
  owner can remain retained by its work.
- Verify recovery paths do not duplicate observers, inputs, outputs,
  subscriptions, or background operations.

## Review Swift tests

- Verify tests cover observable behavior rather than implementation details.
- Check new success, failure, cancellation, interruption, and recovery behavior
  when materially changed.
- Check asynchronous tests for deterministic completion.
- Avoid timing-only sleeps when the test can await an event, state, expectation,
  or clock.
- Verify expectations cannot be fulfilled by unrelated callbacks.
- Verify callbacks expected once fail when invoked multiple times.
- Check actor and main-actor isolation in test helpers.
- Check retain-cycle fixes with a deallocation test when the lifecycle is
  deterministic.
- Check public API and ABI baselines when required by the project.
- For test-only changes, verify assertions exercise the production behavior they
  claim to cover.
- Do not duplicate compiler, SwiftLint, SwiftFormat, or test diagnostics unless
  one higher-level defect explains multiple failures.

## Write Swift findings

For each Swift-specific finding:

- Identify the concrete ownership path, isolation boundary, state transition, or
  compatibility contract involved.
- Explain the reachable sequence that produces the failure.
- Distinguish compiler-enforced problems from runtime or lifecycle problems.
- Recommend the smallest safe direction consistent with project architecture.
- Do not prescribe `[weak self]`, an actor, a lock, or `MainActor` without
  explaining why it matches the required ownership or isolation contract.
- Do not report generic Swift preferences as defects unless project guidance
  makes them mandatory.
- Follow the finding structure and output contract established by the generic
  diff-review process.