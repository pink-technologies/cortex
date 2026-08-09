# Dependency Injection

## Contents

1. Resolution
2. Scope and lifetime
3. Modules
4. Configuration
5. Dependency graph

## 1. Resolution

### FL-DI-001 — Resolve at composition boundaries `[HIGH]`

Resolve dependencies from App/bootstrap modules, Experience DI modules, or the
widget boundary that constructs a BLoC. Do not resolve dependencies from inside
Repository or BLoC behavior.

### FL-DI-002 — Constructor-inject behavioral collaborators `[HIGH]`

Pass Repositories, Resources, clients, and other behavioral collaborators
explicitly through construction. Keep operation-specific values as method
arguments rather than global/container state.

## 2. Scope and lifetime

### FL-DI-010 — Match DI scope to ownership `[HIGH]`

Choose scope from behavior:

- Use a shared/lazy singleton when one authoritative Repository or client must
  preserve application-level state or a shared stream.
- Use a factory for stateless or feature-local collaborators that do not
  require shared identity.
- Let `BlocProvider` or the equivalent feature boundary own screen/component
  BLoC lifetime.

Do not select singleton or factory scope by habit.

### FL-DI-011 — Prevent duplicate stateful registrations `[HIGH]`

Do not create multiple instances of a collaborator that is documented as the
single source of truth for authentication, profile, cache, or another shared
state domain.

## 3. Modules

### FL-DI-020 — Let each Experience register its feature graph `[HIGH]`

Keep construction of feature Resources and Repositories in the Experience DI
module when those dependencies belong specifically to that Experience.

### FL-DI-021 — Keep shared clients in the App/shared composition graph `[HIGH]`

Register backend clients, storage primitives, and other shared infrastructure
at the appropriate parent boundary and let Experience modules consume them.

## 4. Configuration

### FL-DI-030 — Inject environment-specific configuration `[HIGH]`

Represent environment-specific URLs, feature settings, and public integration
configuration explicitly. Do not scatter staging/production branching across
feature code.

Secret values remain subject to `security-and-configuration.md` and must not be
hard-coded merely because a configuration type exists.

## 5. Dependency graph

### FL-DI-040 — Reject dependency cycles `[HIGH]`

Keep package and module dependencies acyclic. A lower layer must not resolve a
higher layer indirectly through the container.

### FL-DI-041 — Remove stale registrations `[MEDIUM]`

When a dependency or implementation is removed, delete its registration,
dependency key, configuration, tests, and obsolete pubspec dependency.

