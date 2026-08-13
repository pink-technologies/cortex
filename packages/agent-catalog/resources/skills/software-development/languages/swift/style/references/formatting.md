# Swift Formatting

Use this reference when Swift implementation, refactoring, or review materially
affects indentation, line wrapping, declaration layout, function calls,
collections, control flow, closures, attributes, modifiers, punctuation, blank
lines, comments, conditional compilation, or formatter-driven source changes.

This reference focuses on **keeping Swift source predictable and easy to scan
without allowing formatting work to obscure behavior, ownership, API intent, or
the actual change being made**.

Use:

- `naming.md` for identifier semantics and call-site naming.
- `source-organization.md` for file structure, imports, declaration grouping,
  overload placement, extensions, and `MARK` ownership.
- the Swift documentation skill for DocC content.
- repository formatter and linter configuration for deterministic mechanical
  formatting.
- the generic implementation and code-review skills for change scope and review
  behavior.

Repository formatter/linter configuration and explicit project instructions take
precedence over fallback formatting choices in this reference.

When the repository does not define a conflicting convention, the source
material behind this skill uses:

```text
indentation: 2 spaces
line length: 120 columns
```

Treat those as fallback conventions, not universal Swift language requirements.

## Formatting baseline

### SWIFT-STYLE-FMT-001 — Formatting should improve scanning without hiding behavior

Formatting exists to make:

- ownership
- control flow
- declaration boundaries
- state transitions
- argument roles
- logical sections

easy to recognize.

Do not reformat code merely to make it visually different.

A formatting change should either:

```text
follow deterministic project configuration
```

or:

```text
materially improve readability within an allowed choice
```

## Deterministic configuration

### SWIFT-STYLE-FMT-010 — Let repository tooling own deterministic formatting

When the repository contains formatting or lint configuration such as:

```text
.swiftformat
.swiftlint.yml
```

or equivalent project tooling, treat it as the executable source of truth for
mechanical rules it represents.

Examples include:

- indentation width
- line length
- modifier order
- import ordering
- trailing commas
- whitespace
- wrapping

Do not invent a competing AI formatting convention.

If written project guidance and deterministic configuration disagree, treat that
as configuration/guidance drift.

Do not require contributors to satisfy contradictory rules.

## Scope

### SWIFT-STYLE-FMT-020 — Apply formatting rules to hand-written Swift source

Apply these rules to hand-written:

- production Swift
- test Swift
- example Swift when maintained as project source

Do not automatically apply them to:

- generated source
- generated interfaces
- vendored source
- dependency checkouts
- build products

Generated code should normally be excluded or regenerated through its owning
tool.

## Formatting versus behavior

### SWIFT-STYLE-FMT-030 — Do not expand a behavioral change into a formatting rewrite

When changing behavior, format:

- changed declarations
- directly affected surrounding lines
- the smallest additional scope required by deterministic formatting

Do not reformat an entire file or module as a side effect of a localized
behavioral change.

Formatting migrations should be separate when their scope is substantially
larger than the behavior being changed.

## Preserve compliant layout

### SWIFT-STYLE-FMT-040 — Preserve existing layout when several forms are valid

If existing code:

- complies with project rules
- remains readable
- does not become misleading after the change

preserve it.

Do not churn between equally valid layouts.

For example, do not collapse a deliberately multiline call merely because one
parameter was removed and the call now happens to fit on one line.

Likewise, do not expand a short declaration only to visually match a neighboring
multiline declaration.

## Statements

### SWIFT-STYLE-FMT-050 — Use one statement per line

Prefer:

```swift
let session = CameraSession()
session.start()
```

Avoid:

```swift
let session = CameraSession(); session.start()
```

Independent operations should remain visually distinct.

## Semicolons

### SWIFT-STYLE-FMT-060 — Do not use semicolons to terminate or combine statements

Avoid:

```swift
prepare(); start()
```

Prefer:

```swift
prepare()
start()
```

Semicolons inside strings or comments are unrelated to this rule.

## Property declarations

### SWIFT-STYLE-FMT-070 — Keep stored and computed properties on separate declaration lines

Prefer:

```swift
private let recorder: MovieFileRecorder
private let session: CameraSession
```

Avoid:

```swift
private let recorder: MovieFileRecorder, session: CameraSession
```

