# Swift DocC Symbols and Links

Use this reference when Swift documentation materially affects DocC symbol
references, links between declarations, code spans, articles, external URLs,
overloaded symbols, nested types, member links, module navigation, or
documentation discoverability.

This reference focuses on **creating stable, useful navigation between supported
API concepts without turning documentation into a fragile web of implementation
references**.

Use:

- `public-api.md` for deciding which declarations and relationships belong in
  consumer-facing documentation.
- `parameters-returns-errors.md` for links used in parameter, result, and error
  documentation.
- `concurrency-and-lifecycle.md` for links between lifecycle, state, cancellation,
  and observation APIs.
- `maintenance.md` for keeping links valid as API evolves.
- the Swift API-design skill for determining the actual supported consumer
  surface.
- repository DocC validation/build tooling as the source of truth for symbol
  resolution.

Project-specific DocC configuration, documentation catalog layout, module
boundaries, generated documentation rules, symbol-resolution tooling, and
repository formatting requirements take precedence over this generic guidance.

## Linking baseline

### SWIFT-DOC-LINK-001 — Link when navigation helps the consumer understand or use the API

Useful links commonly connect:

- a method to its result type
- a state property to its state enum
- a deprecated declaration to its replacement
- an error condition to a public error case
- a lifecycle operation to related start/stop/cancel APIs
- a configuration property to a domain type
- a high-level article to the primary entry point

Do not turn every API name into a link.

A link should provide navigational value.

## Symbol links versus code spans

### SWIFT-DOC-LINK-010 — Use a DocC symbol link for navigable supported API

When referring to a supported symbol that readers may want to inspect, prefer a
DocC symbol link.

Example:

```text
Use ``RecordingSession/start()`` to begin recording.
```

Use code spans for syntax or literals that do not need navigation:

```text
`nil`
`.recording`
`0...1`
`async`
```

Do not use code formatting as a substitute for navigation when the symbol is
important to understanding the contract.

## Do not link every occurrence

### SWIFT-DOC-LINK-020 — Link the first or most useful occurrence rather than every repeated symbol

Weak:

```text
Call ``Session/start()`` after ``Session`` is configured. The ``Session`` then
emits updates from ``Session/statusUpdates()`` until ``Session/stop()`` is
called.
```

This can become visually noisy.

Prefer links where navigation matters most.

Do not optimize documentation for link count.

## Supported symbols only

### SWIFT-DOC-LINK-030 — Consumer documentation should link to supported consumer symbols

Avoid linking application developers to:

- internal service types
- SPI-only helpers
- private implementation abstractions
- test utilities
- internal framework types

unless the documentation audience is explicitly that internal/SPI consumer.

A symbol being resolvable by DocC does not automatically make it appropriate
for consumer documentation.

Use the API-design consumer-surface rules.

## Internal links

### SWIFT-DOC-LINK-040 — Internal documentation can link internal symbols when that helps maintainers

For package/SPI/internal documentation, linking internal abstractions can be
useful.

Keep the audience consistent.

Do not let internal navigation leak into public integration guides unless the
symbol is genuinely part of the supported consumer workflow.

## Prefer semantic links

### SWIFT-DOC-LINK-050 — Link concepts that explain the current contract

For:

```swift
/// Resumes recording after a supported pause.
func resume() async throws
```

useful related links may include:

```text
``Status/paused``
``RecordingSession/pause()``
```

if those symbols help consumers understand when the operation is valid.

Do not link unrelated symbols merely because they appear in the same module.

## Link direction

### SWIFT-DOC-LINK-060 — Link from narrower behavior to the concept that explains it

Useful relationships often look like:

```text
method
→ state/error/result type

deprecated API
→ replacement

property
→ domain type

article
→ entry point
```

Avoid circular prose where every declaration merely links back and forth without
adding meaning.

Navigation should support comprehension.

## Symbol link syntax

### SWIFT-DOC-LINK-070 — Use DocC symbol-link syntax consistently

Typical symbol reference:

