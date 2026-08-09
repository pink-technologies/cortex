---
name: flutter-dart-style
description: Write, modify, refactor, document, test, and review production Flutter and Dart code using the project's architecture, BLoC, API, UI, naming, documentation, lifecycle, concurrency, hardening, testing, security, and PR-review rules. Use for Flutter/Dart implementation, refactoring, architecture review, code review, pull-request review, missing-work assessment, and test work.
---

# Flutter and Dart Engineering

Apply an evidence-based production engineering standard. Preserve clear layer
ownership, direct designs, predictable BLoC state, package boundaries, lifecycle
safety, and testability before formatting or polish.

## Select the operating mode

### Implementation mode

Use when asked to write, change, fix, refactor, document, or test code.

- Implement the requested behavior end to end.
- Apply applicable `FL-*` rules while writing.
- Preserve unrelated code and compliant author style.
- Update affected call sites, documentation, DI, routes, exports, and tests.
- Remove superseded execution paths created by the change.
- Run the most relevant deterministic checks available.
- Report checks as `PASS`, `FAIL`, or `NOT_RUN`.

### Review mode

Use when asked to review a pull request, diff, proposal, architecture, existing
implementation, public API, or missing work.

- Do not modify code unless implementation is also requested.
- Limit findings to issues introduced by or materially affected by the change.
- Inspect unchanged call sites, tests, registrations, exports, routes, and
  configuration when required to validate a changed-code finding.
- Report only findings supported by concrete evidence.

### Combined mode

When implementation and review are both requested, implement and verify first,
then review the resulting change. Keep implementation results separate from
review findings.

## Load the rulebooks

Always read:

- `references/review-philosophy.md`
- `references/architecture-and-layers.md`
- `references/accepted-exceptions.md`

Read the remaining references when the task touches their subject:

- `references/api-and-repository-design.md` for APIs, repositories, resources,
  models, entries, parameters, clients, caching, or retry behavior.
- `references/bloc-state-management.md` for BLoC, events, states, streams, and
  presentation state.
- `references/dependency-injection.md` for modules, containers, registration,
  resolution, scopes, or environment assembly.
- `references/lifecycle-and-async.md` for Futures, streams, subscriptions,
  timers, controllers, cancellation, overlapping work, and async UI code.
- `references/concurrency-and-hardening.md` for mutable async state, event
  ordering, races, reentrancy, locks or serialized work, deadlocks, state
  machines, timeouts, retries, idempotency, external boundaries, and partial
  failure.
- `references/flutter-ui.md` for screens, views, widgets, composition,
  rebuilding, Design System usage, localization, and accessibility.
- `references/responsive-layout.md` for adaptive layouts and screen sizes.
- `references/navigation.md` for routes, parameters, redirects, and intents.
- `references/naming-full-spec.md` for identifier and file naming.
- `references/source-file-basics.md` for imports, exports, regions, generated
  code, and source organization.
- `references/documentation-comments-full-spec.md` for Dartdoc.
- `references/error-handling.md` for exceptions, failure mapping, and recovery.
- `references/testing-strategy-full-spec.md` for tests and Given/When/Then.
- `references/security-and-configuration.md` for secrets, configuration,
  privacy, logging, and environment boundaries.
- `references/review-examples.md` when calibrating findings.

Treat repository formatter, analyzer, lint, build, and test configuration as
the executable source of truth for deterministic rules. Report configuration
drift instead of inventing competing style requirements.

## Apply precedence

Use this order:

1. User instructions for the current task
2. Repository and organization instructions
3. These Flutter/Dart rules and accepted exceptions
4. Repository formatter, analyzer, lint, build, and test configuration
5. Effective Dart and Flutter framework guidance
6. Existing local style when several compliant choices remain

Do not use generic Flutter guidance to replace an explicit project
architecture.

## Architectural baseline

Preserve the established dependency direction:

```text
App / Composition Root
        |
        v
Experiences ----------------> UI Components / Design System
        |
        v
       APIs
        |
        v
     Services
        |
        v
   Data Access
        |
        v
       Core
```

The normal feature data path is:

```text
Screen / View -> BLoC -> Repository -> Resource -> Service Client
```

Do not force a generic `data/domain/ui` or MVVM layout onto repositories that
use the established package/Experience architecture.

