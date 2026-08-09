# API design

Apply these contract rules when designing or reviewing public TypeScript APIs.

## 1. Consumer surface

### CX-API-001 — Judge the API from the call site `[HIGH]`

Read representative consumer calls without implementation knowledge. Names,
defaults, valid order, state effects, results, and errors must be clear from the
public contract.

### CX-API-002 — Keep the public surface minimal `[HIGH]`

Export only what consumers need. Do not export internals merely so another
module can reach them — use proper module boundaries instead.

### CX-API-003 — Use export visibility intentionally `[HIGH]`

Prefer unexported modules and `private` / `#` members. Do not rely on naming
conventions to pretend a public export is private.

### CX-API-004 — Prefer concrete types by default `[MEDIUM]`

Introduce an interface only for real substitution, testing seams, or meaningful
module boundaries. Do not create one-implementation interfaces for symmetry.

### CX-API-005 — Avoid leaking implementation topology `[HIGH]`

Keep queues, storage layout, HTTP details, and DI wiring out of public API
unless exposure is an approved product requirement.

### CX-API-006 — Name for the call site `[MEDIUM]`

- Methods: verb phrases
- Types and properties: noun phrases
- Booleans: read as assertions at the use site (`canRetry`, `isReady`)
- Omit needless words; avoid obscure abbreviations

### CX-API-007 — Keep configuration at the correct boundary `[HIGH]`

Per-invocation values belong on the operation. Stable setup belongs on the
owning type or Nest configuration module.

## 2. State and ownership

### CX-API-020 — Make ownership and lifetime clear `[HIGH]`

The contract must say who owns mutable state, callbacks, returned handles,
files, streams, and cancellation.

### CX-API-021 — Expose one authoritative state model `[BLOCKER]`

Do not expose independently mutable flags that can disagree. Prefer one status
plus derived read-only capabilities.

### CX-API-022 — Make invalid configurations hard to construct `[HIGH]`

Prefer typed inputs, validated constructors, and small builders when they
prevent unsupported combinations.

## 3. Concurrency and errors

### CX-API-030 — Document cancellation and abort `[HIGH]`

If work is cancellable, accept `AbortSignal` (or equivalent) and document
behavior when aborted.

### CX-API-031 — Throw typed, semantic errors `[HIGH]`

Public failures should be typed errors with stable codes. Preserve underlying
causes for diagnostics without forcing consumers to parse messages.

### CX-API-032 — Do not promise unguaranteed behavior `[HIGH]`

Do not document ordering, timing, retry, or recovery the implementation does
not guarantee.

## 4. Compatibility

### CX-API-040 — Preserve compatibility deliberately `[HIGH]`

Treat exported package surfaces as versioned contracts. Prefer additive changes;
use explicit migration when breaking.

### CX-API-041 — Keep dual paths temporary `[MEDIUM]`

Deprecation and shims need an owner and a removal plan. Do not leave permanent
duplicate APIs.

## 5. Engineering discipline

### CX-API-050 — Prefer smallest coherent design `[HIGH]`

Do not recommend factories, wrappers, or large refactors without a demonstrated
current problem.

### CX-API-051 — Align docs and tests with the contract `[HIGH]`

Public JSDoc and regression tests must describe the same behavior the API
exposes.