```text
``TypeName``
```

Member reference:

```text
``TypeName/member``
```

Method reference:

```text
``TypeName/method()``
```

Use the exact syntax that resolves under the project's DocC toolchain.

Do not guess complex symbol syntax when DocC validation can verify it.

## Relative symbol references

### SWIFT-DOC-LINK-080 — Prefer the shortest unambiguous symbol reference

Within type documentation, a relative reference can sometimes remain clearer
than a fully qualified module path.

Use the shortest form that resolves uniquely and remains understandable.

Do not fully qualify every symbol unnecessarily:

```text
``SomeModule.SomeNamespace.SomeType.someMethod()``
```

when:

```text
``SomeType/someMethod()``
```

is stable and unambiguous.

## Ambiguous symbols

### SWIFT-DOC-LINK-090 — Increase qualification only when DocC resolution is ambiguous

Ambiguity can occur with:

- same-named types
- overloads
- nested declarations
- same member names across scopes
- extension-heavy APIs

Start with the natural symbol reference.

If DocC reports ambiguity, qualify enough to identify the intended declaration.

Do not preemptively create long brittle paths for every link.

## Overloads

### SWIFT-DOC-LINK-100 — Link overloads carefully

A base reference such as:

```text
``Processor/process(_:)``
```

may be ambiguous when several supported overloads exist.

If the distinction matters, use the syntax generated/accepted by the configured
DocC toolchain to identify the exact overload.

If all overloads share the same conceptual role, linking the overload group or
type-level concept may be clearer.

Do not invent signature-disambiguation syntax from memory.

Validate it.

## Overload documentation

### SWIFT-DOC-LINK-110 — Do not make consumers choose overloads only through links

Each overload should still have a clear declaration and contract.

Links can help navigate related variants.

They should not substitute for:

- clear parameter labels
- distinct semantics
- useful summaries

If several overloads are impossible to distinguish in documentation, the API
design may itself need review.

## Nested types

### SWIFT-DOC-LINK-120 — Link nested types according to their consumer-visible ownership

For:

```swift
RecordingSession.Status
```

the documentation relationship may naturally be:

```text
``RecordingSession/Status``
```

according to the actual generated symbol graph/toolchain syntax.

Prefer the path that reflects the supported type hierarchy.

Do not flatten nested types in prose if nesting itself communicates ownership.

## Enum cases

### SWIFT-DOC-LINK-130 — Link enum cases when the specific case is relevant to behavior

For example:

```text
The method is available while the session is in ``Status/paused``.
```

can be useful.

Do not link every mention of `.paused` if context already makes the enum
obvious.

Code span:

```text
`.paused`
```

may be sufficient when navigation adds no value.

## Error cases

### SWIFT-DOC-LINK-140 — Link public error cases when consumers may need to inspect or handle them

Example:

```text
Throws ``RecordingError/operationNotAllowed`` when no recording is paused.
```

This is useful when the public error enum documents recovery semantics.

Do not link low-level internal errors that are not part of the supported error
contract.

## Related operations

### SWIFT-DOC-LINK-150 — Cross-link lifecycle operations when sequence matters

For example:

```text
Use ``pause()`` while recording and ``resume()`` to continue the same session.
```

Links are particularly useful when consumers need to navigate between:

```text
start
pause
resume
stop
cancel
```

Do not reproduce the complete lifecycle explanation inside every linked method.

Put shared semantics at the appropriate type/article level.

## Replacement APIs

### SWIFT-DOC-LINK-160 — Deprecated declarations should link directly to their supported replacement

Useful:

```text
Use ``MediaPipeline/export(to:)`` instead.
```

When a direct replacement does not exist, link to a migration article or the
new workflow entry point.

Do not link deprecated API to another deprecated intermediate symbol unless that
is deliberately the supported migration path.

## Replacement semantics

### SWIFT-DOC-LINK-170 — Do not imply equivalence through a link when semantics changed

Weak:

```text
Use ``newMethod()`` instead.
```

if the new method changes:

