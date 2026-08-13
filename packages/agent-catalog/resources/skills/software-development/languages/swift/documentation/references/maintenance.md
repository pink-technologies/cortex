# Swift Documentation Maintenance

Use this reference when Swift documentation must remain synchronized with API
evolution, implementation changes, refactoring, deprecation, examples,
generated documentation, renamed symbols, changed defaults, lifecycle changes,
errors, availability, or other consumer-visible behavior.

This reference focuses on **preventing documentation drift and keeping
documentation aligned with the supported API contract over time**.

Use:

- `public-api.md` for what belongs in consumer-facing documentation.
- `parameters-returns-errors.md` for invocation-level contracts.
- `concurrency-and-lifecycle.md` for async, cancellation, isolation, observation,
  ownership, and lifecycle semantics.
- `symbols-and-links.md` for DocC symbol references and navigation.
- the Swift API-design skill for determining whether behavior or declarations
  are part of the supported consumer contract.
- project-specific DocC, API-diff, formatting, linting, and documentation build
  tooling for deterministic validation.

Project-specific documentation ownership, release processes, generated
documentation systems, API baselines, DocC catalogs, examples, and repository
instructions take precedence over this generic guidance.

## Maintenance baseline

### SWIFT-DOC-MAINT-001 — Documentation and implementation must describe one contract

For supported API, these should agree:

```text
declaration
documentation
behavior
tests
examples
compatibility guidance
```

When they disagree, do not automatically assume the comment is authoritative or
that the implementation is correct.

Determine the intended supported contract.

Then update all materially affected representations.

## Documentation drift

### SWIFT-DOC-MAINT-010 — Treat stale semantic documentation as a correctness defect

Documentation is stale when it describes behavior that consumers can no longer
rely upon.

Examples include:

```text
docs say operation is synchronous
implementation is now async

docs say callback occurs on MainActor
implementation no longer guarantees that

docs say output is deleted on cancellation
implementation preserves it

docs say nil means unsupported
implementation uses nil for not-yet-completed

docs say method may be called repeatedly
implementation rejects the second call
```

Do not classify these only as editorial issues when they can cause incorrect
consumer behavior.

## Changed behavior

### SWIFT-DOC-MAINT-020 — Update documentation in the same change as supported behavior

When a change materially alters:

- lifecycle
- state
- ownership
- errors
- cancellation
- ordering
- defaults
- output
- side effects
- availability
- persistence semantics
- callback or stream behavior

review the corresponding documentation.

Do not intentionally leave consumer documentation for a later change when the
new behavior ships immediately, unless project process explicitly requires a
separate documentation release.

## No behavioral change

### SWIFT-DOC-MAINT-030 — Do not churn documentation during implementation-only refactors

If a refactor changes:

```text
queue → actor
service A → service B
helper structure
private storage
internal task composition
```

while preserving the supported contract, public documentation may require no
change.

Do not rewrite DocC merely because implementation vocabulary changed.

A resilient documentation surface should survive internal refactoring.

## Review the contract, not the diff size

### SWIFT-DOC-MAINT-040 — Small code changes can require important documentation updates

A one-line change such as:

```swift
timeout: 30
```

to:

```swift
timeout: 60
```

can alter supported behavior.

Likewise:

```swift
@MainActor
```

or:

```swift
async
```

or a changed default enum value can materially affect consumers.

Do not use implementation diff size as a proxy for documentation impact.

## Conversely, large refactors can require no public documentation changes

### SWIFT-DOC-MAINT-050 — Documentation scope follows consumer impact

A large internal rewrite may preserve:

- API signatures
- state behavior
- errors
- lifecycle
- ordering
- ownership

In that case, public DocC should remain stable.

Do not use documentation rewrites as a way to visually demonstrate that a large
refactor occurred.

## Source of truth

### SWIFT-DOC-MAINT-060 — Identify authoritative project evidence before resolving a documentation conflict

Depending on the repository, evidence can include:

- project/repository instructions
- public API specification
- tests
- generated interfaces
- compatibility baselines
- release documentation
- existing supported examples
- implementation behavior

No single source is universally authoritative.

When two sources disagree, determine whether the task is:

```text
fix implementation
```

or:

```text
fix documentation
```

rather than silently choosing one.

## Documentation-only changes

### SWIFT-DOC-MAINT-070 — Verify semantic documentation changes against actual behavior

A documentation-only PR can accidentally invent a new API guarantee.

For example, changing:

```text
Attempts to stop the active operation.
```

to:

```text
Returns only after every underlying resource has been released.
```

is not merely editorial.

Confirm that implementation and tests support the stronger guarantee.

Do not approve semantic claims merely because production source was unchanged.

## Stronger guarantees

### SWIFT-DOC-MAINT-080 — Treat stronger wording as compatibility-sensitive when consumers may rely on it

Examples:

```text
may
→ always

typically
→ guarantees

future updates
→ current value followed by all updates

requests cancellation
→ immediately terminates
```

These changes can strengthen the supported contract.

Review whether the implementation can preserve that guarantee over future
versions.

Do not casually turn an implementation observation into a public promise.