Separate declarations improve scanning and future modification.

## Horizontal alignment

### SWIFT-STYLE-FMT-080 — Do not add whitespace merely to align declarations into columns

Prefer:

```swift
let identifier = UUID()
let status = Status.idle
```

Avoid:

```swift
let identifier = UUID()
let status     = Status.idle
```

Likewise, do not horizontally align:

- `=`
- `:`
- inline comments
- property names
- values

Column alignment causes noisy diffs when one declaration changes length.

## Trailing whitespace

### SWIFT-STYLE-FMT-090 — Do not leave trailing spaces or tabs

Source lines should end with meaningful content or the newline itself.

Prefer deterministic tooling to enforce this.

## File termination

### SWIFT-STYLE-FMT-100 — End source files with one newline

Hand-written Swift files should end with one newline unless repository tooling
defines another requirement.

Do not create multiple blank lines at the end of a file.

## Indentation

### SWIFT-STYLE-FMT-110 — Use spaces rather than tabs unless project configuration says otherwise

The source convention underlying this skill uses spaces for indentation.

If repository configuration defines indentation explicitly, follow it.

Do not mix tabs and spaces to achieve visual alignment.

## Indentation width

### SWIFT-STYLE-FMT-120 — Use the repository's configured indentation width consistently

When no project-specific convention exists, use the fallback convention:

```text
2 spaces per indentation level
```

Example:

```swift
final class Recorder {
  private var status: Status = .idle

  func start() {
    status = .running
  }
}
```

Do not manually use different widths for different constructs.

## Continuation indentation

### SWIFT-STYLE-FMT-130 — Indent continuation lines one logical level

Wrapped:

- arguments
- parameters
- collection elements
- conditions
- generic requirements
- closure contents

should use a predictable continuation indentation.

Prefer:

```swift
let value = makeValue(
  first: first,
  second: second
)
```

over manually aligning values to an opening parenthesis with arbitrary spaces.

## Closing delimiters

### SWIFT-STYLE-FMT-140 — Align multiline closing delimiters with the construct that opened them

Example:

```swift
let value = makeValue(
  first: first,
  second: second
)
```

Apply the same principle to:

```text
)
]
}
```

when they close a multiline construct.

## Switch indentation

### SWIFT-STYLE-FMT-150 — Keep `case` and `default` aligned with `switch`

Prefer:

```swift
switch status {
case .idle:
  prepare()

case .running:
  stop()
}
```

The case body uses one additional indentation level.

Do not indent case labels as though they were ordinary statements inside the
switch body.

## Nested declarations

### SWIFT-STYLE-FMT-160 — Indent nested types and extension members normally

Declarations inside:

- classes
- structs
- enums
- protocols
- extensions

use the same ordinary indentation model.

Do not introduce special visual indentation solely because a declaration occurs
inside an extension.

## Line length

### SWIFT-STYLE-FMT-170 — Follow the repository's configured line limit

When the repository defines a maximum line length, use it.

When no stronger project rule exists, the fallback convention from the source
material is:

```text
120 columns
```

Exceptions should be narrow and based on content that cannot reasonably be
split without changing meaning, such as:

- intentionally indivisible URLs
- exact compiler-generated fixture values
- exact string literals whose contents are the behavior under test

Do not use an exception merely to avoid wrapping a normal declaration or call.

## Semantic wrapping

### SWIFT-STYLE-FMT-180 — Wrap at semantic boundaries

Prefer wrapping:

- between parameters
- between arguments
- between generic requirements
- before chained operations
- between Boolean clauses
- between collection elements

Do not split short identifiers, argument labels, or type names arbitrarily.

Formatting should preserve the visible semantic units of the expression.

## Multiline parameters

### SWIFT-STYLE-FMT-190 — Put each parameter on its own line once a declaration becomes multiline

Prefer:

```swift
func configure(
  session: CameraSession,
  recorder: MovieFileRecorder,
  photoOutput: PhotoOutput
) {
  // ...
}
```

Avoid:

```swift
func configure(session: CameraSession,
  recorder: MovieFileRecorder, photoOutput: PhotoOutput) {
  // ...
}
```

Do not keep multiple parameters on the opening or closing line once the
declaration has adopted multiline layout.

## Multiline arguments

### SWIFT-STYLE-FMT-200 — Put each argument on its own line once a call becomes multiline

