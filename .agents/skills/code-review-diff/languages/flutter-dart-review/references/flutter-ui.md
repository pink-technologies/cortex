# Flutter UI

## Contents

1. UI type responsibilities
2. Composition
3. State ownership
4. BLoC integration
5. Design System and localization
6. Performance and identity
7. Accessibility

## 1. UI type responsibilities

### FL-UI-001 — Use Screen for route-level presentation `[HIGH]`

A `*Screen` may own `Scaffold`, route input, screen-level `BlocProvider`,
listeners, and navigation reactions. It must not own transport or Repository
implementation logic.

### FL-UI-002 — Use View for a meaningful UI section `[MEDIUM]`

Use `*View` for a reusable or independently understandable section with a
stable input/behavior contract.

### FL-UI-003 — Keep small screen-only sections private `[MEDIUM]`

Use private widgets such as `_Body`, `_Form`, `_Email`, or `_SubmitButton` for
small local sections that do not need cross-file reuse or independent public
identity.

### FL-UI-004 — Extract behavior-rich components `[HIGH]`

Move a component into its own file when it owns a BLoC/controller lifecycle,
has independent behavior, is reused, needs independent tests, or becomes a
meaningful standalone UI concept.

## 2. Composition

### FL-UI-010 — Keep build declarative and side-effect free `[HIGH]`

Do not fetch data, write storage, invoke Repositories, mutate application
state, or perform navigation as a consequence of `build()` execution.

### FL-UI-011 — Keep build methods focused `[MEDIUM]`

Keep `build()` at 40 meaningful source lines or fewer. Extract a private local
widget or meaningful `*View` before the widget tree becomes difficult to scan.

Do not extract trivial wrappers solely to satisfy the numeric threshold.

### FL-UI-012 — Prefer StatelessWidget by default `[MEDIUM]`

Use `StatefulWidget` only when the widget genuinely owns Flutter lifecycle
state such as controllers, animation, focus, platform UI handles, or local
ephemeral state. Keep business state in BLoC/Repository layers.

## 3. State ownership

### FL-UI-020 — Do not duplicate BLoC state locally `[HIGH]`

Do not mirror authoritative BLoC values into mutable widget state merely to
render them. Pass values or select them from the owner.

### FL-UI-021 — Keep local state truly local `[MEDIUM]`

Use widget state for concerns such as animation progress, focus, a controller,
or ephemeral visual interaction that has no business meaning outside the
widget lifecycle.

## 4. BLoC integration

### FL-UI-030 — Scope BlocProvider to the owner `[HIGH]`

Create a BLoC at the nearest Screen/View boundary that owns its lifecycle. Do
not place feature BLoCs globally without a demonstrated shared lifetime.

### FL-UI-031 — Keep side effects in listeners `[HIGH]`

Use `BlocListener`/listener boundaries for navigation, snackbars, dialogs, and
other transient effects. Keep `BlocBuilder` and `build()` for rendering.

### FL-UI-032 — Rebuild the smallest useful subtree `[MEDIUM]`

Use `buildWhen`, `listenWhen`, `context.select`, or a narrowly scoped
`BlocBuilder` when only a subset of state affects a subtree. Do not optimize
speculatively when rebuild cost is negligible.

## 5. Design System and localization

### FL-UI-040 — Prefer Design System components and tokens `[MEDIUM]`

Use established DS controls, spacing, sizing, typography, icons, colors, and
styles before creating local equivalents or hard-coded design values.

Feature-specific layout values are allowed when they represent a real local
design requirement rather than a missing shared token.

### FL-UI-041 — Localize user-facing text `[HIGH]`

Use the owning Experience/component localization contract such as
`context.l10n`. Do not introduce hard-coded user-facing copy in production UI.

## 6. Performance and identity

### FL-UI-050 — Use stable identity for dynamic widgets `[HIGH]`

Use stable keys/identifiers when widget identity matters across insertion,
removal, reorder, animation, or preserved state. Do not derive identity from a
mutable list index when the collection can change.

### FL-UI-051 — Keep heavy work out of render paths `[HIGH]`

Do not perform expensive parsing, filtering, encoding, image processing, or
other substantial computation repeatedly from `build`, item builders, or
layout callbacks.

## 7. Accessibility

### FL-A11Y-001 — Preserve semantic accessibility `[HIGH]`

Ensure custom interactive UI exposes meaningful labels, actions, focus order,
and semantics when standard Flutter widgets do not already provide them.

### FL-A11Y-002 — Prefer semantic controls `[MEDIUM]`

Use `Button`, `IconButton`, `TextField`, `Toggle`-equivalent controls, and other
semantic widgets instead of generic gesture targets when the native control
matches the behavior.

### FL-A11Y-003 — Verify changed custom controls `[MEDIUM]`

Add accessibility guideline or semantics coverage when a changed custom
control materially affects labels, target size, contrast, traversal, or input
behavior.

