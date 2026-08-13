# Swift API Compatibility

Use this reference when a Swift API change materially affects existing
consumers, source compatibility, binary compatibility, ABI, behavioral
compatibility, availability, deprecation, migration, persisted representations,
serialized values, or previously shipped public contracts.

This reference focuses on **preserving or intentionally evolving supported
consumer contracts over time**.

Use:

- `consumer-surface.md` to determine whether the changed declaration is actually
  part of the supported consumer surface.
- `state-and-ownership.md` when lifecycle, identity, ownership, or observable
  state behavior changes.
- `concurrency-and-errors.md` when async, isolation, cancellation, ordering, or
  failure behavior changes.
- `interoperability.md` when Objective-C exposure or mixed-language compatibility
  is involved.
- `resilience.md` for detailed library-evolution, ABI, `@frozen`,
  `@inlinable`, and binary-layout reasoning.
- the Swift documentation skill for deprecation and migration documentation.
- project-specific API-diff or binary-compatibility tooling when configured.

Project-specific versioning policy, supported consumer modules, release history,
library-evolution settings, API baselines, deployment targets, and compatibility
promises take precedence over this generic guidance.

## Compatibility baseline

### SWIFT-API-COMPAT-001 — Determine whether compatibility is actually owed

Before preserving an old API or behavior, establish:

```text
Was this contract available to supported consumers?
```

Relevant evidence can include:

- released versions
- published modules/products
- generated interfaces
- symbol graphs
- API baselines
- release documentation
- package products
- framework distribution
- project instructions

Do not add compatibility layers merely because an implementation existed in a
development branch.

Compatibility should serve a supported consumer, not historical source code.

## Supported versus unreleased API

### SWIFT-API-COMPAT-010 — Do not preserve compatibility for an API that never shipped unless project policy requires it

If a public-looking declaration:

```text
was introduced
changed
and never reached supported consumers
```

there may be no compatibility obligation.

In that case, prefer correcting the design directly rather than introducing:

- deprecated aliases
- forwarding wrappers
- duplicate entry points
- temporary names
- compatibility shims

that create permanent surface area.

Do not assume `public` in source proves the API was shipped.

Use `consumer-surface.md` to establish the actual boundary.

## Compatibility dimensions

### SWIFT-API-COMPAT-020 — Evaluate compatibility across separate dimensions

A change can preserve one kind of compatibility while breaking another.

Evaluate independently when relevant:

```text
source compatibility
binary compatibility
ABI compatibility
behavioral compatibility
semantic/data compatibility
platform availability
interoperability compatibility
```

Do not conclude:

```text
the code still compiles
```

therefore:

```text
the change is fully compatible
```

Likewise, a source-breaking change is not automatically a binary break in every
distribution model.

## Source compatibility

### SWIFT-API-COMPAT-030 — Source compatibility means existing consumer source can still compile

Potential source-breaking changes include:

- removing a supported declaration
- renaming a type/member
- changing argument labels
- changing parameter types
- changing return types
- changing optionality in incompatible ways
- adding required generic constraints
- changing protocol requirements
- changing sync APIs to async
- adding required actor isolation
- changing closure requirements to `@Sendable`
- reducing access
- changing initialization requirements

Evaluate representative consumer call sites.

Do not judge source compatibility solely from whether the declaration name still
exists.

## Call-site compatibility

### SWIFT-API-COMPAT-040 — Review the actual consumer expression

For example, changing:

```swift
func upload(_ file: URL)
```

to:

```swift
func upload(file: URL)
```

changes the call site from:

```swift
upload(url)
```

to:

```swift
upload(file: url)
```

That is a source change even if the underlying operation is identical.

Likewise, default arguments, overload resolution, generic inference, and actor
isolation can alter source compatibility without changing the conceptual
operation.

Test or inspect realistic consumer code.

## Renames

### SWIFT-API-COMPAT-050 — Treat supported symbol renames as compatibility changes

Renaming:

```text
MediaUploader
→ UploadManager
```

can improve API design but breaks existing source unless a migration mechanism
is provided.

Possible strategies include:

- deprecation with renamed replacement
- compatibility typealias where semantically correct
- breaking release
- migration tooling/documentation

Do not keep both names indefinitely without a compatibility requirement.

## Swift rename metadata

### SWIFT-API-COMPAT-060 — Use language-supported rename guidance when deprecating a supported Swift API