- ownership
- async behavior
- errors
- result model
- lifecycle

In such cases, briefly explain the difference or point to migration guidance.

A link alone is not migration documentation.

## Type aliases

### SWIFT-DOC-LINK-180 — Prefer links to the supported semantic type rather than implementation aliases

If a public typealias is itself part of the supported vocabulary, linking it can
be appropriate.

If an alias exists only for compatibility, documentation may be clearer when it
links the canonical replacement type.

Do not encourage new consumers toward compatibility-only names.

## Protocols

### SWIFT-DOC-LINK-190 — Link protocol requirements to domain types when it clarifies conformer responsibility

For a public protocol, useful navigation can connect:

- associated domain input
- result
- errors
- lifecycle types

Do not link every language-level constraint such as `Sendable` or `Hashable`
unless that conformance has special consumer meaning.

## Conformances

### SWIFT-DOC-LINK-200 — Avoid documentation links that imply unsupported extension points

A type may conform publicly to a protocol.

That does not necessarily mean consumers should implement or depend upon all
related internal machinery.

Link only supported extension concepts.

Do not use links to expose internal protocol architecture.

## Articles

### SWIFT-DOC-LINK-210 — Use articles for workflows or concepts larger than one declaration

An article is appropriate for:

- setup
- migration
- multi-step lifecycle
- integration
- conceptual architecture
- troubleshooting
- advanced workflow

A declaration comment should remain focused on that declaration.

Do not put a full integration guide inside one method's DocC comment.

## Article links

### SWIFT-DOC-LINK-220 — Link to an article when explanation exceeds declaration-level scope

For example:

```text
For the complete recording lifecycle, see <doc:Recording-Lifecycle>.
```

or the syntax required by the project/toolchain.

Use articles to centralize broader explanations.

Do not duplicate the same workflow across:

- type documentation
- several methods
- README
- multiple DocC articles

without a reason.

## Article naming

### SWIFT-DOC-LINK-230 — Name articles around consumer concepts

Prefer:

```text
Recording Lifecycle
Migrating to the New Upload API
Configuring Media Export
```

over:

```text
Internal Session Coordinator Details
Version2ChangesFinal
Helpers Overview
```

Documentation navigation should follow consumer tasks and concepts.

## Tutorials

### SWIFT-DOC-LINK-240 — Use tutorial-style documentation only for workflows that benefit from guided progression

Tutorials can be useful when consumers must perform several ordered integration
steps.

Do not create tutorial machinery for a trivial one-method API.

Use the simplest DocC format that communicates the workflow well.

## External links

### SWIFT-DOC-LINK-250 — Use external links only when the external resource adds durable consumer value

Useful external destinations can include:

- Apple framework documentation
- a public protocol specification
- an official external service specification
- supported integration documentation

Avoid external links to:

- temporary tickets
- internal dashboards
- PRs
- local wiki pages unavailable to consumers
- unstable search results

Consumer documentation should remain usable independently.

## External authoritative sources

### SWIFT-DOC-LINK-260 — Prefer authoritative external documentation

If a public API wraps a platform concept, link to the platform owner's official
documentation when deeper external context is useful.

Do not link to random blog posts for language/framework semantics in supported
API documentation unless project policy deliberately permits that source.

## URLs

### SWIFT-DOC-LINK-270 — Keep raw URLs out of prose when descriptive links are clearer

Prefer:

```markdown
[Apple documentation](...)
```

over an unexplained long raw URL when ordinary Markdown links are supported by
the documentation context.

Follow repository formatting and DocC rendering behavior.

Do not break URLs across lines in ways that invalidate them.

## Link text

### SWIFT-DOC-LINK-280 — Make link text describe the destination

Weak:

```text
See [here](...).
```

Better:

```text
See [Swift concurrency documentation](...).
```

Consumers should understand the destination before following it.

## Links to source control

### SWIFT-DOC-LINK-290 — Avoid repository-source links in consumer API documentation unless source navigation is intentionally supported