Prefer:

```swift
let cameraInput = try CameraInput(
  descriptor: cameraDeviceDescriptor,
  outputs: outputs
)
```

The same layout principle applies to method calls and initializer calls.

## Opening parenthesis

### SWIFT-STYLE-FMT-210 — Keep the opening parenthesis with the declaration or call name

Prefer:

```swift
func configure(
  session: CameraSession
)
```

Avoid:

```swift
func configure
(
  session: CameraSession
)
```

The base name and invocation/declaration syntax belong together.

## Async, throws, and return type

### SWIFT-STYLE-FMT-220 — Keep completion modifiers and return type with the closing parameter list when readable

Prefer:

```swift
func capture(
  using output: PhotoOutput
) async throws -> CapturedPhoto {
  // ...
}
```

when the closing line fits the configured line limit.

Do not create additional line breaks solely for visual symmetry.

## Generic constraints

### SWIFT-STYLE-FMT-230 — Format multiline generic requirements consistently

Straightforward constraints can remain with the generic parameter when they are
easy to read:

```swift
func serializing<Value: Decodable & Sendable>(
  response: HTTPResponse
) async throws -> Response<Value, NetworkingError> {
  // ...
}
```

For more complex relationships, a `where` clause can improve clarity:

```swift
func process<Input, Output>(
  _ input: Input
) -> Output
where
  Input.Element == Output.Element,
  Output: Sendable
{
  // ...
}
```

When a `where` clause becomes multiline, put each meaningful requirement on its
own line.

Do not use line wrapping to redesign an API whose generic structure itself is
unnecessarily complicated.

## Avoid symmetry wrapping

### SWIFT-STYLE-FMT-240 — Do not wrap short code merely to match nearby multiline code

If this is readable and within the configured limit:

```swift
private let microphone = MicrophoneInput.default
```

keep it compact.

Formatting should respond to readability and constraints, not visual symmetry.

## Initializers

### SWIFT-STYLE-FMT-250 — Format multiline initializers like other declarations

Example:

```swift
init(
  audioSession: AudioSession = .shared,
  permissionRequester: DevicePermissionRequester
) {
  self.audioSession = audioSession
  self.permissionRequester = permissionRequester
}
```

Do not add a blank line immediately inside the initializer body without a
logical reason.

## Access control

### SWIFT-STYLE-FMT-260 — Keep access control attached to the declaration

Prefer:

```swift
public private(set) var status: Status
private(set) var result: Result?
```

Do not represent access control through comments, spacing, or naming.

Modifier ordering should follow deterministic project configuration when
defined.

## Conformance lists

### SWIFT-STYLE-FMT-270 — Keep short inheritance and conformance lists compact

A short readable list can remain on one line.

Wrap when:

- it exceeds the configured line limit
- attributes make the declaration difficult to scan
- generic constraints substantially increase complexity

Do not expand a short list automatically.

## Overloads

### SWIFT-STYLE-FMT-280 — Do not interrupt overload families with formatting sections

Related overloads should remain visually contiguous.

Source ownership of overload grouping belongs to `source-organization.md`; this
rule prevents formatting constructs such as `MARK` or unrelated whitespace from
breaking the family apart.

## Computed properties

### SWIFT-STYLE-FMT-290 — Keep computed-property braces with the declaration

Prefer:

```swift
var isRecording: Bool {
  status == .recording
}
```

For explicit accessors:

```swift
var value: Value {
  get {
    storage.value
  }
  set {
    storage.value = newValue
  }
}
```

Do not introduce an explicit `get` solely for formatting when the property is
read-only and ordinary Swift shorthand is clearer.

## Chained expressions

### SWIFT-STYLE-FMT-300 — Use leading-dot layout for multiline chains

Prefer:

```swift
let outputIdentifiers = outputs
  .values
  .map(\.storage.identifier)
  .sorted()
```

Keep the base expression on the first line.

Do not place the dot at the end of the preceding line:

```swift
outputs.
  values.
  sorted()
```

unless repository configuration explicitly defines a different chain style.

## Chain wrapping

### SWIFT-STYLE-FMT-310 — Keep a chain compact until wrapping improves readability or satisfies the line limit

A short chain can stay on one line.

Once a chain is meaningfully multiline, use a consistent leading-dot layout.

Do not expand every two-member chain mechanically.

