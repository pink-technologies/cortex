---
name: flutter
description: "Applies reusable Flutter framework guidance for implementation, refactoring, debugging, testing, and review. Use when Flutter widgets, UI architecture, lifecycle, BuildContext, adaptive layout, accessibility, rendering performance, navigation, or Flutter tests are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Flutter, Framework, UI, Lifecycle, Accessibility, Performance]
    related_skills: [dart, bloc, code-review-diff]
---

# Flutter Engineering

Use this skill as generic Flutter framework guidance. Combine it with the Dart
language skill when Dart source is involved. Do not use it to replace an
explicitly established project architecture or state-management approach.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  files before relying on this generic guidance.
- Preserve the project's established architecture, state-management approach,
  dependency-injection strategy, navigation model, package structure, Design
  System, and localization conventions when they are explicit and coherent.
- Treat configured analyzer, formatter, build, test, code-generation, and
  platform settings as executable sources of truth for deterministic behavior.
- Use generic Flutter architecture guidance as a fallback or complement, not as
  justification for replacing a project's intentional architecture.

## Load related skills

- Use the Dart language skill when Dart language behavior is materially involved.
- When a state-management, navigation, persistence, networking, or other
  framework-specific skill is available and the dependency is materially
  involved, load that specialized skill as well.
- Do not assume BLoC, Provider, Riverpod, MVVM, or another architecture merely
  because this is a Flutter project.

## Load references

Read the references that materially apply to the task:

- `references/architecture.md` for Flutter UI/data responsibility boundaries,
  state ownership, dependency injection, and optional domain logic.
- `references/widgets-and-state.md` for widget responsibilities, local state,
  build behavior, identity, localization, and navigation side effects.
- `references/lifecycle-and-async.md` for controllers, subscriptions,
  `BuildContext`, asynchronous UI work, disposal, and stale results.
- `references/adaptive-layout.md` for responsive/adaptive layout, constraints,
  orientation/window changes, large screens, collections, and input methods.
- `references/accessibility.md` for semantics, text scaling, contrast, target
  size, keyboard access, and custom controls.
- `references/performance.md` for rebuild scope, render-path work, `const`, lazy
  collections, and evidence-based optimization.
- `references/testing.md` for Flutter-specific widget, integration, adaptive,
  lifecycle, and accessibility tests.

Load only references relevant to the affected code. Do not load a reference
solely because it exists.

## Engineering baseline

- Keep rendering declarative and separate from business/data responsibilities.
- Give mutable application state and widget-owned lifecycle resources clear
  owners.
- Keep side effects out of `build()` and other render-only paths.
- Treat asynchronous UI work as lifecycle-sensitive and guard context/state
  access after suspension when required.
- Design adaptive interfaces from available space and capabilities rather than
  assumptions about a device category.
- Preserve accessibility semantics and input behavior when introducing custom
  UI.
- Optimize based on observable cost and profiling evidence rather than
  speculative complexity.
- Test behavior at the smallest useful boundary while covering important
  integrated user flows.

## Use with other skills

Examples:

```text
Review Flutter + BLoC change
→ code-review/diff
→ languages/dart
→ frameworks/flutter
→ frameworks/bloc
→ project guidance

Implement Flutter change
→ languages/dart
→ frameworks/flutter
→ project-specific framework skills
→ project guidance
```

When another skill defines the workflow, output contract, severity model, or
change strategy, preserve that contract and use this skill only as specialized
Flutter guidance.

## Validation

When execution tools are available, prefer the project's own commands. Common
Flutter checks include formatting, analysis, unit/widget tests, integration
checks when applicable, build validation, and code generation when configured.

Do not claim a check passed unless it was executed successfully.