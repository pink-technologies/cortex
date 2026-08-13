Review Output

Use this reference when rendering the final output of a pull request review.

This reference owns only review presentation:

verdict rendering

required versus optional findings

rule validation outcomes

compliance and coverage reporting

summary structure

inline comment formatting

validation reporting

no-findings output

local/pre-push review rendering

It does not define:

finding validity

severity

confidence

evidence requirements

merge-blocking semantics

technical review rules

project rules themselves

Those come from code-review-diff, repository/project guidance, and thematerially relevant technical skills.

Pull Request Review

Use this structure for the final GitHub review summary.

## Code Review

**[Approved ✅ | Changes Requested 🔴 | Reviewed 💬]** · [N required] · [N suggestions]

**#[number]** · [title] · @[author] · [N files] · +[additions] −[deletions]

### 🔴 Required Changes

#### [Short finding title]
`path/to/file.swift:42`

[Explain the concrete problem and the condition under which it occurs.]

**Impact:** [Explain the correctness, runtime, consumer, compatibility, security,
or maintainability consequence.]

**Change:** [Describe the required correction without prescribing unnecessary
implementation detail.]

### 💡 Suggestions

#### [Short suggestion title]
`path/to/file.swift:87`

[Explain the optional improvement and why it would help.]

### Rule Validation

**Compliance:** [N]% · **Coverage:** [N]%

`[N] passed` · `[N] failed` · `[N] not reviewed` · `[N] not applicable`

#### Failed rules

- ❌ `[RULE-ID]` → `[finding-id]`

<details>
<summary>View all rule outcomes</summary>

- ✅ `[RULE-ID]`
- ❌ `[RULE-ID]` — Finding: `[finding-id]`
- ⏭️ `[RULE-ID]` — [Why the applicable rule could not be reviewed]
- ➖ `[RULE-ID]` — [Why the rule does not apply to this change]

</details>

### ✅ Highlights

- [Call out a meaningful design, test, architecture, or implementation strength.]

### Validation

- ✅ [check that passed]
- ❌ [check that failed]
- ⏭️ [check not run and why]

Do not render empty sections.

Do not render Rule Validation when no explicit rule set was evaluated.

Findings

Render review findings using two author-facing classes:

Type

Meaning

Blocks merge

🔴 Required

A concrete defect or missing work that must be corrected before merge

Yes

💡 Suggestion

An optional improvement that does not affect merge readiness

No

Do not introduce an ambiguous intermediate category such as Warning.

If an issue must be fixed before merge, render it as Required.

If it does not need to be fixed before merge, render it as a Suggestion.

The underlying review model may still contain richer fields such as:

severity
category
confidence
evidence

Do not expose all internal classification unless it improves the review output.

Verdict

Approved ✅

Use when there are no unresolved required changes.

Suggestions may still exist.

Example:

Approved ✅ · 0 required · 2 suggestions

Do not withhold approval solely because optional suggestions remain.

Changes Requested 🔴

Use when at least one unresolved required change exists.

Example:

Changes Requested 🔴 · 2 required · 1 suggestion

Do not use Changes Requested for stylistic preferences or optional cleanup.

Reviewed 💬

Use when a merge recommendation is intentionally not being made.

Examples:

draft pull request

informational review

incomplete review scope

insufficient evidence for merge readiness

explicitly requested comment-only review

Do not use Reviewed merely to avoid making a decision when sufficient evidenceexists.

Rule Validation

Use this section when the review evaluates explicit project, organization,repository, language, framework, or policy rules with stable identifiers.

Rule validation exists to make the review:

auditable

reproducible

traceable

easier to compare across runs

It does not replace findings or determine the merge verdict.

Use four outcomes:

Outcome

Meaning

✅ pass

The rule applies, was reviewed, and is satisfied

❌ fail

The rule applies, was reviewed, and is violated

⏭️ not_reviewed

The rule applies, but there is insufficient evidence to evaluate it

➖ not_applicable

The rule does not apply to the semantic scope of the change

Do not count a rule as pass merely because the behavior it governs was notintroduced by the pull request.

For example:

No cancellation lifecycle introduced.

should normally be:

not_applicable

for a cancellation-specific rule, not pass.

Rule Summary

Keep the visible rule summary compact.

Prefer:

### Rule Validation

**Compliance:** 92% · **Coverage:** 88%

`68 passed` · `6 failed` · `10 not reviewed` · `21 not applicable`

When useful, add an area summary:

| Area | Pass | Fail | Not reviewed |
| --- | ---: | ---: | ---: |
| Architecture | 8 | 0 | 0 |
| BLoC | 14 | 2 | 0 |
| Testing | 10 | 3 | 7 |
| API | 3 | 0 | 0 |
| UI | 4 | 1 | 0 |

