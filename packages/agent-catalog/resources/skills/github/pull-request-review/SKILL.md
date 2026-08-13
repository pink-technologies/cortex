---
name: pull-request-review
description: "Reviews GitHub pull requests by gathering PR context, applying the generic code-review methodology, and loading the materially relevant technical skills to validate the change before producing or publishing review feedback."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [GitHub, Pull-Request, Code-Review, Validation, Collaboration]
    related_skills: [code-review-diff, manage-review-comments]
---

Review GitHub Pull Request

Review a GitHub pull request using GitHub as the source of pull-request contextand the software-development skills as the source of technical review judgment.

This skill owns GitHub pull-request review mechanics.

It does not own:

generic code-review methodology

severity definitions

architecture rules

language rules

concurrency rules

API-design rules

framework rules

testing strategy

documentation rules

formatting rules

Those responsibilities belong to the relevant software-development skills.

The expected flow is:

GitHub Pull Request
        ↓
PR metadata + base/head + diff + checks + existing review context
        ↓
Repository/project guidance
        ↓
code-review/diff
        +
materially relevant technical skills
        ↓
Evidence-backed findings
        ↓
GitHub line/thread mapping
        ↓
Review summary
        ↓
Optional GitHub review submission

Core requirement

Always use the generic code-review skill:

software-development/code-review/diff

for the actual review methodology.

This GitHub skill must not independently redefine:

what qualifies as a finding

finding severity

false-positive thresholds

merge-blocking criteria

evidence requirements

architecture expectations

testing expectations

Use code-review/diff as the authoritative generic review methodology.

Then load additional skills based on what the pull request materially changes.

Skill selection

Always load

For every GitHub pull-request review:

code-review-diff

This provides the review methodology, evidence standard, finding model,changed-scope discipline, and false-positive control.

Load technical skills dynamically

After inspecting:

repository guidance

changed files

changed declarations

affected behavior

affected modules

test changes

public surface

load the skills that materially apply.

Do not load every available skill for every pull request.

The SkillCatalog is dynamic.

Select skills from their descriptions, tags, and applicability to the actualchange.

The examples below are illustrative and must not be treated as a hard-codedcomplete catalog.

Swift

When Swift source is materially involved, load:

swift

Then load specialized Swift skills only when applicable.

For Swift concurrency changes:

code-review-diff
+
swift
+
swift-concurrency

For supported Swift API changes:

code-review-diff
+
swift
+
swift-api-design

For a public async SDK API:

code-review-diff
+
swift
+
swift-concurrency
+
swift-api-design

For DocC changes:

code-review-diff
+
swift
+
swift-documentation

Add swift-api-design when the documentation describes a supported APIcontract whose semantics must also be validated.

For naming, formatting, or source-organization changes:

code-review-diff
+
swift
+
swift-style

Do not load swift-style automatically for every Swift PR merely because thesource has formatting.

Use deterministic formatter/linter output for purely mechanical style wheneverpossible.

SwiftUI

When SwiftUI views, state, identity, navigation, layout, observation,accessibility, animation, or rendering behavior are materially involved:

code-review-diff
+
swift
+
swiftui

Add other specialized skills when required.

Example:

SwiftUI view
+
Task lifecycle
+
shared mutable state

may require:

code-review-diff
+
swift
+
swiftui
+
swift-concurrency

Core Data

When Core Data contexts, managed objects, saves, merging, fetches, modelevolution, persistence, or concurrency are materially involved:

code-review-diff
+
swift
+
core-data

Add swift-concurrency when Swift concurrency materially participates in thepersistence flow.

Dart

When Dart source is materially involved:

code-review-diff
+
dart

Flutter

When Flutter widgets, framework lifecycle, state, layout, navigation,accessibility, or rendering are materially involved:

code-review-diff
+
dart
+
flutter

Load more specialized Flutter skills when available and materially relevant.

Architecture

Load:

software-architecture

when the change materially affects:

component boundaries

dependency direction

ownership

authoritative state

lifecycle

state machines

abstraction

resource ownership

recovery

refactor completeness

Example:

code-review-diff
+
swift
+
swift-concurrency
+
software-architecture

may be appropriate for a change moving shared mutable state into an actor.

Testing

Load:

testing

when the review needs to evaluate:

regression coverage

missing behavioral cases

lifecycle tests

asynchronous behavior

error paths

state transitions

integration boundaries

test determinism

Do not load testing solely because the pull request contains a test file.

Load it when test quality or behavioral coverage is materially part of thereview.

Implementation completeness

Load:

implementation

when the review materially needs to determine whether a feature, bug fix,refactor, or migration was implemented completely across affected executionpaths.

This is especially useful when checking:

missing call-site updates

old execution paths left active

incomplete migrations

cleanup after a refactor

documentation/tests omitted from a behavioral change

Debugging

Load:

debugging

when a bug-fix PR materially depends on:

root-cause validity

reproduction

symptom versus cause

diagnostic evidence

failure-path reasoning

Do not require the debugging skill for every PR whose title begins with fix.

Skill composition

Skills are cumulative.

A PR may legitimately require several specialized skills.

For example:

Public Swift camera API
using AsyncStream
with state-machine changes
and new tests

may require:

code-review-diff
+
swift
+
swift-concurrency
+
swift-api-design
+
software-architecture
+
testing

Another PR containing only an internal Swift rename may require only:

code-review-diff
+
swift
+
swift-style

Do not load unrelated skills merely because they exist in the repository.

Skill selection should follow the actual semantic blast radius of the change.

Guidance precedence

Before evaluating the code, establish applicable guidance.

Use this precedence:

Host/task requirements
        ↓
Organization rules
        ↓
Repository/project rules
        ↓
Project-specific skills
        ↓
Framework skills
        ↓
Language skills
        ↓
Generic fallback guidance

Deterministic:

compiler

formatter

linter

build

test

API baseline

configuration is authoritative for the mechanical rules it represents.

Do not use generic guidance to override an explicit repository architecture oraccepted exception.

Repository guidance discovery

Before producing technical findings, inspect applicable repository guidance.

Examples can include:

AGENTS.md
CONTRIBUTING.md
repository-specific review instructions
project architecture documentation
accepted exceptions
formatter/linter configuration
build/test configuration
API baselines

Load project-specific instructions before applying generic technical rules.

Do not assume conventions from another repository.

Establish the pull request

Before reviewing, identify:

repository

pull request

base branch

head branch

current head revision

draft/ready state when relevant

changed files

actual diff

PR title and body

available CI/check results

existing review comments when relevant

Do not review only the latest commit unless the user explicitly asks for asingle-commit review.

The normal review target is:

base
  ...
merge base
  ↓
all PR changes
  ↓
head

Base and head

Use the pull request's actual base and head.

Do not assume:

main
master
develop

from generic convention.

A PR targeting a release branch, stacked branch, or feature branch must bereviewed against that actual base.

Merge-base awareness

Review the effective PR diff from the correct merge base.

This matters after:

rebases

branch synchronization

stacked PRs

base-branch movement

conflict resolution

Do not classify unrelated base history as part of the pull request.

PR description is intent, not proof

Use the PR title/body to understand intended behavior.

Do not assume that because the PR says:

Fixes interruption recovery.

the implementation actually does so.

Validate claims against:

changed code

relevant unchanged context

tests

configuration

deterministic checks

Likewise, do not reject correct behavior merely because the PR description isweak.

PR description quality and code correctness are separate concerns.

Review changed scope

Start with changed code.

Inspect unchanged code only when necessary to determine whether a changed lineintroduces or exposes a real issue.

Relevant unchanged context can include:

callers

implementations

protocols

state owners

tests

dependency registration

configuration

serialization

generated interfaces

compatibility surfaces

Do not turn a pull-request review into an unrelated repository audit.

Review semantic impact

Review the behavior affected by the diff, not only the syntax directly visiblein changed lines.

For changed behavior, consider applicable paths such as:

success
failure
cancellation
cleanup
retry
interruption
replacement
concurrent invocation
state transition
persistence
compatibility

