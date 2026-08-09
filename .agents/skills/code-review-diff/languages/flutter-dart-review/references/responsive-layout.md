# Responsive and Adaptive Layout

## Contents

1. Measurement
2. Breakpoints
3. Large screens
4. Collections
5. Orientation and input
6. Architecture

## 1. Measurement

### FL-RESP-001 — Adapt to available space, not hardware type `[HIGH]`

Do not branch layout on "phone", "tablet", or device model. Base presentation
decisions on the space actually available to the app or parent.

### FL-RESP-002 — Measure at the correct boundary `[HIGH]`

Use `LayoutBuilder` for parent constraints and `MediaQuery.sizeOf(context)` for
window-level size decisions. Do not use device orientation as a proxy for
available width.

## 2. Breakpoints

### FL-RESP-010 — Centralize breakpoints `[MEDIUM]`

Use Design System or shared responsive tokens for repeated breakpoints. Do not
scatter independent `600`, `800`, or similar width constants through Screens.

Choose a local breakpoint only when it belongs uniquely to that component's
layout contract.

## 3. Large screens

### FL-RESP-020 — Constrain readability-sensitive content `[MEDIUM]`

Prevent forms, text, and similar content from stretching unnaturally across
wide layouts. Use appropriate maximum constraints and alignment.

## 4. Collections

### FL-RESP-030 — Render potentially large collections lazily `[MEDIUM]`

Use builder-based list/grid APIs for collections whose size is unknown or can
grow significantly. Do not force lazy builders for tiny fixed static lists.

## 5. Orientation and input

### FL-RESP-040 — Support valid orientation/window changes `[HIGH]`

Do not lock or branch on orientation unless a documented product/platform
requirement demands it. Ensure layouts remain valid when the window resizes or
rotates.

### FL-RESP-041 — Support applicable input methods `[MEDIUM]`

For tablet, desktop, and web surfaces, preserve appropriate mouse, trackpad,
keyboard, and focus behavior in addition to touch.

## 6. Architecture

### FL-RESP-050 — Keep adaptive differences presentation-only `[HIGH]`

Changing list to grid, column to row, bottom navigation to rail, or another
layout form must not create separate business logic or duplicate BLoCs for the
same behavior.

Use one authoritative state owner across compact and expanded layouts.

