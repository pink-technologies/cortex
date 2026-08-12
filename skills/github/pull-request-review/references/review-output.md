Review Output

Use this reference when rendering the final output of a pull request review.

This reference owns only review presentation:

verdict rendering

required versus optional findings

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

Those come from code-review-diff and the materially relevant technical skills.

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

### ✅ Highlights

- [Call out a meaningful design, test, architecture, or implementation strength.]

### Validation

- ✅ [check that passed]
- ❌ [check that failed]
- ⏭️ [check not run and why]

Do not render empty sections.

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

### Validation

- ⏭️ Unit tests — not available in the current environment

Use Reviewed 💬 only when withholding a merge recommendation is intentional.

Local Review

For local or pre-push reviews, use the same finding structure without GitHub PRmetadata.

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

Do not:

render empty sections

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
What is optional?
What validation supports the decision?