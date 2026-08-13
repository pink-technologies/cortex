---
name: testing
description: "Applies reusable software testing guidance for implementation, refactoring, debugging, regression prevention, and review. Use when tests, test strategy, behavioral coverage, failure paths, lifecycle, asynchronous behavior, state transitions, integration boundaries, or regression protection are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Testing, Regression, Quality, Integration, Determinism, Test-Design]
    related_skills: [code-review-diff, debugging]
---

# Testing Engineering

Use this skill as generic software testing guidance.

This skill helps determine what behavior should be tested, at which boundary,
and with what level of confidence.

It does not define a language-specific testing framework, repository test
architecture, naming convention, coverage threshold, review format, or
project-specific quality policy.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  code and tests before relying on this generic guidance.
- Prefer project-specific testing conventions, test frameworks, fixtures,
  harnesses, naming rules, required environments, and quality gates over
  generic preferences.
- Treat configured test runners, build configuration, coverage settings,
  linters, CI workflows, device requirements, and repository scripts as
  executable sources of truth for deterministic project behavior.
- Do not introduce a different testing architecture merely because this skill
  describes a generally useful technique.
- Do not replace stable project test utilities with new abstractions without a
  demonstrated need.

## Establish the testing context

Before adding, changing, or evaluating tests, determine what materially affects
the required confidence.

Identify when relevant:

- the behavior being changed
- the observable contract
- the owner of the behavior
- the smallest stable boundary that can prove it
- whether external systems are involved
- whether asynchronous or concurrent work is involved
- whether lifecycle or resource ownership is involved
- whether persistent state is involved
- whether multiple components must cooperate
- whether platform or device behavior is part of the contract
- whether the change is a bug fix
- whether an existing regression test already protects the behavior

Also determine the project's available test levels and terminology. These may
include:

- unit tests
- component tests
- widget or view tests
- integration tests
- contract tests
- API tests
- UI/end-to-end tests
- device tests
- performance tests
- compatibility tests

Do not assume every project uses the same test taxonomy.

## Load related skills

- Load the applicable language skill when test correctness depends on
  language-specific semantics.
- Load framework-specific skills when the tested behavior depends on framework
  lifecycle, rendering, persistence, networking, or platform contracts.
- Load the concurrency skill when asynchronous ordering, cancellation,
  isolation, races, or task lifetime materially affect the test.
- Load the API-design skill when testing a supported public compatibility
  contract.
- Use the code-review methodology when evaluating tests as part of a change-set
  review.
- Use the debugging methodology when a failing test is evidence in an
  investigation.

Do not load specialized skills merely because the corresponding dependency
exists somewhere in the repository.

## Load references

Read only the references that materially apply to the task:

- `references/test-design.md` for behavioral boundaries, assertions, isolation,
  fixtures, and test readability.
- `references/regression-testing.md` for bug fixes and regression protection.
- `references/async-and-concurrency-testing.md` for deterministic asynchronous,
  concurrent, cancellation, and ordering tests.
- `references/lifecycle-and-state-testing.md` for state machines, resource
  ownership, cleanup, interruption, recovery, and repeated operations.
- `references/integration-testing.md` for cross-component and external-boundary
  behavior.
- `references/test-doubles.md` for fakes, stubs, mocks, controlled dependencies,
  and seam selection.
- `references/coverage.md` for coverage metrics and quality interpretation.

Load only references relevant to the affected behavior. Do not load a reference
solely because it exists.

## Testing baseline

- Test observable behavior rather than private implementation structure.
- Choose the smallest stable boundary that can prove the required behavior.
- Add broader tests when correctness depends on multiple real components
  cooperating.
- Make regression tests fail when the protected defect is reintroduced.
- Cover meaningful failure and lifecycle paths, not only successful execution.
- Keep tests deterministic.
- Keep tests independent from execution order and unrelated shared state.
- Make asynchronous completion and ordering explicit.
- Assert the outcome that matters to the consumer or system contract.
- Prefer meaningful assertions over merely exercising lines.
- Use coverage as evidence of exercised code, not as proof of correctness.
- Do not request or add tests merely to increase a metric.
- Preserve existing tests that protect behavior still supported by the
  product.

