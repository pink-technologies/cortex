# Architecture and Layer Responsibilities

Use this rulebook to preserve the established package and Experience
architecture. Do not replace it with a generic Flutter template.

## Contents

1. Dependency direction
2. App
3. Experiences
4. UI Components
5. APIs
6. Services
7. Data Access
8. Core
9. Optional abstractions

## 1. Dependency direction

### FL-ARCH-001 — Respect downward dependency direction `[HIGH]`

Keep lower layers independent of higher layers. Core and Data Access must not
import feature APIs or Experiences. API packages must not import presentation.

### FL-ARCH-002 — Keep business data flow explicit `[HIGH]`

Use the normal presentation data path:

```text
Screen / View -> BLoC -> Repository -> Resource -> Service Client
```

Do not bypass a layer when doing so leaks its responsibility upward.

### FL-ARCH-003 — Keep one source of truth `[HIGH]`

Assign one authoritative owner to shared mutable state. Derive presentation
values instead of synchronizing duplicate flags or copies.

## 2. App

### FL-ARCH-010 — Keep App as the composition root `[HIGH]`

App owns environment bootstrap, root dependency assembly, theme, localization
registration, global routing, app-wide intents, and application lifecycle
coordination.

Do not place feature BLoCs or feature business rules in App.

## 3. Experiences

### FL-ARCH-020 — Let an Experience own a complete user flow `[HIGH]`

An Experience may own screens, feature BLoCs, routes, route parameters, local
components, feature DI, localization, assets, presentation data types, and
public cross-Experience intents.

### FL-ARCH-021 — Keep transport implementation out of Experiences `[HIGH]`

Do not perform raw HTTP, JSON serialization, generic storage implementation, or
service-client request construction from screens or BLoCs.

Composition files under `di/` may reference lower-layer constructors only to
assemble dependencies; see accepted exceptions.

### FL-ARCH-022 — Keep Experience internals private to the package `[HIGH]`

Cross-Experience communication must use intentionally exported routes,
parameters, intents, or other public contracts. Do not import another
Experience's `src` or screen internals.

## 4. UI Components

### FL-ARCH-030 — Promote UI to shared components only for demonstrated reuse `[MEDIUM]`

Keep feature-specific components in their Experience. Promote a component to a
shared package when it represents a stable reusable UI or behavior contract.

### FL-ARCH-031 — Keep Design System primitives presentation-only `[HIGH]`

Design System controls, tokens, icons, typography, and layout primitives must
not acquire feature business behavior.

Shared feature components may depend on an API Repository when the component
owns genuinely reusable behavior and the dependency is part of that contract.

## 5. APIs

### FL-ARCH-040 — Use APIs as application-data boundaries `[HIGH]`

API packages own Resources, Repositories, consumer models, transport entries,
operation parameters, and typed API failures. They must not own Flutter
presentation.

## 6. Services

### FL-ARCH-050 — Isolate external service clients `[HIGH]`

Services wrap backend-specific or third-party service interaction and expose a
stable client contract to API Resources or composition code. They must not own
feature presentation state.

## 7. Data Access

### FL-ARCH-060 — Keep Data Access generic `[HIGH]`

Networking and storage packages own generic transport, request, serialization,
retry, and persistence mechanics. They must not know business endpoints,
feature models, screens, or Experiences.

## 8. Core

### FL-ARCH-070 — Keep Core domain-neutral `[HIGH]`

Use Core for cross-cutting primitives such as DI, validation, navigation
infrastructure, logging, and genuinely generic utilities.

Do not move feature concepts into Core merely because multiple files use them.

## 9. Optional abstractions

### FL-ARCH-080 — Add Use Cases only for demonstrated reusable business logic `[HIGH]`

Do not introduce a Use Case or Interactor layer by default.

Add one only when business behavior spans multiple repositories, is reused by
multiple BLoCs, or materially clarifies a BLoC whose responsibility is being
obscured by reusable domain logic.

Keep ordinary operations on the direct BLoC -> Repository path.

### FL-ARCH-081 — Do not force MVVM or generic data/domain/ui folders `[HIGH]`

Do not replace BLoC or the package/Experience structure with ChangeNotifier,
ViewModel, or generic Clean Architecture folders solely because external
Flutter guidance uses them.