When appropriate, deprecation can point consumers toward the replacement using
the project's established `@available` policy.

Conceptually:

```swift
@available(*, deprecated, renamed: "newName")
```

can improve compiler-assisted migration.

Use exact replacement spelling that corresponds to the actual API.

Do not add rename metadata when the replacement has materially different
semantics and requires migration guidance beyond a rename.

## Parameter labels

### SWIFT-API-COMPAT-070 — Argument labels are part of the Swift source contract

Changing:

```swift
func search(query: Query)
```

to:

```swift
func search(matching query: Query)
```

changes consumer source.

That may be worthwhile for API quality, especially in a breaking release, but
it is not source-neutral.

Do not dismiss argument-label changes as formatting or naming-only changes.

## Parameter types

### SWIFT-API-COMPAT-080 — Parameter generalization or specialization can change overload resolution and source usability

Changing:

```swift
func process(_ value: Concrete)
```

to a generic/protocol-based form can appear more flexible but may alter:

- type inference
- overload selection
- existential behavior
- diagnostics
- Objective-C exposure

Likewise, narrowing a type can reject existing calls.

Evaluate real callers.

Do not assume a "more general" signature is automatically source-compatible.

## Default arguments

### SWIFT-API-COMPAT-090 — Defaults are part of both source and behavioral compatibility

Adding a default can make previously explicit syntax optional.

Changing a default can silently change existing source behavior after
recompilation.

For example:

```swift
func export(
    quality: Quality = .balanced
)
```

changing to:

```swift
quality: Quality = .high
```

may preserve source syntax while changing output behavior.

Review default-value changes as consumer contract changes.

## Optionality

### SWIFT-API-COMPAT-100 — Optionality changes can affect both compilation and semantics

Changing:

```swift
Value?
→ Value
```

or:

```swift
Parameter
→ Parameter?
```

can alter:

- valid caller inputs
- unwrap requirements
- overload resolution
- failure/absence semantics

Do not assume making something optional is always a compatible relaxation.

It may create new semantic states consumers must understand.

## Return types

### SWIFT-API-COMPAT-110 — Return-type changes are consumer-visible even when callers often ignore the result

Changing:

```swift
func start() async throws
```

to:

```swift
func start() async throws -> Session
```

may be source-compatible for some ignored-result call sites and problematic for
others depending on API details and compiler behavior.

More importantly, it changes the supported contract.

Do not classify a return-type change solely by whether one local caller still
compiles.

## Sync to async

### SWIFT-API-COMPAT-120 — Changing a supported synchronous API to `async` is a source contract change

Consumers may need:

```text
async context
await
task ownership
new isolation handling
```

after the change.

Do not silently replace:

```swift
func value() -> Value
```

with:

```swift
func value() async -> Value
```

in a compatibility-sensitive release.

If both APIs temporarily coexist, keep one authoritative implementation where
possible.

## Nonthrowing to throwing

### SWIFT-API-COMPAT-130 — Adding `throws` changes caller requirements

Changing:

```swift
func start()
```

to:

```swift
func start() throws
```

requires callers to handle or propagate failure.

This can be the correct design if failure was previously hidden.

It remains a source compatibility change for supported consumers.

Do not preserve a misleading nonthrowing API solely for compatibility if the
project has intentionally chosen a breaking release.

## Error compatibility

### SWIFT-API-COMPAT-140 — Error semantics can break consumers without changing a function signature

This signature may remain unchanged:

```swift
func start() async throws
```

while behavior changes from:

```text
permission denied
→ PermissionError.denied
```

to:

```text
permission denied
→ OperationError.failed
```

Consumer recovery logic can break even though source still compiles.

Treat established error categories as behavioral contract.

## Protocol compatibility

### SWIFT-API-COMPAT-150 — Protocol changes can affect external conformers

Adding a required protocol member can require every conformer to implement new
behavior.

Changing:

- requirement type
- actor isolation
- `async`
- `throws`
- `Sendable` refinement
- associated-type constraints

can similarly affect conformers.

Do not evolve supported protocols as if they were ordinary internal concrete
types.

## Default protocol implementations

### SWIFT-API-COMPAT-160 — A default implementation can reduce source migration cost but does not automatically make a protocol change semantically safe

Providing a default can allow existing conformers to continue compiling in some
situations.

Still determine whether the new requirement represents behavior every conformer
can correctly inherit.

Do not add meaningless default behavior merely to avoid a breaking change.