Do not render an area table when it adds more noise than signal.

Compliance

Calculate compliance using only rules that were applicable and reviewed:

compliance =
pass /
(pass + fail)

Example:

68 pass
6 fail

68 / (68 + 6) = 91.9%

Render:

Compliance: 92%

Do not include not_reviewed or not_applicable in the compliance denominator.

If no applicable rule was reviewed, do not calculate compliance.

Coverage

Calculate coverage using applicable rules:

coverage =
(pass + fail) /
(pass + fail + not_reviewed)

Example:

68 pass
6 fail
10 not_reviewed

(68 + 6) / (68 + 6 + 10) = 88.1%

Render:

Coverage: 88%

Do not include not_applicable rules in coverage.

If no applicable rule exists, do not calculate coverage.

Scoring Semantics

Compliance and coverage are informational.

They must never determine the review verdict.

Do not create thresholds such as:

>= 90% approve
80–89% warning
< 80% reject

A review can legitimately be:

Compliance: 98%
Coverage: 100%

Changes Requested 🔴

when one failed rule maps to a merge-blocking finding.

Likewise, a low coverage score can result in:

Reviewed 💬

when insufficient evidence prevents a merge recommendation.

The relationship is:

Rules
  ↓
outcomes
  ↓
traceability

Failed rules
  ↓
findings
  ↓
merge-blocking semantics
  ↓
verdict

Do not derive the verdict directly from the score.

Failed Rules

Show failed rules prominently because they represent actionable policy ortechnical violations.

Prefer:

#### Failed rules

- ❌ `FL-BLOC-050` → `failure-state-infinite-spinner`
- ❌ `FL-BLOC-031` → `failure-state-infinite-spinner`
- ❌ `FL-TEST-040` → `missing-save-order-bloc-tests`
- ❌ `FL-REVIEW-020` → `orphaned-stock-pagination-parameter`

Every failed rule must reference at least one finding.

A failed rule must not exist only as an isolated score deduction.

Rule-to-Finding Mapping

Multiple failed rules may map to the same finding when they represent the sameunderlying defect.

Example:

FL-BLOC-050 ─┐
FL-BLOC-031 ─┼──> failure-state-infinite-spinner
FL-REVIEW-001┘

Do not create duplicate findings merely to preserve a one-rule-to-one-findingrelationship.

Findings should remain consolidated by root cause.

One finding may therefore satisfy several failed rules.

A failed rule may reference multiple findings when distinct defects are requiredto explain the violation.

Full Rule Outcomes

Keep the complete rule list collapsed when the review evaluates many rules.

Prefer:

<details>
<summary>View all rule outcomes</summary>

- ✅ `FL-BLOC-001`
- ✅ `FL-BLOC-002`
- ❌ `FL-BLOC-050` — Finding: `failure-state-infinite-spinner`
- ⏭️ `FL-TEST-051` — Widget-test harness completeness could not be evaluated.
- ➖ `FL-TEST-091` — No cancellation lifecycle was introduced.

</details>

Use explanations for not_reviewed and not_applicable when the reason is notobvious.

For pass, add explanatory text only when it materially improves traceability.

Avoid verbose commentary on every passing rule.

Rule Ordering

Prefer a stable, understandable order.

When available, use:

repository-defined rule order

rule-family/category order

rule identifier order

Do not order rules by pass/fail status inside the full outcome list if doing somakes it harder to compare runs.

The compact Failed rules section already surfaces violations separately.

Finding Titles

Each finding should have a concise title that identifies the actual defect.

Prefer:

Cancellation can clear the replacement operation
Status stream misses the initial state
Deprecated API no longer forwards the completion result

Avoid:

Concurrency issue
Potential problem
Needs improvement
Consider changing this

The title should communicate the issue before the body is read.

Required Finding

Use this structure for blocking findings:

#### Cancellation can clear the replacement operation
`Sources/UploadTask.swift:142`

The cancelled task clears `activeTask` unconditionally after awaiting cleanup.
If a replacement task starts during that suspension, the stale task can clear
the new operation.

**Impact:** The manager can report no active upload while the replacement is
still running.

**Change:** Clear the stored operation only if it still represents the task
performing cleanup.

Keep the structure focused on:

Problem
↓
Impact
↓
Required change

Do not include:

long rulebook quotations

unrelated refactor ideas

several independent findings in one item

speculative failures without evidence

Suggestion

Use a shorter structure for optional improvements:

#### Reuse the existing lifecycle predicate
`Sources/CameraController.swift:201`

