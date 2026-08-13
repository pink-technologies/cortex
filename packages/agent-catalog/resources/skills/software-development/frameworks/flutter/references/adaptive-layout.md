# Flutter Adaptive and Responsive Layout

## Measurement

### FLUTTER-RESP-001 — Adapt to available space, not device labels

Choose layout behavior from the space and capabilities available to the widget
or window rather than assumptions such as phone/tablet or portrait/landscape.

### FLUTTER-RESP-002 — Measure at the boundary that owns the layout decision

Use local constraints for component-level decisions and window-level metrics
for app/window decisions. Avoid using global screen information when a child
layout's actual constraints are what matter.

## Breakpoints and large layouts

### FLUTTER-RESP-010 — Keep adaptive thresholds intentional

Use meaningful, reusable breakpoints when multiple surfaces share the same
layout transition. Avoid scattering unrelated magic widths throughout the UI.

### FLUTTER-RESP-011 — Constrain readability-sensitive content

Do not stretch content such as forms, text, and controls across arbitrarily wide
windows when doing so harms readability or interaction quality.

## Collections

### FLUTTER-RESP-020 — Build potentially large collections lazily

Use lazy list/grid/sliver construction for collections that can become large
rather than eagerly building the entire child set.

## Window, orientation, and input

### FLUTTER-RESP-030 — Handle valid size and orientation changes

Do not assume the app remains at one screen size or orientation. Preserve
usable state and layout when the supported environment resizes or changes
orientation.

### FLUTTER-RESP-031 — Support relevant input methods

When the target platforms support them, preserve keyboard, mouse, trackpad,
focus, and touch interaction for important user flows.

## Responsibility

### FLUTTER-RESP-040 — Keep adaptive differences primarily presentational

Do not fork business rules solely because the available layout changed. Keep
shared behavior below presentation unless the product contract genuinely
differs by platform or capability.