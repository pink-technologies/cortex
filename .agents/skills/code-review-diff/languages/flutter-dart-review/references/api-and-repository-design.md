# API and Repository Design

## Contents

1. Repository
2. Resource
3. Entry and Model
4. Parameters and clients
5. Errors
6. Caching and retry
7. Package boundary

## 1. Repository

### FL-API-001 — Make Repository the presentation-facing data boundary `[HIGH]`

Have BLoCs consume Repositories rather than Resources, raw clients, storage, or
transport libraries.

### FL-API-002 — Return application models from Repositories `[HIGH]`

Map transport Entries into consumer-facing models before data reaches BLoC or
View code.

### FL-API-003 — Keep shared domain state authoritative in its Repository `[HIGH]`

When a Repository owns shared cached or streamed state, make it the single
source of truth and give its lifetime an explicit DI scope.

## 2. Resource

### FL-API-010 — Keep endpoint concerns in Resources `[HIGH]`

Resources own endpoint paths, HTTP methods, authentication selection, request
parameter serialization, response deserialization, and transport Entry
creation.

Do not duplicate endpoint strings in BLoCs or Views.

### FL-API-011 — Keep Resources presentation-independent `[HIGH]`

Resources must not import Flutter widgets, BuildContext, BLoCs, routes, or
presentation localization.

## 3. Entry and Model

### FL-API-020 — Use Entry types for transport data `[HIGH]`

Use `*Entry` for serialized server DTOs. Keep JSON annotations and generated
serialization at this boundary.

### FL-API-021 — Keep Entries out of presentation `[HIGH]`

Do not expose transport Entries to BLoCs, screens, or reusable presentation
components.

### FL-API-022 — Keep Models transport-independent `[HIGH]`

Use immutable consumer-facing models with value equality where meaningful.
Allow mapping factories such as `Model.fromEntry` without adding HTTP behavior
to the model.

### FL-API-023 — Keep equality complete `[HIGH]`

When using `Equatable`, include every property that participates in semantic
value equality in `props`. Missing state fields can suppress legitimate BLoC
updates or break tests.

## 4. Parameters and clients

### FL-API-030 — Use typed Parameters for non-trivial operations `[MEDIUM]`

Use `*Parameters` when an operation has a meaningful group of inputs or
serialization behavior. Do not introduce a parameters object for a single
self-explanatory argument without a concrete benefit.

### FL-API-031 — Keep service clients below Resources `[HIGH]`

Use service clients to encapsulate service-specific authentication, headers,
base URLs, and transport integration. Do not make a BLoC depend on them.

## 5. Errors

### FL-API-040 — Expose typed operation failures `[HIGH]`

Wrap lower-level failures in meaningful API exceptions while preserving the
underlying error and stack trace when useful for diagnosis.

Do not expose Dio, storage, parsing, or platform exceptions as presentation
contracts.

## 6. Caching and retry

### FL-API-050 — Put retry at the layer that owns the semantics `[HIGH]`

Keep HTTP/request retry in Data Access or the service client. Keep domain-level
retry or recovery in the Repository when it depends on business state.

Do not implement the same retry policy independently in multiple layers.

### FL-API-051 — Give caches an owner and invalidation contract `[HIGH]`

Document and test who populates, observes, refreshes, and invalidates shared
caches. Do not create hidden duplicate caches in BLoC and Repository layers.

## 7. Package boundary

### FL-API-060 — Treat the package barrel as the supported contract `[HIGH]`

Export only consumer-facing declarations. Cross-package code must not import
another package's `src/` implementation.

### FL-API-061 — Type public contracts explicitly `[MEDIUM]`

Give public methods, parameters, callbacks, properties, and returned values
explicit useful types. Do not leak `dynamic` when a stable type can express the
contract.