Which paths matter is determined by the loaded technical skills.

Do not mechanically apply every category to every change.

Validate ownership

When the change touches mutable state, lifecycle, operations, resources, orobservation, use the relevant architecture/language/framework skills to identifythe authoritative owner.

Check for problems such as:

duplicate state authority
state copied between owners
lifecycle split across unrelated components
cleanup performed by the wrong owner
public handles no longer representing authoritative state

Do not create architecture findings solely because another structure ispossible.

Require concrete behavioral or maintainability impact.

Validate refactor completeness

When a PR performs a migration or refactor, inspect whether the old design wasfully superseded where intended.

Look for affected:

wrappers

pass-through methods

duplicate state

obsolete protocols

compatibility paths

old execution paths

stale registrations

stale tests

stale documentation

Preserve compatibility code when actual supported consumers still require it.

Do not request deletion merely because code looks old.

Validate public boundaries

When supported API may be affected, load the corresponding API-design skill.

Do not infer supported consumer surface from Swift public or equivalentlanguage visibility alone.

Establish the actual product/package/module boundary from repository evidence.

This prevents false findings such as treating an internal composition API as anexternal breaking change.

Validate tests

When behavior changes materially, inspect whether tests protect the relevantcontract.

Use the testing skill when test strategy or coverage requires substantivejudgment.

Do not require tests based only on changed-line count.

Focus on meaningful behavior and regression risk.

Deterministic checks

Use available deterministic evidence when relevant, including:

compiler results

unit tests

integration tests

UI tests

formatter results

linter results

API/ABI baselines

static analysis

CI checks

A passing deterministic check is evidence for what that check actuallyvalidates.

It is not proof of overall correctness.

A failing deterministic check should not automatically become a separate reviewfinding if the tool already reports the problem adequately.

Focus review findings on the underlying semantic issue when additional analysisadds value.

Failed and unavailable checks

Distinguish:

PASS
FAIL
NOT_RUN

Do not report an unavailable check as passing.

Do not infer that code is incorrect solely because a check could not run.

When inability to run the check materially reduces confidence, state thatlimitation.

Existing review comments

When existing GitHub review comments are available, inspect them when they affectthe current review.

Do not post a duplicate finding that is already clearly covered by an unresolvedreview thread.

A previous comment may also have become outdated after new commits.

Validate the current head before relying on old feedback.

False-positive control

Before reporting a finding, verify:

What changed?
What behavior does that change affect?
Which rule/contract applies?
What concrete failure or regression can result?
Is the problem introduced or materially affected by this PR?
Does repository guidance already accept this behavior?

If those questions cannot be answered with sufficient evidence, do not reportthe finding as a defect.

Prefer fewer high-confidence findings over speculative review volume.

Do not review preferences as defects

Do not create findings because:

I would structure this differently.
I prefer another name.
I would use an actor.
I would use another pattern.
I would split this file.

unless the current design violates:

repository guidance

a loaded skill's applicable rule

a supported contract

a concrete correctness/maintainability requirement

Alternative designs are not automatically defects.

Finding ownership

Technical findings are produced according to:

code-review-diff

and the loaded specialized skills.

This GitHub skill must preserve the finding:

severity

category

confidence

problem

impact

remediation expectations

defined by the generic review methodology.

Do not invent a GitHub-specific severity system.

Consolidate root causes

When several changed lines are manifestations of one underlying issue, prefer oneroot-cause finding with representative evidence.

Do not create multiple comments for:

same incorrect ownership
same missing cancellation path
same API compatibility break
same formatter violation

unless separate fixes are genuinely required.

GitHub inline comments

Use an inline review comment when:

a precise changed line represents the problem

the comment remains understandable at that location

GitHub can anchor the comment to the current diff

The inline comment should explain:

problem
+
impact
+
necessary correction direction

without reproducing the complete review summary.

Cross-file findings

Do not force a finding onto an arbitrary line when the problem spans:

several files

architecture boundaries

missing implementation

compatibility surface

test coverage

repository configuration

Place such findings in the review summary or at the most representative changedlocation when GitHub requires an anchor.