## Nested calls

### SWIFT-STYLE-FMT-320 — Wrap nested calls from the outside inward

First make the outer operation readable.

Then expand a nested value only when that nested expression independently needs
multiline layout.

Avoid unnecessary vertical expansion of short nested expressions.

## Argument labels

### SWIFT-STYLE-FMT-330 — Keep an argument label attached to its value

Avoid:

```swift
perform(
  destination:
    destination
)
```

for an ordinary short value.

A multiline closure or collection may naturally begin after the label if its own
layout requires it.

## Key paths

### SWIFT-STYLE-FMT-340 — Keep key-path syntax compact

Prefer:

```swift
map(\.identifier)
```

Do not insert spaces inside the key path.

## Collection literals

### SWIFT-STYLE-FMT-350 — Use multiline layout for nontrivial collections

A collection should become multiline when:

- it contains several nontrivial entries
- an entry is already multiline
- the expression exceeds the configured line limit
- multiline presentation clarifies configuration roles

Do not expand small obvious literals without a readability reason.

## Trailing commas in collections

### SWIFT-STYLE-FMT-360 — Follow repository configuration for multiline trailing commas

The source convention underlying this skill requires trailing commas for
multiline arrays and dictionaries:

```swift
let outputs: [Output] = [
  .photo(photoOutput),
  .record(movieRecorder),
]
```

```swift
let metadata: [String: String] = [
  "source": "camera",
  "type": "inspection",
]
```

If project formatter configuration defines another policy, follow it.

## Parameter-list commas

### SWIFT-STYLE-FMT-370 — Do not infer collection trailing-comma policy applies to parameters

A project may require trailing commas in multiline collection literals without
requiring one after the final:

- function parameter
- call argument

Treat those as separate formatting rules.

Follow deterministic repository configuration.

## Empty collections

### SWIFT-STYLE-FMT-380 — Keep empty collection literals compact

Prefer:

```swift
[]
[:]
```

Do not expand an empty literal into multiline syntax.

## Dictionary colons

### SWIFT-STYLE-FMT-390 — Keep dictionary colons attached to keys

Prefer:

```swift
"status": "running"
```

Use no space before the colon and one space after it.

## Collection ordering

### SWIFT-STYLE-FMT-400 — Do not reorder semantically meaningful collection elements for formatting

Ordering may represent:

- priority
- UI presentation
- state transitions
- fallback sequence
- execution precedence

Formatting is not a reason to alter such order.

Only sort when ordering is semantically irrelevant and project convention
requires or benefits from it.

## Braces

### SWIFT-STYLE-FMT-410 — Keep opening braces on the declaration or control-flow line

Prefer:

```swift
if isReady {
  start()
}
```

Apply the same layout to:

- `guard`
- `switch`
- `for`
- `while`
- `do`
- `catch`
- functions
- closures
- types

Avoid placing an opening brace alone on the next line unless the repository
explicitly uses that style.

## `else` and `catch`

### SWIFT-STYLE-FMT-420 — Keep `else` and `catch` with the preceding closing brace

Prefer:

```swift
if isReady {
  start()
} else {
  prepare()
}
```

and:

```swift
do {
  try start()
} catch {
  handle(error)
}
```

## Multiline conditions

### SWIFT-STYLE-FMT-430 — Expand multiline conditions by logical clause

Prefer:

```swift
guard
  isConfigured,
  !isInterrupted,
  status == .idle
else {
  return
}
```

Avoid horizontal alignment through arbitrary spaces.

Each condition remains one semantic unit.

## Simple guards

### SWIFT-STYLE-FMT-440 — Keep short guards compact

Prefer:

```swift
guard let telemetryManager else {
  return
}
```

Do not expand a single simple condition solely because neighboring guards are
multiline.

## Switch cases

### SWIFT-STYLE-FMT-450 — Use blank lines between nontrivial switch cases when they improve scanning

Separate cases when their bodies contain:

- multiple statements
- substantially different logical work

Short related cases can remain adjacent when that is easier to scan.

Do not add blank lines inside one case's tightly related statements merely to
create vertical spacing.

## Pattern matching

### SWIFT-STYLE-FMT-460 — Format `if case` and `guard case` as ordinary conditions

Do not add special parentheses or extra indentation solely because pattern
matching is involved.