## Protocol refinement

### SWIFT-API-COMPAT-170 — Adding inherited protocol requirements can strengthen the consumer contract

For example:

```swift
protocol Provider: Sendable
```

requires conformers to satisfy a concurrency-transfer contract.

That can invalidate existing implementations.

Treat refinements as API evolution, not implementation annotations.

## Class inheritance

### SWIFT-API-COMPAT-180 — Changes to externally subclassable classes require additional compatibility care

For `open` classes and overridable members, consumers may depend on:

- initializer behavior
- override points
- call ordering
- dynamic dispatch
- superclass implementation

Changing these can affect external subclasses without altering ordinary call
sites.

Do not evaluate `open` API compatibility only from direct consumers.

## Binary compatibility

### SWIFT-API-COMPAT-190 — Distinguish binary compatibility from source compatibility

Binary compatibility concerns whether already compiled consumer code can
continue working with a different version of the library without recompilation.

This matters particularly for separately distributed binary frameworks and
libraries.

Changes involving:

- symbol availability
- calling convention
- type metadata
- vtables
- protocol witness behavior
- stored layout
- exported symbols

can matter.

Use `resilience.md` for detailed ABI reasoning.

Do not claim binary compatibility from source inspection alone when the project
has dedicated tooling or generated interfaces.

## ABI compatibility

### SWIFT-API-COMPAT-200 — Treat ABI as a specialized compatibility contract

ABI compatibility is not equivalent to:

```text
same public source declarations
```

Whether a change is ABI-safe depends on factors such as:

- library evolution
- frozen versus resilient types
- inlinable code
- symbol presence
- layout exposure
- compiler/runtime contract

Route detailed analysis to `resilience.md`.

Do not make categorical ABI claims without knowing the build/distribution
configuration.

## Library evolution configuration

### SWIFT-API-COMPAT-210 — Inspect whether the library is built for evolution before making resilience assumptions

Relevant build configuration can materially affect ABI expectations.

If the project distributes binary frameworks, inspect its actual settings and
release pipeline.

Do not infer:

```text
public framework
→ library evolution enabled
```

without evidence.

Likewise, do not assume source-only packages owe the same binary-compatibility
contract as prebuilt frameworks.

## Binary API tooling

### SWIFT-API-COMPAT-220 — Prefer deterministic API/ABI tooling when the repository provides it

Projects may use:

- API digests
- symbol graphs
- generated `.swiftinterface`
- ABI comparison
- custom API baseline checks
- framework-interface diffing

Use configured tooling as evidence.

Semantic review should explain meaningful compatibility impact rather than
duplicating every generated diff.

## Behavioral compatibility

### SWIFT-API-COMPAT-230 — Stable syntax does not imply stable behavior

A change can preserve every public declaration and still break consumers.

Examples include changing:

- default behavior
- state-transition semantics
- callback ordering
- cancellation
- retries
- timeout
- thread/actor delivery
- resource lifetime
- persistence
- output format
- error mapping
- duplicate-event behavior

Treat supported semantics as part of the contract.

## Lifecycle compatibility

### SWIFT-API-COMPAT-240 — Changing when an operation becomes active or terminal is behavioral API evolution

For example:

```text
old:
await start()
→ resource fully active

new:
await start()
→ start merely scheduled
```

preserves the signature but changes consumer sequencing assumptions.

Likewise:

```text
stop()
previously waited for cleanup
now returns before teardown
```

can introduce races in existing consumer code.

Review lifecycle completion boundaries explicitly.

## Ordering compatibility

### SWIFT-API-COMPAT-250 — Established ordering guarantees are compatibility-sensitive

Changing:

```text
callbacks always ordered
```

to:

```text
callbacks may overlap
```

can break consumers even if callback signatures remain identical.

Similarly, changing from concurrent operations to forced serialization can
alter:

- latency
- completion ordering
- UI behavior

Do not expose internal scheduling accidentally as a guarantee, but preserve
ordering once it is part of the supported contract.

## Concurrency compatibility

### SWIFT-API-COMPAT-260 — Concurrency annotations and semantics can affect existing consumers

Review changes involving:

- `async`
- actor isolation
- `MainActor`
- `nonisolated`
- `Sendable`
- `@Sendable`
- cancellation
- overlap policy

through both source and behavioral compatibility.

Use `concurrency-and-errors.md` for the actual concurrency contract.

## Resource ownership compatibility

