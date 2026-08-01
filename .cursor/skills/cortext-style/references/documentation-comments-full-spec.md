# Documentation comments

Write JSDoc as a consumer-facing behavioral contract. Do not document private
implementation simply to increase comment volume.

## Documentation scope

### CX-DOC-001 — Document every changed public contract `[HIGH]`

Provide meaningful JSDoc for changed exported types, constructors, properties,
methods, and enum/union members when meaning is not self-evident.

Document internal helpers only when the contract is non-obvious and the comment
adds maintainer value.

### CX-DOC-002 — Do not require private or DI field documentation `[MEDIUM]`

Do not require JSDoc for private methods, private properties, or Nest-injected
fields documented only for volume. Constructors still need `@param` for every
parameter, including injects.

### CX-DOC-003 — Document models completely `[HIGH]`

Every property on exported models/interfaces — including optional fields and
discriminated-union members — must have JSDoc.

## Content

### CX-DOC-010 — Start with a single-sentence summary `[MEDIUM]`

- Verb phrase for methods and constructors
- Noun phrase for properties and types
- Describe behavior rather than restating the symbol name

```ts
/**
 * Loads an issue plus remote links for triage.
 */
```

### CX-DOC-011 — Describe consumer-observable behavior `[HIGH]`

Document purpose, defaults, preconditions, results, errors, cancellation, and
ownership of returned resources when consumer-relevant.

### CX-DOC-012 — Do not leak implementation details `[MEDIUM]`

Do not expose private queues, storage layout, transport internals, or Nest DI
wiring in public docs. Implementation can change without rewriting the contract.

### CX-DOC-013 — Document only guaranteed behavior `[HIGH]`

Do not promise ordering, timing, automatic recovery, or idempotency the code
does not guarantee.

### CX-DOC-014 — Preserve established wording during targeted edits `[MEDIUM]`

When documenting one declaration, preserve compliant surrounding docs unless the
task requests a broader rewrite.

## Structure

### CX-DOC-020 — Use JSDoc tag order `[MEDIUM]`

1. `@param`
2. `@returns`
3. `@throws`

Add notes/warnings only when they support the behavior description.
