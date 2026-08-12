# Swift API Resilience

Use this reference when a Swift library or framework change materially affects
ABI, library evolution, module stability, binary distribution, stored layout,
public enums or structs, `@frozen`, `@inlinable`, `@usableFromInline`,
client-emitted implementation, exported imports, generated interfaces, or other
compiler-visible implementation details that can constrain future evolution.

This reference focuses on **preserving implementation freedom across versions
while honoring the binary and compiler contracts intentionally exposed to
consumers**.

Use:

- `consumer-surface.md` to determine which modules and declarations form the
  supported consumer surface.
- `compatibility.md` for source, behavioral, availability, persistence, and
  broader binary compatibility.
- `interoperability.md` for Objective-C headers, generated interfaces, selectors,
  and mixed-language binary surfaces.
- `state-and-ownership.md` when public type representation exposes mutable state
  or resource ownership.
- `concurrency-and-errors.md` when isolation, async behavior, or error types form
  part of the supported API.
- project API/ABI tooling, generated interfaces, symbol graphs, and binary
  baselines when configured.

Project-specific distribution model, compiler/toolchain version, build settings,
release policy, library-evolution configuration, supported modules, and binary
compatibility requirements take precedence over this generic guidance.

## Resilience baseline

### SWIFT-API-RES-001 — Preserve implementation freedom unless consumers need a stronger contract

A resilient library should normally allow internal representation to evolve
without requiring existing consumers to know that representation.

Prefer:

```text
consumer-visible behavior
        ↓
stable API boundary
        ↓
evolvable implementation
```

over:

```text
consumer
        ↓
depends on stored layout / internal helper / implementation type
```

Do not expose representation details merely because doing so is convenient for
the current implementation.

Every exposed implementation detail can reduce future design freedom.

## Determine whether resilience applies

### SWIFT-API-RES-010 — Establish the distribution and compatibility model first

Before making ABI or resilience claims, determine whether the relevant module is:

- source-distributed
- distributed as a prebuilt binary
- shipped as a framework/XCFramework
- compiled together with all consumers
- built with library evolution
- expected to support replacement without consumer recompilation
- only an internal sibling-module dependency

These models create different compatibility obligations.

Do not assume:

```text
public Swift module
=
stable ABI contract
```

without inspecting the actual product and build configuration.

## Consumer support versus binary dependency

### SWIFT-API-RES-020 — Distinguish supported application API from compiled internal module boundaries

A repository can distribute several binary modules while supporting only a
subset as application-developer API.

Conceptually:

```text
application consumer
        ↓
supported framework A
        ↓
internal framework B
```

Framework B can still participate in binary composition without becoming a
supported application-consumer surface.

Review:

```text
external consumer compatibility
```

and:

```text
internal binary composition compatibility
```

as related but distinct concerns.

Do not document an internal binary dependency as supported consumer API merely
because it is shipped as a framework.

## Module stability

### SWIFT-API-RES-030 — Distinguish module stability from library evolution

Module stability concerns a compiled library's Swift module interface being
consumable across compatible compiler/toolchain versions according to the
supported distribution model.

Library evolution concerns the library retaining implementation flexibility
while preserving compatible binary contracts across versions.

These concepts are related but not identical.

Do not use:

```text
module stable
```

and:

```text
ABI resilient
```

as interchangeable terms.

## Build configuration

### SWIFT-API-RES-040 — Inspect actual build settings before applying library-evolution rules

Relevant configuration can include project/toolchain settings controlling:

- library evolution
- module interface generation
- distribution builds
- target type
- optimization
- emitted modules/interfaces

Use the repository's actual configuration and generated artifacts.

Do not infer resilience policy from:

- framework file extension
- target name
- `public` declarations alone
- another module's settings

Each distributed module can have a different contract.

## Generated interfaces

### SWIFT-API-RES-050 — Treat generated module interfaces as evidence of what clients compile against

When a project distributes stable Swift binary modules, generated interfaces
can reveal compiler-visible declarations including:

- public API
- availability
- generic constraints
- conformances
- inlinable implementation
- usable-from-inline declarations where relevant
- re-exported modules

Inspect generated interfaces when a change could alter the compiler-facing
surface.

Do not rely only on the source file's visual access levels.

## API versus ABI

### SWIFT-API-RES-060 — Keep source API and ABI reasoning separate

Source API answers:

```text
What can consumer source name and call?
```

ABI answers:

```text
What compiled consumer code depends on at runtime?
```

A declaration can participate in ABI without being ordinary source API.

Likewise, a source-visible change does not necessarily have identical binary
impact in every distribution model.

Use `compatibility.md` for the broader compatibility classification.

## Resilient representation

### SWIFT-API-RES-070 — Avoid promising stored representation unless that promise is intentional