The location should help the author understand the root cause.

Missing-code findings

A valid finding may concern code that should have changed but did not.

Examples:

new public state added
but observation stream does not publish it

new implementation added
but dependency registration still resolves old implementation

old API renamed
but supported compatibility wrapper is missing

behavior changed
but corresponding persistence migration is absent

Anchor the finding to the changed declaration that creates the missingobligation when possible.

Do not manufacture a location in an unrelated unchanged file.

Current head

Before publishing line comments, ensure findings correspond to the current PRhead.

If the head changed during review:

refresh the diff

verify affected findings

remap locations if necessary

Do not publish comments against stale code without revalidation.

Outdated comments

A GitHub comment becoming "outdated" does not automatically mean the issue wasfixed.

Likewise, an old comment still appearing current does not prove the issueremains.

Evaluate the actual current implementation.

Comment quality

GitHub review comments should be concise and actionable.

Avoid pasting the entire rulebook.

Include only enough explanation to establish:

what is wrong
why it matters
what behavior needs to be corrected

Technical reasoning should come from the loaded skills.

Suggested code

Use GitHub suggestion blocks only when:

the correction is local

the intended behavior is unambiguous

the suggestion does not hide broader required changes

Do not provide a one-line suggestion for an architectural problem requiringchanges across several owners.

Review output

When producing the final GitHub review, read:

references/review-output.md

Use that reference for:

review verdict presentation

required versus optional findings

summary structure

inline comment formatting

validation reporting

no-findings output

local/pre-push rendering

Do not redefine finding semantics in the output layer.

Finding validity, severity, confidence, evidence, and merge-blocking behaviorcome from code-review-diff and the materially relevant technical skills.

Review summary

Produce a review summary even when no findings exist.

The summary should communicate:

reviewed scope

important validation performed

findings or lack of findings

relevant check limitations

Do not manufacture praise or findings to make the summary appear substantial.

No findings

When the reviewed change has no actionable findings, say so clearly.

Do not invent low-value style comments merely to avoid an empty review.

A clean review is a valid result.

Review decision

Determine the technical recommendation using the merge-gating semantics fromcode-review-diff and applicable repository policy.

Possible GitHub outcomes include:

APPROVE
COMMENT
REQUEST_CHANGES

Do not create separate GitHub-specific severity rules.

Approve

An approval is appropriate when:

no unresolved finding requires correction before merge

required validation is sufficiently complete according to repository policy

no known blocker remains

Do not approve merely because CI is green.

Request changes

Request changes when the generic review methodology identifies unresolved workthat must be corrected before merge.

Do not request changes for subjective preferences or ordinary nonblockingsuggestions.

Comment

Use a nonblocking review when findings or observations do not require preventingmerge according to the generic review and repository policy.

Publishing behavior

Analyzing a pull request and publishing a GitHub review are distinct actions.

If the task requests only:

review
analyze
inspect
find issues

produce the review result without mutating GitHub unless the surroundingworkflow explicitly defines publication as part of the task.

Publish:

inline comments

review summary

approve/request-changes state

only when the user or workflow authorizes GitHub review submission.

Do not silently publish review comments while performing a read-only analysis.

Relationship to manage-review-comments

This skill owns the initial or repeated technical review of the pull request.

After review feedback exists, use:

github/manage-review-comments

for workflows such as:

evaluate reviewer feedback

reply to a thread

determine whether a comment was addressed

resolve a thread

reopen discussion when necessary

manage-review-comments should use the same relevant technical skills whenvalidating whether reviewer feedback is correct or has been addressed.

Relationship to create-pull-request

create-pull-request owns:

PR creation

title

body

draft state

GitHub PR metadata

This skill may inspect those fields as review context but does not own theircreation.

A weak PR description is not automatically a code defect.

Relationship to code-review-diff

The separation is:

github/pull-request-review
        ↓
obtain GitHub-specific context
        ↓
software-development/code-review/diff
        ↓
apply review methodology
        ↓
specialized skills
        ↓
technical validation
        ↓
github/pull-request-review
        ↓
