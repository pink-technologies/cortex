---
name: swift-style
description: "Applies reusable Swift naming, source organization, formatting, and readability guidance for implementation, refactoring, and review. Use when Swift API naming, argument labels, source structure, imports, declaration organization, formatting, comments, or style consistency are materially involved."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Swift, Style, Naming, Formatting, Source-Organization, Readability]
    related_skills: [swift, swift-api-design, swift-documentation, code-review-diff]
---

# Swift Style Engineering

Use this skill as specialized Swift guidance for naming, formatting, source
organization, and readability.

Combine it with the Swift language skill when general Swift semantics are
materially involved.

Use the Swift API-design skill when naming or source changes affect a supported
consumer-facing API.

This skill does not define the task workflow, repository architecture, review
format, severity model, formatting configuration, file template, or
project-specific style policy.

## Apply project guidance first

Before applying these rules:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  files before relying on this generic guidance.
- Treat repository formatter, linter, compiler, and source-generation
  configuration as the source of truth for deterministic style rules.
- Preserve established project conventions when several Swift-native
  alternatives are equally valid.
- Do not replace project formatting, naming, import grouping, source ordering,
  or file-organization rules with preferences from this skill.
- Exclude generated, vendored, dependency, and externally constrained source
  from ordinary project style rules when its format is controlled elsewhere.
- Keep interoperability-required naming and structure at the boundary that
  requires them.

## Establish the style context

Before recommending or applying a style change, determine when relevant:

- repository formatting configuration
- lint configuration
- existing local conventions
- whether the declaration is consumer-facing
- whether compatibility constrains renaming
- whether Objective-C or another interoperability boundary affects naming
- whether source is generated
- whether declaration ordering has semantic or conceptual meaning
- whether formatting is deterministic or merely one valid presentation among
  several

Do not infer a mandatory style rule merely because one pattern appears
frequently in the repository.

Use explicit configuration and project guidance as stronger evidence than
incidental repetition.

## Load related skills

- Use the Swift language skill for general Swift correctness.
- Use the Swift API-design skill when names or declarations form a supported
  consumer contract.
- Use the Swift documentation skill when DocC or declaration documentation is
  materially involved.
- Use framework-specific skills when naming or source organization is governed
  by a framework contract.
- Use code-review methodology only when evaluating style as part of a
  change-set review.

Do not load this skill merely because a file contains Swift. Use it when naming,
formatting, source organization, or readability is materially part of the task.

## Load references

Read only the references that materially apply to the task:

- `references/naming.md` for call-site clarity, role-based names, methods,
  properties, Booleans, argument labels, delegates, and rename decisions.
- `references/formatting.md` for deterministic formatting, wrapping, multiline
  structure, collections, attributes, control flow, and formatting scope.
- `references/source-organization.md` for imports, top-level declarations,
  extensions, logical grouping, overloads, protocol conformances, and file
  structure.

Load only references relevant to the affected code. Do not load a reference
solely because it exists.

## Engineering baseline

- Optimize names for clarity at the point of use.
- Name declarations for the role or behavior they represent rather than an
  incidental implementation mechanism.
- Omit words that do not improve understanding.
- Prefer established terminology over unnecessary abbreviations.
- Use language-level access control rather than naming conventions to simulate
  visibility.
- Keep formatting deterministic when project tooling defines the result.
- Preserve an existing valid layout when multiple layouts are equally correct.
- Organize source around understandable responsibilities.
- Keep related overloads and conformances discoverable.
- Avoid unrelated formatting or source reorganization during focused
  behavioral work.
- Prefer comments that explain reasoning or constraints over comments that
  narrate the code.
- Treat renaming of supported consumer-facing declarations as an API change,
  not merely a style edit.

## Naming for the call site

Evaluate Swift names in representative usage.

A declaration should communicate its intent without requiring knowledge of the
implementation.

For example:

```swift
recorder.startRecording()
session.resetZoom()
configuration.recordingDuration
```

Judge the complete expression rather than the declaration name in isolation.

Do not request a rename merely because a synonym sounds preferable.

A rename should improve a concrete property such as:

- ambiguity
- grammar
- semantic accuracy
- role clarity
- consistency
- consumer understanding

Do not churn accurate Swift-native names for subjective vocabulary preferences.

## Name roles, not mechanisms

Prefer names that communicate what a type or value does in the domain.

Avoid exposing implementation mechanisms unnecessarily.

For example, a consumer concept should not need to be named after:

