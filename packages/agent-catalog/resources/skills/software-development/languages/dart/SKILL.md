---
name: dart
description: "Applies reusable Dart language guidance for implementation, refactoring, debugging, testing, and review. Use when Dart source, packages, public APIs, asynchronous code, errors, documentation, or analyzer/lint behavior are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Dart, Language, Engineering, Async, API-Design]
    related_skills: [flutter, code-review-diff]
---

# Dart Engineering

Use this skill as generic Dart language guidance. It complements the current
engineering task; it does not define the task workflow, repository
architecture, review format, or project-specific conventions.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  files before relying on this generic guidance.
- Prefer project-specific guidance over this skill when the project explicitly
  defines a convention or architecture.
- Treat `analysis_options.yaml`, configured analyzer plugins, formatter settings,
  build configuration, and test configuration as the executable source of truth
  for deterministic project rules.
- Do not replace an established project convention with a generic Dart
  preference unless the task explicitly requests that change.
- Keep externally required naming or generated-code conventions at their
  interoperability boundary.

## Load references

Read the references that materially apply to the task:

- `references/style-and-naming.md` for formatting, identifiers, naming, and
  source readability.
- `references/documentation.md` for Dartdoc and public API documentation.
- `references/language-and-api-design.md` for Dart API design, types,
  immutability, value semantics, and language usage.
- `references/async-and-errors.md` for Futures, Streams, asynchronous ownership,
  errors, cleanup, and failure propagation.
- `references/libraries-and-source.md` for libraries, imports, exports,
  generated code, package boundaries, and source organization.

Load only references relevant to the affected code. Do not load a reference
solely because it exists.

## Engineering baseline

- Prefer clear, idiomatic Dart over framework-independent abstractions that do
  not solve a demonstrated problem.
- Preserve one authoritative representation of mutable state where practical;
  derive values instead of synchronizing redundant copies.
- Make asynchronous ownership, ordering, cleanup, and failure behavior explicit
  when correctness depends on them.
- Keep public APIs intentional, typed, documented where useful, and compatible
  with their supported consumers.
- Preserve useful errors and diagnostic context instead of swallowing failures.
- Keep generated and interoperability code isolated from normal project naming
  and style rules when external contracts require it.
- Prefer deterministic analyzer, formatter, compiler, and test results over
  subjective style judgments.

## Use with other skills

This skill may be combined with framework and methodology skills.

Examples:

```text
Dart package review
→ code-review/diff
→ languages/dart
→ project guidance

Flutter implementation
→ languages/dart
→ frameworks/flutter
→ project guidance
```

When another skill defines the workflow, output contract, severity model, or
change strategy, preserve that contract and use this skill only as specialized
Dart guidance.

## Validation

When execution tools are available, prefer the project's own commands. Common
Dart checks include formatting, analysis, tests, and code generation when the
project uses generated sources.

Do not claim a check passed unless it was executed successfully.