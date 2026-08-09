# Architecture and API engineering

Use this rulebook when designing, implementing, refactoring, or reviewing
production behavior, public APIs, stateful components, and asynchronous work.

## 1. Consumer behavior

### CX-ARCH-001 — Reconstruct the consumer workflow `[HIGH]`

Trace changed behavior from the public call site through success, failure,
cancellation, retry, and terminal completion.

### CX-ARCH-002 — Review observable behavior before implementation shape `[HIGH]`

Identify what the consumer can rely on: valid call order, state before/after,
results and errors, cancellation and retry, delivery guarantees.

### CX-ARCH-003 — Keep one authoritative source of truth `[BLOCKER]`

Do not maintain competing mutable representations of the same state. Derived
values should be computed from or updated atomically with their authority.

## 2. Ownership and lifecycle

### CX-ARCH-010 — Give every lifecycle one owner `[HIGH]`

Assign one owner for start, mutation, cancellation, completion, reset, and
cleanup.

### CX-ARCH-011 — Give every long-lived async job an owner `[HIGH]`

Every long-lived promise, timer, subscription, or worker must have an owner for
retention, duplicate prevention, cancellation, terminal cleanup, and shutdown.

Fire-and-forget is valid only when completion is independent of the creating
object and failure is deliberately handled.

### CX-ARCH-012 — Balance registration with removal `[HIGH]`

Every listener, subscription, interval, and registry entry needs a defined
removal path on completion, cancellation, failure, replacement, and destroy.

### CX-ARCH-013 — Complete terminal operations exactly once `[BLOCKER]`

A lifecycle must deliver at most one terminal result. Guard against concurrent
finish/stop, error and success both completing, and interruption during
finalization.

### CX-ARCH-014 — Define resource ownership before cleanup `[HIGH]`

Identify whether Cortex or the caller owns files, temp paths, connections, and
external handles before deleting or resetting them.

## 3. Concurrency and serialization

### CX-ARCH-020 — Identify the serialization boundary `[HIGH]`

Know which mutations must be serialized (single owner, mutex, queue, or
sequential awaits). Do not recommend main-thread affinity without a UI reason.

### CX-ARCH-021 — Serialize the complete stateful operation `[BLOCKER]`

All entry points that mutate one lifecycle must pass through the same
serialization strategy end to end — including nested callbacks and retries.

### CX-ARCH-022 — Revalidate assumptions after await `[HIGH]`

After any `await` or yield point, re-check state that may have changed before
mutating or completing.

## 4. State and mutation

### CX-ARCH-030 — Prefer typed states over independent flags `[HIGH]`

Expose one coherent status model. Avoid public combinations the implementation
cannot produce safely.

### CX-ARCH-031 — Reject invalid transitions `[HIGH]`

Illegal transitions should fail with typed errors, not silent no-ops or
undefined behavior.

### CX-ARCH-032 — Leave the last safe state on failure `[HIGH]`

Validate before mutation. On failure, roll back or leave the last safe state.

## 5. Responsibility and abstraction

### CX-ARCH-040 — One concrete job per abstraction `[HIGH]`

Each type should solve one clear problem. Do not introduce interfaces, factories,
or coordinators without a demonstrated need.

### CX-ARCH-041 — Keep transport and storage out of domain APIs `[HIGH]`

Do not leak HTTP, SQL, filesystem layout, or DI wiring into public domain
contracts unless that exposure is an explicit product requirement.

## 6. Errors and recovery

### CX-ARCH-050 — Use typed semantic errors per layer `[HIGH]`

Each layer maps lower failures into its own errors and preserves `cause`.
Consumers branch on codes / types, not message strings.

### CX-ARCH-051 — Preserve cancellation semantics `[HIGH]`

Cancellation must be distinguishable from failure where the contract promises it.
Honor `AbortSignal` through the stack.

## 7. Refactor completeness

### CX-ARCH-060 — Update every affected path `[HIGH]`

Change call sites, docs, and tests with the code. Delete the superseded path.

### CX-ARCH-061 — Do not widen into unrelated cleanup `[MEDIUM]`

Fix only what the change requires. Leave compliant legacy alone.