## Weaker guarantees

### SWIFT-DOC-MAINT-090 — Weakening established documentation can also represent API evolution

Changing:

```text
The method returns after the file is finalized.
```

to:

```text
Finalization may continue after return.
```

is a behavioral contract change even if the source signature remains identical.

Use API compatibility guidance.

Do not hide behavioral breaking changes inside documentation cleanup.

## Rename maintenance

### SWIFT-DOC-MAINT-100 — Search documentation when supported symbols are renamed

When:

```text
OldName
→ NewName
```

review:

- declaration comments
- symbol links
- code examples
- articles
- tutorials
- deprecation messages
- migration guides
- module-level documentation

Do not update only the renamed declaration.

Stale old names can remain discoverable long after the source compiles.

## Exact-symbol search

### SWIFT-DOC-MAINT-110 — Search the old spelling after a rename or removal

Exact textual search is useful for API migration because stale references often
contain the old symbol literally.

Search relevant documentation surfaces for:

```text
OldType
oldMethod(
oldProperty
old module import
```

Evaluate each match.

Do not mechanically replace historical migration examples where the old name is
intentionally being discussed.

## Moved declarations

### SWIFT-DOC-MAINT-120 — Revalidate documentation when symbols move across modules or owners

Changing:

```text
Manager.start()
```

to:

```text
Session.start()
```

may require updates to:

- symbol links
- examples
- conceptual ownership explanation
- imports
- migration guidance

Even if a compatibility wrapper remains, new documentation should normally teach
the canonical API.

Do not make obsolete ownership models permanent through stale documentation.

## Removed declarations

### SWIFT-DOC-MAINT-130 — Remove or redirect references to APIs that are no longer supported

When a symbol disappears:

```text
old API
→ removed
```

documentation should either:

- point to the replacement
- explain migration where still relevant
- remove obsolete references

Do not leave documentation that compiles conceptually only against a previous
release.

## New declarations

### SWIFT-DOC-MAINT-140 — Add documentation at the level required by the new consumer contract

For a new supported declaration, ask:

```text
Is its purpose obvious?
Does it introduce lifecycle?
Does it expose errors?
Does it require ownership knowledge?
Does it create a new workflow?
```

Add documentation accordingly.

Do not automatically create a long DocC article for every new public member.

## Removed public behavior

### SWIFT-DOC-MAINT-150 — Remove obsolete semantic claims even if the related symbol remains

A declaration can stay while one behavior disappears.

For example:

```text
method still exists
automatic retry removed
```

Update the method/type docs.

Do not search only for deleted symbol names; behavior prose can become stale
without any API rename.

## Defaults

### SWIFT-DOC-MAINT-160 — Review documentation when defaults change

Defaults can be expressed through:

- parameter default values
- static `.default`
- configuration initialization
- environment-derived policy
- runtime capability selection

When the default changes, search for prose and examples that depend on the
previous behavior.

Do not update only the declaration literal.

## Dynamic defaults

### SWIFT-DOC-MAINT-170 — Avoid maintaining documentation for accidental runtime values

If the API defines:

```text
uses the system-selected camera
```

do not document one currently observed device as:

```text
defaults to the wide-angle camera
```

unless that is the actual product guarantee.

Documentation for dynamic defaults should remain semantic enough to survive
environment changes.

## Errors

### SWIFT-DOC-MAINT-180 — Review `- Throws:` when error mapping changes

Changes such as:

```text
new error case
removed case
translated error
cancellation reclassified
permission behavior changed
invalid state changed
```

can make existing DocC inaccurate.

Search for both:

- error type/case names
- textual descriptions of failure conditions

Do not assume updating the error enum documentation automatically updates every
method that references the old behavior.

## Error renames

### SWIFT-DOC-MAINT-190 — Update links and condition descriptions together

If:

```text
.operationUnavailable
→ .operationNotAllowed
```

update both:

```text
symbol reference
```

and:

```text
the prose explaining when the error occurs
```

Do not perform a purely textual rename if the semantics also changed.

## Cancellation

### SWIFT-DOC-MAINT-200 — Review cancellation documentation whenever task or lifecycle ownership changes

An internal refactor can accidentally change:

```text
whether caller cancellation propagates
whether explicit cancel is required
whether partial output survives
when cancellation becomes terminal
```

If those semantics changed, update consumer documentation.

If ownership remains identical, do not rewrite documentation merely because the
internal Task structure changed.

## Async migration

### SWIFT-DOC-MAINT-210 — Update workflow documentation when an API migrates from callback to async/await

Review:

- examples
- completion semantics
- errors
- cancellation
- actor isolation
- operation ownership
- deprecated callback paths

Prefer documenting the new canonical async workflow while keeping compatibility
documentation where required.

Do not maintain two independent conceptual explanations if both APIs ultimately
represent the same operation.

## Sync-to-async

### SWIFT-DOC-MAINT-220 — Remove synchronous assumptions after a supported API becomes async

Search for wording such as:

```text
returns immediately
blocks until
synchronously
completion callback
```

when changing the execution model.

Also inspect examples for missing:

```swift
await
```

or async context.