Let the expression shape determine wrapping.

## Parentheses in control flow

### SWIFT-STYLE-FMT-470 — Avoid unnecessary parentheses around Swift conditions

Prefer:

```swift
if isReady {
```

over:

```swift
if (isReady) {
```

unless parentheses are required by the expression itself.

## Closure capture lists

### SWIFT-STYLE-FMT-480 — Keep capture lists with the opening closure

Prefer:

```swift
Task { [weak self] in
  await self?.refresh()
}
```

Do not visually detach the capture list from the closure it configures.

## Closure signatures

### SWIFT-STYLE-FMT-490 — Keep `in` with the closure signature when readable

The closure's:

- parameter list
- return type
- capture list where relevant
- `in`

should form a recognizable signature.

Do not place `in` on an arbitrary separate line merely for symmetry.

## Trailing closures

### SWIFT-STYLE-FMT-500 — Use trailing-closure syntax when it clarifies the call

A final closure argument can use ordinary Swift trailing-closure syntax when that
produces the clearest call site.

Do not remove labels from multiple callback roles merely to maximize trailing
closure usage.

If labels distinguish concepts such as:

```text
onSuccess
onFailure
onProgress
```

preserve their clarity according to the API and repository conventions.

## Empty closures

### SWIFT-STYLE-FMT-510 — Keep intentionally empty closures compact

Use:

```swift
{ }
```

for a deliberately empty closure when consistent with repository tooling.

Example:

```swift
func onDismiss(
  _ action: @escaping () -> Void = { }
)
```

Do not expand an empty closure into an empty multiline block without a reason.

## Complex inline closures

### SWIFT-STYLE-FMT-520 — Do not hide substantial behavior inside an inline closure

When an inline closure accumulates significant:

- branching
- state transitions
- error handling
- lifecycle behavior

consider extracting a named operation.

This is a readability boundary, not a fixed line-count rule.

Do not extract every closure merely because it spans several lines.

## Parameterized attributes

### SWIFT-STYLE-FMT-530 — Put parameterized attributes on their own line

Prefer:

```swift
@available(iOS 17.0, *)
public func beginObservation() {
  // ...
}
```

Do not crowd parameterized attributes onto a complex declaration line.

## Attribute ordering

### SWIFT-STYLE-FMT-540 — Follow deterministic project ordering for multiple attributes

The source convention orders multiple attributes lexicographically except where
the compiler requires another relationship.

If formatter configuration defines attribute ordering, follow it.

Do not reorder attributes manually against project tooling.

## Attribute indentation

### SWIFT-STYLE-FMT-550 — Align an attribute with the declaration it modifies

Example:

```swift
@MainActor
public final class CameraViewModel {
}
```

Do not indent the attribute differently from its declaration.

## Non-parameterized attributes

### SWIFT-STYLE-FMT-560 — Keep non-parameterized attributes inline only when readability and project style permit

A short declaration may allow:

```swift
@MainActor final class Model {}
```

if repository convention accepts it.

When the declaration becomes difficult to scan, place the attribute on its own
line.

Do not force one form solely for visual consistency when tooling permits both.

## Property wrappers

### SWIFT-STYLE-FMT-570 — Keep property wrappers attached to their properties

Prefer:

```swift
@Published private(set) var status: Status = .idle
```

Do not insert a blank line or unrelated comment between the wrapper and the
property.

Place the wrapper on its own line when:

- several attributes apply
- line length requires it
- project style requires it

## Modifiers

### SWIFT-STYLE-FMT-580 — Keep declaration modifiers in conventional project order

Modifier ordering can include:

- access control
- setter restriction
- ownership modifiers
- declaration modifiers
- concurrency modifiers

Let formatter configuration own exact deterministic order when configured.

Do not use manual whitespace to align modifiers.

## Binary operators

### SWIFT-STYLE-FMT-590 — Use ordinary spacing around binary operators

Prefer:

```swift
let duration = endTime - startTime
```

Do not add spaces around ordinary prefix or postfix operators.

Follow project formatter behavior for specialized custom operators.

## Type-annotation colons

### SWIFT-STYLE-FMT-600 — Use no space before a type-annotation colon and one after

Prefer:

```swift
let status: Status
```

Avoid:

```swift
let status :Status
```

## Delimiters

