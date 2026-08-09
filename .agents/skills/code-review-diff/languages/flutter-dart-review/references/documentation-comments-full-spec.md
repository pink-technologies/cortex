# Documentation Comments

Write Dartdoc as a consumer/maintainer contract. Do not document implementation
line by line.

## Contents

1. Scope
2. Templates and macros
3. Content
4. Structure
5. Maintenance

## 1. Scope

### FL-DOC-001 — Document changed public contracts `[HIGH]`

Provide meaningful `///` Dartdoc for changed non-overriding public types,
constructors, properties, methods, callbacks, enums, and non-obvious enum cases
that form a supported contract.

### FL-DOC-002 — Do not require private documentation by default `[MEDIUM]`

Do not add Dartdoc to private widgets, private BLoC handlers, DI storage fields,
or obvious local helpers solely to increase comment volume.

Document private behavior only when its invariant, lifecycle, or non-obvious
contract benefits maintainers.

### FL-DOC-003 — Do not document generated/obvious overrides `[MEDIUM]`

Do not require repetitive documentation on generated declarations or obvious
framework overrides such as a standard `build()` implementation.

## 2. Templates and macros

### FL-DOC-010 — Use established template/macro style for primary public types `[MEDIUM]`

Use the repository's established pattern where it improves reuse between a
public type and constructor:

```dart
/// {@template pet_detail_screen}
/// A screen that displays the details of a specific pet.
/// {@endtemplate}
class PetDetailScreen extends StatelessWidget {
  /// {@macro pet_detail_screen}
  const PetDetailScreen({super.key});
}
```

Do not create macros for trivial repetition with no documentation value.

### FL-DOC-011 — Reject empty documentation `[MEDIUM]`

An empty `{@template}` block, symbol-name restatement, or placeholder such as
`nodoc` does not satisfy a documentation requirement for a meaningful public
contract.

## 3. Content

### FL-DOC-020 — Document responsibility and observable behavior `[HIGH]`

Explain what the declaration owns or represents, valid input/lifecycle
expectations, important state/result behavior, meaningful failures, and
consumer-visible side effects.

For BLoCs, describe the state/interaction responsibility and Repository
boundary. For Repositories, describe the data responsibility and shared state
contract when relevant. For Views, describe meaningful input/behavior.

### FL-DOC-021 — Do not leak replaceable implementation detail `[MEDIUM]`

Do not make public documentation depend on private container layout, concrete
HTTP libraries, internal widget decomposition, generated serializers, or other
details that can change without changing the contract.

### FL-DOC-022 — Document only guaranteed behavior `[HIGH]`

Do not promise caching, ordering, retry, persistence, timing, idempotency, or
automatic recovery that the implementation does not guarantee.

## 4. Structure

### FL-DOC-030 — Use Dartdoc links for declarations `[MEDIUM]`

Use `[Type]`, `[member]`, or another valid Dartdoc reference for in-scope
declarations when linking improves clarity.

### FL-DOC-031 — Keep examples short and contractual `[LOW]`

Add examples when construction, call order, or result handling would otherwise
remain unclear. Do not use large tutorial examples in ordinary member Dartdoc.

## 5. Maintenance

### FL-DOC-040 — Update documentation with changed behavior `[HIGH]`

Update affected docs when defaults, state transitions, errors, ownership,
routes, configuration, or results change.

### FL-DOC-041 — Preserve compliant wording during targeted changes `[MEDIUM]`

Do not rewrite surrounding accurate documentation merely to express a writing
preference.