Do not update only the method signature in the code sample.

## Isolation changes

### SWIFT-DOC-MAINT-230 — Review execution-context documentation after actor-isolation changes

When a supported declaration gains or loses:

```swift
@MainActor
```

or another isolation contract, inspect documentation claiming:

- callback execution context
- UI ownership
- concurrency safety
- overlapping usage

Do not leave old queue/thread language contradicting the new Swift isolation
model.

## Observation changes

### SWIFT-DOC-MAINT-240 — Review stream and observer documentation when publication behavior changes

Changes to:

- initial emission
- replay
- buffering
- duplicates
- ordering
- termination
- multicast behavior

can materially affect consumers.

Update:

- stream member DocC
- lifecycle docs
- examples
- tests

when appropriate.

Do not describe an observation API as unchanged merely because its return type
remains `AsyncStream<Value>`.

## Lifecycle states

### SWIFT-DOC-MAINT-250 — Update state documentation when the public state machine evolves

When states are:

- added
- removed
- renamed
- merged
- reinterpreted

review:

- enum case comments
- type-level lifecycle
- valid-operation docs
- examples
- errors
- migration notes

Do not expose obsolete transition paths through stale comments.

## Internal state changes

### SWIFT-DOC-MAINT-260 — Do not update public documentation for implementation-only states

If an internal state:

```text
waitingForEncoder
```

becomes:

```text
preparingOutput
```

while consumer-visible behavior remains the same, public docs should normally
remain unchanged.

This is a useful signal that public documentation is properly abstracted.

## Ownership changes

### SWIFT-DOC-MAINT-270 — Review documentation when retain/release semantics become consumer-visible

If behavior changes from:

```text
operation survives handle release
```

to:

```text
releasing handle stops observation
```

documentation must change.

Likewise for:

- delegate retention
- subscription tokens
- resource cleanup
- returned file ownership

Do not document ARC implementation details unless they determine consumer
responsibility.

## Resource lifetime

### SWIFT-DOC-MAINT-280 — Review resource documentation after changes to cleanup or validity

For returned:

- temporary files
- URLs
- handles
- buffers
- streams

check whether changes affect:

```text
who cleans up
when resource becomes invalid
whether stop waits for release
whether cancellation preserves output
```

Update documentation at the API that owns the resource contract.

## Availability

### SWIFT-DOC-MAINT-290 — Review docs when platform support or runtime capability changes

Changes to:

- `@available`
- deployment targets
- supported hardware
- fallback implementation
- unavailable features

may invalidate integration examples or behavioral descriptions.

Do not duplicate availability attributes in prose unless consumers need
additional semantic context.

## Deprecation baseline

### SWIFT-DOC-MAINT-300 — Deprecation requires synchronized compiler and documentation guidance

When deprecating an API, review:

```text
@available(... deprecated ...)
renamed/replacement metadata
DocC summary
migration explanation
examples
articles
```

They should point consumers toward one coherent replacement.

Do not have the compiler recommend one API while DocC recommends another.

## Deprecated API

### SWIFT-DOC-MAINT-310 — Keep deprecated documentation correct during the support window

A deprecated method may still be used by supported consumers.

Its documentation should remain accurate enough for:

- lifecycle
- errors
- ownership
- compatibility

while clearly steering new usage toward the replacement.

Do not abandon documentation maintenance immediately after adding deprecation.

## New documentation should prefer the replacement

### SWIFT-DOC-MAINT-320 — Do not introduce new examples using deprecated API

Except for migration-specific material, new consumer documentation should use
the canonical supported replacement.

Otherwise deprecated surfaces remain socially permanent even after technical
migration paths exist.

## Removing deprecated API

### SWIFT-DOC-MAINT-330 — Delete stale deprecation documentation when the compatibility obligation ends

When project/version policy allows removal:

- remove old declaration docs
- remove compatibility examples
- update migration pages as appropriate
- remove links pointing to the deleted API
- make the replacement canonical everywhere

Do not preserve obsolete API docs in ordinary current-version navigation without
a historical documentation purpose.

## Migration guides

### SWIFT-DOC-MAINT-340 — Maintain migration guides around consumer differences

A migration guide should explain:

```text
Before
After
Why the caller changes
Behavioral differences
Lifecycle differences
Error differences
```

where relevant.

Do not describe internal architecture rewrites unless they explain a required
consumer migration.

## Migration completion

### SWIFT-DOC-MAINT-350 — Do not keep migration guidance in primary API documentation forever

Once the old API is no longer relevant to supported consumers, historical
migration information may belong in versioned release documentation rather than
current declaration comments.

Keep current API DocC focused on current usage.

## Examples baseline

### SWIFT-DOC-MAINT-360 — Treat examples as maintained consumer code

Examples can become stale through:

- symbol rename
- changed initializer
- new async requirement
- changed error handling
- changed module import
- availability
- lifecycle changes

Review examples when their referenced API changes.

Do not consider examples disposable prose.

## Example compilation

### SWIFT-DOC-MAINT-370 — Compile or validate examples when repository tooling supports it

Executable snippets or example applications provide stronger evidence than
visual inspection.

