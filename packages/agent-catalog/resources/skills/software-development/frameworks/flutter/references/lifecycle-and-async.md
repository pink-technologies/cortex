# Flutter Lifecycle and Async Work

## Resource ownership

### FLUTTER-LIFE-001 — Dispose widget-owned resources

A widget or state object that creates controllers, focus nodes, subscriptions,
timers, observers, or similar lifecycle-bound resources is responsible for
releasing them when its lifecycle ends unless ownership is explicitly
transferred.

### FLUTTER-LIFE-002 — Do not let lifecycle-bound work outlive its owner unintentionally

Long-running or detached work started by a widget must either be independent of
the widget lifecycle or be cancelled, ignored, or otherwise prevented from
mutating disposed state after ownership ends.

## BuildContext and state after suspension

### FLUTTER-LIFE-010 — Validate context/state after asynchronous gaps

Do not use a `BuildContext` across an asynchronous gap unless the relevant
context/state is still mounted at the point of use.

### FLUTTER-LIFE-011 — Prevent stale asynchronous writes

When multiple asynchronous operations can overlap, ensure an older completion
cannot overwrite newer authoritative UI state when that would violate the
intended behavior.

## Failure and ordering

### FLUTTER-LIFE-020 — Preserve asynchronous failure semantics

Do not hide failures from asynchronous UI operations. Convert them into the
project's intended state/error path or propagate them to the owner responsible
for recovery.

### FLUTTER-LIFE-021 — Make ordering assumptions explicit

If correctness depends on serialization, latest-wins behavior, debouncing,
dropping, cancellation, or another ordering policy, encode and test that policy
rather than relying on incidental completion order.