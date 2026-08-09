# Naming

Use Effective Dart as the baseline and the project-specific semantic suffixes
below to make architecture discoverable from identifiers.

## Contents

1. Dart casing
2. Acronyms
3. Architectural suffixes
4. Semantic quality
5. Private names
6. Tests

## 1. Dart casing

### FL-NAME-001 — Use UpperCamelCase for types `[MEDIUM]`

Use `UpperCamelCase` for classes, enums, typedefs, extensions, mixins, and type
parameters.

### FL-NAME-002 — Use lowerCamelCase for members and values `[MEDIUM]`

Use `lowerCamelCase` for methods, properties, variables, parameters, named
parameters, top-level values, and constants unless a generated/interoperability
contract requires otherwise.

### FL-NAME-003 — Use lowercase_with_underscores for packages, directories, and files `[MEDIUM]`

Examples: `sign_in_screen.dart`, `authentication_api`, `payment_methods`.

## 2. Acronyms

### FL-NAME-010 — Follow Effective Dart acronym capitalization `[MEDIUM]`

Capitalize acronyms and abbreviations according to Effective Dart. Treat
acronyms longer than two letters as words in general identifiers, for example:

```text
HttpApiClient
UriBuilder
ApiClient
JwtTokenProvider
UrlParser
```

Do not introduce forms such as `HTTPApiClient`, `URIBuilder`, `APIClient`,
`JWTTokenProvider`, or `URLParser` in new/renamed APIs unless an accepted
external/product convention applies.

### FL-NAME-011 — Preserve the DS Design System prefix `[MEDIUM]`

Treat uppercase `DS` as an explicit project-approved prefix for Design System
declarations. Names such as `DSIconButton`, `DSElevatedButton`, `DSTextField`,
`DSButtonStyle`, `DSIcons`, and `DSTheme` are compliant.

Do not suggest renaming `DS` to `Ds`.

## 3. Architectural suffixes

### FL-NAME-020 — Use Screen only for route-level UI `[HIGH]`

Use `*Screen` for route-level presentation/composition, not arbitrary widgets.

### FL-NAME-021 — Use View for meaningful UI sections `[MEDIUM]`

Use `*View` for reusable or independently understandable UI sections.

### FL-NAME-022 — Name BLoC contracts consistently `[MEDIUM]`

Use `<Feature>Bloc`, `<Feature>Event`, `<Feature>State`, and
`<Feature><Action>Event`.

### FL-NAME-023 — Name data roles consistently `[HIGH]`

Use:

- `*Repository` for the consumer-facing application data boundary.
- `*Resource` for endpoint/API operations.
- `*Entry` for transport DTOs.
- `*Parameters` for structured operation input.
- `*Exception` for typed failure.
- `*Module` for DI registration.
- `*Configuration` for injected configuration.
- `*Intent` for public application/cross-boundary intent.

Do not use these suffixes for objects that do not perform the stated role.

## 4. Semantic quality

### FL-NAME-030 — Prefer domain-specific names `[MEDIUM]`

Avoid vague names such as `manager`, `helper`, `handler`, `data`, `info`,
`common`, `utils`, `process`, or `item` when a more specific domain name can
describe the responsibility.

Do not flag generic words when the domain type itself makes the meaning clear,
such as a deliberately scoped `Item` model in a picker package.

### FL-NAME-031 — Name booleans as predicates `[MEDIUM]`

Use names that read as conditions, such as `isLoading`, `hasError`,
`canSubmit`, or `shouldRefresh`.

### FL-NAME-032 — Name methods for effects/results `[MEDIUM]`

Prefer verbs that reveal behavior. Avoid names such as `doWork`, `process`, or
`handle` for public APIs when a domain action can be named directly.

BLoC private event handlers intentionally use `_handle...Event` and are an
accepted established pattern.

## 5. Private names

### FL-NAME-040 — Use leading underscore only for library-private declarations `[MEDIUM]`

Do not add underscore prefixes merely to indicate implementation style when the
declaration is not intended to be private.

## 6. Tests

### FL-NAME-050 — Name tests behaviorally `[MEDIUM]`

Use descriptions that begin with `Should` and state the observable behavior.
Group tests by type and then method/event using the conventions in
`testing-strategy-full-spec.md`.

