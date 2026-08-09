# Implementation workflow

Use this workflow when writing, modifying, fixing, refactoring, documenting, or
testing Cortex code.

## 1. Understand the change

### CX-IMPL-001 — Inspect before editing

Read repository instructions, affected declarations, call sites, dependency
construction, relevant tests, and package export surfaces when compatibility may
change.

Do not infer architecture from a pasted declaration when the implementation or
call sites are available.

### CX-IMPL-002 — Define the requested outcome

State consumer-visible behavior before implementing: valid input and call order,
success, failure, cancellation, retry/recovery, and state after completion.

## 2. Design before mutation

### CX-IMPL-010 — Identify ownership and isolation

Before changing stateful code, identify the authoritative owner, source of
truth, serialization boundary, legal states, await/reentrancy points, resource
ownership, and terminal cleanup.

### CX-IMPL-011 — Preserve compatibility deliberately

For public package changes, determine source and behavioral compatibility. Use
deprecation and one internal implementation path when migration is required.

### CX-IMPL-012 — Prefer the smallest coherent design

Do not introduce an interface, factory, wrapper, or new state layer unless it
solves a current demonstrated problem.

Smallest coherent does not mean changing only one line while leaving related
call sites, cleanup, docs, or tests inconsistent.

## 3. Implement the complete path

### CX-IMPL-020 — Complete every affected execution path

Implement success, failure, cancellation, and cleanup through the stack. Prefer
complete, typecheckable changes over illustrative fragments.

### CX-IMPL-021 — Preserve meaningful errors and last safe state

Validate before mutation. Map lower-layer failures to this layer’s semantic
errors with `cause`. Leave the last safe state on failure.

### CX-IMPL-022 — Honor cancellation

Propagate `AbortSignal` (or equivalent) and define terminal behavior when
aborted.

## 4. Clean up the old path

### CX-IMPL-030 — Delete superseded work

Remove obsolete helpers, dual paths, dead docs, and dead tests created or
replaced by the change.

### CX-IMPL-031 — Do not widen into unrelated cleanup

Leave compliant legacy alone.

## 5. Document and test

### CX-IMPL-040 — Update public JSDoc with the change

Keep docs aligned with guaranteed behavior.

### CX-IMPL-041 — Add regression coverage at the public boundary

Prove the requested behavior and protect the failure mode. Prefer public-API
tests over exporting private helpers.

## 6. Verify and report

### CX-IMPL-050 — Run the most relevant checks

Typecheck, unit/integration tests, and formatter/linter as available. Report
each as `PASS`, `FAIL`, or `NOT_RUN`.

### CX-IMPL-051 — Report the implementation outcome

Lead with changed consumer-visible behavior, cleanup decisions, changed files,
tests, verification status, and remaining gaps. Do not emit review severities
unless review was also requested.
