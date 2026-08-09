# BLoC and State Management

## Contents

1. Responsibility
2. Dependencies
3. Events
4. State
5. Handlers and concurrency
6. Errors and side effects

## 1. Responsibility

### FL-BLOC-001 — Let BLoC own feature presentation state and interactions `[HIGH]`

Use BLoC to translate user/system intent into state transitions and coordinate
Repository operations. Do not move business data fetching into widgets.

### FL-BLOC-002 — Keep one presentation state owner `[HIGH]`

Do not duplicate the same business state across `StatefulWidget` fields and a
BLoC. Keep widget-owned state only for genuinely local UI lifecycle concerns.

## 2. Dependencies

### FL-BLOC-010 — Constructor-inject Repositories `[HIGH]`

Resolve dependencies outside the BLoC and pass them through its constructor.
Do not invoke the service locator from BLoC implementation code.

### FL-BLOC-011 — Keep dependencies immutable and private by default `[MEDIUM]`

Store dependencies in `final` fields. Expose them only when they intentionally
belong to the BLoC's public contract.

## 3. Events

### FL-BLOC-020 — Name events as feature intent `[MEDIUM]`

Use `<Feature><Action>Event`, for example `SignInSubmittedEvent` or
`PetDetailSegmentSelectedEvent`.

### FL-BLOC-021 — Keep events immutable and value-comparable `[MEDIUM]`

Use immutable fields and `Equatable` where event equality is meaningful. Keep
related event declarations together with their BLoC using the established
`part` organization when the package uses it.

## 4. State

### FL-BLOC-030 — Keep state immutable and complete `[HIGH]`

Represent every consumer-observable state value explicitly. Use immutable
fields, an explicit initial state, value equality, and `copyWith` when the state
is incrementally updated.

### FL-BLOC-031 — Model operation status explicitly `[HIGH]`

Use meaningful status types such as `DataLoadStatus` or `FormInputStatus`
instead of unrelated mutable booleans for initial/loading/success/failure or
form-submission state.

### FL-BLOC-032 — Derive presentation flags `[HIGH]`

Prefer computed properties such as `isLoading`, `isContentVisible`, or
`isProgressVisible` when the value can be derived from authoritative state.

### FL-BLOC-033 — Make nullable copyWith semantics unambiguous `[HIGH]`

Do not implement `copyWith` so that `null` means both "leave unchanged" and
"set this nullable property to null". Use an explicit sentinel or another
unambiguous representation when clearing a nullable field is supported.

## 5. Handlers and concurrency

### FL-BLOC-040 — Register handlers in the BLoC constructor `[MEDIUM]`

Keep event-to-handler registration discoverable in one place.

### FL-BLOC-041 — Keep event handlers private `[MEDIUM]`

Use names such as `_handleSignInSubmittedEvent` and keep direct handler calls
out of consumers.

### FL-BLOC-042 — Define overlapping event semantics `[HIGH]`

For searches, refreshes, repeated submits, and other overlapping async events,
choose concurrency behavior deliberately. Debounce, restart, drop, queue, or
serialize based on the user-visible contract. Prevent stale responses from
overwriting newer state.

## 6. Errors and side effects

### FL-BLOC-050 — Convert failures into explicit presentation state `[HIGH]`

Record unexpected BLoC errors for diagnostics and emit a failure state the View
can render or observe. Do not surface raw lower-level exception strings to the
user.

### FL-BLOC-051 — Keep navigation and transient UI side effects outside builders `[HIGH]`

Use `BlocListener` or equivalent listener boundaries for navigation, snackbars,
dialogs, and other side effects. Builders render state only.