For public value types in a library-evolution context, keeping representation
resilient allows the implementation to evolve properties and layout according to
the compiler/library contract.

This can preserve future flexibility to:

- add stored state
- reorganize representation
- optimize storage
- change internal implementation strategy

Do not freeze representation merely to expose current storage choices.

## Struct layout

### SWIFT-API-RES-080 — Treat public stored layout as a compatibility concern when the distribution model exposes it

A public struct can look simple:

```swift
public struct Coordinate {
    public var x: Double
    public var y: Double
}
```

but layout assumptions can matter when the type's representation is exposed or
frozen.

Before making layout-affecting changes, establish whether the type is resilient
under the project's actual compilation model.

Do not claim that adding, removing, or reordering stored properties is
universally ABI-safe or universally ABI-breaking without that context.

## Class layout

### SWIFT-API-RES-090 — Review class evolution separately from value-type layout

Public classes have different evolution concerns from structs and enums,
including:

- superclass relationships
- overridable members
- dynamic dispatch
- stored representation
- initialization
- Objective-C exposure

An `open` class can create additional obligations because external consumers may
subclass and override it.

Do not apply value-type layout rules mechanically to classes.

## `@frozen`

### SWIFT-API-RES-100 — Treat `@frozen` as a deliberate commitment to representation

For a public struct or enum where the attribute is applicable,
`@frozen` tells clients that aspects of its representation/case set are fixed
according to Swift's library-evolution model.

That can improve compiler optimization opportunities while reducing future
evolution freedom.

Do not add `@frozen` merely because:

- the type currently looks complete
- it has only a few properties
- exhaustive switching is convenient
- performance might theoretically improve

Use it only when the representation is intentionally stable.

## Frozen structs

### SWIFT-API-RES-110 — Assume frozen stored representation is a long-term commitment

For a frozen public struct, changing stored representation later can become
compatibility-sensitive.

Before freezing, ask:

```text
Could this type plausibly need another stored property?
Could representation change?
Could implementation storage become indirect?
```

If yes, retaining resilience may be more valuable than exposing layout.

Do not freeze ordinary public models by default.

## Frozen enums

### SWIFT-API-RES-120 — Freeze an enum only when its complete case universe is intentionally stable

A frozen enum communicates that clients may reason about its known case set
according to the library-evolution contract.

This makes adding another case later compatibility-sensitive.

Good candidates are rare and usually represent genuinely closed domains.

Do not freeze an enum simply because all currently known cases have been
implemented.

## Non-frozen enums

### SWIFT-API-RES-130 — Preserve case-set evolution when new cases are plausible

For an externally distributed evolving library, a non-frozen public enum can
preserve flexibility to add cases according to the applicable Swift
library-evolution rules.

Consumer switch code may need to account for future unknown values where the
language/toolchain requires or recommends it.

Do not mark the enum frozen solely to make exhaustive consumer switching more
convenient if the product domain is expected to grow.

## `@unknown default`

### SWIFT-API-RES-140 — Use unknown-case handling when consuming an evolvable enum and future cases are possible

When consuming a resilient external enum, an unknown-case branch can preserve
behavior if a newer library introduces a value not known to the compiling
consumer.

The correct handling depends on the domain.

Possible behavior includes:

- safe fallback
- unsupported-value path
- diagnostic reporting
- generic presentation

Do not convert all unknown cases silently into an existing semantic case when
that would misrepresent the value.

## Public enum evolution

### SWIFT-API-RES-150 — Consider both ABI resilience and consumer semantics when adding cases

Even when a new case is permitted by the binary evolution model, consumers may
still have behavioral assumptions about the previous case set.

Review:

- documentation
- sample switches
- serialization
- Objective-C representation
- persistence
- default handling

Do not treat:

```text
ABI permitted
```

as equivalent to:

```text
behaviorally harmless
```

## Exhaustive domain enums

### SWIFT-API-RES-160 — Closed domain semantics can justify frozen representation only when both contracts align

Some domains are inherently closed:

```text
binary yes/no state
fixed protocol constant set
mathematically closed category
```

But semantic closedness alone does not require `@frozen`.

Use the attribute only when the binary representation commitment is also
desired.

Do not conflate:

```text
domain has no expected new cases
```

with:

```text
clients should know enum representation forever
```

## `@inlinable`

### SWIFT-API-RES-170 — Treat `@inlinable` as exposing implementation to consumer compilation

An inlinable declaration allows its implementation body to become visible to
client compilation according to Swift's compiler contract.

That means implementation details referenced by the body can become relevant to
binary compatibility and future evolution.

Do not think of `@inlinable` as only:

```text
please optimize this function
```

It expands the compiler-visible contract.

## Add `@inlinable` only with evidence

### SWIFT-API-RES-180 — Do not use `@inlinable` as a speculative performance annotation