### SWIFT-STYLE-FMT-610 — Do not add spaces inside delimiters

Prefer:

```swift
capture(photo)
values[index]
[String: Value]
```

An intentionally empty closure:

```swift
{ }
```

can follow the repository's specific empty-closure convention.

## Commas

### SWIFT-STYLE-FMT-620 — Use one space after a comma and none before it

Prefer:

```swift
configure(first: first, second: second)
```

Avoid:

```swift
configure(first: first ,second: second)
```

## Range operators

### SWIFT-STYLE-FMT-630 — Keep range operators compact

Prefer:

```swift
0..<count
```

Do not add surrounding whitespace unless a custom expression genuinely requires
a different interpretation.

## Optional and metatype punctuation

### SWIFT-STYLE-FMT-640 — Keep optional and metatype punctuation attached

Prefer:

```text
Value?
Value!
Value.Type
Value.Protocol
```

Do not add spaces before those suffixes.

## Blank lines

### SWIFT-STYLE-FMT-650 — Use at most one consecutive blank line

Avoid multiple empty lines used solely as visual padding.

Use one blank line to express a logical section boundary.

## Logical sections

### SWIFT-STYLE-FMT-660 — Separate meaningful declaration groups with one blank line

Typical boundaries can include:

- property groups and initializers
- initializers and methods
- distinct method families
- top-level type declarations
- import groups defined by project convention

Do not create vertical whitespace inside a tightly related operation.

## `MARK` spacing

### SWIFT-STYLE-FMT-670 — Surround `MARK` sections consistently

When the repository uses `MARK` sections, keep one consistent separation around
them according to project style.

Example using the fallback source convention:

```swift
final class CameraController {

  // MARK: - Private Properties

  private let cameraSession: CameraSession

  // MARK: - Initializer

  init(cameraSession: CameraSession) {
    self.cameraSession = cameraSession
  }
}
```

The exact `MARK` vocabulary and ownership belong to `source-organization.md`.

## Function-body boundaries

### SWIFT-STYLE-FMT-680 — Do not place an empty line immediately after an opening function brace

Prefer:

```swift
func start() {
  prepare()
}
```

Avoid:

```swift
func start() {

  prepare()
}
```

unless a highly unusual construct is required by tooling.

## Closing-brace spacing

### SWIFT-STYLE-FMT-690 — Do not leave a blank line immediately before a closing brace

Prefer:

```swift
func start() {
  prepare()
}
```

not:

```swift
func start() {
  prepare()

}
```

## Keep related constructs together

### SWIFT-STYLE-FMT-700 — Do not insert blank lines that split one declaration relationship

Keep together:

- property wrapper and property
- attributes and declaration
- overload family
- short documentation and its declaration
- directly related statements

Whitespace should clarify logical boundaries, not create artificial ones.

## Comments

### SWIFT-STYLE-FMT-710 — Use comments to explain reasoning rather than narrate code

Weak:

```swift
// Set status to running.
status = .running
```

Useful comments explain a non-obvious constraint or reason.

Detailed documentation semantics belong to the Swift documentation skill.

## Inline comments

### SWIFT-STYLE-FMT-720 — Keep inline comments short and consistently separated

The source convention uses two spaces before an end-of-line comment:

```swift
let timeout: TimeInterval = 30  // Server request timeout.
```

Do not horizontally align inline comments across several declarations.

If repository formatter/configuration defines another rule, follow it.

## Substantial comments

### SWIFT-STYLE-FMT-730 — Put substantial reasoning above the relevant code

Prefer:

```swift
// Preserve the previous generation until cleanup finishes so stale work cannot
// clear the replacement operation.
await cleanup()
```

over placing long reasoning at the end of one source line.

## Comment indentation

### SWIFT-STYLE-FMT-740 — Align comments with the code they describe

Comments inside a scope should use the same logical indentation as the
declaration or statement they explain.

Do not place a comment at outer scope when it applies only to one nested
operation.

## DocC layout

### SWIFT-STYLE-FMT-750 — Preserve DocC paragraph structure

A common layout is:

```swift
/// Starts recording media.
///
/// The operation remains active until it completes or is cancelled.
///
/// - Parameter destination: The destination for the recorded media.
/// - Returns: The completed recording.
/// - Throws: An error when recording cannot start or complete.
```

This rule concerns layout only.