- an internal queue
- a framework type it wraps
- a storage implementation
- a synchronization primitive
- a transport mechanism

unless that mechanism is itself part of the supported abstraction.

Be cautious with vague suffixes such as:

```text
Manager
Helper
Handler
Data
Info
Utils
```

They are not inherently wrong.

Use them only when the complete name communicates a concrete and understandable
responsibility.

## Omit needless words

Avoid repeating information already obvious from the declaration context or
type.

Prefer:

```swift
extension URLSession {
    static let shared: URLSession
}
```

over:

```swift
extension URLSession {
    static let sharedSession: URLSession
}
```

when the additional word contributes no semantic distinction.

Do not remove words when doing so creates ambiguity at the call site.

Conciseness is subordinate to clarity.

## Abbreviations

Prefer established platform and domain abbreviations when they are widely
understood in the relevant context.

Examples can include:

```text
URL
HTTP
ID
API
SDK
UI
```

Avoid inventing abbreviations merely to shorten declarations.

Project- or domain-specific abbreviations are appropriate when they are part of
established terminology understood by the intended maintainers or consumers.

Do not expand a conventional abbreviation solely for stylistic uniformity.

## Methods and properties

Operations should generally read as actions.

For example:

```swift
func startRecording()
func capturePhoto()
func resetZoom()
```

Values and state should generally read as noun phrases or descriptions of the
value:

```swift
var recordingDuration: TimeInterval
var zoomFactorRange: ClosedRange<CGFloat>
```

Do not apply the verb/noun distinction mechanically when protocol requirements,
platform conventions, or established domain terminology dictate another form.

## Boolean naming

Boolean declarations should read naturally as assertions, capabilities,
permissions, or requirements.

Depending on the meaning, appropriate forms can include:

```swift
isRecording
hasTorch
canCapturePhoto
allowsEditing
supportsHDR
needsAuthorization
shouldRetry
```

Do not enforce one Boolean prefix independently of semantics.

Evaluate the declaration in context:

```swift
if camera.supportsHDR { ... }
if session.isRecording { ... }
if request.needsAuthorization { ... }
```

Prefer grammatical clarity over prefix uniformity.

## Argument labels

Use argument labels to communicate semantic roles and make call sites read
naturally.

Prefer:

```swift
move(from: source, to: destination)
```

when directional roles matter.

Avoid filler labels that contribute no information.

Do not remove labels merely to shorten the call when they distinguish otherwise
ambiguous values.

Treat argument labels on supported public APIs as part of the source
compatibility contract.

## Initializer parameters

Prefer initializer parameter names that express the same domain concept as the
value being initialized.

Using explicit `self` can make assignments clear:

```swift
init(session: CameraSession) {
    self.session = session
}
```

Do not rename parameters artificially merely to avoid `self`.

Whether explicit `self` is required outside ambiguity-sensitive contexts is a
project style decision.

## Delegate-style APIs

When designing Cocoa-style delegate APIs, follow established Swift and Apple
grammar when it matches the project and framework context.

A common pattern is:

```swift
func cameraSessionDidStartRunning(
    _ cameraSession: CameraSession
)

func cameraSession(
    _ cameraSession: CameraSession,
    didFailWith error: Error
)
```

Common conventions include:

- source object first
- source object unlabeled where Cocoa grammar expects it
- `did...` for observed events
- `should...` for policy decisions
- labels that form a grammatical description of the event

Preserve the surrounding delegate vocabulary.

Do not rename one callback in isolation when related callbacks intentionally use
an established grammar.

## Access control

Use Swift access control to express visibility and consumer boundaries.

Do not use:

```text
_
Internal
Private
Impl
```

as substitutes for:

```swift
private
fileprivate
internal
package
public
open
```

A leading underscore or similar naming convention can still be appropriate
when required by:

- generated code
- backing storage
- interoperability
- language or framework conventions
- an explicitly documented project pattern

Do not infer public support merely from a declaration's spelling.

Use the Swift API-design skill for deeper consumer-boundary reasoning.

## Formatting authority

When the repository configures tools such as SwiftFormat or SwiftLint, prefer
their deterministic result over manual formatting preferences.

A useful precedence is generally:

```text
host/project requirements
        ↓
repository formatter/linter configuration
        ↓
established local convention
        ↓
generic Swift style guidance
```

Do not ask code to satisfy contradictory formatter and linter rules.

When project configuration conflicts internally, identify the configuration
conflict rather than inventing a third style.

