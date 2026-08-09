# Testing Strategy

Test the responsibility boundary at each architectural layer and preserve the
project's established Given/When/Then structure.

## Contents

1. Test organization
2. Given/When/Then
3. Naming
4. Layer boundaries
5. BLoC tests
6. Widget tests
7. Responsive and accessibility tests
8. Coverage and regressions
9. Determinism
10. Concurrency and hardening tests

## 1. Test organization

### FL-TEST-001 — Mirror production responsibility in tests `[MEDIUM]`

Place tests under the package `test/` directory and organize them so the
production type/feature is easy to locate. Use `_test.dart` suffixes.

### FL-TEST-002 — Group by type then behavior `[MEDIUM]`

Use the established structure:

```dart
group('DatasourceRepositoryTests', () {
  group('.connectTo()', () {
    test(...);
  });
});
```

For BLoC events:

```dart
group('SignInSubmittedEvent()', () {
  blocTest(...);
});
```

## 2. Given/When/Then

### FL-TEST-010 — Structure every behavioral test as Given, When, Then `[MEDIUM]`

Make the three phases obvious and ordered:

```dart
test('Should return the profile when retrieval succeeds', () async {
  // Given
  final sut = ProfileRepository(...);
  when(...).thenAnswer(...);

  // When
  final result = await sut.retrieve();

  // Then
  expect(result, expectedProfile);
  verify(...).called(1);
});
```

Use `// Given, When` or `// When, Then` only for genuinely trivial tests where
separating the phases would add noise rather than clarity.

### FL-TEST-011 — Keep one meaningful action in When `[MEDIUM]`

Do not exercise several independent behaviors in one test. When multiple
actions are part of one required workflow, make that workflow explicit in the
test name and assertions.

## 3. Naming

### FL-TEST-020 — Name the system under test sut `[LOW]`

Use `sut` for the primary system under test when a local variable is needed.
Name mocks by collaborator role rather than `mock1` or `dependency`.

### FL-TEST-021 — Use behavioral Should descriptions `[MEDIUM]`

Name tests as observable expectations, for example:

```text
Should emit failure when the repository throws
Should not call signIn when the form is invalid
Should return false when storage deletion fails
```

Avoid names that only repeat the method name.

## 4. Layer boundaries

### FL-TEST-030 — Mock the immediate architectural collaborator `[HIGH]`

Use the normal boundaries:

```text
Data Access -> underlying platform/library client
Resource    -> Service Client
Repository  -> Resource
BLoC        -> Repository
View        -> controlled BLoC/state or immediate presentation dependency
```

Do not turn a unit test into an accidental end-to-end test by bypassing the
immediate boundary.

### FL-TEST-031 — Verify collaboration when it is part of the contract `[HIGH]`

Verify correct calls and arguments when delegation is the behavior under test.
Use negative verification such as `verifyNever` for validation/precondition
paths that must stop lower-layer work.

## 5. BLoC tests

### FL-TEST-040 — Test meaningful BLoC transitions `[HIGH]`

For changed behavior, cover applicable initial, input/validation, loading,
success, empty, and failure states plus Repository interaction.

Use `blocTest` for event-to-state behavior where it improves clarity.

### FL-TEST-041 — Test overlapping-event policy when relevant `[HIGH]`

For debounced search, refresh, pagination, repeated submit, or similar async
behavior, verify the chosen latest-wins/serialized/droppable semantics when a
race can affect observable state.

## 6. Widget tests

### FL-TEST-050 — Test widgets through observable behavior `[HIGH]`

Verify rendered state, user interaction, emitted event/intent, navigation, or
other presentation side effect. Avoid asserting private widget decomposition
that can change without changing behavior.

### FL-TEST-051 — Build a production-relevant test harness `[HIGH]`

Provide the theme/Design System, localization, BLoC, DI providers, and router
that the widget contract actually requires. Keep the harness minimal while
matching the relevant runtime environment.

### FL-TEST-052 — Pump deliberately `[MEDIUM]`