`canResume` already represents this condition. Reusing it here would keep the
lifecycle rule centralized and easier to maintain.

Do not add Impact or Change sections mechanically when the suggestion isalready clear.

Inline Comments

Inline comments should be more concise than summary findings.

Required

🔴 **Required — correctness**

This cleanup clears `activeTask` after an `await` without verifying that it still
owns the stored operation. A replacement task can start during the suspension
and then be cleared by the stale task.

Guard the cleanup using the operation's identity.

Suggestion

💡 **Suggestion — readability**

This condition is already represented by `canResume`; reusing that predicate
would keep the lifecycle rule centralized.

Use a short category only when it improves scanning.

Examples:

correctness
security
concurrency
compatibility
architecture
testing
lifecycle
performance
documentation
maintainability

Do not invent a category merely to fill the label.

Do not prefix inline comments with rule IDs unless doing so materially improvestraceability for the repository.

Prefer keeping rule mapping in the review summary.

Inline Comment Placement

Use an inline comment when:

the problem has a clear representative changed line

the explanation remains understandable at that location

the review platform can anchor the comment to the current diff

Use the review summary instead when the finding concerns:

multiple files

architecture or ownership

missing implementation

compatibility across declarations

missing tests

repository configuration

a cross-cutting problem without one representative line

Do not attach a cross-file finding to an arbitrary line merely to create aninline comment.

Highlights

Highlights is optional.

Include it only when something is materially worth calling out, such as:

clearer ownership

strong regression coverage

effective simplification

well-designed compatibility migration

removal of duplicate state or execution paths

Do not manufacture praise to balance required findings.

Avoid low-value comments such as:

Nice code.
Looks clean.
Good naming.

unless they communicate something useful to the author.

Validation

Validation reports execution evidence such as builds, tests, linters, staticanalysis, and CI checks.

It is separate from rule validation.

Use:

Rule Validation
    = which explicit review rules were evaluated and their outcomes

Validation
    = which deterministic checks ran and what happened

Report only checks that were actually observed or executed.

Use:

✅ PASS
❌ FAIL
⏭️ NOT_RUN

Example:

### Validation

- ✅ Unit tests
- ✅ SwiftFormat
- ❌ SwiftLint — 2 violations
- ⏭️ UI tests — device environment unavailable

Do not represent an unavailable check as passing.

Do not repeat every CI job when it adds no value to the review.

Prefer validation materially relevant to merge readiness.

Approved Review

When there are no actionable findings, keep the output compact.

## Code Review

**Approved ✅** · No actionable findings

**#482** · Fix recording recovery after interruption · @author · 6 files · +184 −72

### Rule Validation

**Compliance:** 100% · **Coverage:** 96%

`47 passed` · `0 failed` · `2 not reviewed` · `18 not applicable`

<details>
<summary>View all rule outcomes</summary>

- ✅ `SDK-ARCH-001`
- ✅ `SDK-CONC-004`
- ⏭️ `SDK-TEST-021` — Integration environment unavailable.
- ➖ `SDK-API-030` — No supported API surface changed.

</details>

### Validation

- ✅ Unit tests
- ✅ SwiftLint
- ✅ SwiftFormat

Do not create suggestions merely to make the review appear more thorough.

Changes Requested Review

Example:

## Code Review

**Changes Requested 🔴** · 2 required · 1 suggestion

**#482** · Fix recording recovery after interruption · @author · 6 files · +184 −72

### 🔴 Required Changes

#### Stale recovery can overwrite the current recording state
`Sources/CameraController.swift:214`

The recovery task writes `.recording` after an `await` without confirming that
the controller is still recovering the same interruption.

**Impact:** A newer interruption or stop operation can be overwritten with an
invalid `.recording` state.

**Change:** Revalidate recovery ownership/state before publishing the terminal
transition.

#### Failure path leaves the session running
`Sources/CameraController.swift:267`

The recorder failure transitions the state to `.failed`, but the capture session
remains active.

**Impact:** The controller reaches a terminal state while still retaining an
active capture resource.

**Change:** Ensure the failure path releases or stops the active session before
publishing the terminal state.

### 💡 Suggestions

#### Reuse the existing recovery predicate
`Sources/CameraController.swift:193`

The same lifecycle condition is already represented by `canRecover`; reusing it
would avoid duplicating the transition rule.

### Rule Validation

**Compliance:** 92% · **Coverage:** 88%

`68 passed` · `6 failed` · `10 not reviewed` · `21 not applicable`

#### Failed rules

