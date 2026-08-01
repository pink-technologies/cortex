# Review examples

Calibrate findings with concrete evidence. Prefer TypeScript locations and
Cortex contracts.

## Blocker: double completion

```text
[BLOCKER] Job can complete twice after concurrent finish — CX-ARCH-013
Location: execution-job-processor.ts:120
Evidence: complete() and fail() both run when cancel races success; both HTTP
lifecycle calls fire.
Impact: Duplicate terminal transitions; API state corruption.
Fix: Guard terminal transition with a single-owner state machine.
Tests: Cancel racing success delivers exactly one terminal result.
```

## High: incomplete refactor

```text
[HIGH] Superseded request helper still used beside new call sites — CX-ARCH-060
Location: jira/resources/issue/jira-issue-resource.ts
Evidence: New session.request paths land next to leftover requestJson wrapper.
Impact: Two transports; future fixes miss one path.
Fix: Delete the wrapper; keep one call-site pattern.
Tests: Existing adapter suite covers success and typed failure.
```

## High: missing typed error

```text
[HIGH] Networking failure leaked as generic Error — CX-ARCH-050
Location: github/resources/pull/github-pull-resource.ts
Evidence: getOrThrow() surfaces NetworkingError across the resource boundary.
Impact: Callers cannot branch on layer semantics; messages are unstable.
Fix: Throw GitHub*Error with { cause }.
Tests: Assert error code and cause type on 404/5xx.
```

## Medium: undocumented model property

```text
[MEDIUM] Exported model property lacks JSDoc — CX-DOC-003
Location: jira/resources/issue/models/jira-issue.ts
Evidence: summary has no property documentation.
Impact: Consumers guess meaning and defaults.
Fix: Add noun-phrase JSDoc for every property.
Tests: Not required for docs-only fix.
```

## Not a finding: personal naming preference

Do not report a compliant name merely because another synonym exists. Report
naming only when it is misleading or inconsistent with the module vocabulary.
