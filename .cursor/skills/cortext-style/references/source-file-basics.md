# Source file basics

Apply these rules to changed hand-written TypeScript source and test files.
Exclude generated code, vendored code, and build products.

## 1. Copyright header

### CX-FILE-001 — Use the canonical PinkTech header `[HIGH]`

```ts
// Copyright (c) 2026, PinkTech
// https://pink-tech.io/
```

Keep the header consistent with surrounding files. Place it above imports.

## 2. Declaration documentation

### CX-FILE-010 — Document public declarations `[HIGH]`

Require meaningful JSDoc on exported types, constructors, public methods, and
model properties according to `documentation-comments-full-spec.md` and
`cortex-typescript-overlay.md`.

### CX-FILE-011 — Explain related top-level declarations when needed `[MEDIUM]`

When tightly related exported types share a file, document each type and their
relationship when it helps consumers.

## 3. Imports

### CX-FILE-020 — Import what you use `[HIGH]`

Do not rely on accidental re-exports for types you mention in signatures.

### CX-FILE-021 — Keep import groups explicit `[MEDIUM]`

1. Single-line imports first (external packages, then internal/`@/` paths)
2. Multiline imports last
3. No blank line before the first multiline block
4. Blank line between multiline import blocks

## 4. Top-level declarations

### CX-FILE-030 — Prefer one primary type per file `[MEDIUM]`

Allow tightly related supporting types when separation hurts discoverability.
Do not place unrelated public owners or lifecycles in one file.

### CX-FILE-031 — Keep extensions / sections purpose-driven `[MEDIUM]`

Group by responsibility (MARK sections). Do not scatter one type without a
discoverable reason.

## 5. Member organization

### CX-FILE-040 — Use explainable logical grouping `[MEDIUM]`

Typical MARK groups:

- Types
- Properties
- Constructor
- Instance methods
- Private methods

Omit groups that do not exist. Interface conformance may use a named MARK.

### CX-FILE-041 — Sort only when order has no semantics `[MEDIUM]`

Alphabetical order is fine inside a group when execution order or conceptual
hierarchy does not provide a better order.

### CX-FILE-042 — Keep overloads / related methods together `[MEDIUM]`

Place methods with the same responsibility sequentially.

### CX-FILE-043 — Preserve compliant local organization `[MEDIUM]`

When several orders comply, preserve the author's existing MARK sections.

## 6. Change scope

### CX-FILE-050 — Do not widen behavioral changes `[MEDIUM]`

Do not reorganize unrelated declarations merely because a changed file contains
legacy inconsistencies.

### CX-FILE-051 — Consolidate structural findings `[LOW]`

Report one root-cause finding with representative locations instead of a comment
per import or blank line.