### SWIFT-API-COMPAT-270 — Changing who owns cleanup can break consumers

For example:

```text
old:
consumer owns returned temporary file

new:
SDK deletes file after callback
```

can break callers without changing any Swift type.

Likewise:

```text
old:
operation survives handle release

new:
handle release cancels operation
```

changes lifecycle semantics.

Use `state-and-ownership.md`.

## Side-effect compatibility

### SWIFT-API-COMPAT-280 — Preserve supported side-effect expectations

An operation may create:

- files
- persistent records
- network requests
- notifications
- telemetry
- cache entries

Changing when or whether these side effects occur can be consumer-visible.

Do not evaluate API compatibility only through return values.

## Serialization compatibility

### SWIFT-API-COMPAT-290 — Persisted or serialized representations create contracts beyond Swift source

Types encoded using:

- `Codable`
- JSON
- plist
- database records
- disk persistence
- IPC/messages
- network payloads

may need compatibility with values written by older versions.

A source-compatible model refactor can still make old stored data unreadable.

Identify whether persisted representation is:

```text
private disposable cache
```

or:

```text
durable supported data
```

before imposing compatibility requirements.

## Codable keys

### SWIFT-API-COMPAT-300 — Treat stable encoded keys as data contracts when persisted externally or durably

Renaming:

```swift
var identifier: String
```

does not necessarily require changing an existing serialized key.

If old data contains:

```json
{
  "id": "..."
}
```

a migration may preserve:

```swift
case identifier = "id"
```

when `"id"` is part of the durable representation.

Do not couple serialized field names mechanically to Swift property renames.

## Codable synthesis

### SWIFT-API-COMPAT-310 — Do not rely blindly on synthesized Codable when representation stability matters

Automatic synthesis can be convenient.

But changing:

- property names
- optionality
- enum shape
- nested types

can change decoding/encoding behavior.

For durable formats, consider explicit coding keys or custom migration behavior
when representation stability is required.

Do not add custom Codable implementation when data is ephemeral and no
compatibility obligation exists.

## Added persisted fields

### SWIFT-API-COMPAT-320 — New fields should account for older stored data when backward decoding is required

Adding a new required property can make decoding previous payloads fail.

Possible strategies include:

- optional field
- decoding default
- versioned migration
- custom decoder

Choose according to the domain.

Do not invent defaults that produce invalid semantic state merely to keep old
data decodable.

## Removed persisted fields

### SWIFT-API-COMPAT-330 — Removing model properties does not always mean older encoded keys must become invalid

Decoders may be able to ignore unknown old fields depending on the format and
implementation.

Determine:

- whether old readers must read new data
- whether new readers must read old data
- whether round-tripping must preserve unknown fields

Do not assume compatibility is bidirectional.

## Backward data compatibility

### SWIFT-API-COMPAT-340 — Define whether new software must read old data

Backward-compatible decoding means conceptually:

```text
new version
   ↓ reads
old representation
```

This is common for persisted app/SDK state.

Test representative previous representations when this contract matters.

## Forward data compatibility

### SWIFT-API-COMPAT-350 — Define whether old software must understand data written by a newer version

Forward compatibility is a separate requirement:

```text
old version
   ↓ reads
new representation
```

Many products do not support this fully.

Do not assume backward-compatible decoding automatically provides forward
compatibility.

## Versioned representations

### SWIFT-API-COMPAT-360 — Introduce explicit schema/version migration when semantic evolution requires it

When representation changes cannot be safely inferred:

```text
version 1
    ↓ migrate
version 2
```

may be clearer than accumulating ambiguous optional/default behavior.

Use versioning when it solves a real persistence evolution problem.

Do not add schema versions preemptively for short-lived internal data.

## Enum serialization

### SWIFT-API-COMPAT-370 — Persisted enum representation can outlive Swift case names

If an enum is serialized as raw strings:

```swift
case running = "running"
```

changing the Swift spelling or raw value may affect old persisted/network data.

Separate:

```text
Swift source naming
```

from:

```text
wire/storage representation
```

when stability matters.

Do not assume enum refactoring is data-compatible.

## Unknown enum values

### SWIFT-API-COMPAT-380 — Decide how readers handle values introduced by newer producers

For external/wire formats, an older or differently versioned reader may
encounter an unknown value.

Possible policies include:

- fail decoding
- preserve unknown raw representation
- map to `.unknown`
- ignore the record

Choose according to the protocol/domain.