## Test observable contracts

Start from the contract that should remain true.

Depending on the behavior, observable outcomes can include:

- returned values
- emitted events
- state changes
- persisted values
- errors
- callbacks
- resource ownership
- cancellation
- navigation or rendered UI
- external requests
- side effects
- cleanup
- ordering guarantees
- compatibility behavior

Prefer assertions against these outcomes over assertions about:

- private helper invocation
- internal call counts that are not part of the contract
- temporary implementation structure
- exact internal object graphs
- arbitrary intermediate state

Internal behavior can be asserted when it is itself the supported contract or
when no more stable observable boundary exists.

## Choose the smallest useful boundary

A test should be as narrow as possible while still proving the intended
behavior.

Use a smaller boundary when:

- the behavior can be proven without unrelated dependencies
- failures can be diagnosed more precisely
- setup remains representative
- the contract exists at that boundary

Use a broader boundary when:

- correctness depends on several components being wired together
- serialization/deserialization must agree
- routing or dependency composition matters
- platform APIs are part of the contract
- persistence behavior crosses layers
- authentication or permission flows cross boundaries
- a critical user workflow cannot be proven meaningfully in isolation

Do not replace integration confidence with large quantities of unit tests.

Do not use an end-to-end test for behavior that a stable smaller test can prove
more reliably and cheaply.

## Regression testing

For a bug fix, prefer a regression test that demonstrates the original failure
condition.

A useful regression test should:

1. reproduce the relevant pre-fix condition,
2. exercise the affected supported behavior,
3. fail when the defect is reintroduced,
4. pass because of the correction rather than unrelated setup.

When practical, establish the failing test before implementing the correction.

Do not create a regression test that merely executes the corrected code without
asserting the behavior that was previously wrong.

Do not reproduce accidental implementation details of the bug if the
consumer-visible failure can be tested directly.

## Changed behavior

When behavior materially changes, identify the contract dimensions affected.

Relevant scenarios can include:

- success
- expected failure
- invalid input
- invalid configuration
- invalid state
- cancellation
- retry
- recovery
- repeated invocation
- replacement
- interruption
- timeout
- terminal cleanup

Do not mechanically add every scenario to every change.

Test the scenarios whose behavior is meaningful to the affected contract.

## State-machine testing

When a component has meaningful states or lifecycle transitions, test the
transitions that define its contract.

Consider:

- valid transitions
- rejected transitions
- transitional states
- repeated operations
- out-of-order operations
- interruption
- cancellation
- failure
- retry
- recovery
- teardown

Examples of useful questions include:

```text
Can start occur twice?

Can stop occur while starting?

Can resume occur when not paused?

What happens if cancellation arrives after partial resource acquisition?

What happens if an interruption occurs during finalization?
```

Do not enumerate impossible transitions merely to achieve exhaustive-looking
coverage.

Prioritize transitions that are reachable through supported APIs or expected
external events.

## Lifecycle and cleanup

When a change affects resource ownership, verify the lifecycle behavior that
matters.

Depending on the component, this may include:

- task cancellation
- observer removal
- subscription termination
- timer invalidation
- file cleanup
- connection closure
- buffer release
- temporary-resource cleanup
- deallocation
- producer termination
- consumer termination

Test cleanup through the smallest reliable observable signal.

Do not require a deallocation test when object lifetime is not deterministic or
not part of the contract.

When deallocation is the contract, make the test's ownership graph explicit.

## Asynchronous testing

Asynchronous tests must wait for the intended condition, not for an estimated
amount of time.

Prefer deterministic coordination mechanisms such as:

- async expectations
- controlled continuations
- test clocks
- barriers
- latches
- controlled schedulers
- deterministic fake dependencies
- observable state transitions
- framework-provided synchronization primitives

Avoid arbitrary sleeps as the primary synchronization mechanism.

