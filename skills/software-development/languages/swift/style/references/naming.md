# Swift Naming

Use this reference when Swift implementation, refactoring, or review materially
affects type names, methods, properties, variables, parameters, Boolean APIs,
initializers, static values, delegates, abbreviations, or other identifier
semantics.

This reference focuses on **making Swift names communicate domain role and read
naturally at the call site**.

Use:

- Apple's Swift API Design Guidelines as the baseline naming model.
- the Swift API-design skill when a rename affects supported consumer API.
- the Swift documentation skill when terminology changes require DocC updates.
- `source-organization.md` for file naming, imports, declaration placement, and
  member organization.
- `formatting.md` for declaration layout rather than identifier semantics.

Project-specific terminology, established domain vocabulary, interoperability
requirements, generated API contracts, and repository instructions take
precedence over this generic guidance.

## Naming baseline

### SWIFT-STYLE-NAME-001 — Optimize names for the call site

Judge a name together with the declaration and representative usage.

Prefer names that form clear Swift expressions without requiring knowledge of
the implementation.

For example:

```swift
try await session.startRecording()
```

should communicate the operation more clearly than a name based on an internal
engine or framework abstraction.

Do not judge names in isolation from:

- argument labels
- return type
- declaring type
- surrounding domain vocabulary

The complete call site is the naming unit.

## Role-based names

### SWIFT-STYLE-NAME-010 — Name declarations for the role they perform

Prefer domain responsibility over implementation mechanism.

A type should normally describe:

```text
what it represents
```

or:

```text
what responsibility it owns
```

rather than the framework class, storage mechanism, or helper it wraps.

Avoid vague standalone roles such as:

```text
Manager
Helper
Handler
Data
Info
```

when the complete name does not communicate a concrete responsibility.

A generic word is acceptable when its surrounding domain gives it precise
meaning.

Do not rename an accurate established domain type merely because a more
specific synonym can be invented.

## Avoid redundant words

### SWIFT-STYLE-NAME-020 — Omit words already communicated by context

Do not repeat the declaring type unnecessarily.

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

The surrounding type already communicates `Session`.

Likewise, avoid repeating a parameter's obvious type or role when the complete
call remains clear without it.

## Domain vocabulary

### SWIFT-STYLE-NAME-030 — Use one stable term for one domain concept

When the repository already calls a concept:

```text
upload
recording
session
status
destination
```

preserve that vocabulary across related APIs.

Do not alternate between several approximate synonyms merely for variety.

For example, avoid representing one concept inconsistently as:

```text
task
job
request
operation
```

unless those terms intentionally represent different domain concepts.

Naming should reinforce architecture rather than obscure it.

## Casing

### SWIFT-STYLE-NAME-040 — Use Swift casing consistently

Use `UpperCamelCase` for types.

```swift
RecordingSession
UploadTask
MediaLibrary
```

Use `lowerCamelCase` for methods, properties, variables, parameters, and global
values.

```swift
startRecording()
recordingDuration
uploadTask
```

Do not introduce PascalCase methods:

```swift
FileUploadRequestBuilder(...)
```

Method names should read like Swift operations rather than type names.

## Abbreviations

### SWIFT-STYLE-NAME-050 — Avoid unnecessary abbreviations

Use established platform or domain abbreviations when they are already
well-understood, such as:

```text
URL
ID
SDK
API
```

Spell out uncommon abbreviations unless the abbreviation is an established
project or product term.

Do not shorten names merely to reduce identifier length.

Clarity takes precedence over brevity.

## Established abbreviations

### SWIFT-STYLE-NAME-060 — Preserve established capitalization

Once a project or platform establishes spelling for an abbreviation, use it
consistently.

Avoid variants such as:

```text
Sdk
SDK
```

for the same concept within one supported naming surface unless an external
compatibility constraint requires the existing spelling.

Do not perform casing migrations casually on supported API.

Use the Swift API-design compatibility guidance when existing consumers can be
affected.

## Excessive prefixes

### SWIFT-STYLE-NAME-070 — Do not repeat module or product context unnecessarily

Avoid long names whose prefixes duplicate context already supplied by:

- module
- enclosing type
- namespace
- subsystem

For example, if a module already establishes the media domain, prefer a concise
domain name when possible over repeatedly encoding the complete product/module
hierarchy into every declaration.

Do not remove an established product prefix blindly.

Prefixes can still be required for:

- compatibility
- Objective-C interoperability
- collision avoidance
- explicit product naming

Evaluate the actual consumer context before changing them.

## Access control

### SWIFT-STYLE-NAME-080 — Do not use naming conventions as access control

Use Swift access control:

```text
private
fileprivate
internal
package
public
```

or the project's established SPI mechanism to represent visibility.

Do not expose a declaration and attempt to hide it through names such as:

```text
_internalThing
InternalThing
_privateHelper
```

when Swift access control can express the actual boundary.

Naming communicates semantics.

Access control communicates visibility.

## Leading underscores

### SWIFT-STYLE-NAME-090 — Do not introduce leading underscores as a generic privacy convention

A leading underscore should not replace:

```swift
private
```

or:

```swift
fileprivate
```

Use underscore naming only when a concrete language, generated-code,
interoperability, or project-specific requirement establishes it.

Do not infer public support or internal privacy from an underscore alone.

## Identifiers

### SWIFT-STYLE-NAME-100 — Prefer ASCII identifiers by default

Use ordinary ASCII identifiers unless a Unicode identifier has:

- legitimate domain meaning
- clear readability
- team-understood semantics

For example, mathematical notation may justify a domain-specific Unicode
identifier.

Emoji may be perfectly valid as data:

```swift
let smile = "😊"
```

but should not be used as an identifier merely because Swift permits it.

## Methods

### SWIFT-STYLE-NAME-110 — Name operations with verb phrases

Methods that perform actions should communicate the action.

Examples:

```swift
func startRecording()
func capturePhoto()
func resetZoom()
```

The verb should describe the domain effect.

Avoid names based only on generic implementation activity such as:

```text
doWork
handle
performAction
```

when a specific domain verb exists.

## Avoid Java-style getters

### SWIFT-STYLE-NAME-120 — Do not add `get` prefixes that contribute no semantic meaning

Avoid APIs such as:

```swift
func getById(_ id: ID)
func getUploadRequests(...)
```

when `get` merely means:

```text
return something
```

Prefer the domain operation already established by the API, for example:

```swift
func fetch(id: ID) async throws -> Media?
func search(_ query: MediaSearchQuery) async throws -> [Media]
```

when those verbs accurately represent the behavior.

Do not mechanically replace every `get` with `fetch`.

A rename should describe the actual operation.

## Properties

### SWIFT-STYLE-NAME-130 — Name properties as noun phrases or state assertions

Values and state should normally read as values:

```swift
var recordingDuration: TimeInterval
var zoomFactorRange: ClosedRange<CGFloat>
var status: Status
```

Avoid property names that sound like imperative operations.

The distinction should remain clear:

```text
method
→ does something

property
→ represents something
```

## Boolean properties

### SWIFT-STYLE-NAME-140 — Make Boolean APIs read as assertions

Choose a prefix that expresses the actual predicate.

Common forms include:

```text
is
has
can
should
allows
supports
needs
```

Examples:

```swift
var isRecording: Bool
var hasTorch: Bool
var canCapturePhoto: Bool
var supportsMulticamera: Bool
```

Do not enforce one Boolean prefix independently of the meaning.

For example:

```text
isCapturePhoto
```

is not better simply because it begins with `is`.

Read the complete assertion.

## Boolean methods

### SWIFT-STYLE-NAME-150 — Name Boolean-returning operations according to the question they answer

A method returning `Bool` should read naturally as a predicate or policy
decision.

This is especially important for delegate and policy APIs.

Do not use names whose return meaning can only be understood by inspecting the
implementation.

## Initializers

### SWIFT-STYLE-NAME-160 — Keep initializer parameter names aligned with stored concepts

Prefer:

```swift
init(session: CameraSession) {
    self.session = session
}
```

Do not rename the argument merely to avoid using `self`:

```swift
init(session otherSession: CameraSession) {
    session = otherSession
}
```

Explicit `self` makes the assignment clear while preserving the natural
parameter name.

## Static and class values

### SWIFT-STYLE-NAME-170 — Do not suffix same-type static instances with the declaring type

Prefer:

```swift
URLSession.shared
Configuration.default
```

over:

```swift
URLSession.sharedSession
Configuration.defaultConfiguration
```

when the suffix merely repeats the type.

Names such as:

```text
shared
default
```

are common but not mandatory.

Choose the role that accurately describes the instance.

## Global values

### SWIFT-STYLE-NAME-180 — Use lower camel case for global values

Prefer:

```swift
let secondsPerMinute = 60
```

Avoid naming conventions such as:

```swift
let SecondsPerMinute = 60
let kSecondsPerMinute = 60
let gSecondsPerMinute = 60
let SECONDS_PER_MINUTE = 60
```

Do not use Hungarian-style prefixes to encode declaration kind or scope.

Swift syntax and access control already communicate those properties.

## Argument labels

### SWIFT-STYLE-NAME-190 — Use argument labels to make calls read naturally

Evaluate labels as part of the complete call.

Prefer labels that communicate the role of each argument.

For example:

```swift
move(from: source, to: destination)
```

can communicate direction directly.

Avoid filler labels when they do not improve grammar or understanding.

The goal is not:

```text
every parameter must have a label
```

but:

```text
the call site should communicate the operation clearly
```

## Directional labels

### SWIFT-STYLE-NAME-200 — Keep directional terminology consistent

When an API uses directional concepts, prefer consistent pairs such as:

```text
from / to
```

rather than changing equivalent operations between several unrelated terms.

Consistency across related overloads and operations improves discoverability.

## Parameter order

### SWIFT-STYLE-NAME-210 — Put the values defining the operation before optional context when practical

When an operation has:

```text
primary domain inputs
+
optional context/metadata
```

prefer ordering that makes the primary operation visible first.

Platform protocol requirements or established APIs may dictate another order.

Do not reorder supported parameters merely for stylistic consistency without
considering compatibility.

## Delegate naming

### SWIFT-STYLE-NAME-220 — Follow Cocoa-style delegate grammar

For delegate-like protocols, including data-source-style contracts:

- pass the source object first
- keep the source argument unlabeled where the established Cocoa-style grammar
  applies
- use event-oriented names for notifications
- use conditional wording for Boolean policy decisions
- use noun phrases and natural prepositions for queried values

Example notification:

```swift
func cameraSessionDidStartRunning(
    _ cameraSession: CameraSession
)
```

Example failure callback:

```swift
func cameraSession(
    _ cameraSession: CameraSession,
    didFailWith error: Error
)
```

The method should read naturally as a sentence describing the source and event.

## Delegate events

### SWIFT-STYLE-NAME-230 — Use event names that describe what occurred

For a Void callback notifying an event, use grammar analogous to:

```text
sourceDidPerform...
sourceWillPerform...
```

according to the actual timing.

Do not call an event `did...` before the event has actually completed if the API
semantics are `will...`.

Naming should agree with lifecycle behavior.

## Delegate policy

### SWIFT-STYLE-NAME-240 — Use conditional grammar for Boolean delegate decisions

A Boolean delegate callback can communicate policy through wording analogous to:

```text
sourceShouldPerform...
```

The name should make the returned Boolean understandable at the call site.

Avoid generic names such as:

```text
check
validate
handle
```

when the method actually asks the delegate for a decision.

## Delegate queries

### SWIFT-STYLE-NAME-250 — Use noun-oriented grammar for queried values

When a delegate provides information rather than receives an event or policy
question, prefer a noun phrase with a natural preposition.

For example:

```swift
func numberOfSections(
    in source: Source
) -> Int
```

or the equivalent domain-specific grammar.

Do not force event-style `did...` wording onto value queries.

## Additional delegate arguments

### SWIFT-STYLE-NAME-260 — Keep additional delegate arguments grammatically connected to the event or query

For example:

```swift
func cameraSession(
    _ cameraSession: CameraSession,
    didFailWith error: Error
)
```

The second label completes the event phrase.

Avoid unrelated labels that make the declaration readable only as a parameter
list rather than a sentence.

## Established callback grammar

### SWIFT-STYLE-NAME-270 — Preserve established naming families

If a module consistently uses a callback family such as:

```text
didFailToSet...
didFailToChange...
```

preserve that grammar unless the API is intentionally being migrated.

Do not rename one member of a family independently because another synonym
sounds preferable.

Consistency is part of API usability.

## Subjective synonyms

### SWIFT-STYLE-NAME-280 — Do not rename accurate identifiers for stylistic preference alone

Do not request changes such as:

```text
load → fetch
manager → coordinator
configuration → options
```

merely because another word is possible.

A rename should improve a concrete problem such as:

- inaccurate domain meaning
- inconsistent vocabulary
- unclear call-site grammar
- wrong architectural role
- collision
- established project convention violation

Do not create diff churn from subjective synonym preferences.

## Existing conventions