## Formatting is not architecture

Do not elevate a formatting preference into a correctness or architecture
problem.

Examples include:

- line wrapping
- blank lines
- trailing commas
- attribute placement
- import ordering
- indentation
- section markers

unless the project configuration makes the rule deterministic or the layout
creates a concrete readability or behavioral problem.

Formatting should make behavior easier to read, not become the primary design
constraint.

## Preserve valid layouts

When several layouts are valid under project configuration, preserve the
existing readable form unless changing it serves the task.

Do not churn:

```text
single-line ↔ multiline
one valid wrapping form ↔ another
one valid MARK arrangement ↔ another
```

solely because the agent prefers another presentation.

Formatting stability reduces unrelated diff noise and preserves review focus.

## Keep formatting scope focused

For behavioral changes, avoid formatting unrelated declarations or files.

Format:

- the changed declaration
- the immediately affected scope
- additional code only when deterministic tooling necessarily changes it

Do not turn a functional change into a repository-wide style rewrite unless
that rewrite is explicitly requested.

This principle applies equally during implementation and automated fixes.

## Multiline structure

When a declaration, call, condition, generic constraint, collection, or chain
becomes multiline, structure it so semantic units remain easy to scan.

Prefer predictable continuation indentation.

For example:

```swift
let input = try CameraInput(
    descriptor: descriptor,
    outputs: outputs
)
```

and:

```swift
let identifiers = outputs
    .map(\.identifier)
    .sorted()
```

The exact indentation width and line-length limit belong to project
configuration.

Do not hard-code a universal:

```text
4 spaces
120 columns
```

rule in this generic skill.

## Control flow formatting

Keep control flow visually aligned with its logical structure.

When conditions become complex, place semantic clauses on separate lines when
that improves readability.

For example:

```swift
guard
    isConfigured,
    !isInterrupted,
    status == .idle
else {
    return
}
```

A short condition does not need expansion merely for consistency with a large
one elsewhere.

Formatting should reflect complexity rather than manufacture it.

## Collections

Use multiline collection formatting when the collection no longer reads
clearly on one line.

For example:

```swift
let outputs = [
    .photo(photoOutput),
    .record(movieFileRecorder),
]
```

Whether trailing commas are required is a formatter or project-policy decision.

Do not impose them universally when the repository has no such rule.

## Attributes and property wrappers

Keep attributes visually associated with the declaration they modify.

Parameterized or multiple attributes often benefit from their own lines:

```swift
@Environment(\.dismiss)
private var dismiss
```

Compact nonparameterized wrappers can remain inline when project formatting
allows it and readability remains good:

```swift
@Published private(set) var status: Status = .idle
```

Do not establish a universal lexical ordering for multiple attributes unless
project tooling requires it.

Compiler requirements always take precedence.

## Imports

Import the modules on which the source intentionally relies.

Do not depend accidentally on transitive imports when the module is directly
part of the source contract.

However, deliberate re-exported APIs can make a transitive module part of an
intentional module boundary.

Import grouping and lexical ordering are project-style decisions.

When the project configures them deterministically, follow that configuration.

Avoid rewriting import groups solely to apply a generic preference.

## Top-level source organization

Organize files so the primary responsibilities remain discoverable.

One primary type per file can be useful, but it is not a universal Swift rule.

Keeping several declarations together can be appropriate when they are:

- tightly coupled
- small supporting declarations
- part of one cohesive concept
- clearer when discovered together

Splitting declarations can be appropriate when a file mixes unrelated owners,
lifecycles, or responsibilities.

Choose the organization that preserves cohesion and discoverability.

Do not split files solely to satisfy an arbitrary declaration count.

## Extensions

Use extensions when they create a meaningful organizational or conformance
boundary.

Common reasons include:

- protocol conformance
- logical responsibility
- framework adaptation
- focused organization of a large type

Do not scatter one type across many extensions or files without a discoverable
reason.

Likewise, do not prohibit extensions merely because all members could fit in the
original declaration.

## Logical member grouping

Organize members according to understandable responsibility.

Possible groups can include:

```text
dependencies
state
configuration
initialization
public operations
private operations
protocol conformances
```

These are examples, not a required universal vocabulary.

Follow the project's existing `MARK` conventions when they exist.

Do not create empty or unnecessary sections merely to satisfy a template.

## Member ordering

Prefer semantic ordering over arbitrary sorting.

Useful ordering signals can include:

