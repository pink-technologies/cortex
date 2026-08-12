# Flutter Accessibility

## Semantics

### FLUTTER-A11Y-001 — Preserve semantic meaning

Interactive and informational UI must expose enough semantics for assistive
technology to understand its purpose, state, label, and available actions.

### FLUTTER-A11Y-002 — Prefer controls with built-in semantics

Prefer standard Flutter/Material/Cupertino controls when they satisfy the
product behavior. Custom controls must reproduce the semantics and interaction
behavior they replace.

## Visual accessibility

### FLUTTER-A11Y-010 — Support text scaling

Layouts containing text should remain usable when platform text scaling is
increased. Avoid fixed layouts that clip or hide essential content solely
because text grows.

### FLUTTER-A11Y-011 — Preserve sufficient contrast and target size

Use the project's accessibility/design-system requirements for contrast and
interactive target size, and validate custom controls when those properties
change.

## Input and focus

### FLUTTER-A11Y-020 — Preserve keyboard and focus access where applicable

Important interactions on platforms with keyboard or directional input should
remain reachable and understandable through focus/navigation behavior.

## Verification

### FLUTTER-A11Y-030 — Test materially changed custom accessibility behavior

When custom controls or layout changes affect semantics, labels, traversal,
contrast, target size, or text scaling, add focused accessibility verification
at the smallest meaningful UI boundary.