---
name: create-pull-request
description: "Creates or updates GitHub pull requests from an already prepared change. Use when a branch or completed implementation needs to be published as a GitHub pull request, including selecting the base branch, preparing the title and description, handling draft state, linking relevant issues, and updating an existing pull request."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [GitHub, Pull-Request, Collaboration, Source-Control]
    related_skills: [implementation, testing, issue-to-pr]
---

## Pull request title

Use Conventional Commits format for the pull request title unless the repository
explicitly defines a different pull-request title convention.

Use:

```text
<type>[optional scope]: <description>
```

Common types include:

```text
feat
fix
refactor
perf
test
docs
build
ci
chore
revert
```

Examples:

```text
feat(camera): add automatic interruption recovery
fix(upload): prevent stale state after cancellation
refactor(media): centralize pipeline execution ownership
test(camera): cover recording recovery failures
docs(sdk): document cancellation behavior
ci: validate SDK builds before merge
```

Choose the type from the primary intent of the change.

Do not choose the type based on the files that changed.

For example, a bug fix that also updates tests and documentation remains:

```text
fix(camera): recover recording after audio interruption
```

not:

```text
test(camera): update interruption tests
```

when the tests only support the bug fix.

### Scope

Use a scope when it adds useful domain or subsystem context.

Prefer concise scopes such as:

```text
camera
media
upload
networking
telemetry
auth
```

Do not derive the scope mechanically from:

- directory names
- package names
- target names
- implementation types

when a clearer domain scope exists.

Omit the scope when it adds little information:

```text
ci: update pull request validation
```

is preferable to inventing:

```text
ci(workflows): update pull request validation
```

unless `workflows` is an established repository scope.

### Description

Write the description in imperative, concise language.

Prefer:

```text
fix(camera): recover recording after interruption
```

Avoid:

```text
fix(camera): recovered recording after interruption
fix(camera): recovering recording after interruption
fix(camera): changes for recording interruption
```

Do not end the title with a period.

### Breaking changes

When the pull request introduces an intentional breaking change, represent it
using Conventional Commits breaking-change syntax:

```text
feat(media)!: replace legacy upload API
```

Use `!` only when the change is intentionally breaking for the supported
consumer contract.

Do not mark a change as breaking merely because internal declarations, private
types, or unsupported implementation APIs changed.

Use the relevant API-design and compatibility skills to determine whether the
change is actually breaking.

### Repository conventions

Repository-specific Conventional Commit rules take precedence.

If the repository defines:

- allowed types
- required scopes
- ticket prefixes
- maximum title length
- capitalization rules
- semantic-release requirements

follow those rules.

Do not invent additional Conventional Commit restrictions when the repository
does not define them.

The default title format remains:

```text
<type>[optional scope]: <description>
```

## Checklist

Before creating or updating a GitHub pull request, verify when applicable:

- the PR title follows Conventional Commits unless the repository explicitly
  defines another title convention
- the Conventional Commit type reflects the primary intent of the change
- the scope is included only when it adds meaningful domain context
- the title description is concise and imperative
- breaking-change syntax is used only for actual supported consumer breaks
- repository-specific Conventional Commit rules take precedence