### SWIFT-STYLE-NAME-290 — Preserve compliant local terminology

When several names would all be valid, prefer the one consistent with:

- surrounding APIs
- existing domain vocabulary
- platform conventions
- project terminology

Do not impose a new naming dialect on one changed declaration.

## Architecture and naming

### SWIFT-STYLE-NAME-300 — Do not use suffixes to pretend a responsibility exists

Names such as:

```text
Manager
Provider
Controller
Service
Repository
Builder
Task
Session
```

communicate architectural roles only when the type actually performs that role.

Do not rename a structurally confused abstraction and consider the architecture
fixed.

Naming should reveal responsibility, not manufacture it.

Detailed responsibility design belongs to the software-architecture and
API-design skills.

## Public naming

### SWIFT-STYLE-NAME-310 — Treat supported public renames as compatibility changes

Changing a supported declaration from:

```text
oldName
→ newName
```

can break consumer source even when the behavior is identical.

Before applying a rename, determine:

```text
Is this supported consumer API?
Has it shipped?
Does compatibility need to be preserved?
```

Use the Swift API-design compatibility guidance for:

- deprecation
- aliases
- migration
- breaking-release decisions

Do not let a naming cleanup accidentally become an unreviewed API break.

## Internal renames

### SWIFT-STYLE-NAME-320 — Do not require public migration machinery for implementation-only names

When a declaration is truly internal to the implementation boundary, rename it
coherently together with affected call sites.

Do not add:

- deprecated aliases
- compatibility wrappers
- duplicate names

solely because the internal declaration previously existed.

The actual consumer boundary determines compatibility obligations.

## Rename completeness

### SWIFT-STYLE-NAME-330 — Complete semantic renames across the affected scope

When a concept is intentionally renamed, inspect directly affected:

- declarations
- parameters
- properties
- call sites
- tests
- documentation
- examples

Avoid leaving mixed terminology that makes one concept appear to be several
different concepts.

Do not perform unrelated terminology cleanup outside the coherent change.

## Review scope

### SWIFT-STYLE-NAME-340 — Report naming problems only when they are concrete

A review finding should identify a specific issue such as:

```text
method uses PascalCase
Boolean does not read as an assertion
name exposes implementation mechanism
callback grammar contradicts event timing
public rename breaks supported consumers
```

Do not report:

```text
I would call this something else.
```

as a defect.

Naming review should be evidence-based.

## Review checklist

When Swift naming changes, verify when applicable:

- names are evaluated at representative call sites rather than in isolation
- types and values describe domain roles rather than implementation mechanisms
- vague terms are rejected only when the complete name fails to communicate a
  concrete responsibility
- redundant words already supplied by the declaring type are omitted
- one domain concept uses consistent terminology
- types use the project's Swift type casing
- methods, properties, variables, parameters, and globals use the project's
  Swift member/value casing
- PascalCase method names are not introduced
- established abbreviations are used consistently
- uncommon abbreviations are not introduced merely to shorten names
- product/module prefixes are not repeated unnecessarily
- existing compatibility or interoperability prefixes are not removed casually
- naming conventions are not used instead of Swift access control
- leading underscores are not introduced as generic privacy markers
- Unicode identifiers have genuine domain meaning
- operation methods read as verb phrases
- Java-style `get` prefixes are not used when they add no semantic information
- properties read as values or state rather than commands
- Boolean APIs read naturally as assertions
- initializer arguments retain natural names and use explicit `self` for
  assignments
- static instances do not redundantly repeat their declaring type
- global values do not use Hungarian or all-uppercase naming conventions
- argument labels clarify roles and make the complete call grammatical
- directional labels remain consistent across related APIs
- optional context does not obscure the primary operation
- delegate callbacks follow the established source/event/query grammar
- `did`, `will`, and `should` terminology matches actual semantics
- related callback families use consistent grammar
- accurate names are not changed for subjective synonyms
- compliant local terminology is preserved when several choices are valid
- architectural suffixes correspond to actual responsibilities
- supported public renames receive compatibility review
- internal-only renames do not receive unnecessary consumer migration machinery
- intentional renames update the complete affected terminology surface
- review findings identify an objective naming defect rather than personal word
  preference

Do not treat a name as better merely because it is shorter, longer, more
specific, more "Swifty", or preferred by the reviewer. A good Swift name
communicates the correct domain role, reads naturally at the call site, follows
established conventions, and preserves compatibility where required.