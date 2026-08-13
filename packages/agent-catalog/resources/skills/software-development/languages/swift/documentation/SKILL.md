---
name: swift-documentation
description: "Applies reusable Swift documentation guidance for implementation, refactoring, API evolution, and review. Use when DocC, public Swift declarations, consumer-facing behavior, parameters, return values, errors, cancellation, ownership, availability, concurrency guarantees, or documentation compatibility are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Swift, Documentation, DocC, Public-API, API-Design]
    related_skills: [swift, swift-api-design, code-review-diff]
---

# Swift Documentation Engineering

Use this skill as specialized guidance for documenting Swift declarations and
consumer-facing behavior.

Combine it with the Swift language skill for general Swift semantics and with
the Swift API-design skill when documentation describes a supported public or
package-facing contract.

This skill does not define the task workflow, repository architecture, review
format, severity model, documentation coverage policy, or project-specific
wording conventions.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover documentation guidance applicable to the
  affected declarations before relying on this generic skill.
- Preserve the project's established terminology, DocC structure, symbol-link
  conventions, documentation scope, and API naming.
- Treat public interfaces, implementation behavior, tests, availability
  annotations, compiler configuration, and generated documentation as evidence
  of the actual contract.
- Do not rewrite accurate documentation solely to match a generic wording
  preference.
- Do not document implementation details as guarantees unless they are
  intentionally part of the supported contract.

## Establish the documentation context

Before writing or evaluating documentation, determine when materially relevant:

- who the intended consumer is
- whether the declaration is private, internal, package, SPI, public, or open
- whether the declaration is part of a supported external API
- whether Objective-C consumers are supported
- whether the behavior is synchronous or asynchronous
- whether cancellation is supported
- whether lifecycle or state preconditions exist
- whether returned resources have ownership requirements
- whether ordering or isolation is consumer-visible
- supported platform and availability boundaries
- whether the documentation already forms part of a released contract

Do not infer an external API contract merely because a declaration is `public`.

## Load related skills

- Use the Swift language skill when documentation depends on Swift language
  semantics.
- Use the Swift API-design skill when documenting supported consumer-facing
  APIs, compatibility, availability, deprecation, or migration.
- Load the Swift concurrency skill when documentation exposes asynchronous
  ordering, cancellation, isolation, actor behavior, or concurrent-use
  guarantees.
- Load framework-specific skills when framework behavior materially defines the
  documented contract.
- Use code-review methodology only when documentation is being evaluated as
  part of a change-set review.

Do not load specialized skills solely because their technology exists somewhere
else in the repository.

## Load references

Read only references that materially apply to the task:

- `references/public-contracts.md` for documentation scope, consumer-visible
  behavior, guarantees, ownership, lifecycle, and failure semantics.
- `references/docc-structure.md` for summaries, parameters, return values,
  throws, notes, warnings, symbol links, code spans, and examples.
- `references/documentation-evolution.md` for keeping documentation aligned with
  implementation, targeted edits, compatibility, and stale contracts.

Load only references relevant to the affected declaration. Do not load a
reference solely because it exists.

## Documentation baseline

- Document behavior consumers need in order to use the declaration correctly.
- Describe guarantees rather than implementation mechanics.
- Keep documentation consistent with actual implementation and supported tests.
- Document meaningful preconditions, state requirements, defaults, errors,
  cancellation, ownership, and availability when they affect correct use.
- Do not promise behavior the implementation does not guarantee.
- Prefer concise documentation over exhaustive restatement of the declaration.
- Preserve established terminology across related APIs.
- Keep documentation updated when observable behavior changes.
- Distinguish API documentation from internal implementation commentary.
- Add examples only when they clarify a contract that prose and the declaration
  do not express clearly.

## Document contracts, not comment volume

Documentation should reduce uncertainty for the intended consumer.

Do not document declarations simply to increase documentation coverage.

High-value documentation explains things that are not obvious from the type
system or declaration itself, such as:

- valid lifecycle state
- ordering requirements
- defaults
- side effects
- terminal behavior
- cancellation
- error semantics
- ownership
- resource lifetime
- thread or actor requirements
- availability
- recovery behavior
- relationships between related declarations

Low-value documentation merely repeats:

```swift
/// The user identifier.
var userIdentifier: String
```

when neither the meaning nor behavior requires clarification.

Prefer useful contracts over mechanical completeness.

## Documentation scope

Apply documentation effort according to the supported contract.

### Public and consumer-facing declarations

Provide meaningful documentation when the declaration's behavior is not fully
clear from its type and name.

Pay particular attention to:

- public types
- public initializers
- public methods
- public properties
- public protocols
- public enum cases
- associated values
- configuration values
- callbacks
- streams
- asynchronous operations

When the project requires documentation for all supported public declarations,
follow that policy.

### Internal and SPI declarations

Document internal or SPI declarations when the contract is non-obvious and the
documentation materially helps maintainers or supported internal consumers.

Do not require documentation for every:

- private helper
- stored dependency
- obvious computed property
- framework storage wrapper
- straightforward implementation detail

unless project policy explicitly requires it.

## Document declarations, not files

Swift files do not have API access levels.

