---
name: cortex-style
description: >-
  Write, modify, refactor, document, test, and review Cortex TypeScript/Nest
  code using the official engineering style, public API, architecture,
  lifecycle, cleanup, and testing rules. Use for every Cortex implementation
  task, bug fix, feature, refactor, API design, hardening review, pull request
  review, or missing-work assessment.
---

# Cortex engineering style

Apply an evidence-based senior engineering standard. Protect consumer-visible
behavior, public API stability, ownership, lifecycle safety, and concurrency
correctness before formatting or polish.

Also follow `.cursor/rules/cortex-style.mdc`, `.cursor/rules/code-organization.mdc`,
and `.cursor/rules/test-coverage.mdc`.

## Select the operating mode

Choose the mode from the user's requested action.

### Implementation mode

Use when asked to write, change, fix, refactor, document, or test code.

- Implement the requested behavior.
- Apply the rulebooks proactively while writing.
- Make the smallest coherent end-to-end change.
- Preserve unrelated code and compliant author style.
- Update affected call sites, public JSDoc, and tests.
- Remove superseded code and duplicate execution paths.
- Verify the result with available deterministic checks.
- Report the implementation outcome, not review severities or a merge verdict.

Read `references/implementation-workflow.md`.

### Review mode

Use when asked to review a pull request, diff, proposal, existing implementation,
architecture, public API, or missing work.

- Do not modify code unless the user also requests implementation.
- Report only validated findings.
- Apply the severity, evidence, and review output contracts below.

Read `references/review-examples.md` when calibrating findings.

### Combined mode

When explicitly asked to implement and review, complete the implementation
first, verify it, and then review the resulting change. Keep the implementation
summary separate from review findings.

## Load the rulebooks

Always read:

- `references/review-philosophy.md`
- `references/architecture-and-api-review.md`
- `references/api-design-full-spec.md`
- `references/accepted-exceptions.md`
- `references/cortex-typescript-overlay.md` (TypeScript/Nest specialization)

Read the remaining references when the task touches their subject:

- `references/source-file-basics.md` for file structure, imports, headers, and
  member organization.
- `references/formatting-full-spec.md` for objective formatting requirements.
- `references/naming-full-spec.md` for identifier and API naming.
- `references/documentation-comments-full-spec.md` for public JSDoc.
- `references/testing-strategy-full-spec.md` for production behavior, bug fixes,
  state transitions, concurrency, or tests.

Apply repository Prettier/ESLint/Jest configuration as the executable tooling.
When documentation and configuration disagree, report or correct configuration
drift rather than satisfying contradictory rules.

## Apply precedence

1. User instructions for the current task
2. Cortex style skill + Cursor rules (including `CX-*` rulebooks)
3. Repository build settings and deterministic tool configuration
4. Existing local style when several layouts remain valid

Cortex rules win conflicts between rulebooks. Do not invent additional
stylistic rules.

## Establish work scope

### Implementation scope

Treat the requested behavior as the primary scope. Inspect relevant unchanged
code, call sites, tests, build settings, public API surfaces, and related types
before editing.

Modify additional code only when required to:

- Complete the requested behavior safely
- Preserve source or package-export compatibility
- Maintain one owner or source of truth
- Update affected documentation and tests
- Remove a superseded execution path created by the change
- Make the edited target build and pass required checks

Do not rewrite unrelated legacy code or widen the task with cosmetic cleanup.

### Review scope

Limit findings to issues introduced by or materially affected by the reviewed
change.

Inspect relevant unchanged context when required to validate a changed-code
finding. Do not report unrelated legacy problems.

If essential evidence is unavailable, identify it and mark the affected
conclusion `REVIEW_INCOMPLETE`. Do not replace missing evidence with an
assumption.

## Implementation workflow

1. Inspect repository instructions, toolchain settings, existing architecture,
   affected public declarations, call sites, and tests.
2. Define the requested consumer-visible behavior, including success, failure,
   cancellation, interruption, retry, and compatibility where relevant.
3. Identify ownership, isolation boundaries, state transitions, resources, and
   terminal cleanup before changing stateful code.
4. Implement the smallest coherent solution through every affected execution
   path.
5. Preserve meaningful errors, cancellation semantics, rollback, and the last
   safe state.
6. Perform a deletion pass for obsolete state, helpers, tasks, observers,
   overloads, compatibility paths, documentation, and tests.
7. Add or update public JSDoc and regression coverage.
8. Run the most relevant available formatter, linter, typecheck, unit, or
   integration checks.
9. Report checks as `PASS`, `FAIL`, or `NOT_RUN` and disclose remaining gaps.

Do not leave placeholder implementations, incomplete lifecycle branches, or
unresolved `TODO` markers unless the user explicitly requests a scaffold or the
missing work is a reported blocker.

## Review workflow

Review in this risk order:

1. Reconstruct the consumer workflow and changed behavior.
2. Trace ownership, lifecycle, state transitions, failure, cancellation, and
   cleanup.
3. Validate concurrency boundaries, serialization, reentrancy, tasks, streams,
   callbacks, and shared mutable state.