Do not add `.unknown` mechanically when unknown values should actually make the
payload invalid.

## Persistence identity

### SWIFT-API-COMPAT-390 — Preserve stable identifiers across representation migrations

If consumers or internal subsystems rely on persisted logical identity,
migration should not accidentally create:

```text
old operation ID
→ new unrelated operation ID
```

for the same logical object.

Use `state-and-ownership.md` for identity semantics.

## Cache compatibility

### SWIFT-API-COMPAT-400 — Do not over-engineer migration for disposable caches

If persisted state is explicitly:

```text
rebuildable cache
```

invalidating it on version upgrade may be safer and simpler than maintaining a
complex schema migration.

Determine whether data loss is acceptable.

Do not treat every file on disk as durable supported state.

## Network compatibility

### SWIFT-API-COMPAT-410 — Wire contracts are independent compatibility surfaces

Changing Swift models can change network behavior when those models define:

- request JSON
- response decoding
- query parameters
- headers
- enum raw values

Preserve the external service contract independently from Swift naming.

Do not rename a JSON field because a Swift property was renamed unless the
server contract changes too.

## Availability

### SWIFT-API-COMPAT-420 — Platform availability is part of API usability

A supported declaration can only be used where its availability allows.

Changing availability can affect existing consumers.

Review:

- platform
- OS version
- introduced version
- deprecated version
- obsoleted version

according to deployment and product support.

Do not call a newer platform API from a supported declaration without
appropriate availability handling.

## Raising minimum availability

### SWIFT-API-COMPAT-430 — Increasing an API's minimum OS requirement can break supported call sites

Changing:

```text
available iOS 16+
```

to:

```text
available iOS 18+
```

removes the API from consumers targeting the older supported range.

Treat this as compatibility-sensitive.

Do not hide a higher availability requirement inside implementation code if the
public API can no longer work on previously supported systems.

## Availability fallbacks

### SWIFT-API-COMPAT-440 — Preserve older-platform behavior only when the product still supports it

When a new framework capability is unavailable on older supported systems,
possible strategies include:

- alternative implementation
- reduced capability
- explicit unsupported error
- availability-gated API

Choose according to product requirements.

Do not create a fake fallback whose semantics differ materially without making
that difference clear.

## Deprecation

### SWIFT-API-COMPAT-450 — Deprecation is a migration tool for supported APIs

Deprecation means:

```text
the API remains available for now
but consumers should move to another contract
```

Use it when:

- old API has shipped
- migration time is required
- replacement exists
- compatibility policy supports staged removal

Do not deprecate unreleased experimental API merely to preserve development
history.

## Deprecation replacement

### SWIFT-API-COMPAT-460 — Provide a clear migration destination

A useful deprecation should tell consumers what to use instead.

When the migration is a direct rename, compiler rename metadata may be enough.

When semantics change, documentation should explain:

```text
old workflow
→ new workflow
```

Do not deprecate into another API that is itself temporary or ambiguous.

## Deprecated behavior

### SWIFT-API-COMPAT-470 — Deprecated APIs still need correct behavior

Until removed according to project compatibility policy, an old API remains a
supported entry point.

Prefer routing:

```text
deprecated API
      ↓
new authoritative implementation
```

rather than maintaining a second implementation.

Do not intentionally let the deprecated path rot while consumers can still use
it.

## Deprecation and wrappers

### SWIFT-API-COMPAT-480 — Keep compatibility wrappers thin

A deprecated adapter should normally translate:

```text
old input
→ new model
→ authoritative implementation
→ old result shape
```

It should not become a second owner of:

- state
- lifecycle
- retry
- persistence
- business policy

If maintaining the old behavior requires a substantial independent engine,
reevaluate the compatibility strategy.

## Compatibility aliases

### SWIFT-API-COMPAT-490 — Use aliases only when old and new concepts are semantically equivalent

A typealias can help migrate a renamed value type:

```swift
@available(*, deprecated, renamed: "NewName")
public typealias OldName = NewName
```

where project/toolchain usage supports the desired migration.

Do not alias two concepts that differ in:

- lifecycle
- ownership
- generic behavior
- state
- semantics

merely to preserve compilation.

## Compatibility overloads

### SWIFT-API-COMPAT-500 — Avoid overload sets that make migration ambiguous

Keeping:

```swift
oldMethod(...)
newMethod(...)
```

or several overloads can preserve source but create ambiguous resolution.