A delay may be appropriate when elapsed real time is itself the behavior under
test, but the reason should be explicit.

## Concurrency testing

When a public or supported contract allows overlapping work, test the
concurrency behavior that the contract promises.

Relevant scenarios may include:

- simultaneous callers
- cancellation racing completion
- replacement racing stale completion
- duplicated events
- concurrent finish/stop
- interruption during active work
- multiple readers and writers
- ordered event processing

Coordinate the race intentionally.

Do not rely on scheduler luck to create the condition being tested.

A test that has passed thousands of times does not prove race freedom if the
relevant interleaving was never controlled or established.

## Cancellation testing

Calling `cancel()` is not sufficient evidence that cancellation works.

When cancellation is part of the behavior, verify the relevant outcome, such
as:

- the operation terminates
- the documented cancellation result is produced
- no later success is emitted
- no stale result mutates state
- acquired resources are released
- terminal state is consistent
- child work is cancelled when required

Keep cancellation semantics aligned with the production contract.

Do not require cancellation assertions for work that is intentionally
non-cancellable.

## Ordering and stale work

When correctness depends on ordering, encode that requirement in the test.

Determine whether behavior is:

- FIFO
- latest-wins
- first-wins
- serialized
- deduplicated
- replaceable
- independently parallel

Test that older or duplicated work cannot produce an invalid later state.

For latest-wins behavior, for example:

```text
request A starts
request B starts
request B completes
request A completes
```

should verify that A cannot overwrite B when B is authoritative.

Do not assume invocation order implies completion order.

## Error assertions

Assert enough of the failure contract to prove the intended behavior.

When consumers distinguish error categories, assert the meaningful category and
relevant associated information.

Prefer:

```text
expected failure category
+ relevant context
+ expected state/side effects
```

over merely asserting:

```text
some error occurred
```

Do not over-specify error strings, stack traces, or implementation details when
they are not stable parts of the contract.

## Test independence

Tests should not depend unintentionally on:

- execution order
- state left by another test
- global mutable singletons
- previous filesystem artifacts
- uncontrolled wall-clock state
- production credentials
- real external services
- random values without controlled seeds
- environment assumptions not declared by the suite

When sharing expensive fixtures intentionally, make reset and ownership behavior
explicit.

Parallel execution should not change results unless the suite explicitly tests
shared concurrent behavior.

## Test doubles

Use test doubles to control boundaries whose real behavior would make the test
slow, non-deterministic, unsafe, or unable to exercise the required scenario.

Choose the simplest useful mechanism:

- fake
- stub
- spy
- mock
- controlled clock
- in-memory implementation
- fixture server
- deterministic adapter

Prefer state or behavior verification over interaction verification when the
interaction itself is not part of the contract.

Do not mock simple value behavior merely to increase isolation.

Do not mock so deeply that the test reproduces the implementation instead of
testing production behavior.

A test double should represent a meaningful boundary.

## Interaction assertions

Call-count and invocation assertions are appropriate when cardinality or
interaction is itself part of the contract.

Examples include:

- a completion must execute exactly once
- a payment must not be submitted twice
- an observer must unsubscribe
- a retry policy permits exactly N attempts
- a callback must not occur after cancellation

Do not assert every internal collaborator invocation simply because the mocking
framework makes it easy.

## Integration testing

Use integration tests when confidence depends on boundaries agreeing with each
other.

Examples include:

```text
client ↔ transport
repository ↔ persistence
serializer ↔ persisted schema
UI ↔ navigation
feature ↔ dependency composition
application ↔ platform service
producer ↔ consumer
```

An integration test should identify which integration contract it protects.

Avoid giant integration tests that validate many unrelated behaviors in one
scenario.

Prefer focused integration tests plus a small number of critical end-to-end
flows.

## Critical workflows

Preserve broader coverage for workflows where failure would have significant
user or operational impact and correctness depends on multiple components.

A critical workflow test should validate the outcome of the workflow rather
than every internal implementation step.

