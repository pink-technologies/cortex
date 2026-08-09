# Formatting

Use deterministic formatting so diffs stay small and code stays readable.
Prefer the repository Prettier/ESLint configuration over personal taste.

## Precedence

1. User instructions for the current task
2. Cortex style rules
3. Repository Prettier / ESLint / TypeScript config
4. Existing local compliant style when several layouts remain valid

## Basics

### CX-FMT-001 — Match surrounding style `[HIGH]`

Follow the file’s existing semicolon, quote, and trailing-comma conventions
unless the task is an explicit format pass.

### CX-FMT-002 — Keep related lines cohesive `[MEDIUM]`

Do not insert blank lines that break a logical unit (for example between a
request chain’s fluent calls).

### CX-FMT-003 — Prefer early returns over deep nesting `[MEDIUM]`

Flatten error and guard paths when it improves readability without changing
behavior.

### CX-FMT-004 — Keep lines scannable `[MEDIUM]`

Break long parameter lists and fluent chains at logical points. Prefer one
idea per line in dense call sites.

### CX-FMT-005 — Keep line length within print width 120 `[MEDIUM]`

Match repository Prettier `printWidth: 120`. Break URLs, argument lists, and
fluent chains before they exceed 120 columns. Do not disable the wrap for
convenience.

## Imports

### CX-FMT-010 — Follow the import grouping rules `[HIGH]`

See `source-file-basics.md` and `cortex-typescript-overlay.md`.

## Tooling

### CX-FMT-070 — Use formatter/linter deterministically `[HIGH]`

Use repository Prettier/ESLint. Report `PASS`, `FAIL`, or `NOT_RUN`. Do not
infer a pass when tools did not run.

### CX-FMT-071 — Do not fight the formatter `[MEDIUM]`

If docs and config disagree, fix the drift rather than hand-formatting against
the tool.
