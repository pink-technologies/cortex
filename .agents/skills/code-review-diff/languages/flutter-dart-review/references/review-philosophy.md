# Flutter/Dart Review Philosophy

Apply these principles when implementing or reviewing Flutter/Dart code.

## Contents

1. Consumer workflow
2. Ownership
3. Direct design
4. Evidence and PR scope
5. Deterministic tooling
6. Refactor completeness
7. Author style
8. Incomplete reviews

## 1. Start with the consumer workflow

### FL-REVIEW-001 — Reconstruct the changed workflow `[HIGH]`

Trace the change from the consumer or user interaction through state, data,
success, failure, retry, navigation, and terminal completion as applicable.

Do not evaluate an isolated declaration without its relevant call path.

## 2. Establish ownership first

### FL-REVIEW-010 — Identify state and lifecycle ownership `[HIGH]`

Identify who owns mutable state, BLoCs, repositories, subscriptions, timers,
controllers, Futures, caches, routes, and cleanup before approving an
abstraction or refactor.

### FL-REVIEW-011 — Require one authoritative owner `[HIGH]`

Reject competing mutable sources of truth unless synchronization is explicit,
atomic where required, and justified by observable behavior.

## 3. Prefer direct designs

### FL-REVIEW-020 — Require abstractions to solve a current problem `[HIGH]`

Do not add a Use Case, manager, helper, service, wrapper, adapter, generic base
class, or additional state layer solely for architectural symmetry.

Require a demonstrated responsibility, reuse boundary, ownership boundary,
external integration boundary, or test seam.

### FL-REVIEW-021 — Prefer the smallest coherent correction `[MEDIUM]`

Correct the violated contract or owner without proposing unrelated rewrites.

## 4. Keep reviews evidence-based and PR-scoped

### FL-REVIEW-030 — Report only introduced or materially affected issues `[HIGH]`

Do not report unrelated legacy problems. Inspect unchanged context when it is
required to prove a changed-code finding.

### FL-REVIEW-031 — Require concrete evidence `[HIGH]`

Every finding must identify the changed behavior, rule, scenario, impact,
smallest coherent fix, tests, and confidence.

Do not turn an unsupported concern into a finding.

### FL-REVIEW-032 — Report one root cause once `[MEDIUM]`

Consolidate repeated occurrences under one finding and list representative or
materially affected locations.

## 5. Respect deterministic tooling

### FL-REVIEW-040 — Do not duplicate formatter, analyzer, compiler, or test diagnostics `[MEDIUM]`

Do not repeat individual diagnostics already produced deterministically. Report
a higher-level finding only when one root cause explains multiple diagnostics
or exposes a semantic issue the tool does not express.

### FL-REVIEW-041 — Never infer a successful check `[HIGH]`

Use `PASS`, `FAIL`, or `NOT_RUN`. If a check did not run, report `NOT_RUN`.

## 6. Complete refactors

### FL-CLEAN-001 — Perform a deletion pass `[HIGH]`

After moving or replacing behavior, search for obsolete BLoCs, events, states,
properties, methods, resources, repositories, DI registrations, routes,
exports, dependencies, tests, documentation, compatibility paths, and helpers.

### FL-CLEAN-002 — Preserve one intentional execution path `[HIGH]`

Do not leave old and new implementations active behind different call sites
unless dual behavior is an explicit, documented, and tested contract.

### FL-CLEAN-003 — Remove obsolete package dependencies `[MEDIUM]`

Remove dependencies and dev dependencies that became unused because of the
change.

## 7. Preserve compliant author style

### FL-REVIEW-050 — Leave compliant code alone `[MEDIUM]`

When several implementations satisfy the rules, preserve established naming,
member ordering, region usage, formatting, and local implementation style.

Do not turn review into cosmetic rewriting.

## 8. Mark incomplete reviews honestly

### FL-REVIEW-060 — Mark missing evidence `[HIGH]`

Use `REVIEW_INCOMPLETE` when a material conclusion depends on unavailable
implementations, call sites, configuration, generated code, tests, platform
behavior, or public contracts.