When the environment cannot run the required broader test, report that
limitation separately instead of treating narrower tests as equivalent proof.

## Test naming

Use names that communicate:

- the behavior or condition
- the expected result

Follow the project's established naming convention.

This skill does not prescribe:

```text
testThat...
should...
Given_When_Then
snake_case
camelCase
```

as a universal naming style.

Consistency and behavioral clarity matter more than a specific grammar.

## Test structure

Organize tests so setup, action, and expectation are understandable.

Given–When–Then, Arrange–Act–Assert, or another clear structure can all be
appropriate.

Use explicit section comments when they improve readability for nontrivial
tests.

Do not require ceremony for a short test whose structure is already obvious.

## Coverage

Coverage is a diagnostic metric, not a quality guarantee.

Use project-defined coverage thresholds when they exist.

Do not invent a global threshold when the repository has none.

High coverage does not prove:

- correct assertions
- meaningful failure coverage
- cancellation correctness
- concurrency correctness
- lifecycle correctness
- integration compatibility

Low coverage can identify unexercised code but does not by itself identify
which missing tests are valuable.

Prefer protecting meaningful behavior over maximizing percentage.

## Avoid ineffective tests

A test provides little protection when it:

- has no meaningful assertion
- asserts values produced entirely by its own fixture
- mocks away the behavior it claims to test
- catches every error and still passes
- passes before and after removing the production behavior
- asserts only that code does not crash
- relies on an uncontrolled sleep
- skips conditionally in normal supported environments without justification
- verifies private implementation that can change without affecting behavior

When evaluating a suspicious test, establish how it would fail if production
behavior were incorrect.

## Preserve existing protection

When changing production behavior, identify existing tests that protect the
affected contract.

Do not:

- delete them
- weaken assertions
- disable them
- skip them unconditionally
- replace them with less representative tests

unless the protected behavior is intentionally changing or the replacement
provides equivalent or stronger confidence.

When behavior intentionally changes, update tests to represent the new contract
rather than making old expectations silently stop running.

## Test-only changes

Test code should be reviewed with the same correctness standard as production
code.

For test-only changes:

- verify the assertion actually exercises production behavior
- verify fixtures represent the intended condition
- verify test doubles do not bypass the relevant path
- verify asynchronous tests wait for the intended completion
- verify failure tests fail for the intended reason

Do not assume a test-only change is safe merely because production code is
unchanged.

## Validation reporting

Separate executed checks from unexecuted checks.

When the task or output contract reports validation, distinguish relevant
results such as:

```text
unit tests       PASS / FAIL / NOT_RUN
integration      PASS / FAIL / NOT_RUN
UI/end-to-end    PASS / FAIL / NOT_RUN
device tests     PASS / FAIL / NOT_RUN
coverage         PASS / FAIL / NOT_RUN
```

Use the project's terminology when it differs.

`NOT_RUN` is not equivalent to `PASS`.

When a check cannot run, record the reason rather than implying successful
validation.

## Use with other skills

Examples:

```text
Implement Dart behavior
→ languages/dart
→ testing
→ project guidance
```

```text
Fix Swift concurrency regression
→ languages/swift
→ languages/swift/concurrency
→ testing
→ project guidance
```

```text
Review Flutter change
→ code-review-diff
→ languages/dart
→ frameworks/flutter
→ testing
→ project guidance
```

```text
Debug failing state-machine test
→ debugging
→ applicable language/framework skills
→ testing
→ project guidance
```

When another skill defines the workflow, output contract, severity model, or
change methodology, preserve that contract and use this skill only as
specialized testing guidance.

## Validation

When execution tools are available:

- Prefer the project's own test commands.
- Run the smallest relevant test set first.
- Expand validation when the affected contract crosses broader boundaries.
- Run deterministic static checks separately from behavioral tests.
- Report unavailable checks explicitly.
- Do not infer that a broader suite passed because a narrower test passed.
- Do not infer coverage status when coverage was not collected.

Do not claim any test or validation check passed unless it was executed
successfully.