- ❌ `SDK-LIFE-020` → `stale-recovery-overwrites-state`
- ❌ `SDK-CONC-031` → `stale-recovery-overwrites-state`
- ❌ `SDK-CLEAN-010` → `failure-path-leaves-session-running`

<details>
<summary>View all rule outcomes</summary>

- ✅ `SDK-LIFE-001`
- ✅ `SDK-CONC-001`
- ❌ `SDK-LIFE-020` — Finding: `stale-recovery-overwrites-state`
- ❌ `SDK-CONC-031` — Finding: `stale-recovery-overwrites-state`
- ❌ `SDK-CLEAN-010` — Finding: `failure-path-leaves-session-running`
- ⏭️ `SDK-TEST-041` — Device interruption tests were not available.
- ➖ `SDK-API-030` — No supported API surface changed.

</details>

### Validation

- ✅ Unit tests
- ✅ SwiftLint
- ⏭️ UI tests — device environment unavailable

Reviewed Without Verdict

Example:

## Code Review

**Reviewed 💬** · 1 required · 0 suggestions

**#482** · Refactor camera interruption recovery · @author · 6 files · +184 −72

### 🔴 Required Changes

#### Recovery ownership cannot be verified
`Sources/CameraController.swift:214`

The new recovery task writes state after suspension, but the available diff does
not establish whether another operation can replace the recovery owner.

**Impact:** Merge readiness cannot be determined without validating the
controller's serialization/ownership contract.

**Change:** Confirm or enforce exclusive recovery ownership before the terminal
state transition.

### Rule Validation

**Compliance:** 100% · **Coverage:** 67%

`12 passed` · `0 failed` · `6 not reviewed` · `9 not applicable`

#### Failed rules

None.

<details>
<summary>View all rule outcomes</summary>

- ✅ `SDK-ARCH-001`
- ✅ `SDK-LIFE-001`
- ⏭️ `SDK-CONC-040` — Recovery serialization could not be established from the
  available evidence.
- ➖ `SDK-API-030` — No supported API surface changed.

</details>

### Validation

- ⏭️ Unit tests — not available in the current environment

Use Reviewed 💬 only when withholding a merge recommendation is intentional.

A review may contain a required finding while rule compliance remains 100% ifthe finding is based on a technical skill or contract not represented by anexplicit project rule.

Rule validation must not be treated as the complete universe of review logic.

Local Review

For local or pre-push reviews, use the same finding and rule-validation structurewithout GitHub PR metadata.

Example:

## Code Review

**Changes Required 🔴** · 1 required · 1 suggestion

### 🔴 Required Changes

#### Stale task can clear the replacement operation
`Sources/UploadTask.swift:142`

The cancelled task clears `activeTask` after an `await` without confirming that
it still owns the stored operation.

**Impact:** A replacement upload can disappear from manager state while it is
still running.

**Change:** Clear the stored task only when its identity still matches the task
performing cleanup.

### 💡 Suggestions

#### Simplify duplicate state lookup
`Sources/UploadTask.swift:201`

The state is already available from the task snapshot; reusing it would avoid a
second lookup.

### Rule Validation

**Compliance:** 95% · **Coverage:** 91%

`38 passed` · `2 failed` · `4 not reviewed` · `12 not applicable`

#### Failed rules

- ❌ `CONC-021` → `stale-task-clears-replacement`
- ❌ `LIFE-010` → `stale-task-clears-replacement`

<details>
<summary>View all rule outcomes</summary>

- ✅ `ARCH-001`
- ❌ `CONC-021` — Finding: `stale-task-clears-replacement`
- ❌ `LIFE-010` — Finding: `stale-task-clears-replacement`
- ⏭️ `TEST-031` — Integration test environment unavailable.
- ➖ `API-020` — No supported API surface changed.

</details>

### Validation

- ✅ Unit tests
- ⏭️ Integration tests — service unavailable

Output Rules

Keep the final review:

concise

evidence-based

actionable

centered on root causes

clear about blocking versus optional feedback

traceable to explicit project rules when those rules exist

Do not:

render empty sections

render rule validation when no explicit rules were evaluated

count not_applicable as pass

count not_reviewed as fail

use compliance or coverage thresholds to determine the verdict

create failed rules without corresponding findings

create duplicate findings for multiple rules describing the same root cause

create findings for personal preferences

duplicate deterministic formatter/linter output without additional semanticvalue

report unrelated pre-existing issues

create several comments for the same root cause

manufacture positive feedback

use review length as a proxy for review quality

expose internal reviewer reasoning that does not help the author

The author should be able to understand within seconds:

Can this merge?
If not, what must change?
Which explicit rules failed?
How much of the applicable rule set was reviewed?
What is optional?
What validation supports the decision?