4. Review the public API as a durable source and package-export compatibility
   contract.
5. Validate responsibility boundaries and require each abstraction to solve a
   concrete current problem.
6. Review error semantics, recovery, privacy, and observability.
7. Verify regression coverage for success, failure, invalid transitions,
   cancellation, and recovery.
8. Perform a deletion pass for obsolete state, helpers, tasks, observers,
   compatibility layers, and duplicated logic.
9. Review JSDoc, naming, organization, and formatting.

Do not approve concurrency or lifecycle safety from a declaration alone. Trace
the actual mutation and completion paths.

## Implementation requirements

When writing code:

- Follow every applicable `CX-*` rule unless an accepted exception applies.
- Prefer complete, typecheckable changes over illustrative fragments.
- Preserve public compatibility unless the requested change explicitly includes
  a migration.
- Prefer concrete types and direct behavior over speculative abstractions.
- Keep one authoritative owner and source of truth.
- Serialize stateful operations end to end where races matter.
- Give every task, observer, AbortSignal consumer, file, and external resource a
  terminal owner.
- Update all affected call sites when changing an internal contract.
- Add tests that prove the requested behavior and protect the failure mode.
- Preserve existing compliant formatting, ordering, naming, and documentation
  wording outside the necessary change.
- Apply `references/cortex-typescript-overlay.md` for models/, errors, MARK,
  imports, networking, and Nest-specific layout.

## Review severity model

Use severities only in review mode.

### BLOCKER

Use when the changed code creates or preserves a demonstrated:

- Crash, deadlock, data race, corruption, or data-loss path
- Security or privacy exposure
- Broken public source or package-export contract without an explicit migration
- Invalid or unrepresentable public state that consumers can reach
- Double completion, leaked resource, or terminal lifecycle that cannot finish
- Unsafe shared mutable state crossing an isolation boundary

Block merge.

### HIGH

Use for material risks that should be corrected before merge:

- Unclear ownership, task lifetime, cancellation, or terminal cleanup
- Incomplete recovery, rollback, error propagation, or refactor cleanup
- Public API likely to be misused or exposing unnecessary implementation detail
- Missing regression tests for changed high-risk or bug-fix behavior
- Missing or materially incorrect public documentation
- Missing or incorrect PinkTech copyright header on a changed TypeScript file
- Repeated structural rule violations not better reported by deterministic tools

Request changes.

### MEDIUM

Use for localized maintainability, testability, naming, documentation, or
structural issues with objective evidence and a small correction.

### LOW

Use only for non-subjective polish that is not already reported by Prettier,
ESLint, the TypeScript compiler, or tests.

## Validate every review finding

Before reporting a finding:

1. Identify the changed declaration or behavior.
2. Trace a concrete failure or misuse scenario.
3. Cite the exact `CX-*` rule identifier.
4. Explain the runtime, maintenance, compatibility, or consumer impact.
5. Propose the smallest coherent correction.
6. Name the tests required to prevent regression.
7. Confirm the finding is not an accepted exception.

Report one finding per root cause. Consolidate additional affected locations.
Report every validated blocker and high-severity issue. Consolidate repeated
medium and low issues.

Do not:

- Report speculative architecture.
- Recommend a factory, wrapper, generic abstraction, or broad refactor without
  demonstrating the current problem it solves.
- Treat a mutex, queue, weak capture, or lock as proof of safety without
  checking the protected operations.
- Duplicate deterministic diagnostics.
- Rewrite an entire file for a localized issue.
- Comment on compliant code merely to express a preference.

## Implementation output contract

Lead with what was implemented.

Include:

- Changed consumer-visible behavior
- Important implementation and cleanup decisions
- Changed files
- Added or updated tests
- Typecheck, test, Prettier/ESLint status using `PASS`, `FAIL`, or `NOT_RUN`
- Remaining blockers, deferred work, or assumptions

Do not emit finding severities, issue tables, or a merge verdict unless review
mode was also requested.

## Review output contract

Lead with the outcome.

### PR Review Summary

Include:

- Verdict: `BLOCK MERGE`, `REQUEST CHANGES`, `SAFE TO MERGE`, or
  `REVIEW_INCOMPLETE`
- Highest severity
- Material issue count
- One-sentence risk summary
- Verification status for typecheck, tests, Prettier/ESLint using `PASS`,
  `FAIL`, or `NOT_RUN`

### Findings

Order findings by severity and use this structure:

```text
[SEVERITY] Concise finding title — CX-RULE-ID
Location: file.ts:line
Evidence: Concrete changed behavior and reproducible scenario.
Impact: Runtime, consumer, compatibility, or maintenance consequence.
Fix: Smallest coherent correction.
Tests: Required regression coverage.
```

If no material findings are validated, say so directly. Do not manufacture low
severity feedback.

### Remaining uncertainty

List missing files, unavailable checks, unverified platform behavior, and any
conclusion marked `REVIEW_INCOMPLETE`.

### Final verdict

End with the merge decision and the minimum work required to change it.