## Implementation requirements

- Keep one authoritative owner for mutable state and every lifecycle.
- Define isolation and ordering for mutable async state and overlapping work.
- Harden external and long-running boundaries against invalid input, stale
  results, cancellation, retry, duplicate execution, and partial failure.
- Keep Views declarative and business behavior outside `build()`.
- Constructor-inject BLoC and behavioral dependencies.
- Keep transport details below Repository boundaries.
- Keep `Entry`/DTO types out of presentation code.
- Add abstractions only for demonstrated ownership, reuse, behavior, or test
  seams.
- Preserve meaningful errors and user-safe presentation failures.
- Update documentation and tests with changed behavior.
- Perform a deletion pass after refactors.
- Do not commit secrets or sensitive data.

## Review risk order

Review in this order:

1. Consumer-visible behavior and regressions
2. Security, privacy, data loss, crashes, and broken flows
3. Layer ownership and dependency direction
4. State ownership, BLoC transitions, concurrency, races, deadlocks, async
   work, and lifecycle cleanup
5. API, Repository, Resource, Entry, and public package boundaries
6. DI lifetime, routing, cross-Experience contracts, and configuration
7. Hardening, error, timeout, retry, idempotency, and recovery semantics
8. Regression and behavioral test coverage
9. Refactor completeness and deletion pass
10. UI composition, responsive behavior, accessibility, and performance
11. Documentation, naming, file organization, and formatting

## Review severity model

### BLOCKER

Use for a demonstrated crash, deadlock, corruption, data loss, credential or
privacy exposure, broken critical flow, unrecoverable lifecycle, or similarly
unsafe behavior that must not merge.

### HIGH

Use for material correctness or architectural risks that should be corrected
before merge, including ownership violations, layer bypasses, stale async work,
wrong DI lifetime, broken public boundaries, unsafe errors, missing cleanup, or
missing regression coverage for high-risk changed behavior.

### MEDIUM

Use for objective localized maintainability, naming, organization,
documentation, test-structure, responsive, or performance issues with concrete
impact and a small correction.

### LOW

Use only for objective non-subjective polish not already enforced by
deterministic tooling.

## Merge disposition

Keep technical severity separate from merge disposition:

- `required_before_merge`: the finding must be resolved before merge.
- `recommended_before_merge`: correction is strongly recommended in the PR but
  does not independently block merge.
- `follow_up`: the issue is valid and safely separable from the PR.
- `product_decision`: behavior cannot be judged without an explicit product or
  architecture decision; state the exact decision required.

Do not lower technical severity merely because a finding is assigned to a
follow-up.

## Validate every finding

Before reporting a finding:

1. Identify the changed declaration or behavior.
2. Trace a concrete failure, misuse, or objective rule violation.
3. Cite the exact `FL-*` rule.
4. Explain runtime, consumer, security, or maintenance impact.
5. Propose the smallest coherent correction.
6. Name the verification or regression tests required.
7. Confirm an accepted exception does not apply.
8. Assign confidence from the available evidence.

Report one finding per root cause. Consolidate repeated locations. Do not
manufacture low-severity findings to make a review look complete.

## PR review output contract

Use this order:

### Decision

- Verdict: `BLOCK MERGE`, `REQUEST CHANGES`, `SAFE TO MERGE`, or
  `REVIEW_INCOMPLETE`
- Highest technical severity
- Material issue count
- One-sentence risk summary

### Summary

Summarize the changed behavior and architecture surface.

### Strengths

List concrete strengths only when they materially help the review. Do not add
generic praise.

### Findings

Use:

```text
[SEVERITY/disposition] Concise finding title — FL-RULE-ID
Location: path/file.dart:line
Evidence: Concrete changed behavior and reproducible scenario.
Impact: Runtime, consumer, security, or maintenance consequence.
Fix: Smallest coherent correction.
Tests: Required verification or regression coverage.
Confidence: high | medium | low
```

### Validation

Report relevant checks as `PASS`, `FAIL`, or `NOT_RUN`, including formatter,
analyzer, tests, build, and code generation when applicable.

### Applied guidance

Name the project rules or external guidance materially used for the decision.

### Limitations

List missing files, unavailable checks, unverified platform behavior, and
anything that makes the review incomplete.
