# Flutter Testing

Use the project's general testing methodology in addition to these
Flutter-specific rules.

## Test level

### FLUTTER-TEST-001 — Choose the smallest test level that proves the behavior

Use unit tests for isolated logic, widget tests for widget rendering and
interaction, and integration tests for important flows that require multiple
real application components to work together.

### FLUTTER-TEST-002 — Cover important integrated user flows

Do not rely exclusively on isolated unit tests when a critical behavior depends
on widgets, routing, plugins, persistence, services, or other integration
boundaries working together.

## Widget tests

### FLUTTER-TEST-010 — Test observable widget behavior

Assert rendered state, user interaction, emitted intent, navigation, semantics,
or another user-observable contract. Avoid tests coupled only to private widget
composition.

### FLUTTER-TEST-011 — Build a contract-relevant harness

Provide the theme, localization, router, state owner, dependency providers, and
other environment pieces the widget contract actually needs while keeping the
harness as small as practical.

### FLUTTER-TEST-012 — Pump deliberately

Use `pump()` for known frame/state transitions and `pumpAndSettle()` only when
the test intentionally waits for scheduled animation or asynchronous UI work
to settle. Do not use settling as a blanket fix for unexplained timing.

### FLUTTER-TEST-013 — Prefer stable finders

Prefer user-observable text, semantics, or intentionally stable keys when they
express the contract. Avoid binding tests to private widget decomposition
without a behavioral reason.

## Lifecycle and adaptive behavior

### FLUTTER-TEST-020 — Test lifecycle-sensitive behavior when changed

When code owns controllers, subscriptions, delayed work, or asynchronous UI
state, cover disposal/cancellation and stale-completion behavior when those
paths can affect the observable result.

### FLUTTER-TEST-021 — Test meaningful adaptive boundaries

When adaptive behavior changes, cover representative widths or constraint
boundaries and assert the intended layout behavior rather than brittle
pixel-perfect implementation details.

### FLUTTER-TEST-022 — Test changed custom accessibility behavior

When custom controls or layout changes affect semantics, focus, target size,
contrast, or text scaling, add focused accessibility verification.

## Regression and determinism

### FLUTTER-TEST-030 — Add regression coverage for bug fixes

Prove the corrected failure at the smallest meaningful boundary and cover the
consumer-visible path when the regression crosses layers.

### FLUTTER-TEST-031 — Keep tests deterministic

Avoid dependence on execution order, uncontrolled wall-clock delays, production
credentials, real network services, or shared mutable state unless the test is
explicitly designed as an integration test for that dependency.