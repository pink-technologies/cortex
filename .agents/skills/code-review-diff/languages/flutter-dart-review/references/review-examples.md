# Review Examples

Use these examples to calibrate evidence, scope, severity, and merge
disposition. Do not copy a finding unless the reviewed change demonstrates the
same root cause.

## Valid architecture finding

```text
[HIGH/required_before_merge] BLoC bypasses Repository boundary — FL-BLOC-010
Location: lib/screens/profile/bloc/profile_bloc.dart:74
Evidence: The new submit handler resolves ProfileResource directly and calls
the endpoint, while ProfileRepository is the package's existing consumer data
boundary and owns model/error mapping.
Impact: Presentation now depends on transport behavior and creates a second
execution path that bypasses Repository state/error semantics.
Fix: Inject ProfileRepository into ProfileBloc and route the operation through
the Repository; remove the direct Resource resolution.
Tests: Update ProfileBloc tests to mock ProfileRepository and verify success,
failure, and invalid-submit behavior.
Confidence: high
```

## Valid async lifecycle finding

```text
[HIGH/required_before_merge] Older search response can overwrite newer state — FL-BLOC-042
Location: lib/screens/search/bloc/search_bloc.dart:91
Evidence: Each query event starts an independent request and all completions
emit results. A slow request for "a" can complete after the newer "ab" request
and replace the state with stale results.
Impact: The user can see results for a previous query.
Fix: Make search latest-wins using the established restart/debounce transform
or an equivalent operation token.
Tests: Add an overlapping-query BLoC test where the older request completes
last and verify only the newest result is emitted.
Confidence: high
```

## Valid test-structure finding

```text
[MEDIUM/recommended_before_merge] New Repository tests do not follow the established Given/When/Then contract — FL-TEST-010
Location: test/repository/order_repository_test.dart:28
Evidence: The new tests interleave stubbing, execution, and verification,
making it unclear which setup belongs to each behavior and allowing calls made
during setup to satisfy later verification.
Impact: The tests are harder to review and can hide incorrect interaction
ordering.
Fix: Restructure each behavioral test into explicit Given, When, and Then
phases and keep one operation in When.
Tests: Existing test behavior remains the verification surface.
Confidence: high
```

## Do not report untouched legacy naming

If a changed function calls an existing `HTTPApiClient` but does not introduce,
rename, or alter that type's contract, do not report `FL-NAME-010` merely
because the legacy declaration uses old acronym capitalization.

## Do not report deterministic lint noise

If `flutter analyze` already reports three `prefer_const_constructors`
diagnostics, report them under Validation. Do not create three AI findings.

Create one higher-level finding only if the diagnostics demonstrate a semantic
root cause not captured by the analyzer itself.

## Product decision example

Use `product_decision` only when the code is technically implementable in
multiple materially different ways and the correct observable behavior is not
defined. State the exact decision needed; do not label missing engineering
evidence as a product decision.