Content requirements belong to the Swift documentation skill.

## DocC wrapping

### SWIFT-STYLE-FMT-760 — Wrap documentation without breaking Markdown or DocC constructs

When applying the configured line length, preserve:

- symbol links
- code spans
- URLs
- lists
- directives

Do not split a URL or symbol path merely to satisfy a column limit if doing so
damages the documentation syntax.

## Conditional compilation

### SWIFT-STYLE-FMT-770 — Align conditional-compilation directives with their surrounding scope

At top level:

```swift
#if DEBUG
let diagnosticsEnabled = true
#else
let diagnosticsEnabled = false
#endif
```

Do not add indentation solely because code is inside a conditional compilation
branch.

Inside a type or function, directives align with the surrounding declarations or
statements according to the same principle.

## Conditional branches

### SWIFT-STYLE-FMT-780 — Keep equivalent conditional branches visually parallel when practical

If both branches contain equivalent declarations, use comparable layout.

Do not distort semantically different branches solely to force symmetry.

## Closing compiler directive

### SWIFT-STYLE-FMT-790 — Align `#endif` with the directive that opened the conditional

Do not indent the closing directive differently without a surrounding-scope
reason.

## Preserve member organization

### SWIFT-STYLE-FMT-800 — Formatting should not reorder semantic source structure

A formatter-driven change should preserve, unless another explicit change
requires otherwise:

- `MARK` sections
- member ordering
- property ordering
- overload relationships
- surrounding declaration organization

Formatting is not an architecture migration.

## No equal-layout churn

### SWIFT-STYLE-FMT-810 — Do not switch between equally valid formatting choices without a reason

If both forms comply with project configuration, preserve the existing one
unless the current change makes it misleading or hard to read.

This reduces unnecessary diff noise.

## Dedicated formatting migrations

### SWIFT-STYLE-FMT-820 — Keep repository-wide formatting migrations separate from behavioral changes

When changing the formatter configuration or intentionally reformatting a broad
codebase:

```text
format migration
```

should normally be its own coherent change.

This keeps behavioral review possible.

Do not combine a repository-wide rewrite with unrelated implementation work.

## AI formatting preferences

### SWIFT-STYLE-FMT-830 — Do not rewrite code solely because an agent prefers another valid layout

An agent or reviewer should ground formatting changes in:

- project configuration
- project guidance
- this fallback skill
- a concrete readability problem

Do not create findings such as:

```text
I prefer this closure on another line.
```

when both layouts are compliant and readable.

## SwiftFormat

### SWIFT-STYLE-FMT-840 — Prefer SwiftFormat when the repository uses it

When `.swiftformat` or equivalent SwiftFormat configuration exists, use the
repository configuration.

For review workflows, prefer lint/check behavior that reports drift without
silently rewriting contributor code unless the task explicitly requests
formatting changes.

Do not assume every Swift repository uses SwiftFormat.

## SwiftLint

### SWIFT-STYLE-FMT-850 — Use SwiftLint for configured lint rules rather than generic formatting opinion

When `.swiftlint.yml` exists, its deterministic findings should be treated as
project evidence.

Do not duplicate each SwiftLint warning as an independent AI style finding when
the tool already communicates it adequately.

A semantic review may still identify the underlying root cause when it matters.

## Formatter availability

### SWIFT-STYLE-FMT-860 — Distinguish a formatter that did not run from one that passed

Use result semantics such as:

```text
PASS
FAIL
NOT_RUN
```

when reporting validation.

If SwiftFormat or SwiftLint is unavailable:

```text
NOT_RUN
```

is accurate.

Do not report `PASS`.

Do not infer noncompliance merely because the tool could not execute.

## Changed-scope review

### SWIFT-STYLE-FMT-870 — Report formatting issues introduced or materially affected by the change

Do not flood a focused review with unrelated historical formatting defects.

When one changed declaration causes deterministic whole-file output, attach the
finding to the relevant changed scope and explain the relationship.

## Consolidate repeated violations

### SWIFT-STYLE-FMT-880 — Avoid one review comment per identical formatting defect

When the same formatting problem appears repeatedly:

- rely on formatter output
- or report one representative/root-cause finding

Do not generate dozens of equivalent comments.

## Auto-fixing during review

### SWIFT-STYLE-FMT-890 — Do not silently rewrite contributor code during review