Use configured validation when available.

Do not claim example correctness solely because the code looks plausible.

## Noncompiled examples

### SWIFT-DOC-MAINT-380 — Review noncompiled snippets more carefully

Markdown snippets may not participate in normal compiler validation.

After relevant API changes, inspect:

- spelling
- argument labels
- `await`
- `try`
- imports
- state ordering
- types

Noncompiled examples are especially vulnerable to drift.

## Example behavior

### SWIFT-DOC-MAINT-390 — Keep examples semantically correct, not merely compilable

This can compile:

```swift
try await session.resume()
```

while being an invalid example if the session was never paused.

Examples should demonstrate valid consumer lifecycle.

Do not accept compile success as proof of conceptual correctness.

## Sample applications

### SWIFT-DOC-MAINT-400 — Treat official sample apps as integration documentation

When the repository provides supported sample applications, their usage can
define consumer expectations.

Update them when the canonical integration path changes.

Do not preserve an obsolete API only because the sample has not yet migrated.

The supported API drives the sample.

## README documentation

### SWIFT-DOC-MAINT-410 — Keep README-level usage aligned with DocC

A repository may document integration in:

- README
- DocC
- sample applications
- migration guides

These should not teach contradictory entry points or lifecycle.

Do not duplicate every detail across all surfaces.

Use each layer for its intended scope.

## Documentation hierarchy

### SWIFT-DOC-MAINT-420 — Maintain one authoritative location for shared semantics

Prefer:

```text
module/article
→ integration

type
→ shared lifecycle

member
→ operation-specific behavior

error type
→ error semantics

migration guide
→ old-to-new mapping
```

If the same contract appears in five places, drift becomes likely.

Link rather than duplicate when appropriate.

## Duplication

### SWIFT-DOC-MAINT-430 — Remove duplicated prose when it creates multiple sources of truth

Example:

```text
type says stop waits for cleanup
method says stop requests cleanup
README says cleanup happens asynchronously
```

Consolidate the shared contract and keep narrower docs focused on their own
responsibility.

Do not copy large paragraphs between members for convenience.

## Copy/paste drift

### SWIFT-DOC-MAINT-440 — Inspect repeated documentation for incorrect symbol or behavior references

Common copy/paste defects include:

- wrong parameter name
- wrong error case
- wrong type
- wrong lifecycle state
- old method name
- reference to another operation

Do not assume structurally similar declarations have identical contracts.

## Generated documentation

### SWIFT-DOC-MAINT-450 — Modify generated documentation at its source

If documentation is generated from:

- schema
- source definitions
- templates
- code generator
- API specification

update the owning source and regenerate.

Do not edit generated comments directly.

Manual changes will be overwritten and create false review confidence.

## Generated source detection

### SWIFT-DOC-MAINT-460 — Confirm whether a file is generated before editing documentation

Evidence can include:

- generated-file header
- project instructions
- generation scripts
- build configuration
- file location

Do not infer generated status solely from unusual formatting.

When generated, route the fix to the generator.

## Generation validation

### SWIFT-DOC-MAINT-470 — Regenerate and inspect the resulting documentation surface

After changing documentation generation:

1. run the established generator
2. inspect affected output
3. run DocC/API validation where configured
4. avoid unrelated generated churn

Do not hand-edit generated output after generation to "finish" the fix.

## Symbol links

### SWIFT-DOC-MAINT-480 — Revalidate DocC links after API evolution

Renames, overload changes, nesting changes, and module moves can invalidate
links.

Use configured DocC diagnostics.

Do not assume a textual symbol name that still exists resolves to the same
declaration.

See `symbols-and-links.md`.

## Broken links

### SWIFT-DOC-MAINT-490 — Fix broken links caused by the current change

When a changed API invalidates documentation links, fix them within the same
scope.

For unrelated pre-existing broken links, follow project cleanup policy.

Do not widen a focused behavioral PR into an unrelated documentation cleanup
unless necessary.

## Link targets and deprecation

### SWIFT-DOC-MAINT-500 — Move new links toward canonical API as deprecations progress

During compatibility periods:

```text
old API
→ links to new API
```

New documentation should prefer:

```text
new API
```

Do not keep compatibility aliases as central navigation nodes.

## Comments versus DocC

### SWIFT-DOC-MAINT-510 — Preserve implementation reasoning when refactoring code around public documentation

A source file may contain both:

```text
/// consumer contract
```

and:

```text
// implementation rationale
```

When moving/refactoring code, preserve each at the appropriate abstraction.

Do not accidentally move an internal invariant into public DocC or discard an
important rationale because it is not consumer-facing.

## Internal comments

### SWIFT-DOC-MAINT-520 — Update implementation comments when the reasoning they describe changes

An internal comment can become dangerous when it explains an invariant no longer
true.

Examples:

```text
"This lock protects all access"
```

after some access moved outside the lock.

```text
"Callbacks always arrive on queue X"
```

after framework behavior changed.

Maintain comments that explain why.

Delete comments whose explanation is no longer relevant.

## Obvious comments

### SWIFT-DOC-MAINT-530 — Remove comments made redundant by clearer code