Document the declarations that form the relevant contract.

Do not add a fake file-level `///` comment that unintentionally attaches to the
first declaration.

When several related declarations share a file, document each contract and
explain their relationship where that relationship matters to consumers.

## Start with a useful summary

Begin declaration documentation with a concise summary of its purpose or
behavior.

For operations, prefer language that communicates the action:

```swift
/// Starts recording using the current session configuration.
```

For values and types, describe what the declaration represents:

```swift
/// The configuration used when creating a recording session.
```

Avoid restating the declaration mechanically:

```swift
/// This method starts recording.
```

The summary should add semantic information beyond the symbol name whenever
possible.

## Describe consumer-observable behavior

Document what a supported consumer can rely on.

Depending on the API, this may include:

### Purpose

What capability does the declaration provide?

### Preconditions

What must already be true?

For example:

- required lifecycle state
- required authorization
- required configuration
- supported platform capability

### State changes

What observable state changes when the operation succeeds, fails, or is
cancelled?

### Results

What does the returned value represent?

### Defaults

Which behavior occurs when an optional configuration is omitted?

### Errors

What categories of failure can the consumer meaningfully handle?

### Cancellation

What does cancellation mean?

For example:

- throws `CancellationError`
- returns no result
- preserves previous state
- cleans up partially acquired resources

### Ownership

Who owns returned resources and for how long?

This may matter for:

- files
- temporary URLs
- handles
- streams
- buffers
- tokens
- observers
- tasks

### Concurrency

Document isolation, ordering, or concurrent-use guarantees only when they are
part of the consumer contract.

Do not expose internal synchronization merely because it is involved in the
implementation.

## Document only guaranteed behavior

Documentation creates expectations.

Do not promise:

- execution on a particular queue
- actor isolation
- callback order
- exact timing
- automatic retry
- automatic recovery
- idempotency
- file retention
- thread safety
- cancellation semantics

unless the implementation and supported contract actually guarantee them.

For example, avoid:

```swift
/// Calls the completion handler on the main queue.
```

unless main-queue delivery is intentionally guaranteed.

Internal implementation behavior can change.

Consumer contracts should remain stable unless intentionally evolved.

## Hide implementation topology

Public documentation should generally describe **what**, not internal **how**.

Avoid unnecessarily exposing details such as:

- private queues
- internal actors
- locks
- implementation-specific managers
- graph nodes
- storage layout
- native framework objects hidden behind an abstraction
- internal sequencing
- private pipeline stages

For example, prefer:

```swift
/// Finishes the active recording and returns the resulting media.
```

over:

```swift
/// Flushes the internal writer queue, waits for the synchronizer, and closes
/// the AVAssetWriter.
```

unless those implementation details are intentionally part of the supported
consumer contract.

## Errors and `Throws`

Use `- Throws:` to describe meaningful failure semantics.

Prefer describing consumer-actionable causes:

```swift
/// - Throws: An error when the session is not ready or recording cannot start.
```

over leaking internal implementation types that are not supported API:

```swift
/// - Throws: `InternalWriterError.code17`.
```

When specific public error types are intentionally part of the contract, link
to and describe them appropriately.

Do not claim an operation throws a particular error unless the implementation
guarantees that behavior.

## Parameters

Document parameters when their semantics, constraints, units, defaults, or
relationships are not obvious.

Useful parameter documentation can explain:

- units
- ranges
- optional behavior
- ownership
- lifecycle
- defaults
- special values
- relationships with other parameters

Avoid simply repeating the parameter name or type.

Prefer:

```swift
/// - Parameter timeout: The maximum time, in seconds, to wait for completion.
```

over:

```swift
/// - Parameter timeout: The timeout.
```

## Return values

Use `- Returns:` when the meaning, ownership, validity, or lifecycle of the
result benefits from explanation.

For example:

```swift
/// - Returns: The URL of the completed temporary file. The file remains valid
///   until the owning session is released.
```

Do not add verbose return documentation when the declaration is already fully
self-explanatory.

## DocC structure

Follow the project's established DocC style.

A common structure is:

```swift
/// Performs the operation.
///
/// Additional behavioral context when needed.
///
/// - Parameters:
///   - first: Description.
///   - second: Description.
/// - Returns: Description.
/// - Throws: Description.
```

When all sections are present, a useful conventional order is:

1. parameters
2. returns
3. throws

Notes, warnings, important information, examples, and related symbols should be
placed where they best support understanding.

Do not treat formatting order as more important than correctness or local
project consistency.

## Symbol links

Use DocC symbol links when referring to declarations that should participate in
documentation navigation.

For example:

```swift
/// See ``RecordingConfiguration`` for configuration details.
```

Use code spans for literal code values:

```swift
`nil`
`.ready`
`30`
```

Do not use symbol links for plain conceptual prose.

Ensure referenced symbols actually resolve in the relevant documentation
context.

## Examples

Examples are valuable when they clarify:

- operation sequencing
- configuration
- lifecycle
- result handling
- cancellation
- related APIs

Keep examples:

- short
- compilable or clearly illustrative
- focused on supported behavior
- free of unrelated setup

Do not add examples merely to make documentation longer.

