# Security, Configuration, and Observability

## Contents

1. Secrets
2. Sensitive data
3. Environment configuration
4. Logging
5. Dependencies

## 1. Secrets

### FL-SEC-001 — Never commit credentials or secrets `[BLOCKER]`

Do not hard-code private API keys, passwords, signing material, refresh/access
tokens, client secrets, or other credentials in source, tests, generated
assets, or configuration committed to the repository.

Use the project's approved secret/configuration delivery mechanism.

## 2. Sensitive data

### FL-SEC-010 — Keep sensitive data out of logs `[BLOCKER]`

Do not log credentials, authorization headers, full tokens, payment data,
passwords, or other sensitive user information.

### FL-SEC-011 — Minimize sensitive state retention `[HIGH]`

Keep sensitive values only for the lifetime and layer that requires them. Do
not copy credentials into BLoC/View state or analytics metadata without a
documented need and approved privacy treatment.

## 3. Environment configuration

### FL-CONFIG-001 — Centralize environment differences `[HIGH]`

Keep environment-specific endpoints, public configuration, feature settings,
and integration setup at bootstrap/configuration boundaries. Inject the
resolved configuration into the behavior that consumes it.

### FL-CONFIG-002 — Do not branch on environment throughout features `[MEDIUM]`

Avoid repeated `if production/staging` logic in Screens, BLoCs, Repositories,
or Resources when composition can select the correct configuration or
implementation once.

## 4. Logging

### FL-LOG-001 — Use the project's logging infrastructure `[MEDIUM]`

Do not introduce `print`/ad-hoc debug output as production observability.

### FL-LOG-002 — Keep logs structured and actionable `[MEDIUM]`

Log meaningful operation, failure, and recovery context without producing
high-volume method-entry noise.

### FL-LOG-003 — Preserve useful failure context without leaking data `[HIGH]`

Record enough typed/contextual information to diagnose failures while applying
redaction and privacy rules.

## 5. Dependencies

### FL-SEC-020 — Justify new runtime dependencies `[MEDIUM]`

Do not add a package for behavior that the SDK/framework/project already
provides adequately. Review ownership, maintenance, platform support, and
security implications when a new runtime dependency materially expands the
application surface.