Links to:

```text
GitHub source file
specific commit
PR
issue
```

are usually poor long-term API documentation dependencies.

Use source links only when the product intentionally publishes source-level
reference and the URL is expected to remain stable.

Do not link consumer contracts to implementation-history artifacts.

## Links to issue trackers

### SWIFT-DOC-LINK-300 — Do not use issue or ticket links to explain supported behavior

Weak:

```text
See JIRA-1234 for why this is required.
```

The consumer may not have access and the issue is historical context.

Explain the actual contract in documentation.

Issue references belong in development history, not consumer DocC.

## Links to internal modules

### SWIFT-DOC-LINK-310 — Do not link internal architecture from external consumer documentation

Avoid:

```text
See ``InternalTransport/RequestCoordinator``.
```

if consumers cannot or should not use that symbol.

The public abstraction should stand on its own.

Internal implementation documentation can make those links separately.

## Cross-module links

### SWIFT-DOC-LINK-320 — Cross-module links should reflect supported dependency relationships

If supported module A intentionally exposes type B from supported module B, a
cross-module link can be useful.

If B is an internal implementation dependency, linking it from A's public DocC
can accidentally promote that dependency into the consumer mental model.

Use the consumer-surface architecture as the guide.

## Re-exported symbols

### SWIFT-DOC-LINK-330 — Do not rely on transitive symbol availability accidentally

A symbol may currently resolve because another module is re-exported.

If documentation directly teaches consumers to use that symbol, it can
strengthen the effective support expectation.

Link re-exported dependencies only when that exposure is intentional.

Do not let documentation create a consumer dependency the API architecture
intended to keep incidental.

## Code spans

### SWIFT-DOC-LINK-340 — Use code spans for syntax, values, and non-navigational references

Appropriate:

```text
`nil`
`true`
`.failed`
`async`
`throws`
`0..<count`
```

A code span communicates:

```text
this is code/syntax
```

without implying:

```text
navigate to API declaration
```

Use symbol links when navigation matters.

## Member names in prose

### SWIFT-DOC-LINK-350 — Avoid ambiguous unqualified member references

Weak:

```text
Call `start`.
```

Better:

```text
Call ``start()``.
```

or, when context requires:

```text
Call ``RecordingSession/start()``.
```

Include parentheses for methods where that improves clarity.

Do not refer to a method like a property unless that is intentional prose.

## Parentheses

### SWIFT-DOC-LINK-360 — Preserve method syntax in documentation references

Prefer:

```text
`start()`
```

or:

```text
``Session/start()``
```

over:

```text
`start`
```

when referring specifically to a method invocation.

This helps distinguish:

- methods
- properties
- types

## Argument labels

### SWIFT-DOC-LINK-370 — Include labels when needed to distinguish or clarify a method

For:

```swift
func export(to destination: URL)
```

a useful textual reference may be:

```text
`export(to:)`
```

or the corresponding DocC symbol link.

If overloads exist, labels may be essential for disambiguation.

Do not omit labels when doing so changes which API readers think is being
referenced.

## Generic types

### SWIFT-DOC-LINK-380 — Refer to the public generic type, not one incidental specialization, unless specialization matters

For:

```swift
Result<Value, Failure>
```

documentation may discuss the generic abstraction.

If a specific specialization is part of the consumer contract, use code spans
or prose to describe that specialization clearly.

Do not expect DocC symbol links to represent every generic instantiation as a
separate symbol.

## Operator symbols

### SWIFT-DOC-LINK-390 — Link operators only when navigation adds real value

Operators can have less obvious symbol syntax and overload resolution.

When documentation simply shows usage, a code example may be clearer.

If operator declaration navigation is important, validate the exact DocC syntax
with the configured toolchain.

Do not guess complex operator paths.

## Initializers

### SWIFT-DOC-LINK-400 — Link initializers when construction is part of the workflow

For example:

```text
Create the session using ``RecordingSession/init(configuration:)``.
```

if that exact initializer is important.

