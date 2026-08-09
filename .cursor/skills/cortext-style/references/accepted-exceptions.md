# Accepted exceptions

Check these exceptions before implementing a rule-driven change or reporting a
finding. Apply them narrowly; they do not waive safety or readability.

## Backing fields

A leading underscore or explicit `private` field is fine for storage that a
public getter/method exposes as a controlled snapshot or operation.

The declaration still requires the narrowest valid visibility. Do not use naming
tricks to hide an exported API.

## Nest dependency injection

Constructor parameters injected by Nest do not each need a private-property
JSDoc block. The constructor summary plus `@param` for every parameter is
enough (`CX-DOC-002`).

## Node Jest branch threshold (temporary)

`apps/node` may keep the global Jest **branch** `coverageThreshold` at **94%**
while Nest `@Inject` constructor parameter-property branches under the v8
provider leave the suite just under 95% after jira.triage repro authoring.
Statements, functions, and lines stay at 95%. Restore branches to 95% when
those DI seams are covered or no longer counted.

## Opt-in configuration

When a fluent or builder API is opt-in by default (for example
`.validate()` on networking), not calling the method is the correct way to
leave the feature off. Do not require a redundant opt-out API.

## Soft-fail secondary paths

A secondary enrichment path may soft-fail to an empty/default result when the
primary operation already succeeded and the product contract allows degraded
data. Document that behavior; do not silently swallow errors on the primary
path. Jira issue `remotelink` fetch is not soft-fail — failures surface as
`JiraIssueLookupError`.

## Test isolation seams

Interfaces introduced solely as Nest/testing substitution boundaries are
allowed when they protect a real module edge. They still need a concrete job
and must not proliferate one-implementation abstractions for symmetry.

## Silent cancellation

Returning early on `AbortSignal` without throwing is allowed when the public
contract defines that behavior. Prefer `throwIfAborted()` / typed abort errors
when callers must distinguish cancel from success.