Inlining across module boundaries can sometimes improve performance.

It also reduces implementation freedom.

Before introducing it, require a reason such as:

- measured hot path
- known generic specialization requirement
- low-level performance-sensitive library design
- established project convention backed by evidence

Do not annotate ordinary domain/API methods merely because they are short.

## Inlinable body stability

### SWIFT-API-RES-190 — Review dependencies referenced from inlinable code

Because client code can compile using an inlinable body, declarations referenced
from that body participate in a stronger compatibility relationship.

Changes to:

- helper semantics
- availability
- referenced constants
- implementation assumptions

may matter beyond the ordinary internal implementation.

Do not refactor an inlinable body as though all of it were hidden behind the
binary boundary.

## `@usableFromInline`

### SWIFT-API-RES-200 — Treat `@usableFromInline` as ABI-relevant internal surface

`@usableFromInline` allows eligible non-public declarations to participate in
inlinable implementation.

Such a declaration may remain unavailable as ordinary public source API while
still being visible to the binary/compiler contract needed by inlined code.

Conceptually:

```text
not public source API
        ≠
completely private implementation
```

Do not expose `@usableFromInline` declarations in consumer documentation merely
because they participate in ABI.

## Usable-from-inline evolution

### SWIFT-API-RES-210 — Do not rename or remove usable-from-inline declarations casually

When client-emitted inlinable code can depend on a declaration, changing that
declaration may have compatibility implications.

Treat such changes with the same care as other ABI-sensitive implementation
surface.

Do not mechanically change:

```text
internal
→ @usableFromInline
```

only to satisfy an inlinable compiler error without considering the expanded
contract.

## Prefer shrinking inlinable scope

### SWIFT-API-RES-220 — Do not recursively expose implementation merely to support one inlinable declaration

A weak pattern can become:

```text
@inlinable public operation
        ↓
requires helper
        ↓
@usableFromInline helper
        ↓
requires another helper
        ↓
more ABI-visible internals
```

When this chain starts exposing substantial implementation, reconsider whether
the original API needs cross-module inlining.

Do not expand ABI surface recursively for speculative optimization.

## Client-emitted implementation

### SWIFT-API-RES-230 — Treat code copied or emitted into clients as a stronger compatibility commitment

Some compiler features can cause implementation to live in consumer binaries
rather than only inside the library binary.

When the project uses such mechanisms, understand that upgrading the library
does not automatically replace already emitted client implementation.

This can affect:

- bug fixes
- behavior changes
- availability
- helper symbols
- compatibility

Do not use client-emission mechanisms without understanding their update model.

## Underscored attributes

### SWIFT-API-RES-240 — Treat underscored compiler attributes as specialized and toolchain-sensitive

Attributes whose names begin with `_` are not ordinary general-purpose API
design tools.

If the repository already uses mechanisms such as client-emission or compiler
implementation attributes:

- inspect the configured toolchain
- understand why they exist
- preserve their compatibility contract
- avoid spreading them casually

Do not recommend an underscored attribute as a generic fix for ABI or
performance concerns.

## `@_alwaysEmitIntoClient`

### SWIFT-API-RES-250 — Treat always-emit-into-client behavior as high-impact compatibility surface when encountered

When this specialized attribute is already used, client binaries may contain
the implementation associated with the declaration.

That can materially affect later bug fixes and behavior evolution.

Do not introduce it merely to:

- avoid exporting a symbol
- improve theoretical performance
- bypass availability issues
- work around another API-design problem

Use only under explicit project/toolchain policy.

## Back deployment and client code

### SWIFT-API-RES-260 — Review client-emission/back-deployment features as distribution contracts

When a project uses language features that emit compatibility implementation
into clients, review:

- deployment target
- runtime availability
- emitted implementation
- future library replacement behavior
- supported compiler/toolchain

Do not treat these features as ordinary implementation annotations.

Keep exact behavior tied to the configured Swift toolchain.

## Public stored properties

### SWIFT-API-RES-270 — Public stored-property syntax can expose more design commitment than a behavioral API

A public model like:

```swift
public struct Configuration {
    public var timeout: TimeInterval
}
```

exposes both:

```text
consumer-readable/mutable concept
```

and potentially representation concerns depending on resilience configuration.

A computed property or behavior-oriented API can preserve more implementation
freedom when storage itself is not the consumer concept.

Do not convert stored properties to computed properties purely for theoretical
resilience if the representation is already intentionally part of the model.

## Public setters

### SWIFT-API-RES-280 — Mutation surface can constrain future representation independently from ABI layout

If consumers are allowed to write:

```swift
configuration.timeout = ...
```

future implementations must continue supporting equivalent mutation semantics
even if internal storage changes.

Resilience includes semantic freedom as well as binary layout freedom.