When several initializers exist and the distinction is obvious in the example,
a code sample may be clearer than a heavily qualified DocC link.

## Subscripts

### SWIFT-DOC-LINK-410 — Use generated DocC resolution for subscripts rather than inventing paths

Subscripts can require more specialized symbol references.

If navigation is important:

- inspect generated documentation
- use IDE/DocC tooling
- verify the link resolves

Do not fabricate complex link syntax manually.

## Extensions

### SWIFT-DOC-LINK-420 — Link the member symbol, not the source extension organization

Consumers should care about:

```text
Type/member
```

not:

```text
the extension file where it is implemented
```

DocC navigation should reflect the API hierarchy.

Do not document source-file organization as part of symbol identity.

## Type members

### SWIFT-DOC-LINK-430 — Preserve type ownership in cross-links when ambiguity exists

For common member names such as:

```text
status
start()
cancel()
```

a qualified link:

```text
``UploadTask/status``
```

can be clearer than a context-free link.

Use qualification as needed for comprehension and resolution.

## Static members

### SWIFT-DOC-LINK-440 — Clarify static/type member ownership when relevant

For:

```swift
Configuration.default
```

prefer a reference that communicates the owning type:

```text
``Configuration/default``
```

rather than simply:

```text
`default`
```

when several defaults exist nearby.

## Associated types

### SWIFT-DOC-LINK-450 — Link associated types only when consumers need to understand the generic relationship

Protocol documentation may benefit from linking associated types and related
requirements.

Do not overload the documentation with language-model links when a simple
example communicates the relationship more clearly.

## Symbol aliases

### SWIFT-DOC-LINK-460 — Prefer canonical current symbols in new documentation

If:

```text
OldType
```

is deprecated in favor of:

```text
NewType
```

new documentation should generally link `NewType`.

Use the old symbol only:

- in migration docs
- in deprecation docs
- when discussing compatibility

Do not teach compatibility aliases as the preferred modern API.

## Renamed symbols

### SWIFT-DOC-LINK-470 — Update references when symbols are renamed

A source rename should trigger review of:

- declaration DocC
- related type DocC
- articles
- tutorials
- code examples
- deprecation guidance
- symbol links

Do not assume DocC will automatically redirect every hand-written reference.

## Moved symbols

### SWIFT-DOC-LINK-480 — Revalidate links when declarations move between types or modules

Changing:

```text
OldModule.Manager/start()
```

to:

```text
NewModule.Session/start()
```

can invalidate previously resolved links.

Even if compatibility aliases exist, new documentation should generally point
to the canonical location.

Use `maintenance.md`.

## Removed symbols

### SWIFT-DOC-LINK-490 — Remove or redirect documentation references when the destination is no longer supported

A stale link can indicate deeper documentation drift.

When a symbol is removed:

- link to replacement if one exists
- update workflow prose
- remove obsolete examples

Do not leave broken references simply because the declaration comment containing
them still compiles.

## Link resolution

### SWIFT-DOC-LINK-500 — Treat DocC diagnostics as authoritative evidence of link resolution

When tooling reports:

```text
unresolved symbol link
ambiguous symbol reference
invalid documentation link
```

fix the actual documentation path.

Do not suppress or ignore deterministic DocC diagnostics merely because the
target symbol appears to exist in source.

Possible causes include:

- wrong module
- unsupported access level
- overload ambiguity
- spelling mismatch
- unavailable documentation target
- generated symbol name difference

## Do not guess after a diagnostic

### SWIFT-DOC-LINK-510 — Inspect generated symbol identity when a link does not resolve

If a natural path fails:

1. inspect DocC diagnostics
2. inspect generated documentation/interface if needed
3. determine the actual symbol hierarchy
4. use the simplest resolving path

Do not repeatedly add qualification by guesswork.

## Broken links

### SWIFT-DOC-LINK-520 — Treat broken supported-API links as documentation defects

Broken links reduce:

- navigation
- trust
- migration clarity

especially when they point to:

- replacement API
- errors
- required lifecycle state
- configuration

Fix them in changed scope.

Do not create broad unrelated documentation churn solely because another
pre-existing broken link exists elsewhere unless task scope includes cleanup.

## Ambiguous links

### SWIFT-DOC-LINK-530 — Resolve ambiguity explicitly rather than relying on arbitrary DocC selection

If two symbols match, documentation should identify the intended declaration.

Do not accept a link merely because one current compiler version happens to
resolve an ambiguous reference in the intended direction.

Ambiguous documentation is brittle.

## Case sensitivity

### SWIFT-DOC-LINK-540 — Match actual symbol spelling exactly

Documentation references should preserve:

- capitalization
- labels
- nested names
- type names

Do not normalize acronyms or spelling independently from the source API.

The source declaration is authoritative.

## Documentation aliases and display names

### SWIFT-DOC-LINK-550 — Distinguish navigation identity from prose display text

A consumer-facing sentence can use natural language while the underlying link
targets the exact symbol.

Avoid changing API spelling in prose so much that readers cannot correlate the
name with code.

Use domain terminology consistently.

## Link density

### SWIFT-DOC-LINK-560 — Keep documentation readable without link saturation

A paragraph with every second word linked becomes difficult to scan.

Prefer linking:

- primary concept
- replacement
- related lifecycle operation
- important type/error

rather than every possible symbol.

Documentation is prose first and navigation second.

## Self-links

### SWIFT-DOC-LINK-570 — Avoid unnecessary links from a declaration to itself

For example, inside `RecordingSession` documentation, repeatedly linking
``RecordingSession`` generally adds no navigational value.

Link related members or concepts instead.

Self-reference can remain plain prose.

## Parent links

### SWIFT-DOC-LINK-580 — Link to a parent type when readers may need broader lifecycle or conceptual documentation

A member can direct consumers to type-level behavior:

```text
See ``RecordingSession`` for the complete session lifecycle.
```

when the method-level contract depends on shared type semantics.

Do not duplicate the full type-level explanation in the member.

## Related types

### SWIFT-DOC-LINK-590 — Link closely related domain types where navigation clarifies the API model

Examples:

```text
Operation → Result
Session → Status
Configuration → Options
Error → Recovery API
```

Avoid linking implementation siblings that consumers do not need to know exist.

## Documentation graph

### SWIFT-DOC-LINK-600 — Build navigation around consumer workflows

A healthy documentation graph may look like:

```text
module overview
      ↓
primary entry point
      ↓
operation/session type
      ↓
configuration + status + result + error
      ↓
advanced workflow/migration
```

Avoid a graph centered around internal dependency layers.

Documentation architecture should mirror the supported consumer mental model.

## Entry points

### SWIFT-DOC-LINK-610 — Make primary entry points easy to reach

High-level articles and module documentation should link consumers toward the
supported starting point.

Avoid requiring consumers to discover functionality by browsing hundreds of
symbols without guidance.

Do not create several competing "start here" links for equivalent workflows.

## Migration links

### SWIFT-DOC-LINK-620 — Migration documentation should connect old and new concepts explicitly

A migration page can link:

```text
old type
→ new type

old method
→ new workflow

old callback
→ new async method
```

where each relationship is accurate.

Do not create a migration guide consisting only of a list of symbols with no
semantic mapping.

## Error navigation

### SWIFT-DOC-LINK-630 — Use error links to support recovery, not merely enumeration

Useful error documentation can link:

```text
permission error
→ authorization API

invalid state
→ lifecycle state

unsupported capability
→ capability query
```

when those connections help consumers recover.

Do not link every error case to unrelated troubleshooting pages.

## Lifecycle navigation

### SWIFT-DOC-LINK-640 — Link state and operations bidirectionally only when useful

For example:

```text
Status.paused
→ resume()

resume()
→ Status.paused
```

can aid navigation.

But repeating the same link network everywhere adds noise.

Choose the most natural consumer direction.

## Examples and links

