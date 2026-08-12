# Flutter Widgets and State

## Rendering

### FLUTTER-UI-001 — Keep `build()` declarative and side-effect free

Use `build()` to describe UI from current inputs and state. Do not start network
requests, mutate application state, register long-lived observers, navigate, or
perform other one-time side effects from normal build execution.

### FLUTTER-UI-002 — Keep render paths focused

Extract meaningful reusable or independently understandable UI sections when a
large widget obscures behavior, state ownership, or rebuild scope. Do not split
widgets solely to satisfy an arbitrary size rule.

## State ownership

### FLUTTER-STATE-001 — Keep widget-owned state local

Use widget-local state for ephemeral state and resources whose lifecycle belongs
to that widget, such as animation controllers, focus, selection, or temporary
presentation state.

### FLUTTER-STATE-002 — Do not duplicate authoritative application state locally

When application or feature state already has an established owner, derive the
widget's presentation from that owner instead of maintaining a second
independent copy that can drift.

### FLUTTER-STATE-003 — Use `StatefulWidget` when the widget owns lifecycle or local mutable state

Do not prefer `StatelessWidget` as a dogma. Use the widget type that correctly
expresses ownership and lifecycle.

## Side effects and navigation

### FLUTTER-UI-010 — Keep transient side effects outside render-only paths

Navigation, dialogs, snackbars, analytics events, and similar one-shot effects
should be triggered from lifecycle/event boundaries designed for side effects,
not from ordinary rendering.

### FLUTTER-UI-011 — Preserve the project's navigation model

Use the router/navigation abstraction established by the project. Do not
introduce a second navigation model or scattered route literals without a
concrete need.

## Identity and localization

### FLUTTER-UI-020 — Preserve stable widget identity when identity affects state

Use keys or other stable identity mechanisms when dynamic reordering,
replacement, or collection updates could otherwise associate state with the
wrong widget.

### FLUTTER-UI-021 — Localize user-facing text when the application is localized

Use the project's localization mechanism for user-visible strings instead of
introducing new hard-coded copy into localized surfaces.