Use `state-and-ownership.md` for the mutation contract.

## Initializers and representation

### SWIFT-API-RES-290 — Prefer initializers based on domain concepts rather than complete stored layout

A public initializer that exposes every stored property:

```swift
init(
    fieldA: ...,
    fieldB: ...,
    fieldC: ...
)
```

can make future representation changes harder if those values are not genuinely
part of the stable domain model.

Expose inputs consumers conceptually provide.

Do not publish memberwise construction merely because the current
implementation stores those members.

## Public type aliases

### SWIFT-API-RES-300 — Type aliases do not create a resilience boundary

A declaration such as:

```swift
public typealias Identifier = String
```

can expose the underlying type directly to consumers.

Changing the implementation later to a struct is then a source/API evolution.

Do not use typealias when the intention is:

```text
hide representation now
change it freely later
```

Use a distinct public type when semantic identity and future representation
freedom justify it.

## Wrapper types

### SWIFT-API-RES-310 — Introduce wrapper types when they represent a stable semantic boundary

A dedicated type can decouple consumer semantics from an implementation
primitive:

```swift
public struct UploadID: Hashable, Sendable {
    ...
}
```

when `UploadID` is a genuine domain concept.

This can allow implementation representation to evolve behind the abstraction.

Do not wrap every primitive solely for hypothetical ABI flexibility.

## Public conformances

### SWIFT-API-RES-320 — Treat supported conformances as API commitments

A public type conforming to:

- `Equatable`
- `Hashable`
- `Codable`
- `Sendable`
- collection protocols
- other public protocols

communicates behavior consumers can rely upon.

Removing or materially changing that conformance can break source or behavior.

Do not add conformances merely because synthesis is currently easy.

Future representation may make the commitment expensive or inappropriate.

## Conditional conformances

### SWIFT-API-RES-330 — Review generic and conditional conformances as part of the public surface

A declaration such as:

```swift
extension Container: Equatable where Element: Equatable
```

can affect consumer generic code and overload resolution.

Adding or removing such conformances can therefore be API evolution.

Do not treat extension-based conformances as implementation-only because they
live outside the primary type declaration.

## Retroactive conformances

### SWIFT-API-RES-340 — Avoid public retroactive conformances without understanding ownership and collision risk

Conforming a type owned by another module to a protocol also owned elsewhere can
create long-term compatibility hazards if another module later introduces the
same conformance.

When the project uses or introduces a retroactive conformance, review:

- ownership of type
- ownership of protocol
- consumer visibility
- collision potential
- toolchain diagnostics/features

Do not add such conformances merely for convenience.

## Protocol resilience

### SWIFT-API-RES-350 — Public protocols can constrain future evolution more than concrete types

A supported protocol can be:

```text
implemented by consumers
```

not merely:

```text
consumed by callers
```

Adding requirements can therefore affect external conformers.

Before making a type a public protocol, consider whether future evolution will
need:

- new requirements
- associated types
- concurrency constraints
- additional semantics

Do not choose protocols solely to create abstraction if consumer conformance is
not intended.

## Protocol defaults

### SWIFT-API-RES-360 — Default implementations can provide evolution flexibility only when their semantics are valid for all conformers

A newly added protocol requirement with a meaningful default may reduce source
migration in some cases.

But a default that merely:

```text
returns false
does nothing
fatalErrors
```

to preserve compilation may violate the abstraction.

Do not trade semantic correctness for apparent protocol compatibility.

## Marker protocols

### SWIFT-API-RES-370 — Treat marker conformances as semantic commitments

Protocols such as transfer/safety markers can affect compiler behavior and
consumer assumptions.

Do not add/remove them as implementation decoration.

For example, `Sendable` should follow the actual transfer contract.

Use `concurrency-and-errors.md` and the Swift concurrency skill.

## Generic constraints

### SWIFT-API-RES-380 — Generic constraints are part of the consumer/compiler contract

Changing:

```swift
func process<T>(_ value: T)
```

to:

```swift
func process<T: Sendable>(_ value: T)
```

can reject existing source.

Changing constraints can also affect specialization and overload behavior.

Treat generic constraints as supported API when they appear on supported
declarations.

Do not strengthen them solely because one current implementation benefits from
the restriction.

## Generic implementation exposure

### SWIFT-API-RES-390 — Generic performance concerns do not automatically justify exposing internals

Generic libraries sometimes benefit from specialization or inlining.

Still balance:

```text
performance
vs
implementation freedom
```

Measure important paths.

Do not make internal representation ABI-visible solely because the declaration
is generic.

## Opaque result types

### SWIFT-API-RES-400 — Use opaque results when consumers need capabilities without concrete implementation identity

An opaque result can preserve abstraction while exposing a stable protocol-level
contract where the language feature fits the consumer API.

It can be useful when consumers need:

```text
a value conforming to capability X
```

rather than:

```text
this exact implementation type
```

Do not use opaque results when consumers genuinely require concrete identity,
storage, or interoperability unavailable through that abstraction.

## Existentials

### SWIFT-API-RES-410 — Choose existential versus generic surface from consumer semantics, not ABI fashion

Existential and generic APIs have different:

- expressiveness
- performance characteristics
- source syntax
- evolution constraints

Do not rewrite one into the other merely because one seems more resilient.

The public abstraction and supported compiler/deployment requirements should
drive the choice.

## Re-exported modules

### SWIFT-API-RES-420 — Re-exporting another module expands the effective consumer surface

If consumers can use declarations from dependency B after importing module A,
that dependency can become part of A's effective API contract.

This can couple A's compatibility to:

- B's declarations
- B's module name
- B's availability
- B's evolution

Do not re-export an implementation dependency merely to save consumers an
import.

## Exported imports

### SWIFT-API-RES-430 — Treat exported import mechanisms as compatibility-sensitive

When a module deliberately re-exports another module, review changes to that
relationship as consumer API evolution.

Removing the re-export may break source that depended on transitive visibility.

Adding one can unintentionally broaden the supported surface.

Do not use exported imports to solve internal dependency wiring.

## Implementation-only imports

### SWIFT-API-RES-440 — Keep implementation dependencies from leaking through supported signatures

An implementation dependency should not appear in:

- public parameters
- return types
- generic constraints
- public conformances
- superclass relationships
- public aliases

unless it is intentionally part of the supported consumer dependency graph.

Use consumer-owned/domain types at the boundary.

Do not assume an import can remain implementation-only if public declarations
expose its types.

## Dependency type leakage

### SWIFT-API-RES-450 — Avoid making third-party implementation types part of the public contract accidentally

Exposing:

```swift
public func execute(
    request: VendorRequest
) -> VendorResponse
```

couples consumers to:

- the vendor package
- its version
- its API
- its binary evolution
- its platform requirements

This may be intentional for integration libraries.

For implementation dependencies, translate to domain types.

Do not hide the dependency merely with a typealias if consumers still compile
against the underlying type.

## Dependency replacement

### SWIFT-API-RES-460 — Design boundaries so implementation dependencies can be replaced without consumer migration when replacement is plausible

For example:

```text
consumer MediaRequest
        ↓
SDK
        ↓
vendor encoder
```

allows replacing the encoder more freely than:

```text
consumer VendorEncodingOptions
        ↓
SDK
```

if vendor-specific configuration is not actually part of the product.

Do not abstract a dependency solely because replacement is imaginable.

Use the abstraction when the dependency is implementation detail.

## Availability and inlining

### SWIFT-API-RES-470 — Review availability inside compiler-visible implementation carefully

When implementation can be emitted or optimized into clients, availability
relationships can become more complex than ordinary library-private code.

Verify with the configured compiler/toolchain when:

- inlinable code
- back-deployment features
- client-emitted implementation
- newer platform APIs

interact.

Do not rely on intuition about which availability checks are sufficient across
client compilation boundaries.

## Availability is also evolution

### SWIFT-API-RES-480 — Preserve deployment compatibility independently from ABI compatibility

A declaration can remain binary-compatible while becoming unusable on an older
supported OS if its implementation or annotations change availability.

Review both:

```text
Can existing binary link?
```

and:

```text
Can it run on supported platforms?
```

Use `compatibility.md` for availability policy.

## Objective-C resilience

### SWIFT-API-RES-490 — Include Objective-C-exported symbols in binary-surface reasoning

For mixed frameworks, binary compatibility can involve:

- Objective-C classes
- selectors
- protocols
- exported C symbols
- headers
- Swift-generated Objective-C interfaces

Do not restrict resilience review to Swift declarations when Objective-C
consumers or runtime integration are supported.

Use `interoperability.md`.

## C ABI boundaries

### SWIFT-API-RES-500 — Treat exported C-callable symbols as explicit binary contracts

A C bridge can have a very stable ABI even when used only for infrastructure.

Changing:

- symbol name
- parameter representation
- calling convention
- exported availability

can break compiled dependents.

Determine whether the symbol serves:

```text
application consumers
```

or:

```text
internal binary composition
```

but review binary dependence in either case where relevant.

## Runtime registration

### SWIFT-API-RES-510 — Runtime-visible symbols can be compatibility-sensitive without being consumer API

Infrastructure can depend on:

- class names
- selectors
- Objective-C runtime registration
- C symbols
- dynamic lookup

Such declarations may not be documented application API, but renaming/removing
them can still break runtime composition.

Do not confuse:

```text
not supported consumer API
```

with:

```text
safe to change without checking dependents
```

## Symbol names