### SWIFT-DOC-LINK-650 — Prefer executable-looking examples over excessive inline linking

Instead of:

```text
Call ``Session/init()``, then ``Session/start()``, then
``Session/statusUpdates()``, and finally ``Session/stop()``.
```

a code example may communicate the workflow more clearly.

Links can accompany explanatory prose around the example.

Use the medium best suited to the concept.

## Code examples

### SWIFT-DOC-LINK-660 — Do not attempt to make every symbol inside a code block navigable

Code examples should prioritize realistic source code.

Navigation belongs in surrounding DocC prose.

Do not replace natural Swift code with awkward symbol-link syntax inside code
blocks.

## External API references

### SWIFT-DOC-LINK-670 — Link external APIs only when consumers need their contract

If your API accepts:

```swift
AVAsset
```

there may be value in linking Apple documentation from a conceptual article.

A local member comment usually does not need to link every Foundation/Apple SDK
type.

Assume consumers can navigate standard library/platform types unless additional
context is useful.

## Standard library symbols

### SWIFT-DOC-LINK-680 — Do not link ordinary Swift language concepts routinely

Avoid unnecessary links for:

- `String`
- `Int`
- `Array`
- `Optional`
- `Error`

unless the documentation is specifically explaining their role.

Focus navigation on domain API.

## Foundation symbols

### SWIFT-DOC-LINK-690 — Link Foundation concepts selectively

For types such as:

- `URL`
- `Date`
- `Data`

the important documentation is usually the domain semantics:

```text
local file URL
```

rather than a link to Foundation's type definition.

Use external/platform links when there is genuine explanatory value.

## Cross-version stability

### SWIFT-DOC-LINK-700 — Prefer links that survive internal refactoring

A link to:

```text
supported public type
```

is usually more stable than a link to:

```text
private helper
internal adapter
generated implementation detail
```

Do not build documentation navigation on architecture that consumers should not
know.

## Module-qualified links

### SWIFT-DOC-LINK-710 — Use module qualification when required for disambiguation or cross-module clarity

A fully qualified reference can be useful when:

- same type name exists in multiple modules
- cross-module dependency matters
- DocC cannot otherwise resolve the symbol

Do not add module names merely because they are available.

Excessive qualification couples documentation to package/module structure.

## Module moves

### SWIFT-DOC-LINK-720 — Treat public module moves as documentation migration

When a supported type changes module, update:

- links
- imports in examples
- module overview pages
- migration articles

Do not keep new docs pointing at the old module only because a compatibility
re-export currently makes it compile.

## SPI links

### SWIFT-DOC-LINK-730 — Keep SPI navigation out of general public documentation

If SPI has its own documentation audience, links can be appropriate there.

General application-developer documentation should not teach:

```text
@_spi imports
```

unless the product explicitly supports that integration.

## Package links

### SWIFT-DOC-LINK-740 — Keep package-facing documentation scoped to package maintainers

Package declarations can link other package contracts.

Do not accidentally surface them in external documentation as supported app API.

Audience determines link appropriateness.

## Generated documentation

### SWIFT-DOC-LINK-750 — Fix generated symbol references at the generator/source

If documentation containing links is generated:

1. identify source template/schema
2. update link there
3. regenerate
4. validate generated DocC

Do not patch generated output manually.

## Link validation

### SWIFT-DOC-LINK-760 — Run configured DocC validation after changing important links

When repository tooling exists, validate:

- unresolved links
- ambiguous links
- missing resources
- malformed Markdown
- article references

Do not claim links resolve without running or observing the configured
validation when the task requires certainty.

## CI diagnostics

### SWIFT-DOC-LINK-770 — Prefer deterministic DocC diagnostics over review speculation

If CI already reports:

```text
unresolved symbol link
```

the review should focus on:

- why it became stale
- whether the target was renamed/removed
- whether documentation points at an unsupported symbol

Do not duplicate every raw warning as a separate semantic finding.

## Link changes during API refactor

### SWIFT-DOC-LINK-780 — Search documentation references when public symbols move or change

