# Testing strategy

Test consumer-observable behavior and lifecycle guarantees. Avoid tests that
only reproduce private implementation structure.

## Required coverage

### CX-TEST-001 — Add a regression test for every bug fix `[HIGH]`

Reproduce the original failure before validating the correction. The test must
fail when the bug is reintroduced.

### CX-TEST-002 — Cover changed public behavior `[HIGH]`

Test the public or closest stable internal boundary for:

- Success
- Expected failure
- Invalid state or configuration
- Cancellation
- Retry or recovery
- Repeated invocation
- Terminal cleanup

### CX-TEST-003 — Test meaningful state transitions `[HIGH]`

For stateful components, cover legal and rejected transitions (start twice,
stop while starting, cancel after acquisition, retry after recoverable failure).

### CX-TEST-004 — Test lifecycle cleanup `[HIGH]`

Verify cancellation, listener removal, temp-file cleanup, resource release, and
shutdown when the change affects ownership.

### CX-TEST-005 — Prefer the public boundary `[HIGH]`

Do not export private helpers solely for tests when the public API already
exercises the behavior.

## Concurrency tests

### CX-TEST-010 — Make concurrency tests deterministic `[HIGH]`

Coordinate with promises, AbortSignals, fake timers, or controlled dependencies.
Do not use arbitrary sleeps as the primary synchronization mechanism.

### CX-TEST-011 — Exercise overlapping operations `[HIGH]`

Test races the public contract must handle: concurrent finish, cancel racing
completion, duplicate preparation.

### CX-TEST-012 — Verify cancellation explicitly `[HIGH]`

Assert the documented abort/cancel result and terminal cleanup.

## Test design

### CX-TEST-020 — Name tests for behavior `[MEDIUM]`

Describe the scenario and expected outcome.

### CX-TEST-021 — Use Given–When–Then when nontrivial `[MEDIUM]`

Separate setup, action, and assertion for multi-step cases.

### CX-TEST-022 — Isolate the unit under test `[MEDIUM]`

Inject network, storage, clocks, and external services when isolation improves
reliability. Do not mock simple values or private structure merely to hit a
coverage number.

### CX-TEST-023 — Assert meaningful errors `[HIGH]`

Assert typed errors and relevant fields (`code`, `issueKey`, etc.), not only
that something threw.

### CX-TEST-024 — Keep tests independent `[HIGH]`

Do not depend on test order, shared mutable singletons, or uncontrolled external
services.

## Coverage policy

### CX-TEST-030 — Maintain the repository coverage target `[MEDIUM]`

Jest: aim for **100%** on modules under test; enforce **≥95%** via
`coverageThreshold`. Mark coverage `NOT_RUN` when the report is unavailable.

Coverage percentage does not replace behavior coverage for failure,
cancellation, recovery, or lifecycle transitions.

### CX-TEST-031 — Do not remove protection for changed behavior `[HIGH]`

Flag deletion, weakening, disabling, or unconditional skipping of tests that
protect behavior modified by the change.

### CX-TEST-040 — Use the smallest useful test set `[MEDIUM]`

Add concrete required scenarios. Do not request generic “more tests” or a large
unrelated rewrite.

### CX-TEST-041 — Separate unavailable checks from passing checks `[HIGH]`

Report typecheck, unit tests, and coverage independently as `PASS`, `FAIL`, or
`NOT_RUN`.
