# Concurrency and Hardening

Apply these rules to asynchronous mutable state, BLoC event processing,
serialized work, state machines, external boundaries, and long-running
operations. Treat concurrency findings as correctness findings, not generic
style advice.

## Contents

1. Isolation and atomicity
2. Ordering and races
3. Reentrancy and deadlocks
4. Boundary hardening
5. Retry, idempotency, and partial failure
6. State and identity hardening
7. Evidence threshold

## 1. Isolation and atomicity

### FL-CONC-001 — Give mutable asynchronous state one isolation boundary `[HIGH]`

Identify the owner that serializes or otherwise coordinates every mutable
state transition that can interleave. Use the mechanism appropriate to the
codebase, such as BLoC event semantics, a single owner, a mutex, or a serialized
executor.

Do not add locking solely because code is asynchronous. Require coordination
when two reachable operations can observe or mutate the same invariant in an
unsafe order.

### FL-CONC-002 — Keep dependent checks and mutations atomic `[HIGH]`

Keep status checks, authorization/precondition checks, read-modify-write
operations, and their dependent mutation inside the same effective isolation
boundary when another operation could invalidate the checked state.

Revalidate after an `await` when suspension permits a competing operation to
change the invariant before the mutation resumes.

## 2. Ordering and races

### FL-CONC-010 — Define overlapping-operation semantics `[HIGH]`

For work that can overlap, deliberately choose the observable policy:
serialized, latest-wins/restartable, droppable, or intentionally concurrent.
Do not rely on completion timing to determine which result becomes
authoritative.

Use `FL-BLOC-042` and `FL-LIFE-040` for the corresponding BLoC and lifecycle
contracts rather than reporting the same root cause multiple times.

### FL-CONC-011 — Correlate results with the operation that owns them `[HIGH]`

Before publishing an asynchronous result, verify it still belongs to the
current request, generation, entity, authentication/session state, route, or
other authoritative owner when that identity can change while work is in
flight.

An older success or failure must not overwrite newer authoritative state.

## 3. Reentrancy and deadlocks

### FL-CONC-020 — Preserve invariants across reentrant callbacks `[HIGH]`

Assume synchronous streams, callbacks, listeners, delegates, or user-provided
code may re-enter the owner when the API permits it. Do not publish callbacks
or notifications while internal state is temporarily inconsistent if the
callback can synchronously call back into that state.

### FL-CONC-021 — Prevent cyclic waits and self-deadlocks `[HIGH]`

Do not wait for work that requires the currently held serialization boundary
to make progress. Check for same-lock reacquisition, dispatching onto and
awaiting the same serialized executor, cyclic `Completer` dependencies,
cross-isolate request cycles, and platform callbacks that require a blocked
owner to resume.

Escalate a demonstrated deadlock or permanently blocked critical flow to
`BLOCKER` severity.

### FL-CONC-022 — Do not retain exclusive ownership across a reentrant await `[HIGH]`

Do not hold a mutex, transaction-like serialization token, or other exclusive
boundary across an `await` when the awaited path can re-enter or itself require
that same boundary. Narrow the critical section or split the operation while
preserving the invariant.

Do not flag an ordinary awaited BLoC handler merely because it is serialized;
prove that the awaited dependency needs the same exclusive boundary.

## 4. Boundary hardening

### FL-HARD-001 — Validate external input before authoritative mutation `[HIGH]`

At network, storage, platform-channel, deep-link, route, push, and other
external boundaries, handle the malformed, missing, duplicate, stale, and
out-of-order inputs that are realistic for the contract. Complete validation
before committing authoritative state when partial mutation would be unsafe.

### FL-HARD-002 — Define timeout and cancellation for operations that can outlive their owner `[HIGH]`

For network requests, background work, user-triggered workflows, and other
operations that can block progress or outlive their owning lifecycle, define
how cancellation or timeout terminates the operation and what state remains.

Do not require arbitrary timeouts for every `Future`; require them when the
boundary has a real liveness or lifecycle requirement.

## 5. Retry, idempotency, and partial failure

### FL-HARD-010 — Keep retries bounded and semantically owned `[HIGH]`

Bound automatic retry attempts and define which failures are retryable. Use the
layer ownership from `FL-API-050`; do not create nested independent retry loops
across Resource, Repository, and BLoC layers.

Do not automatically retry a non-idempotent operation unless duplicate effects
are prevented by the contract.

### FL-HARD-011 — Make realistically repeated operations safe `[HIGH]`

When an operation can be repeated by double taps, duplicate events, network
retry, reconnect, redelivery, app resume, or navigation restoration, define
whether repetition is idempotent, rejected, deduplicated, or intentionally
creates another effect.

### FL-HARD-012 — Define partial-failure semantics `[HIGH]`

For multi-step work, identify which effects may already have committed when a
later step fails. Implement the required rollback, cleanup, reconciliation, or
resume behavior and preserve enough state to recover safely.

Do not report apparent success when required work remains inconsistent; apply
`FL-ERR-041` when failure is incorrectly converted into success.

## 6. State and identity hardening

### FL-HARD-020 — Reject invalid state transitions `[HIGH]`

Explicit state machines and guarded workflows must define valid transitions.
Reject, ignore, or recover from invalid/out-of-order events according to the
contract without partially applying the target transition.

### FL-HARD-021 — Do not let stale identity authorize new state `[HIGH]`

When authentication, account, tenant, entity, route, or session identity can
change during asynchronous work, correlate the final mutation with the current
identity. Cancel, discard, or remap stale work rather than publishing it into
the new owner.

## 7. Evidence threshold

### FL-CONC-030 — Require a concrete concurrency failure path `[HIGH]`

Do not label code a race or deadlock merely because it uses `async`, streams,
BLoC, isolates, or a lock. For a concurrency finding, identify the competing
operations, the relevant suspension/serialization points, a reachable ordering
or wait dependency, and the violated invariant or liveness requirement.

Distinguish ordinary asynchronous interleaving from a traditional shared-memory
thread race. Dart isolate-local objects do not become cross-thread shared
mutable memory merely because Futures overlap; logical ordering and reentrancy
bugs are still valid when their failure path is demonstrated.