Use `pump()` for a known frame/state transition and `pumpAndSettle()` only when
the test intentionally waits for animation or scheduled async UI work to
settle. Do not use `pumpAndSettle()` as a blanket fix for unknown timing.

### FL-TEST-053 — Prefer stable finders `[MEDIUM]`

Prefer user-observable text, semantics, or intentionally stable keys when
possible. Do not bind tests to private widget types merely because they are
easy to find.

## 7. Responsive and accessibility tests

### FL-TEST-060 — Test representative responsive widths `[MEDIUM]`

When adaptive behavior changes, test compact, expanded, and meaningful
breakpoint-boundary widths. Verify behavior/layout mode rather than brittle
pixel-perfect implementation detail.

### FL-TEST-061 — Test semantics for changed custom controls `[MEDIUM]`

Use Flutter accessibility/semantics testing when custom interaction changes
labels, target size, contrast, traversal, or actions.

## 8. Coverage and regressions

### FL-TEST-070 — Target at least 90% coverage for new implementation logic `[HIGH]`

Apply the project's 90%+ target to new/changed implementation logic where
coverage is measured. Do not use percentage as a substitute for meaningful
success, failure, validation, and boundary coverage.

### FL-TEST-071 — Add a regression test for bug fixes `[HIGH]`

Prove the failure before/fix behavior at the smallest meaningful layer and
cover the consumer-visible path when the regression crosses layers.

## 9. Determinism

### FL-TEST-080 — Keep tests isolated and deterministic `[HIGH]`

Do not depend on test execution order, real network services, production
credentials, wall-clock timing, or shared mutable state unless the test is
explicitly an integration test designed for that dependency.

## 10. Concurrency and hardening tests

Apply these tests when the changed behavior has the corresponding risk. Keep
the normal Given/When/Then structure and control scheduling/completion
explicitly instead of depending on arbitrary delays.

### FL-TEST-090 — Test race completion order `[HIGH]`

When two operations can overlap, prove the intended result when the older
operation completes after the newer one. Verify stale work cannot overwrite
the authoritative state, entity, session, or request result.

### FL-TEST-091 — Test cancellation and disposal during active work `[HIGH]`

When work is lifecycle-bound or replaceable, cancel or dispose the owner while
the operation is active. Verify no later state emission, navigation, callback,
resource use, or unhandled failure escapes the cancelled lifecycle.

### FL-TEST-092 — Test repeated operations and idempotency `[HIGH]`

When duplicate taps, events, retries, reconnects, or delivery are realistic,
exercise the operation more than once. Verify the documented contract does not
produce duplicate writes, submissions, navigation, charges, or other
non-idempotent effects.

### FL-TEST-093 — Test timeout and retry boundaries `[HIGH]`

For operations with timeout or retry policy, verify timeout termination, retry
count, retryable versus non-retryable failures, and the final observable
state. Do not use real wall-clock waits to prove the policy when time can be
controlled.

### FL-TEST-094 — Test partial-failure recovery `[HIGH]`

For multi-step operations that can partially succeed, fail after each material
side effect where practical. Verify required cleanup, rollback,
reconciliation, retained state, and retry behavior.

### FL-TEST-095 — Test invalid state transitions `[HIGH]`

For explicit state machines or guarded workflows, attempt invalid or
out-of-order transitions and verify they are rejected or handled according to
the contract without corrupting the current state.

### FL-TEST-096 — Test liveness of serialization and locking paths `[HIGH]`

When code introduces a mutex, serialized executor, queued operation,
Completer-based rendezvous, isolate handshake, or another wait dependency,
exercise nested/reentrant and terminal paths that could wait on the same
boundary. Fail the test deterministically if the operation cannot make
progress.

### FL-TEST-097 — Test malformed, duplicate, stale, and out-of-order input `[HIGH]`

At changed external boundaries, cover the input classes that the contract must
tolerate or reject. Verify invalid input cannot partially mutate authoritative
state before validation completes.
