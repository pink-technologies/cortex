# Flutter Architecture

These are generic Flutter architecture principles. Explicit project
architecture takes precedence.

## Separation of concerns

### FLUTTER-ARCH-001 — Keep UI and data responsibilities separated

Widgets should primarily render state and translate user interaction into
intent. Keep networking, persistence, serialization, and other data-source
mechanics out of widget rendering code.

### FLUTTER-ARCH-002 — Preserve a clear data boundary

Use an explicit application/data boundary for shared or external data instead
of letting widgets reach directly into transport, storage, or platform clients.
The project's established Repository, service, controller, or equivalent
abstraction should remain authoritative.

### FLUTTER-ARCH-003 — Keep one authoritative owner for mutable state

Avoid synchronizing multiple independent copies of the same application state.
Keep state ownership explicit and derive presentation values when practical.

## Dependency management

### FLUTTER-ARCH-010 — Inject behavioral dependencies at composition boundaries

Construct and provide dependencies at intentional composition boundaries rather
than resolving global dependencies throughout business or presentation logic.

### FLUTTER-ARCH-011 — Match dependency lifetime to ownership

A dependency's scope should reflect the lifecycle of the state or resource it
owns. Avoid accidental duplicate instances of stateful dependencies that are
expected to represent one authoritative source.

### FLUTTER-ARCH-012 — Avoid dependency cycles

Keep dependency direction understandable and reject cycles that make ownership,
initialization, or testing ambiguous.

## Optional domain logic

### FLUTTER-ARCH-020 — Add domain/use-case abstractions only when they solve a demonstrated problem

A separate domain/use-case layer can be useful for complex, reused, or composed
business logic. Do not introduce it mechanically when the existing boundaries
already express the behavior clearly.

### FLUTTER-ARCH-021 — Do not force a generic architecture onto an established project

Do not replace BLoC, MVVM, Riverpod, Provider, Redux, or another coherent
project architecture merely because a different Flutter architecture is common
or recommended elsewhere.