Prefer an example when the contract is difficult to communicate clearly through
the signature and prose alone.

## Concurrency documentation

Document concurrency only at the consumer-visible level.

Useful guarantees may include:

- an API is main-actor isolated
- instances support concurrent calls
- calls are serialized
- events preserve a defined order
- cancellation stops future event delivery
- callbacks occur on a documented executor

Do not document internal implementation details such as:

```text
uses DispatchQueue X
uses lock Y
uses actor Z internally
```

unless consumers must understand that mechanism to use the API correctly.

If the public guarantee changes, update both implementation and documentation
intentionally.

## Cancellation documentation

When cancellation is materially part of an async API contract, document the
observable semantics.

Clarify when relevant:

- how cancellation is requested
- whether cancellation is cooperative
- what terminal result is produced
- whether partial work is retained
- whether resources are cleaned up
- whether later callbacks/results can still arrive

Do not write vague statements such as:

```swift
/// Supports cancellation.
```

when the actual semantics affect consumer behavior.

## Ownership documentation

Document ownership when a consumer must take action or reason about lifetime.

For returned or registered resources, clarify when relevant:

- who retains the resource
- whether the consumer must release/cancel it
- how long it remains valid
- whether ownership transfers
- whether a returned file is temporary
- whether a token must be retained
- whether terminating a stream releases the producer

Do not explain ARC mechanics unless those mechanics are themselves relevant to
the supported contract.

## Availability

When platform availability affects use, ensure documentation and availability
annotations tell a consistent story.

Do not claim an API is usable on a platform version unsupported by its
declaration or implementation.

Avoid duplicating obvious availability metadata in prose unless the behavioral
difference needs explanation.

When behavior differs across platforms or versions, document only differences
that supported consumers need to know.

## Deprecation and migration

Deprecation documentation should help consumers migrate.

A useful deprecation message explains:

- what replaces the declaration
- any meaningful behavioral difference
- additional migration action when necessary

Prefer actionable guidance:

```swift
@available(*, deprecated, message: "Use start(configuration:) instead.")
```

over:

```swift
@available(*, deprecated, message: "Deprecated.")
```

Do not document migration paths that the product does not actually support.

## Keep documentation synchronized with behavior

When implementation changes consumer-visible behavior, inspect accompanying
documentation.

Relevant changes can include:

- defaults
- valid states
- results
- errors
- cancellation
- availability
- ownership
- ordering
- concurrency guarantees
- resource lifetime
- recovery behavior

Stale documentation is a contract defect when consumers can reasonably rely on
the old statement.

Do not require documentation updates for implementation-only changes that
preserve the documented contract.

## Preserve surrounding documentation during focused changes

When the task targets one declaration, avoid rewriting otherwise correct nearby
documentation without a reason.

Preserve:

- established terminology
- valid summaries
- related links
- examples
- local structure

unless they are incorrect, materially unclear, or the task explicitly requests
broader cleanup.

This keeps documentation changes reviewable and avoids accidental contract
changes through wording.

## Comments versus documentation

Use DocC for declaration contracts.

Use ordinary comments for implementation reasoning that future maintainers need
but consumers do not.

Good implementation comments explain **why**, such as:

```swift
// Keep the previous generation alive until pending callbacks drain so stale
// events can be rejected deterministically.
```

Avoid comments that merely narrate code:

```swift
// Increment index.
index += 1
```

Do not convert implementation reasoning into public API documentation.

## Avoid redundant prose

Documentation should complement the declaration and type system.

Do not repeat:

- obvious parameter labels
- obvious return types
- access level
- the exact function name
- implementation line-by-line behavior

Prefer information the declaration cannot communicate on its own.

## Documentation as a compatibility surface

For supported public APIs, documentation can define behavioral expectations
even when the compiler cannot enforce them.

Examples include:

- ordering
- ownership
- callback cardinality
- cancellation
- retry behavior
- thread or actor guarantees
- valid operation sequencing

When changing documented guarantees, evaluate whether the change is also a
behavioral compatibility change.

Use the Swift API-design skill when that compatibility boundary is material.

## Use with other skills

Examples:

```text
Document a Swift SDK API
→ languages/swift
→ languages/swift/api-design
→ languages/swift/documentation
→ project guidance
```

```text
Review Swift API documentation change
→ code-review-diff
→ languages/swift
→ languages/swift/documentation
→ project guidance
```

```text
Document async Swift API
→ languages/swift
→ languages/swift/concurrency
→ languages/swift/api-design
→ languages/swift/documentation
→ project guidance
```

```text
Document private implementation
→ languages/swift
→ project guidance
```

The final case should load this specialized skill only when DocC or a meaningful
declaration contract is actually involved.

## Validation

When execution tools are available, prefer project-provided documentation
validation.

Depending on the project and change, relevant checks may include:

- Swift compilation
- DocC documentation generation
- symbol-link validation
- documentation warnings
- public API validation
- example compilation when the project supports it
- tests that establish documented behavior

When documentation describes implementation behavior, inspect or test that
behavior before claiming it as guaranteed.

Do not claim documentation was validated successfully unless the relevant check
was actually performed.