1. conceptual relationship
2. lifecycle sequence
3. API discoverability
4. overload grouping
5. protocol conformance
6. alphabetical order when no stronger organization exists

Alphabetical ordering can be useful, but it should not override meaningful
relationships between declarations.

Preserve an existing coherent order when multiple organizations are valid.

## Keep overloads discoverable

Declarations sharing one base name should generally remain close enough that a
reader can discover the complete overload family easily.

For example:

```swift
func configure()
func configure(using configuration: Configuration)
func configure(using configuration: Configuration, options: Options)
```

Do not insert unrelated declarations between overloads without a meaningful
organizational reason.

## Protocol conformances

Keep protocol implementation discoverable.

Depending on project style, this can mean:

- a dedicated extension
- a logical `MARK` section
- grouped witness declarations

Do not force extension-based conformances when the project deliberately keeps
small conformances inside the primary declaration.

The important property is discoverability and coherent responsibility.

## Comments

Use comments primarily to explain reasoning, constraints, workarounds, or
non-obvious behavior.

Prefer:

```swift
// Revalidate after suspension because another request can replace the active
// generation while this operation is awaiting the network.
```

over:

```swift
// Check generation.
guard generation == activeGeneration else {
    return
}
```

Comments should complement the code rather than narrate it.

Use the Swift documentation skill when the comment describes a declaration
contract rather than implementation reasoning.

## Avoid style-only abstraction

Do not extract methods, types, extensions, or wrappers merely to satisfy
formatting preferences.

Extraction should improve a real boundary such as:

- responsibility
- readability
- reuse
- testability
- lifecycle ownership
- control-flow comprehension

A substantial closure containing branching, state transitions, or error
handling may benefit from extraction.

Do not impose a fixed closure line-count rule.

## Style and compatibility

Renaming or restructuring a supported consumer-facing declaration can have
compatibility consequences.

Before renaming:

- establish the consumer boundary
- identify affected call sites
- determine whether source compatibility matters
- preserve migration when project policy requires it

Do not treat a public API rename as a zero-cost style correction.

Use the Swift API-design skill for compatibility-sensitive changes.

## Generated and externally controlled code

Do not apply ordinary style rules mechanically to:

- generated source
- vendored source
- dependency checkouts
- generated interfaces
- interoperability-generated declarations
- code whose format is externally specified

Change the generator or source of truth when the project owns it and the task
requires a systematic style change.

Do not repeatedly hand-edit generated output that will be overwritten.

## Avoid formatting-only noise

When solving behavioral problems, keep stylistic edits proportionate to the
change.

Do not combine an unrelated style cleanup with a functional fix unless:

- the cleanup is required for deterministic tooling
- the existing layout prevents a safe change
- the task explicitly includes cleanup

This improves reviewability and makes behavioral diffs easier to reason about.

## Review style with evidence

When this skill is used during review:

- do not report deterministic formatter or linter diagnostics as independent AI
  findings when the tooling already reports them
- do not report subjective alternatives as defects
- do not report unrelated legacy style
- do not request large formatting rewrites around a small behavioral change
- consolidate repeated instances of one deterministic issue when the review
  contract expects findings
- treat style as blocking only when project policy or concrete impact justifies
  that classification

The code-review skill remains responsible for finding scope, severity,
confidence, and output format.

This skill provides Swift-specific style evidence only.

## Use with other skills

Examples:

```text
Implement Swift code
→ languages/swift
→ languages/swift/style
→ project guidance
```

```text
Review Swift naming change
→ code-review-diff
→ languages/swift
→ languages/swift/style
→ project guidance
```

```text
Review public Swift API rename
→ code-review-diff
→ languages/swift
→ languages/swift/style
→ languages/swift/api-design
→ project guidance
```

```text
Document and rename public Swift API
→ languages/swift
→ languages/swift/style
→ languages/swift/api-design
→ languages/swift/documentation
→ project guidance
```

When another skill defines the workflow, output contract, severity model,
validation strategy, or change methodology, preserve that contract and use this
skill only as specialized Swift style guidance.

## Validation

When execution tools are available, prefer the project's configured tools.

Depending on the repository, relevant checks may include:

- SwiftFormat
- SwiftLint
- Swift compilation
- source-generation checks
- project-specific formatting scripts

Use lint/check mode when the task should not modify source.

Use formatting/fix mode only when modification is part of the task.

Restrict automated changes to the intended scope unless the user explicitly
requests broader formatting.

Do not claim formatting or linting passed unless the corresponding check was
executed successfully.