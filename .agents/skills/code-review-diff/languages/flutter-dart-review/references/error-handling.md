# Error Handling and Recovery

## Contents

1. Layer mapping
2. Typed failures
3. Presentation failures
4. Catching and rethrowing
5. Recovery

## 1. Layer mapping

### FL-ERR-001 — Keep failure semantics at the owning layer `[HIGH]`

Translate failures as they cross responsibility boundaries:

```text
Transport/platform failure
        -> Resource/API exception
        -> Repository/domain meaning when needed
        -> BLoC failure state
        -> User-safe presentation
```

Do not expose raw transport implementation as a presentation contract.

## 2. Typed failures

### FL-ERR-010 — Use meaningful operation exceptions `[HIGH]`

Use typed exceptions such as `SignInException` or
`DatasourceConnectionException` when consumers need to distinguish a failed
operation or recovery path.

### FL-ERR-011 — Preserve diagnostic cause and stack trace `[MEDIUM]`

When wrapping an unexpected error, preserve the original error and stack trace
where it materially helps diagnosis.

Avoid creating a new current stack trace that hides the original failure when
the original trace is available.

## 3. Presentation failures

### FL-ERR-020 — Never show raw exception text to users `[HIGH]`

Do not use `error.toString()` or raw backend/transport messages as user-facing
copy unless the API explicitly guarantees that content is safe and localized.

Map failures to user-safe localized presentation messages or states.

## 4. Catching and rethrowing

### FL-ERR-030 — Do not swallow unexpected failure `[HIGH]`

Reject empty `catch` blocks unless failure is intentionally ignored by the
documented contract and no diagnostic/recovery action is required.

### FL-ERR-031 — Rethrow already-correct typed failures `[MEDIUM]`

Do not repeatedly wrap the same domain/API exception at every layer. Preserve
its identity when the current layer adds no new semantics.

## 5. Recovery

### FL-ERR-040 — Define recovery ownership `[HIGH]`

State whether retry/recovery is automatic, Repository-driven, BLoC/user-driven,
or terminal. Ensure status and resources match that contract.

### FL-ERR-041 — Do not convert failure into apparent success `[HIGH]`

Return success only when the public contract defines the failed condition as a
valid successful outcome.