Ensure compatibility overloads:

- clearly delegate
- remain distinguishable
- do not accidentally capture new calls
- have a removal plan when temporary

Do not sacrifice the clarity of the new API merely to avoid all source changes
if the release permits breaking evolution.

## Compatibility shims

### SWIFT-API-COMPAT-510 — Every shim should have a supported consumer and a lifecycle

Before adding a shim, answer:

```text
Who still needs this?
Until when?
What implementation does it delegate to?
```

Do not accumulate compatibility infrastructure without a real supported
consumer.

## Breaking releases

### SWIFT-API-COMPAT-520 — A breaking release is an opportunity to remove obsolete compatibility paths

When product/versioning policy explicitly allows breaking change:

- simplify API
- remove superseded names
- remove duplicate entry points
- consolidate state ownership
- eliminate wrappers with no remaining role
- update migration documentation

Do not carry every historical compatibility mechanism into a breaking release
by default.

## Semantic versioning

### SWIFT-API-COMPAT-530 — Follow the project's versioning policy

Many projects use semantic-version-like rules where breaking supported API
changes require a major release.

Others have different release conventions.

Use the repository's actual versioning and release rules.

Do not infer required version numbers solely from generic SemVer assumptions.

## Behavior changes in minor releases

### SWIFT-API-COMPAT-540 — Source compatibility is insufficient justification for a behavior change

A change may compile for all callers but still alter:

- output
- timing
- state
- error
- retries
- resource lifetime

Determine whether the project's release policy permits that behavioral change.

Do not classify it as "non-breaking" merely because no source edit is required.

## Bug fix versus compatibility

### SWIFT-API-COMPAT-550 — Correcting defective behavior is not automatically a compatibility problem

Sometimes existing behavior is clearly contrary to the supported contract.

Fixing it may change what some consumers observed.

Determine:

```text
documented/intended behavior
vs
accidental bug behavior
```

Do not preserve a known correctness defect solely because some caller could have
depended on it.

When behavior was ambiguous or widely relied upon, migration/release impact may
still deserve consideration.

## Undocumented behavior

### SWIFT-API-COMPAT-560 — Undocumented does not automatically mean non-contractual

Consumers can depend on behavior established through:

- long-standing implementation
- examples
- tests
- generated interfaces
- release notes
- official guidance

Conversely, incidental internal timing may remain unsupported.

Use evidence.

Do not declare a behavior safe to change merely because no DocC sentence
mentions it.

## Compatibility evidence

### SWIFT-API-COMPAT-570 — Prefer concrete evidence of prior contract

Useful evidence includes:

```text
released public interface
consumer sample
previous tests
migration docs
API baseline
binary symbols
release notes
supported usage
```

Do not invent compatibility requirements from hypothetical consumers.

## Compare against the correct baseline

### SWIFT-API-COMPAT-580 — Use the relevant released/base version

For a PR review, compare against the correct base revision.

For release compatibility, compare against the appropriate previously supported
release.

Do not compare only against another intermediate development commit if the
question concerns shipped consumers.

## API diff scope

### SWIFT-API-COMPAT-590 — Limit compatibility findings to the actual supported surface

A large modular repository may contain many `public` declarations that are
internal to the product architecture.

Apply compatibility analysis only where the project says compatibility is owed.

Use `consumer-surface.md`.

Do not generate breaking-change findings for implementation modules without a
supported external/module consumer contract.

## Compatibility and refactoring

### SWIFT-API-COMPAT-600 — Refactoring should not leave two authoritative implementations

When introducing the new design:

```text
old surface ─┐
             ├→ one implementation
new surface ─┘
```

is preferable to:

```text
old surface → old engine
new surface → new engine
```

unless their behavior intentionally differs.

Compatibility should wrap the new owner, not duplicate ownership.

## Deletion pass

### SWIFT-API-COMPAT-610 — Remove compatibility code that no longer protects a supported contract

After migration, inspect for:

- deprecated wrappers past their support window
- obsolete aliases
- old callbacks
- duplicate state
- legacy models
- dead adapters
- compatibility flags
- unused migration paths

Do not preserve code indefinitely because it once had compatibility purpose.

## Migration documentation

### SWIFT-API-COMPAT-620 — Document consumer action for intentional breaking changes

A migration guide should focus on:

```text
what changed
why consumer code must change
old usage
new usage
behavior differences
```

where relevant.

