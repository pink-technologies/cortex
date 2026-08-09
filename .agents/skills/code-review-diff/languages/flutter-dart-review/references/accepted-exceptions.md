# Accepted Exceptions

Apply these exceptions narrowly. An exception permits the described pattern;
it does not waive unrelated architecture, lifecycle, security, or testing
rules.

## Contents

1. Composition imports
2. StatefulWidget
3. Context resolution
4. Shared UI components
5. Design System prefix
6. Local layout values
7. Generated and interoperability code
8. Tests
9. Legacy code

## 1. Composition imports

### FL-EXC-001 — DI modules may see multiple lower layers

An Experience `di/` module may import API Resources, Repositories, storage,
service types, and external integration configuration solely to assemble the
feature dependency graph.

Runtime BLoC/View behavior may not use this exception to bypass Repository
boundaries.

## 2. StatefulWidget

### FL-EXC-010 — StatefulWidget is valid for widget-owned lifecycle

Use `StatefulWidget` for controllers, animations, focus, platform view handles,
and local ephemeral state whose lifetime belongs to the widget.

Do not use this exception for business state already owned by BLoC.

## 3. Context resolution

### FL-EXC-020 — A widget composition boundary may resolve BLoC dependencies

`context.resolve()` or the established equivalent is valid while constructing a
BLoC/feature dependency at the owning widget boundary.

Do not call the service locator from inside BLoC behavior.

## 4. Shared UI components

### FL-EXC-030 — A reusable behavioral component may depend on an API

A shared component package may own a BLoC and depend on a Repository when the
component represents stable reusable feature behavior, as opposed to a pure
Design System primitive.

## 5. Design System prefix

### FL-EXC-040 — Preserve uppercase DS prefix

`DS` is an approved product/design-system prefix. `DSIconButton`,
`DSElevatedButton`, `DSTextField`, `DSButtonStyle`, `DSIcons`, and `DSTheme` are
compliant and must not be renamed to `Ds...` by the general acronym rule.

## 6. Local layout values

### FL-EXC-050 — Feature-specific layout constants may remain local

A one-off value that represents a real component-specific design requirement
does not need a Design System token. Repeated semantic values should migrate to
the shared design contract.

## 7. Generated and interoperability code

### FL-EXC-060 — External naming may override project naming when required

Generated code, platform channel contracts, server field names, and other
external interoperability surfaces may preserve externally required naming.
Keep the exception at the boundary and map into project naming when practical.

## 8. Tests

### FL-EXC-070 — Combined Given/When/Then comments are allowed for trivial tests

Use `// Given, When` or `// When, Then` when a trivial construction/assertion
test would become noisier if split into three empty-looking phases.

The conceptual Given -> When -> Then order must remain clear.

## 9. Legacy code

### FL-EXC-080 — Untouched legacy violations are not PR findings

Do not report a legacy naming, documentation, organization, or architecture
violation that the PR does not introduce or materially affect.

When the PR creates a new public declaration or execution path, require the new
code to comply even when neighboring legacy code does not.

