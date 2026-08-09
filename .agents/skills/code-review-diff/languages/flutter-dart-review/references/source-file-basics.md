# Source File Basics

Apply these rules to changed hand-written Dart source and test files. Exclude
generated code, vendored code, dependency checkouts, and build output.

## Contents

1. Header and generated code
2. Imports and exports
3. Public barrels
4. Top-level declarations
5. Member organization
6. Feature organization
7. Change scope

## 1. Header and generated code

### FL-FILE-001 — Preserve the repository's canonical source header `[MEDIUM]`

When the repository defines a canonical copyright/header convention, apply it
to changed hand-written files according to repository policy. Do not invent a
PinkTech, TruVideo, or other ownership header in repositories that define a
different owner.

### FL-FILE-002 — Do not hand-edit generated files `[HIGH]`

Change the source definition and rerun the generator for `.g.dart`, generated
localizations, generated mocks, generated assets, and equivalent output.

If generated output changes unexpectedly, review the source or generator
version that caused it.

## 2. Imports and exports

### FL-FILE-010 — Order directive groups deterministically `[MEDIUM]`

Use this order:

1. `dart:` imports
2. `package:` imports
3. relative imports
4. exports in their own section when a file contains both imports and exports

Sort each comparable group alphabetically. Preserve blank lines between the
established groups.

### FL-FILE-011 — Prefer relative imports within the package `[MEDIUM]`

Follow repository analyzer configuration. For the supplied package style, use
relative imports within the same package and package imports across package
boundaries.

### FL-FILE-012 — Do not depend on another package's src implementation `[HIGH]`

Cross-package consumers must use the package's supported public library/barrel
unless a sublibrary is explicitly designed as public.

## 3. Public barrels

### FL-FILE-020 — Keep package barrels intentional `[HIGH]`

Use root libraries such as `authentication_api.dart`, `pets_experience.dart`,
or `storage.dart` to define the supported package surface.

Do not export a declaration solely because internal code needs access to it.

### FL-FILE-021 — Remove stale exports `[MEDIUM]`

When a public declaration is removed or replaced, update barrel files and all
supported call sites in the same coherent change.

## 4. Top-level declarations

### FL-FILE-030 — Keep one primary responsibility per file `[MEDIUM]`

Prefer one primary public owner per file. Allow tightly related declarations,
private local widgets, enum/support types, and BLoC event/state part files when
their co-location improves discoverability.

Do not put unrelated feature lifecycles in one file.

## 5. Member organization

### FL-FILE-040 — Use established region sections `[MEDIUM]`

Use regions only when a type contains declarations for that responsibility.
Prefer this vocabulary/order where applicable:

1. Initializer / Initializers
2. Dependencies
3. Properties / Private Properties
4. Computed Properties
5. Lazy Properties
6. Overridden methods
7. Equatable or other focused conformance section
8. Instance methods
9. Private methods

Use the established `//#region <Name>` and `//#endregion` style consistently.
Do not add empty regions.

### FL-FILE-041 — Keep related methods together `[MEDIUM]`

Keep constructors, related overloads, BLoC handlers, and conformance methods
discoverable as a group. Do not order members by when they were added.

## 6. Feature organization

### FL-FILE-050 — Organize screen features by responsibility `[MEDIUM]`

Use the established shape when the pieces exist:

```text
feature/
  feature_screen.dart
  bloc/
    feature_bloc.dart
    feature_event.dart
    feature_state.dart
  components/
  router/
  styles/
```

Do not create empty `components`, `router`, or `styles` directories merely to
match the template.

### FL-FILE-051 — Keep Experience-level infrastructure at Experience root `[MEDIUM]`

Keep `di/`, `l10n/`, `routes/`, shared feature components, images/assets, and
Experience-specific extensions discoverable outside individual screens when
they apply to the whole Experience.

## 7. Change scope

### FL-FILE-060 — Do not widen behavioral changes with unrelated cleanup `[MEDIUM]`

Preserve compliant local organization and formatting outside the requested or
reviewed change. Perform required refactor cleanup, but do not use it as a
license for unrelated cosmetic reorganization.