After a refactor:

```swift
// Check if there are no items.
guard items.isEmpty else {
    return
}
```

the comment adds no value.

Do not preserve comments merely because they existed before the refactor.

Keep important reasoning, remove narration.

## Historical comments

### SWIFT-DOC-MAINT-540 — Remove obsolete implementation history from active source documentation

Comments such as:

```text
This used to work around bug X.
```

should remain only if the workaround still exists and understanding the history
is necessary to maintain it.

Once the workaround disappears, remove the historical comment or move history
to the appropriate project record.

Do not let source comments become a changelog.

## TODOs

### SWIFT-DOC-MAINT-550 — Reevaluate nearby TODOs when the owning behavior changes

A refactor can make a TODO:

- resolved
- obsolete
- incorrect
- newly urgent

If changed code directly addresses the TODO's subject, update or remove it.

Do not perform unrelated TODO cleanup across the repository.

## FIXME comments

### SWIFT-DOC-MAINT-560 — Do not leave a FIXME describing a defect that the current change claims to solve

If the defect is fixed, remove/update the FIXME.

If only partially fixed, refine it so it describes the remaining problem
accurately.

Stale FIXME comments reduce trust in source documentation.

## Commented-out code

### SWIFT-DOC-MAINT-570 — Do not preserve obsolete code as documentation

Deleted implementations belong in version control.

Avoid blocks such as:

```swift
// Old implementation:
// ...
```

unless the project explicitly uses such examples for compatibility explanation.

Document why a non-obvious current implementation exists instead.

## Version references

### SWIFT-DOC-MAINT-580 — Avoid hard-coded version statements in declaration documentation unless version itself is part of the contract

Prefer availability/deprecation metadata and migration documentation for release
history.

Avoid:

```text
As of version 7.4 this uses...
```

inside ordinary method DocC.

Such statements become stale quickly.

## Current year/date

### SWIFT-DOC-MAINT-590 — Avoid temporal wording that silently expires

Examples:

```text
currently
for now
recently
new
latest
```

can become meaningless over time.

Use precise:

- availability
- version
- capability
- contract

when time matters.

Do not make API docs depend on when they were written.

## External dependencies

### SWIFT-DOC-MAINT-600 — Review documentation when supported dependency requirements change

Changes to:

- required framework
- third-party dependency
- entitlement
- platform capability
- integration setup

may require updates to high-level integration documentation.

Do not expose dependency implementation details if consumers still interact
through the same supported abstraction.

## Vendor replacement

### SWIFT-DOC-MAINT-610 — Remove vendor-specific wording when the vendor is no longer a consumer contract

If internal implementation changes:

```text
VendorA
→ VendorB
```

and consumers should not care, public docs should usually require no vendor
mention.

If current docs mention VendorA unnecessarily, the refactor may reveal that
documentation leaked implementation detail.

Remove it rather than replacing it with VendorB.

## Feature flags

### SWIFT-DOC-MAINT-620 — Document feature configuration only when consumers control it

Internal rollout flags should not normally appear in public DocC.

If consumers have a supported configuration flag, document:

- effect
- default
- compatibility
- availability

Do not expose internal experimentation infrastructure.

## Configuration migrations

### SWIFT-DOC-MAINT-630 — Update documentation when configuration semantics change

Review:

- renamed fields
- new required fields
- changed defaults
- removed options
- different lifetime/scope

Keep examples and property documentation synchronized.

Do not document configuration structure that consumers cannot actually set.

## Serialization

### SWIFT-DOC-MAINT-640 — Update serialization documentation only when serialization is supported consumer behavior

If consumers persist/publicly exchange a model, schema evolution may require
documentation or migration guidance.

If serialization is internal implementation, do not expose schema changes
through public DocC.

Use API compatibility guidance for durable formats.

## Public resources

### SWIFT-DOC-MAINT-650 — Review documentation when consumer-visible resource behavior changes

Examples include:

- bundle names
- asset identifiers
- required resources
- model/resource availability
- localization usage

Do not document internal bundle topology unless consumers must reference it
directly.

## Security

### SWIFT-DOC-MAINT-660 — Remove sensitive or environment-specific values from examples and documentation

Documentation should not contain:

- credentials
- access tokens
- private keys
- production secrets
- private endpoints unless intentionally public
- customer data

Use placeholders that preserve semantic clarity.

Do not copy diagnostic logs containing sensitive values into DocC.

## Redaction

### SWIFT-DOC-MAINT-670 — Keep example placeholders clearly non-secret

Good:

```text
"<api-token>"
"<identity>"
```

Avoid placeholders that resemble real production credentials.

Documentation should teach structure without encouraging hard-coded secrets.

## Documentation formatting

### SWIFT-DOC-MAINT-680 — Preserve repository formatting while updating semantic content

When editing DocC:

- maintain paragraph structure
- preserve valid Markdown
- respect line-length/tooling rules
- avoid unrelated rewrapping
- keep code examples readable

Do not turn a semantic documentation fix into a broad formatting diff.

## Formatter behavior