For a supported rename/removal, inspect likely references in:

- DocC comments
- articles
- tutorials
- README/integration docs if in scope
- deprecation messages
- examples

Do not update only the declaration comment while leaving surrounding
documentation stale.

## Search by exact symbol

### SWIFT-DOC-LINK-790 — Search old symbol spellings during migration

When:

```text
OldController
→ RecordingSession
```

search for:

```text
OldController
```

across documentation surfaces.

This is one of the few cases where exact text search can reveal stale
navigation effectively.

Do not replace unrelated historical references blindly; evaluate context.

## Canonical symbol

### SWIFT-DOC-LINK-800 — New documentation should point to one canonical supported symbol

If compatibility aliases exist, choose the modern canonical API for:

- examples
- related links
- module navigation
- conceptual docs

Keep old names where migration context specifically requires them.

This prevents compatibility paths from becoming permanent preferred
documentation.

## Review checklist

When Swift DocC symbols or links change, verify when applicable:

- links are added only where navigation helps consumer understanding
- supported API uses symbol links while syntax/literals use code spans
- repeated occurrences are not all linked unnecessarily
- public consumer documentation does not link internal or SPI-only symbols
- internal/SPI documentation keeps its intended audience clear
- semantic relationships, not file/module proximity, drive cross-links
- symbol-link syntax matches the configured DocC toolchain
- the shortest unambiguous symbol path is preferred
- qualification increases only when required for clarity/resolution
- overloaded declarations resolve to the intended operation
- overload ambiguity is validated rather than guessed
- nested types and members preserve their consumer-visible ownership
- enum/error cases are linked only when specific navigation helps
- lifecycle operations are cross-linked at useful points without duplicating the
  entire lifecycle
- deprecated declarations point to the canonical replacement or migration
  workflow
- links do not falsely imply semantic equivalence during migration
- canonical current types are preferred over compatibility aliases
- protocol links reinforce supported conformer/domain relationships rather than
  implementation architecture
- workflows larger than one declaration use articles when appropriate
- article names follow consumer concepts
- external links point to durable, authoritative consumer resources
- consumer documentation does not depend on issues, PRs, internal dashboards, or
  inaccessible repositories
- raw URLs are avoided when descriptive link text improves readability
- cross-module links reflect intentional supported dependencies
- re-exported implementation dependencies are not accidentally promoted through
  documentation
- code spans are used for syntax/value references that do not need navigation
- method references preserve parentheses and argument labels where useful
- generic/operator/initializer/subscript references are validated against actual
  DocC symbol resolution when complex
- extensions are documented through their API ownership rather than source-file
  organization
- static/member ownership remains clear
- new documentation prefers canonical symbols instead of deprecated aliases
- renames, moves, and removals trigger corresponding documentation-link review
- DocC diagnostics are treated as authoritative evidence for unresolved or
  ambiguous links
- broken links in changed supported scope are fixed
- case and spelling match source declarations exactly
- documentation remains readable without excessive link density
- unnecessary self-links are avoided
- parent/type links centralize broader conceptual documentation
- related types are linked according to consumer workflow
- the documentation graph leads consumers from module/entry point toward domain
  operations rather than internal architecture
- migration links map old concepts to new concepts semantically
- error links aid recovery where useful
- code examples remain natural Swift rather than link-heavy pseudo-code
- ordinary standard-library/Foundation types are not linked without a reason
- stable supported symbols are preferred over internal implementation details
- module qualification is used only when needed
- SPI/package documentation does not leak into general consumer navigation
- generated links are fixed at their source/template
- configured DocC validation is run when appropriate
- deterministic CI link diagnostics are not duplicated as low-value review noise
- public API refactors search for stale documentation references beyond the
  changed declaration itself
- new documentation points to one canonical modern API

Do not treat a successfully rendered link, a fully qualified symbol path, or a
high number of cross-references as proof that DocC navigation is useful or
stable. Links should reinforce the supported consumer model rather than expose
implementation structure.