Do not describe internal refactoring that does not affect consumers.

## Migration examples

### SWIFT-API-COMPAT-630 — Prefer before/after consumer code for meaningful API migrations

For example:

```swift
// Before
sdk.upload(request) { result in
    ...
}

// After
let task = sdk.uploads.create(options: options)
let result = try await task.start()
```

when that accurately represents the changed workflow.

Examples make ownership and async differences clearer than only listing renamed
symbols.

## Compatibility tests

### SWIFT-API-COMPAT-640 — Test compatibility contracts that cannot be proven by compilation alone

Depending on the change, useful tests can verify:

- deprecated API delegates correctly
- old serialized data still decodes
- state behavior remains equivalent
- previous error mapping remains supported
- availability fallback works
- stable identity survives migration

Do not create runtime tests for source compatibility that deterministic API
tooling already verifies better.

## Serialization fixtures

### SWIFT-API-COMPAT-650 — Keep representative previous-format fixtures when durable decoding compatibility matters

A fixture can prove:

```text
payload created by version N
        ↓
new decoder
        ↓
correct domain state
```

Use real representative schema shapes rather than only constructing the current
model and round-tripping it.

A current-version round-trip does not prove backward compatibility.

## Round-trip tests

### SWIFT-API-COMPAT-660 — Use round-trip tests for representation symmetry, not migration proof

This:

```text
current encode
→ current decode
```

tests current representation consistency.

It does not prove:

```text
old encode
→ new decode
```

Keep these concerns separate.

## API tooling and semantic review

### SWIFT-API-COMPAT-670 — Let deterministic tooling detect symbol changes and semantic review explain impact

If an API-diff tool reports:

```text
removed public method
```

the semantic review should determine:

- whether it is supported consumer API
- whether it shipped
- whether replacement exists
- whether the release permits the break

Do not duplicate raw tool output without interpreting the consumer impact.

## Review checklist

When Swift compatibility changes, verify when applicable:

- a real supported consumer contract exists
- unreleased APIs are not preserved through unnecessary compatibility shims
- source, binary/ABI, behavioral, data, availability, and interoperability
  compatibility are evaluated separately
- representative consumer call sites are considered
- renames and argument-label changes are treated as source changes
- parameter/return/optional/default changes include semantic analysis
- sync-to-async and nonthrowing-to-throwing changes receive compatibility review
- protocol changes account for external conformers
- externally subclassable APIs account for overrides and inheritance
- binary compatibility claims consider actual distribution/library-evolution
  configuration
- detailed ABI questions are routed through `resilience.md`
- configured API/ABI baseline tooling is used when available
- unchanged signatures are not assumed to imply unchanged behavior
- lifecycle completion and ordering remain compatible when promised
- concurrency and isolation changes are treated as consumer-visible
- resource ownership changes are reviewed behaviorally
- durable serialized representations are treated as independent compatibility
  surfaces
- Codable synthesis is not relied upon blindly when schema stability matters
- new required persisted fields remain compatible with old data when required
- backward and forward data compatibility are distinguished
- explicit schema migration is used when semantic changes cannot be represented
  safely by defaults
- enum/raw-value changes account for persisted or wire representation
- cache data is not given unnecessary migration complexity
- network field names remain aligned with wire contracts independently of Swift
  renaming
- platform availability changes are treated as consumer compatibility changes
- deprecation is used for actually supported/shipped API
- deprecated APIs delegate to one authoritative implementation
- aliases are used only for semantically equivalent concepts
- compatibility overloads do not introduce ambiguity
- every compatibility shim has a known consumer and support lifecycle
- breaking releases remove obsolete compatibility paths when policy permits
- project versioning policy, rather than assumed SemVer, determines release
  treatment
- bug fixes distinguish supported contract from accidental previous behavior
- undocumented but established behavior is evaluated with evidence
- compatibility comparison uses the correct released/base version
- analysis is limited to the actual supported consumer surface
- refactors do not preserve duplicate authoritative implementations
- migration documentation explains consumer changes rather than internal
  refactoring
- previous-format fixtures are used when persisted backward compatibility
  matters
- current-version round trips are not mistaken for migration tests
- deterministic API tooling and semantic compatibility review complement rather
  than duplicate one another

Do not treat successful compilation, unchanged method names, deprecation
annotations, a compatibility wrapper, library-evolution mode, or successful
current-version serialization round trips as proof that a Swift API change is
fully compatible.