### SWIFT-DOC-MAINT-690 — Let deterministic formatting tools own mechanical layout

If the repository uses SwiftFormat or another formatter, follow its output.

Do not maintain competing manual wrapping conventions in documentation.

When deterministic formatting and written guidance disagree, report
configuration drift according to project policy rather than asking authors to
satisfy both.

## Documentation linting

### SWIFT-DOC-MAINT-700 — Use lint rules as diagnostics, not a substitute for semantic review

A documentation linter can detect:

- missing comments
- malformed sections
- line length
- unresolved references

It cannot prove that:

```text
stop() really waits for teardown
```

or:

```text
nil really means not found
```

Semantic review remains necessary.

## Documentation coverage metrics

### SWIFT-DOC-MAINT-710 — Do not optimize for documentation coverage at the expense of usefulness

A project may require a percentage of documented public symbols.

Respect deterministic requirements.

But avoid comments such as:

```swift
/// The value.
var value: Value
```

when better semantic information is available.

Coverage is a signal, not documentation quality itself.

## DocC validation

### SWIFT-DOC-MAINT-720 — Run configured DocC validation when documentation structure changes materially

Relevant changes include:

- symbol links
- articles
- tutorials
- documentation catalogs
- renamed public API
- cross-module links

Use the repository's established command.

Do not invent a validation command when the project defines one.

## Build validation

### SWIFT-DOC-MAINT-730 — Verify documentation in the same build configuration consumers use when relevant

A symbol can resolve differently depending on:

- module composition
- conditional compilation
- platform
- access level
- generated interface

Use the relevant project target/module.

Do not validate only an internal target if consumer documentation is produced
from another module.

## API baseline validation

### SWIFT-DOC-MAINT-740 — Use API baselines to identify documentation impact, not to replace documentation review

If deterministic tooling reports:

```text
new public method
removed public property
changed isolation
```

use that as a prompt to inspect relevant DocC.

Do not assume:

```text
API baseline clean
→ documentation still correct
```

Behavior can change without symbol changes.

## Tests as documentation evidence

### SWIFT-DOC-MAINT-750 — Use behavioral tests to validate documented guarantees

Tests can provide evidence for claims such as:

```text
stop waits until no more callbacks arrive
```

```text
cancelled operation removes partial file
```

```text
status stream emits current value first
```

Do not overfit documentation to one low-level implementation-focused test.

Look for tests representing the public contract.

## Missing tests

### SWIFT-DOC-MAINT-760 — Strong guarantees without evidence deserve scrutiny

If documentation claims:

```text
exactly once
always ordered
never emits after stop
automatically resumes
```

and correctness materially depends on those guarantees, consider whether tests
should protect them.

Do not require a test for every sentence.

Prioritize behavior whose regression would affect consumers.

## Comments and tests disagreement

### SWIFT-DOC-MAINT-770 — Investigate contradictions rather than updating whichever is easier

If:

```text
DocC says A
test expects B
implementation does C
```

the task is to determine the intended contract.

Do not rewrite all three toward whichever behavior currently passes.

Use project/product evidence.

## CI

### SWIFT-DOC-MAINT-780 — Keep documentation validation deterministic in CI where the project chooses to enforce it

Possible checks include:

- DocC build
- unresolved links
- examples
- API baseline
- formatting/linting

Use project policy to determine blocking versus nonblocking checks.

Generic guidance should not invent mandatory CI gates.

## Changed scope

### SWIFT-DOC-MAINT-790 — Focus maintenance findings on documentation affected by the current change

If a PR changes recording lifecycle, review related recording docs.

Do not report unrelated legacy documentation defects across the entire SDK unless
the task explicitly requests a broad audit.

This keeps review findings actionable.

## Root-cause findings

### SWIFT-DOC-MAINT-800 — Consolidate several stale comments caused by one contract change

If one rename breaks:

- three symbol links
- two examples
- one migration paragraph

a review can describe the root documentation migration rather than emitting six
nearly identical findings.

Follow the generic code-review skill's finding structure and severity model.

## Deterministic diagnostics

### SWIFT-DOC-MAINT-810 — Do not duplicate tool-reported formatting or link errors as independent semantic findings without added value

If DocC reports an unresolved link, the review can reference that evidence.

Focus semantic review on questions such as:

```text
Why is the link stale?
Was the API moved?
Is the documentation still teaching an obsolete surface?
```

Avoid noise that merely repeats compiler/linter text.

## Deletion pass

### SWIFT-DOC-MAINT-820 — Remove documentation made obsolete by completed refactors

After a migration, inspect for:

- old symbol references
- compatibility examples no longer needed
- obsolete implementation notes
- stale TODO/FIXME comments
- old lifecycle terminology
- duplicate explanations
- links to removed API

Do not preserve dead documentation "just in case."

Version control already preserves history.

## Preserve accepted compatibility documentation

### SWIFT-DOC-MAINT-830 — Do not delete documentation for supported compatibility paths prematurely

Deprecated APIs can remain supported during a migration period.

Keep enough documentation for existing consumers until the compatibility policy
allows removal.

Deletion should follow support policy, not aesthetic preference.

## Canonical terminology

