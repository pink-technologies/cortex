# Lifecycle and Async Work

## Contents

1. Ownership
2. Futures and cancellation
3. Streams and controllers
4. UI async boundaries
5. Overlapping work
6. Failure

## 1. Ownership

### FL-LIFE-001 — Give every long-lived operation one owner `[HIGH]`

Assign an owner to subscriptions, timers, controllers, streams, manually
created BLoCs, listeners, and long-running async operations. The owner is
responsible for start, replacement, cancellation, and cleanup.

### FL-LIFE-002 — Balance acquisition with cleanup `[HIGH]`

Dispose or cancel owned `StreamSubscription`, `Timer`, `AnimationController`,
`TextEditingController`, `FocusNode`, `StreamController`, and comparable
resources on every terminal lifecycle path.

## 2. Futures and cancellation

### FL-LIFE-010 — Await owned asynchronous work `[HIGH]`

Await Futures whose completion or failure affects the current operation.
Deliberately detached work must have explicit ownership and error handling; do
not silently discard a Future.

### FL-LIFE-011 — Preserve cancellation/replacement semantics `[HIGH]`

When an operation can be superseded, ensure the old operation cannot publish a
stale terminal result after the new operation becomes authoritative.

## 3. Streams and controllers

### FL-LIFE-020 — Own subscriptions and stream termination `[HIGH]`

Define who subscribes, who cancels, and what happens on error/completion.
Prefer BLoC-aware stream APIs such as `emit.forEach` when they naturally tie
subscription lifetime to the handler.

### FL-LIFE-021 — Close owned stream controllers `[HIGH]`

Any manually owned `StreamController`, subject, or equivalent producer must
have a terminal close/dispose path unless its lifetime intentionally matches
the process and that ownership is documented.

## 4. UI async boundaries

### FL-LIFE-030 — Validate BuildContext after suspension `[HIGH]`

After `await`, guard context-dependent UI work with the appropriate mounted
check when the widget/context may have been removed.

Do not suppress the analyzer warning without proving lifetime safety.

## 5. Overlapping work

### FL-LIFE-040 — Prevent stale async writes `[HIGH]`

For searches, refreshes, pagination, repeated form submissions, and similar
work, define whether operations are latest-wins, serialized, droppable, or
parallel. Test the chosen behavior when races are realistic.

### FL-LIFE-041 — Debounce only where semantics require it `[MEDIUM]`

Use debouncing for bursty user input such as remote search, not as a generic
workaround for duplicate events or incorrect ownership.

## 6. Failure

### FL-LIFE-050 — Do not hide asynchronous failure `[HIGH]`

Do not use empty catches or detached async work that can fail without an
explicit diagnostic/recovery path.

