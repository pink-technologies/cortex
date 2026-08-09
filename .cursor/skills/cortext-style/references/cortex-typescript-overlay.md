# Cortex TypeScript / Nest overlay

Monorepo-specific layout and networking conventions. Read with the core
rulebooks; this file does not replace them.

## Layout

```text
feature/
  index.ts                 # barrel only at folder root when possible
  models/                  # domain types and request/result shapes
  error/error.ts           # all errors for this folder (one file)
  store/ | repository/     # persistence / resolution
  parameters/              # request/input shapes when non-trivial
  resources/<path>/        # one resource per API path segment (e.g. issue, comment)
    <name>-resource.ts
    models/
    error/error.ts
```

- Put data models under `models/` — never inline them in adapter/service/port files.
- Keep ports (`*Adapter`, `*Manager`, `*Engine`, `*Resource`) in their own files; import from `./models`.
- One primary type per file; tightly related types may share a file.
- Folder-scoped errors live in `<folder>/error/error.ts` only.
- Prefer shared constants/types (`HTTPMethod.POST`, etc.) over raw method strings.
- For external HTTP APIs, use a connection-bound client (`JiraClient`) that
  exposes `request(path, options)` and construct path resources with that client.
  Split `resources/` by API path (`issue`, `comment`, …).

## Domain models

Prefer **classes** for domain models consumed by the rest of the feature.
Keep **wire / transport DTOs** as separate types (often `*Response` interfaces)
next to the serializer call site types.

Good domain model checklist:

- Document the type and **every** property (noun phrases).
- Co-locate tightly related types in the same file (assignee, nested config).
- Explicit constructor with `@param` for every parameter.
- Static `from(...)` (or `fromResponses(...)`) maps wire → domain; adapters call
  the mapper and stay free of field-by-field parsing.
- Persistence: use `Model.from(record)` for a single persistence graph (including
  nested relations). Keep a `*Mapper` class only when the domain model needs more
  than one independently loaded source. Skip identity enum `switch` maps when
  Prisma and domain string values match—cast/assert instead.
- MARK order for models: Properties → Static methods → Constructor
  (omit unused sections). Nested related types follow in the same file.

Wire DTOs may stay as `interface` / plain `type` with property docs and optional
`CodingKeys`-style notes when JSON names differ. Domain mapping owns defaults
and ADF/string coercion.

Canonical example: `apps/node/src/jira/resources/issue/`.

## MARK organization

```text
// MARK: - Types
// MARK: - Properties          (include private fields; no JSDoc on private)
// MARK: - Static methods      (mappers such as from / fromResponses)
// MARK: - Constructor         (always document + @param for every param)
// MARK: - Instance methods    (public API only)
// MARK: - Private methods     (no JSDoc)
```

Omit unused sections. Interface conformance may use a named MARK matching the
interface when that matches surrounding code.

## Imports

1. Single-line imports first (external packages, then internal/`@/` paths).
2. Multiline imports last; no blank line before the first multiline.
3. Blank line between each multiline import block.

## Documentation (JSDoc)

- Document exported types, constructors, and public methods.
- **Always** document constructors with `@param` for every parameter (including Nest injects).
- **Always** document every property on exported models/interfaces.
- Do **not** JSDoc private members for volume.
- Tag order: `@param` → `@returns` → `@throws`.

## Networking

Call `session.request` at the use site — no shared `requestJson` helpers:

```ts
try {
  const response = await this.session
    .request(url, {
      headers,
      method: HTTPMethod.POST,
      parameterEncoder: JSONParameterEncoder.default,
      parameters: { name: 'a' },
      signal,
    })
    .validate()
    .serializingJson<T>()

  if (!response.result.ok) {
    throw response.result.error
  }

  const payload = response.result.value
  // ...
} catch (error) {
  throw new LayerSemanticError(context, { cause: error })
}
```

Prefer `parameters` + `JSONParameterEncoder.default` over manual
`body: JSON.stringify(...)`. The encoder owns serialization and
`Content-Type: application/json`. Use raw `body` only for non-JSON payloads
(streams, multipart, etc.).

Validation is **opt-in** via `.validate()`. Never require an opt-out when the
default is already off. When `.validate()` is used and the response is
unacceptable after retries, serialization **rejects** with
`NetworkingResponseValidationError` (it does not return a soft failure). Other
failures (connection, cancel, serialization) still resolve as
`response.result.ok === false`.

Each layer throws its own semantic errors (`NodeApplicationError` or package
base) and preserves the lower-layer failure in `cause`. Do not leak raw
networking errors as the thrown type, and do not use generic `Error` /
`toDomainError` wrappers.

## Testing (public boundary)

Test through the public or closest stable boundary. Do not export private
helpers solely for tests when the public API already exercises the behavior
(for example description parsing via `getIssue().descriptionText`).

## Canonical in-repo examples

- Networking: `packages/networking`
- Feature folders: `apps/node/src/connection`
- Errors: `apps/node/src/agent/provider/error/error.ts`, `apps/node/src/jira/resources/issue/error/error.ts`
- Resources: `apps/node/src/jira/resources/{issue,comment}/`, `apps/node/src/github/resources/{pull,issue-comment}/`, `apps/node/src/github/resources/{pull,issue-comment}/`