### SWIFT-DOC-MAINT-840 — Update terminology consistently when the domain vocabulary changes

If the supported product concept changes from:

```text
job
```

to:

```text
operation
```

review relevant consumer documentation.

Do not mechanically rename unrelated uses of "job" where it has a different
meaning.

Terminology migration should follow semantic scope.

## Canonical entry point

### SWIFT-DOC-MAINT-850 — Keep documentation centered on the current preferred consumer path

As APIs evolve, ensure:

```text
module overview
README
examples
articles
quick-start
```

all lead toward the canonical entry point.

Compatibility APIs can remain documented without competing with the modern path.

## Documentation ownership

### SWIFT-DOC-MAINT-860 — Keep documentation near the declaration or concept that owns the contract

If one lifecycle applies to an entire type, own it at type level.

If one parameter has special behavior, own it at the method.

If integration spans several types, own it in an article.

Do not duplicate ownership of the same rule across unrelated places.

## Refactor documentation ownership too

### SWIFT-DOC-MAINT-870 — Move documentation when responsibility moves

If behavior moves from:

```text
Manager
→ Session
```

the documentation ownership may need to move with it.

Do not leave the old manager's comment describing behavior it no longer owns.

Architecture changes can require documentation relocation even when wording
remains mostly valid.

## Consumer surface changes

### SWIFT-DOC-MAINT-880 — Review documentation navigation when the supported module boundary changes

If declarations move into or out of supported consumer modules, inspect:

- module overviews
- imports
- symbol links
- examples
- SPI/internal references
- re-export assumptions

Do not expose a newly internal module through stale public documentation.

Use API-design consumer-surface guidance.

## SPI evolution

### SWIFT-DOC-MAINT-890 — Maintain SPI documentation for its real audience without promoting it to public API

SPI documentation may remain useful for sibling modules.

When SPI changes:

- update sibling-module docs/call sites
- avoid external consumer migration guidance unless external consumers are
  actually supported

Do not treat SPI maintenance exactly like public SDK documentation.

## Package-facing documentation

### SWIFT-DOC-MAINT-900 — Keep package-internal documentation aligned with package ownership

Package-facing API may need documentation for repository maintainers and sibling
targets.

Do not publish it automatically in external consumer guides.

Audience remains part of documentation correctness.

## Objective-C interoperability

### SWIFT-DOC-MAINT-910 — Review Objective-C examples and names when Swift API changes affect generated interop

A Swift rename or signature change can alter:

- Objective-C selector
- nullability
- generated header
- completion handler
- type availability

If Objective-C is supported, update corresponding docs/examples.

Use the API-design interoperability reference.

## Cross-language semantics

### SWIFT-DOC-MAINT-920 — Keep Swift and Objective-C documentation semantically aligned

The syntax can differ:

```text
Swift async/await
Objective-C completion handler
```

but both surfaces should usually describe the same:

- operation
- lifecycle
- result
- errors
- ownership

Do not maintain contradictory language-specific behavior unless the product
intentionally differs.

## Binary/framework packaging

### SWIFT-DOC-MAINT-930 — Update installation/integration docs when packaging changes affect consumers

Changes to:

- framework names
- package products
- required modules
- XCFramework composition
- resource bundles

can require integration-documentation updates even if Swift declarations stay
the same.

Do not expose internal packaging changes that do not alter consumer setup.

## Build settings

### SWIFT-DOC-MAINT-940 — Document consumer-required build configuration, not internal build-system details

If consumers genuinely need:

- minimum deployment target
- linker flag
- entitlement
- privacy usage description
- capability

document it at integration level.

Do not copy internal CI/XcodeGen implementation settings into public DocC unless
the consumer must configure the same thing.

## Privacy requirements

### SWIFT-DOC-MAINT-950 — Keep permission/setup documentation synchronized with platform integration requirements

When an API requires system permission or application metadata, review
integration documentation after that requirement changes.

Do not rely on runtime failure alone to teach mandatory host-app configuration.

## Platform API migration

### SWIFT-DOC-MAINT-960 — Remove obsolete implementation-version notes after platform migrations

If implementation moves from one platform API to another while preserving
consumer behavior, public docs should generally continue describing the stable
behavior.

Do not rewrite:

```text
uses API A
```

to:

```text
uses API B
```

unless consumers genuinely need that framework-specific knowledge.

## Review stale absolutes

### SWIFT-DOC-MAINT-970 — Reevaluate words such as "always", "never", and "exactly" after behavior changes

Absolute language deserves evidence.

Search affected docs when a refactor changes:

- ordering
- callback count
- timeout
- resource cleanup
- retry
- state transitions

Do not weaken accurate strong guarantees merely because absolutes seem risky.

Verify them.

## Review stale implementation nouns

### SWIFT-DOC-MAINT-980 — Search implementation names that should have disappeared from public docs

After replacing:

```text
LegacyUploadCoordinator
```

search consumer docs for the name.

If consumers never needed that concept, remove the reference entirely rather
than replacing it with the new implementation class.

This is a useful way to restore abstraction after a refactor.

## Documentation quality review