### SWIFT-API-RES-520 — Avoid relying on implementation symbol names unless the architecture intentionally requires dynamic lookup

Normal Swift callers should interact through declarations and module metadata.

If infrastructure uses symbol lookup by name, that string becomes an explicit
compatibility contract for that integration.

Keep these cases narrow and documented.

Do not design ordinary consumer APIs around binary symbol names.

## ABI surface is larger than documented API

### SWIFT-API-RES-530 — Recognize compiler-visible compatibility surface without documenting it as public API

A binary framework can contain ABI-relevant implementation declarations such as
usable-from-inline helpers.

They may require compatibility preservation without becoming consumer-facing
documentation.

Maintain this distinction:

```text
consumer API
≠
all ABI-relevant symbols
```

Do not expose implementation ABI symbols in public guides solely because they
must remain binary-compatible.

## Public metadata

### SWIFT-API-RES-540 — Treat metadata-producing declarations as part of type evolution

Changes to public:

- generic constraints
- conformances
- superclass
- protocol relationships
- actor isolation

can affect how consumers compile and interact with type metadata.

Do not limit resilience review to method symbols and stored properties.

## Error types

### SWIFT-API-RES-550 — Public error enums have both semantic and potentially resilience implications

If an error enum is part of a supported API:

- consumers may switch over cases
- Objective-C may receive mapped error codes
- serialization may preserve cases
- freezing may constrain extension

Keep its evolution strategy intentional.

Use `concurrency-and-errors.md` for error semantics and `compatibility.md` for
consumer migration.

## Codable is not ABI

### SWIFT-API-RES-560 — Keep serialized representation separate from memory layout

A type can preserve binary ABI while changing:

```text
Codable representation
```

or preserve serialized representation while changing internal memory layout.

These are different contracts.

Do not use ABI resilience as evidence that persisted data remains compatible.

Use `compatibility.md` for serialization evolution.

## Memory layout is not wire layout

### SWIFT-API-RES-570 — Do not couple network/storage representation to Swift memory representation

Avoid persisting or transmitting raw in-memory layout of evolving Swift domain
types unless a low-level format explicitly requires and controls it.

Prefer explicit encoding formats for durable/external data.

This allows memory representation and wire representation to evolve
independently.

## Performance versus resilience

### SWIFT-API-RES-580 — Trade representation exposure for performance only with evidence

Attributes such as:

- `@frozen`
- `@inlinable`
- specialized client-emission mechanisms

can reduce some optimization barriers while increasing compatibility
commitments.

Prefer resilience unless profiling demonstrates that exposing implementation is
worth the long-term cost.

Do not spend API evolution freedom on theoretical optimization.

## Small value types

### SWIFT-API-RES-590 — Small size alone is not sufficient reason to freeze a public value

A two-field struct can still evolve later.

Ask whether:

- the semantic representation is permanently closed
- consumers benefit from fixed layout
- the performance need is proven
- compatibility policy accepts the commitment

Do not infer stability from current simplicity.

## Low-level libraries

### SWIFT-API-RES-600 — Specialized low-level modules may intentionally expose stronger representation contracts

Some performance-critical or systems-level libraries have legitimate reasons to
freeze layout or expose inlinable implementation.

Apply those mechanisms deliberately and locally.

Do not generalize their choices to ordinary application/domain frameworks.

## ABI baselines

### SWIFT-API-RES-610 — Prefer deterministic ABI comparison when the repository provides it

Use project tools that compare:

- ABI descriptors
- symbol graphs
- generated interfaces
- exported symbols
- API digests

when available.

A semantic reviewer should interpret whether a detected change affects the
supported compatibility contract.

Do not attempt to reproduce compiler ABI analysis manually when authoritative
tooling exists.

## Generated interface diff

### SWIFT-API-RES-620 — Review interface changes semantically after deterministic comparison

A generated interface change may indicate:

- intentional API addition
- accidental exposure
- isolation change
- conformance change
- inlinable implementation change
- availability change

Do not treat every textual interface diff as a breaking change.

Determine the semantic and compatibility impact.

## Binary integration tests

### SWIFT-API-RES-630 — Test replacement compatibility when binary replacement is a supported release model

Where the product promises it, meaningful validation can involve:

```text
consumer compiled against version N
        ↓
run/link with version N+1
```

using the project's established compatibility infrastructure.

Do not infer binary replacement compatibility only because both versions build
independently.

## Build all dependent modules

### SWIFT-API-RES-640 — Rebuild dependent binary composition after internal cross-module ABI changes

Even an internal module can be a compiled dependency of another shipped module.

When an internal cross-module contract changes, rebuild all affected dependents
according to the repository's shared release/version strategy.

Do not treat internal visibility as proof that no binary composition can be
affected.

## Same-version train

