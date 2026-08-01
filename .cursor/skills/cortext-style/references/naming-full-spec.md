# Naming

Name for the call site. Prefer clarity over cleverness.

## General

### CX-NAME-001 — Prefer role-based names `[HIGH]`

Names should state the concrete job (`JiraIssueResource`, `ExecutionJobHandlerRegistry`).
Avoid empty suffixes like `Manager`, `Helper`, `Handler`, `Util` unless the
prefix already states one clear responsibility.

### CX-NAME-002 — Match grammatical role `[MEDIUM]`

- Types and properties: noun phrases
- Methods: verb phrases
- Booleans: assertions (`isReady`, `canRetry`, `hasAssignee`)

### CX-NAME-003 — Omit needless words `[MEDIUM]`

Do not repeat type information already obvious from context. Prefer
`issue.key` over `issue.issueKey` when the enclosing type is already `Issue`.

### CX-NAME-004 — Prefer established domain terms `[MEDIUM]`

Use terms already in the module (`connection`, `execution`, `triage`) instead of
inventing synonyms.

### CX-NAME-005 — Avoid obscure abbreviations `[MEDIUM]`

Abbreviations are fine when established (`id`, `url`, `cwd`). Avoid novel
shorthand.

## Types and modules

### CX-NAME-010 — One concept per type name `[MEDIUM]`

If the name needs “And”, split responsibilities.

### CX-NAME-011 — Align file names with primary type `[MEDIUM]`

`jira-issue-resource.ts` exports `JiraIssueResource`. Error and model folders follow the
overlay layout.

### CX-NAME-012 — Stable error codes `[HIGH]`

Machine-readable `code` strings are `SCREAMING_SNAKE` and stable across releases
(`JIRA_ISSUE_LOOKUP_ERROR`).

## Methods and parameters

### CX-NAME-020 — Parameter names clarify role `[MEDIUM]`

Prefer `issueKey`, `signal`, `connection` over vague `value`, `data`, `opts`
unless the type already carries the meaning.

### CX-NAME-021 — Factory / create names stay honest `[MEDIUM]`

`create`, `from`, `parse`, `resolve` should match what the function actually
does. Do not call a lookup `create`.

## Review behavior

### CX-NAME-030 — Do not rename for preference `[LOW]`

Only rename when the current name is misleading, inconsistent with the module,
or blocks understanding. Preserve compliant local vocabulary.