### SWIFT-DOC-MAINT-990 — Review whether changed documentation remains concise after incremental edits

Repeated maintenance can create comments like:

```text
original paragraph
+ compatibility sentence
+ exception
+ another exception
+ historical note
```

When a comment becomes difficult to understand, rewrite it around the current
supported contract.

Do not preserve every historical sentence to minimize textual diff.

The goal is minimal semantic complexity, not minimal character changes.

## Minimal coherent documentation change

### SWIFT-DOC-MAINT-1000 — Update all directly affected documentation, but avoid unrelated cleanup

A good maintenance change is:

```text
smallest coherent documentation update
```

not:

```text
smallest number of edited lines
```

If changing a state requires updating:

- enum case
- method
- lifecycle article
- example

update all four if they form one consumer contract.

Do not leave an internally inconsistent documentation surface merely to keep the
diff small.

## Documentation review checklist

When maintaining Swift documentation, verify when applicable:

- implementation, tests, examples, and DocC describe one supported contract
- semantic documentation drift is treated as correctness, not merely wording
- consumer-visible behavioral changes update documentation in the same change
- implementation-only refactors do not create unnecessary public DocC churn
- documentation impact is based on consumer semantics rather than code diff size
- documentation-only changes are checked against actual behavior
- stronger or weaker guarantees receive compatibility scrutiny
- public symbol renames trigger exact searches for stale references
- moved and removed declarations update links, examples, and conceptual
  ownership
- new declarations receive documentation proportional to their consumer
  contract
- removed behavior is removed from prose even when declarations remain
- default changes update semantic documentation and examples
- dynamic defaults are not documented as fixed incidental values
- changed error mapping updates `- Throws:` and error links
- cancellation documentation follows the actual ownership model
- callback-to-async migrations update workflow, errors, and cancellation
- sync-to-async migrations remove stale synchronous assumptions
- actor-isolation changes update execution-context guarantees where relevant
- observation changes update initial-value, replay, ordering, buffering, and
  termination documentation
- public state-machine changes update cases, lifecycle, valid operations, and
  examples
- internal state refactors do not leak into public documentation
- ownership/resource changes update cleanup and validity documentation
- availability/platform changes update consumer integration only where needed
- deprecation metadata and DocC point to the same canonical replacement
- deprecated API remains accurately documented during its support window
- new examples avoid deprecated API outside migration material
- obsolete compatibility documentation is removed when its support obligation
  ends
- migration guides describe consumer changes instead of internal refactoring
- examples are treated as maintained consumer code
- examples are semantically valid, not merely syntactically plausible
- official sample applications follow the current supported workflow
- README, DocC, samples, and migration guides do not teach contradictory
  integration paths
- shared semantic documentation has one authoritative location
- duplicated prose is reduced when it creates multiple sources of truth
- copy/paste documentation is checked for stale parameter/type/state references
- generated documentation is modified through its generator/source
- generation is rerun and resulting output validated
- DocC links are revalidated after symbol movement/renames
- internal implementation comments are updated when their reasoning changes
- redundant comments are removed after code becomes self-explanatory
- stale TODO/FIXME comments directly affected by the change are updated or
  removed
- commented-out historical implementation is not used as documentation
- temporal wording such as "currently", "new", or "latest" is avoided when it can
  silently expire
- vendor-specific implementation wording is removed when vendor identity is not
  a consumer contract
- consumer-controlled feature/configuration changes update relevant docs
- serialization documentation changes only when serialization is supported API
- examples and docs do not contain secrets or sensitive production values
- documentation formatting follows deterministic repository tools
- lint/coverage metrics do not substitute for semantic documentation quality
- configured DocC validation runs for structural/link changes where appropriate
- validation uses the relevant consumer module/build configuration
- API baselines are used to identify surface changes but do not replace
  behavioral documentation review
- behavioral tests protect important documented guarantees when practical
- contradictions between docs, tests, and implementation are investigated rather
  than resolved arbitrarily
- documentation CI behavior follows project policy rather than generic rules
- review findings stay within changed scope unless a broader audit was requested
- repeated stale-doc problems from one root cause are consolidated
- raw deterministic diagnostics are not duplicated without semantic value
- completed refactors include a deletion pass for obsolete documentation
- accepted compatibility documentation is preserved until its support window
  ends
- terminology and canonical entry points remain consistent across the
  documentation surface
- documentation ownership moves when architectural responsibility moves
- public, SPI, package, and internal documentation remain scoped to the correct
  audience
- Objective-C documentation remains aligned when interoperability is supported
- packaging/integration documentation changes only when consumer setup changes
- absolute guarantees such as "always", "never", and "exactly" remain supported
  by the contract
- implementation names removed by a refactor do not remain as accidental public
  concepts
- accumulated documentation edits are rewritten when necessary around the
  current contract
- the change updates the smallest coherent set of documentation rather than the
  smallest possible number of lines

Do not treat documentation compilation, zero broken links, full symbol coverage,
or unchanged DocC during a refactor as proof that documentation is correct.
Documentation maintenance succeeds when the current supported consumer contract
has one accurate, coherent, and maintainable explanation.