### SWIFT-API-RES-650 — Distinguish lockstep internal binaries from independently replaceable consumer binaries

Some SDKs ship several internal frameworks only as one coordinated version.

In that model:

```text
internal module A v10
+
internal module B v10
```

may be validated and shipped together rather than guaranteeing arbitrary:

```text
A v9 + B v10
```

compatibility.

Follow the project's real distribution guarantee.

Do not impose independently replaceable ABI guarantees on internal modules when
the product intentionally ships them as one version train.

## Public module dependencies

### SWIFT-API-RES-660 — Keep supported module dependency graph intentional

If public module A requires consumers to install/import module B, B can become
part of the integration contract.

Before adding a public dependency:

- determine whether consumers already receive it
- check availability/version requirements
- check binary packaging
- check re-export behavior
- avoid leaking implementation-only modules

Do not expand the external dependency graph merely to reuse an internal type.

## Moving declarations between modules

### SWIFT-API-RES-670 — Moving a public declaration can be a compatibility change even when its name stays the same

Changing:

```text
ModuleA.Type
→ ModuleB.Type
```

can affect:

- imports
- mangled symbols
- generated interfaces
- Objective-C headers
- binary linkage
- source qualification

Use migration aliases/re-exports only when compatibility policy requires them
and their semantics are correct.

Do not classify file/module relocation as internal when the declaration's module
identity is consumer-visible.

## Module renames

### SWIFT-API-RES-680 — Treat module identity as part of binary/source integration

Renaming a distributed module can affect:

- `import`
- generated interfaces
- framework lookup
- module-qualified symbols
- package product integration
- Objective-C module imports

This is generally larger than renaming one Swift declaration.

Review packaging and migration together.

## Framework composition

### SWIFT-API-RES-690 — Binary packaging is part of the integration contract

Changes to:

- framework names
- XCFramework contents
- slices
- architectures
- module maps
- public headers
- resources
- embedded dependencies

can affect consumers even when Swift source API is unchanged.

Resilience review should include packaging when the product ships binaries.

Do not restrict API review to `.swift` declarations.

## Resources

### SWIFT-API-RES-700 — Publicly required resources can become distribution compatibility

If supported API depends on:

- resource bundles
- model files
- localization
- configuration assets

their location and lookup behavior can affect binary consumers.

Keep resource lookup behind the owning module where practical.

Do not require consumers to know internal bundle topology unless it is an
intentional integration contract.

## `Bundle.module` and equivalent lookup

### SWIFT-API-RES-710 — Keep resource lookup mechanisms implementation-owned

The mechanism used to locate a resource can differ across:

- Swift Package
- framework
- bundle
- application embedding

Expose the resource/capability, not internal bundle lookup mechanics.

Do not make a private bundle identifier or path part of the consumer API without
a product requirement.

## Implementation refactors

### SWIFT-API-RES-720 — Resilience should enable refactoring behind a stable boundary

A healthy resilient API should allow changes such as:

```text
queue → actor
vendor A → vendor B
stored property → computed representation
database → another storage engine
```

without consumer migration when those details were not part of the supported
contract.

If such an internal change requires widespread consumer updates, inspect whether
implementation details leaked through the surface.

## Delete obsolete ABI workarounds carefully

### SWIFT-API-RES-730 — Do not remove compatibility mechanisms until their binary obligation has ended

A helper may appear unused from current source while remaining required by:

- previously compiled clients
- inlinable client code
- runtime lookup
- Objective-C integration
- older supported binary composition

Before deleting ABI-sensitive declarations, determine whether current supported
clients can still reference them.

Do not use ordinary source reference search as the only proof that an exported
symbol is dead.

## Conversely, do not preserve ABI forever without policy

### SWIFT-API-RES-740 — Compatibility obligations need an explicit support window

Once product policy permits dropping compatibility with older binary consumers,
obsolete:

- symbols
- deprecated declarations
- wrappers
- aliases
- ABI shims

can be removed.

Do not let historical compatibility become permanent accidental architecture.

Use the release/version policy to determine removal.

## Testing

### SWIFT-API-RES-750 — Test supported behavior separately from ABI structure

Ordinary unit tests verify:

- behavior
- errors
- lifecycle
- state

ABI/API tooling verifies:

- symbols
- interfaces
- compatibility metadata

Do not replace one with the other.

A binary-compatible API can still behave incorrectly.

A behaviorally correct implementation can still break binary consumers.

## ABI review evidence

### SWIFT-API-RES-760 — Prefer evidence over speculative ABI findings

Before reporting an ABI break, seek appropriate evidence such as:

- configured library-evolution mode
- generated interface diff
- ABI tool output
- exported symbol change
- known frozen representation
- inlinable/usable-from-inline dependency
- actual binary consumer failure

Do not label every public stored-property change as an ABI break without
establishing the relevant resilience model.