map findings to GitHub

Do not duplicate code-review/diff inside this skill.

Representative skill-selection examples

Swift concurrency bug fix

PR changes:
CameraController.swift
CameraControllerTests.swift

Behavior:
interruption recovery + Task cancellation

Load:

code-review-diff
swift
swift-concurrency
testing

Add software-architecture if authoritative lifecycle/state ownership changed.

Public SDK API change

PR changes:
public protocol
new async method
deprecated callback method

Load:

code-review-diff
swift
swift-api-design
swift-concurrency

Add:

swift-documentation

when consumer-facing documentation changed or should change.

SwiftUI state change

PR changes:
View
Observable state
Task lifecycle

Load:

code-review-diff
swift
swiftui
swift-concurrency

Add testing when behavior/test coverage requires evaluation.

Core Data change

PR changes:
background context
save/merge behavior
managed-object handoff

Load:

code-review-diff
swift
core-data
swift-concurrency

Formatting-only Swift PR

Load:

code-review-diff
swift
swift-style

Use formatter/linter output as primary evidence.

Do not load:

swift-api-design
swift-concurrency
software-architecture

without material relevance.

Internal implementation refactor

PR changes:
internal service ownership
old execution path removed

Load:

code-review-diff
implementation
software-architecture

plus the relevant language skill.

Flutter feature

Load:

code-review-diff
dart
flutter

Add:

testing
software-architecture

only when materially involved.

Review checklist

Before completing a GitHub pull-request review, verify when applicable:

the actual PR base and current head were identified

the effective PR diff is based on the correct relationship

the PR title/body were used as intent rather than proof

repository and organization guidance were loaded before generic rules

accepted project exceptions were respected

code-review-diff was loaded for every review

the relevant language skill was loaded for materially changed source

specialized skills were loaded only when their subject is materially involved

concurrency changes use the relevant concurrency skill

supported API changes use the relevant API-design skill

SwiftUI changes use the SwiftUI skill

Core Data changes use the Core Data skill

documentation semantics use the documentation skill

meaningful Swift naming/formatting/source organization uses the Swift styleskill

architecture/ownership changes use the architecture skill

substantive test coverage questions use the testing skill

implementation completeness uses the implementation skill when appropriate

bug-root-cause analysis uses debugging when materially required

skill selection was driven by semantic impact rather than file extension alone

unrelated skills were not loaded merely because they exist

changed code was reviewed first

unchanged context was inspected only where needed to validate changed behavior

success, failure, cancellation, cleanup, and lifecycle paths were consideredonly where relevant

authoritative state and ownership were validated when the change affects them

refactor cleanup was checked when the old design should have been superseded

compatibility was evaluated against the actual supported consumer boundary

tests were judged by behavioral risk rather than changed-line count

deterministic checks were used as evidence for what they actually validate

unavailable checks were represented as NOT_RUN

deterministic tool diagnostics were not unnecessarily duplicated

existing unresolved review comments were checked before posting duplicates

every reported finding has concrete changed-scope evidence

subjective alternatives were not reported as defects

technical finding severity and structure come from code-review-diff

root-cause issues were consolidated instead of fragmented into repeatedcomments

inline comments are anchored to representative current changed lines

cross-file findings are not attached to arbitrary lines

missing-code findings are anchored to the change creating the obligation whenpossible

the PR head was refreshed before publishing comments if commits changed duringreview

outdated GitHub comments were not treated as proof that an issue was fixed

review comments remain concise and actionable

suggested patches are used only for genuinely local corrections

the review summary accurately represents findings and validation limitations

zero actionable findings is accepted as a valid review result

approve/comment/request-changes follows the generic merge-gating semantics andrepository policy

GitHub mutation occurs only when review publication is authorized

follow-up comment/thread management is delegated togithub/manage-review-comments

Do not treat GitHub metadata, green CI, changed-line inspection, or one genericreview prompt as sufficient validation of a pull request.

A GitHub pull-request review is complete only after the generic code-reviewmethodology and every materially relevant technical skill have been applied tothe actual current PR diff under the repository's own rules.