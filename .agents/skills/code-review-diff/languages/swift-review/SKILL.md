---
name: swift
description: "Applies reusable Swift language guidance for implementation, refactoring, debugging, testing, and review. Use when Swift source, packages, public APIs, ARC ownership, structured concurrency, errors, platform availability, Objective-C interoperability, or source and binary compatibility are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Swift, Language, Concurrency, ARC, API-Design, Compatibility]
    related_skills: [code-review-diff]
---

# Swift Engineering

Use this skill as generic Swift language guidance. It complements the current
engineering task; it does not define the task workflow, repository architecture,
review format, severity model, or project-specific conventions.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  files before relying on this generic guidance.
- Prefer project-specific guidance over this skill when the project explicitly
  defines an architecture, API boundary, concurrency model, ownership policy,
  compatibility requirement, or source convention.
- Treat the configured Swift language mode, deployment targets, compiler flags,
  package manifests, Xcode build settings, library-evolution configuration,
  formatter, linter, and test configuration as executable sources of truth for
  deterministic project behavior.
- Do not replace an established project convention or architecture with generic
  Swift guidance unless the task explicitly requests that change.
- Preserve generated-code, interoperability, ABI, and externally required
  conventions at their applicable boundaries.

## Establish Swift context

Before applying specialized guidance, determine the context that materially
affects the task:

- Swift language mode and relevant compiler settings.
- Supported platforms and deployment targets.
- Package and module boundaries.
- Whether library evolution or binary distribution is involved.
- Whether the affected surface is private, internal, package, SPI, public, or
  open.
- Whether Objective-C interoperability is required.
- Whether the component is an application, package, internal library, SDK,
  framework, or mixed Swift/Objective-C module.

Inspect `Package.swift`, Xcode build settings, module declarations, availability
annotations, public declarations, protocols, conformances, extensions, and
materially affected call sites when those details influence correctness.

Do not assume SDK, ABI, Objective-C, or library-evolution requirements merely
because the repository contains those concepts elsewhere.

## Load related skills

- When another skill defines the engineering workflow, preserve that workflow
  and use this skill only as Swift-specific guidance.
- Load framework-specific skills only when the framework is materially involved
  in the task.
- SwiftUI, UIKit, AVFoundation, Combine, persistence, networking, or other
  frameworks should provide their own specialized guidance when corresponding
  skills exist.
- Do not infer framework requirements solely from dependencies that are present
  elsewhere in the repository.
- For a change-set review, combine this skill with the applicable review
  methodology rather than introducing a Swift-specific review process here.

## Load references

Read only the references that materially apply to the task:

- `references/language-and-correctness.md` for optionals, casts, value/reference
  semantics, collections, `Codable`, `Equatable`, `Hashable`, closures,
  continuations, and general Swift correctness.
- `references/ownership-and-lifecycle.md` for ARC, closure capture, tasks,
  delegates, observers, subscriptions, timers, streams, resource ownership, and
  cleanup.
- `references/concurrency.md` for actors, executors, isolation, `Sendable`,
  structured concurrency, cancellation, tasks, locks, continuations, streams,
  and event ordering.
- `references/errors-and-cancellation.md` for error propagation, translation,
  recovery, rollback, retries, cancellation, and throwing contracts.
- `references/api-and-compatibility.md` for source compatibility, API evolution,
  ABI/resilience, access control, protocols, enums, availability, SPI, and
  public contracts.
- `references/interoperability.md` for Objective-C exposure, selectors,
  nullability, bridging, callbacks, delegates, and platform framework
  boundaries.
- `references/testing.md` for Swift-specific asynchronous, lifecycle,
  concurrency, ownership, API, and compatibility testing.

Load only references relevant to the affected code. Do not load a reference
solely because it exists.

## Engineering baseline

- Prefer clear, idiomatic Swift over abstractions that do not solve a
  demonstrated problem.
- Make ownership and lifetime explicit when correctness depends on reference
  semantics or long-lived work.
- Make isolation, ordering, cancellation, and asynchronous ownership explicit
  when correctness depends on concurrency.
- Keep related validation and mutation within the same isolation boundary when
  they form one logical state transition.
- Revalidate assumptions after suspension when concurrent work can invalidate
  them.
- Prefer structured concurrency when child work belongs to the lifetime of a
  parent operation.
- Preserve original failure information and cancellation semantics unless the
  public contract intentionally translates them.
- Keep public APIs intentional and compatible with their supported consumers.
- Respect source, ABI, Objective-C, SPI, and platform-availability boundaries
  when they materially apply.
- Ensure acquired resources have a deliberate release, cancellation, or
  termination path.
- Prefer deterministic compiler, analyzer, formatter, linter, and test results
  over subjective style judgments.

## Ownership principles

Do not treat weak capture as a default solution.

When references or long-lived work are involved:

- Determine who should own the operation.
- Determine how long that ownership should last.
- Trace strong references through stored closures, tasks, delegates, observers,
  subscriptions, timers, streams, and continuations.
- Distinguish an intentional lifetime extension from a retain cycle.
- Account for weak references promoted to strong references across suspension.
- Ensure stop, replacement, failure, cancellation, and teardown paths release
  resources according to the intended lifetime.

Do not report or fix a retain cycle unless the ownership path and lifetime
consequence can be demonstrated.

## Concurrency principles

When asynchronous or shared mutable state is involved:

- Identify the actor, executor, queue, lock, or other isolation mechanism that
  owns each mutable state transition.
- Keep related check-and-mutate operations within one isolation boundary when
  atomicity is required.
- Consider actor reentrancy whenever an assumption spans an `await`.
- Revalidate mutable assumptions after suspension when another task may have
  changed them.
- Verify UI-bound work executes on the appropriate main isolation boundary.
- Treat `@unchecked Sendable`, `nonisolated`, unsafe isolation escapes, and
  concurrency-suppression annotations as explicit proof obligations.
- Use `Task.detached` only when discarding inherited actor context, task-local
  values, priority, and cancellation is intentional.
- Ensure unstructured tasks have an explicit owner and lifetime.
- Propagate cancellation at boundaries where continued work would violate the
  operation contract.
- Do not hold synchronization primitives across suspension points unless the
  primitive and design explicitly support that behavior.
- Ensure checked continuations resume exactly once on every reachable path.
- Ensure stream termination releases producers, continuations, consumers, and
  other retained resources.
- Do not assume an actor, queue, or lock makes a multi-step operation atomic if
  execution leaves that isolation boundary.

## API and compatibility principles

When changing externally visible Swift surface:

- Identify the intended consumers before deciding whether a change is
  compatible.
- Consider names, argument labels, generic constraints, overload resolution,
  return types, optionality, async/throws behavior, and isolation.
- Consider protocol requirement additions and their impact on existing
  conformers.
- Consider enum evolution when exhaustive consumers or frozen representations
  are relevant.
- Treat access control as part of the API contract; naming conventions do not
  replace language-level access control.
- Preserve `public`, `open`, `package`, SPI, and implementation-only boundaries
  according to the intended consumer model.
- Evaluate Objective-C representability only when Objective-C consumers are
  part of the supported contract.
- Evaluate availability against actual supported deployment targets.
- When library evolution is enabled, account for ABI and resilience
  implications.
- Treat `@frozen`, `@inlinable`, `@usableFromInline`, exported imports, and
  layout-sensitive changes as compatibility-sensitive.

Do not classify an internal implementation change as a breaking public API
change without establishing the affected consumer boundary.

## Lifecycle and state principles

When a stateful component is materially involved:

- Make stable and transitional states explicit enough to reason about.
- Keep state validation and mutation atomic when they represent one operation.
- Consider success, failure, cancellation, interruption, retry, replacement,
  and teardown paths.
- Handle repeated calls, duplicate callbacks, stale asynchronous responses, and
  out-of-order events when the underlying contract permits them.
- Prevent stale work from mutating a newer session, generation, authentication
  state, or completed operation.
- Make stop and teardown idempotent when callers may invoke them repeatedly.
- Reconcile or roll back partially completed configuration when required.
- Ensure observation starts early enough and remains alive long enough to
  satisfy the component's lifecycle contract.

## Errors and cancellation principles

- Preserve actionable error context.
- Treat broad `catch`, empty `catch`, `try?`, and error replacement carefully
  when they can suppress required failure information.
- Translate errors only at a boundary that owns the translated contract.
- Preserve the primary error when cleanup or rollback also fails unless the
  contract defines another priority.
- Keep cancellation distinct from ordinary failure unless the API contract
  explicitly unifies them.
- Ensure cancellation leaves state and resources consistent.
- Prevent callbacks or continuations from reporting multiple terminal outcomes.
- Make retry policy distinguish transient failure, permanent failure, and
  cancellation when that distinction affects behavior.

## Use with other skills

Examples:

```text
Review Swift SDK change
→ code-review-diff
→ languages/swift
→ applicable framework skills
→ project guidance

Implement Swift concurrency fix
→ languages/swift
→ applicable framework skills
→ project guidance

Debug Swift lifecycle issue
→ debugging
→ languages/swift
→ applicable framework skills
→ project guidance
```

When another skill defines the workflow, output contract, severity model,
validation strategy, or change methodology, preserve that contract and use this
skill only as specialized Swift guidance.

## Validation

When execution tools are available, prefer the project's own validation
commands and configuration.

Depending on the project, relevant checks may include:

- Swift compilation.
- Package or Xcode builds.
- Swift tests.
- Project-configured linting or formatting.
- Strict-concurrency diagnostics.
- Public API or ABI validation when the project uses those mechanisms.

Run only checks relevant to the task and available environment.

Do not claim a check passed unless it was executed successfully.