## Source-visible but ABI-safe

### SWIFT-API-RES-770 — Do not conflate source-breaking and ABI-breaking changes

A rename, label change, or overload change may break recompilation while an
already compiled client can have a different binary compatibility outcome,
depending on what symbols remain.

Classify the actual dimension.

Use `compatibility.md`.

## ABI-sensitive but source-internal

### SWIFT-API-RES-780 — Do not dismiss internal declarations that participate in emitted client code

A declaration marked for inlinable/internal ABI use can matter to previously
compiled clients even though ordinary consumer source cannot name it.

This is why:

```text
source access control
```

alone does not define the complete binary contract.

## Optimization mode

### SWIFT-API-RES-790 — Do not infer compatibility guarantees from optimizer behavior

The compiler may optimize calls, specialize generics, or inline code under
various modes.

Supported resilience should rely on documented/toolchain contracts and explicit
attributes/settings, not assumptions about what one optimization build happened
to emit.

Do not preserve incidental assembly layout as public ABI policy.

## Compiler version

### SWIFT-API-RES-800 — Evaluate specialized resilience features against the configured Swift toolchain

Compiler behavior and available attributes can evolve.

For:

- generated interfaces
- library evolution
- back deployment
- specialized attributes
- Objective-C bridging

use the actual project toolchain and compiler output as evidence.

Do not encode version-sensitive compiler folklore as universal API guidance.

## Review checklist

When Swift resilience or ABI-sensitive code changes, verify when applicable:

- the actual distribution model is known
- supported consumer API is distinguished from internal compiled dependencies
- module stability and library evolution are not treated as synonyms
- library-evolution/build settings are inspected per relevant module
- generated module interfaces are used as consumer/compiler evidence when
  applicable
- source API and ABI impact are classified separately
- stored representation remains resilient unless fixed layout is intentionally
  promised
- struct/class/enum evolution is evaluated according to the correct type model
- `@frozen` is used only for an intentional long-term representation/case-set
  commitment
- potentially evolving enums remain capable of future extension under the
  project's resilience model
- new enum cases are reviewed for behavioral and serialization impact even when
  ABI evolution permits them
- `@inlinable` is introduced only for a demonstrated cross-module optimization
  need
- inlinable implementation is treated as compiler-visible compatibility surface
- `@usableFromInline` declarations are treated as ABI-relevant but not ordinary
  public API
- inlining does not recursively force unnecessary internals into ABI surface
- client-emitted implementations are reviewed for upgrade and bug-fix behavior
- underscored compiler attributes are not used as generic API-design tools
- public stored properties and initializers expose domain concepts rather than
  accidental implementation representation
- type aliases are not mistaken for abstraction barriers
- wrapper types represent real semantic boundaries
- public and conditional conformances are treated as consumer contracts
- retroactive conformances are reviewed for ownership/collision risk
- public protocols account for external conformers and future evolution
- generic constraints are treated as part of consumer API
- generic optimization does not automatically justify implementation exposure
- exported/re-exported modules are treated as expansion of effective consumer
  surface
- implementation dependencies do not leak through supported signatures
- vendor types become public only when vendor coupling is intentional
- availability is validated when inlinable/client-emitted implementation is
  involved
- Objective-C and C-visible symbols participate in binary compatibility review
- runtime registration symbols are distinguished from application-consumer API
  while still preserving required binary/runtime dependencies
- compiler-visible ABI surface is not automatically documented as consumer API
- Codable/wire compatibility is kept separate from ABI/memory layout
- representation is exposed for performance only with evidence
- deterministic API/ABI baseline tools are used when the project provides them
- generated-interface differences receive semantic interpretation rather than
  raw duplication
- binary replacement testing is used when independently replacing library
  versions is part of the product contract
- dependent frameworks are rebuilt after internal binary-contract changes
- lockstep version trains are distinguished from independently compatible module
  versions
- module moves, module renames, framework composition, and packaging changes are
  included in compatibility review
- public resource/bundle behavior remains valid across packaging changes
- internal refactors remain possible behind the supported boundary
- source-reference searches are not the sole evidence that ABI-sensitive symbols
  are safe to delete
- obsolete ABI shims are removed only after their support obligation ends
- behavioral tests and ABI/API verification remain separate complementary
  validation layers
- ABI findings are supported by configuration, compiler artifacts, tooling, or
  another concrete compatibility contract
- version-sensitive compiler behavior is validated against the configured
  toolchain

Do not treat `public`, a generated `.swiftinterface`, binary framework
distribution, `BUILD_LIBRARY_FOR_DISTRIBUTION`, `@frozen`, `@inlinable`,
`@usableFromInline`, successful linking, or a clean ABI-diff run in isolation as
proof that a Swift library has the correct resilience and evolution strategy.