A review agent may:

- report the deterministic check
- identify the affected construct
- provide a minimal suggested correction when useful

It should not silently create a broad formatting rewrite unless implementation
or auto-fix was explicitly requested.

## Formatting severity

### SWIFT-STYLE-FMT-900 — Formatting severity should remain proportional to impact

Formatting is normally lower risk than:

- correctness
- security
- data loss
- concurrency defects
- consumer-breaking API changes

A formatting issue can still be merge-blocking when deterministic project
configuration explicitly requires it.

Do not elevate a cosmetic preference to critical engineering severity.

## Review checklist

When Swift formatting changes, verify when applicable:

- deterministic repository formatter/linter configuration was identified
- project configuration takes precedence over generic fallback values
- hand-written code is distinguished from generated and vendored source
- formatting changes remain within the coherent changed scope
- compliant existing line breaks are preserved
- one statement and one property declaration appear per line
- semicolons are not used as statement separators
- declarations are not horizontally aligned with arbitrary whitespace
- trailing whitespace is absent
- files end according to repository newline convention
- indentation uses the configured width consistently
- continuation lines use logical indentation rather than manual alignment
- switch case labels align with the switch
- multiline closing delimiters align with their opening construct
- line length follows project configuration
- fallback 120-column guidance is used only when no stronger project rule exists
- wrapping happens at semantic boundaries
- multiline parameters and arguments use one item per line under the source
  convention
- opening parentheses stay with declaration/call names
- `async`, `throws`, and return types remain readable with the closing parameter
  list
- multiline generic requirements have consistent structure
- short declarations are not expanded solely for symmetry
- multiline initializers follow ordinary declaration layout
- access control stays attached to declarations
- short conformance lists remain compact when readable
- overload families are not visually interrupted
- computed properties use ordinary Swift accessor layout
- multiline chains use the configured leading-dot style
- nested calls are wrapped from the outside inward
- argument labels are not detached unnecessarily from values
- key paths remain compact
- nontrivial collections use readable multiline layout
- multiline collection trailing commas follow repository configuration
- collection comma rules are not incorrectly applied to parameter lists
- empty collections remain compact
- dictionary colon spacing is consistent
- semantically meaningful collection ordering is preserved
- opening braces remain on the declaration/control-flow line
- `else` and `catch` stay with the preceding closing brace
- multiline conditions are separated by semantic clause
- short guards are not expanded without a reason
- nontrivial switch cases are separated only when it improves scanning
- unnecessary condition parentheses are not introduced
- closure capture lists remain attached to the closure
- closure signatures keep `in` in a readable position
- trailing closures are used only when they improve call-site clarity
- intentionally empty closures remain compact
- substantial behavior is not hidden in an oversized inline closure
- parameterized attributes use readable placement
- attribute ordering follows deterministic tooling where configured
- attributes align with their declarations
- property wrappers remain attached to their properties
- declaration modifier order follows project tooling
- operator, colon, comma, delimiter, range, optional, and metatype punctuation
  spacing is consistent
- no multiple consecutive blank lines are introduced
- logical sections use one intentional separator
- `MARK` spacing follows project convention
- function bodies do not begin with unexplained blank space
- closing braces are not preceded by unnecessary empty lines
- tightly related declarations are not split by formatting whitespace
- inline comments remain short and are not horizontally aligned
- substantial comments remain on their own lines
- DocC layout preserves paragraph and markup structure
- conditional-compilation directives align with surrounding scope
- equivalent conditional branches remain visually coherent
- formatting does not reorder semantic member organization
- equally valid layouts are not churned without reason
- broad formatting migrations remain separate from behavioral changes
- AI review does not invent formatting conventions
- SwiftFormat and SwiftLint are used only when the repository actually configures
  them
- unavailable tooling is reported as `NOT_RUN`, not `PASS`
- formatting review remains focused on changed scope
- repeated deterministic violations are consolidated
- review automation does not silently perform broad auto-fixes
- formatting severity reflects deterministic project requirements and actual
  readability impact

Do not treat two-space indentation, a 120-column limit, leading-dot chains,
trailing commas, SwiftFormat, SwiftLint, or any other mechanical convention as a
universal Swift language requirement. Apply explicit repository configuration
first; use this reference as a fallback and as guidance for preserving readable,
low-noise source structure.