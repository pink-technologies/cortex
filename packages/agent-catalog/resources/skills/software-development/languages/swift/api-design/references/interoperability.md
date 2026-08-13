# Swift API Interoperability

Use this reference when a Swift API materially affects Objective-C consumers,
mixed Swift/Objective-C modules, `@objc`, generated Objective-C interfaces,
selectors, delegates, blocks, NSError bridging, Objective-C-compatible models,
umbrella headers, bridging boundaries, or compatibility between Swift-native
and Objective-C-facing API surfaces.

This reference focuses on **designing a clear supported boundary between Swift
and Objective-C without forcing implementation or Swift-native API design to
mirror Objective-C constraints unnecessarily**.

Use:

- `consumer-surface.md` to determine whether Objective-C is an actual supported
  consumer.
- `state-and-ownership.md` for delegates, callbacks, handles, resource lifetime,
  and public state.
- `concurrency-and-errors.md` for async APIs, callbacks, actor isolation,
  cancellation, and errors.
- `compatibility.md` when changing an existing Objective-C-visible surface.
- `resilience.md` when binary framework distribution or generated interfaces
  materially affect compatibility.
- the Swift style skill for Swift-side naming.
- the Swift documentation skill for consumer-facing API documentation.
- project-specific Objective-C headers, generated interfaces, examples, and
  integration tests as evidence of the supported Objective-C surface.

Project-specific interoperability policy, minimum deployment targets, Swift
toolchain, module structure, generated-header configuration, Objective-C
examples, and compatibility requirements take precedence over this generic
guidance.

## Interoperability baseline

### SWIFT-API-INTEROP-001 — Establish whether Objective-C is actually a supported consumer

Before modifying Swift design for Objective-C compatibility, determine whether
Objective-C consumers exist.

Useful evidence can include:

- Objective-C examples
- public Objective-C headers
- umbrella headers
- generated `ModuleName-Swift.h` usage
- released Objective-C integration documentation
- existing `@objc` public declarations
- Objective-C consumer tests
- compatibility requirements
- project instructions

Do not constrain every Swift API to Objective-C-compatible types merely because
the project contains some Objective-C code.

Objective-C interoperability should follow an actual consumer boundary.

## Preserve deliberate boundaries

### SWIFT-API-INTEROP-010 — Expose Objective-C only where consumers need it

A Swift module may contain:

```text
Swift-native API
Objective-C-compatible API
internal implementation
```

These sets do not need to be identical.

Prefer exposing only the consumer-facing declarations required by Objective-C.

Do not make:

- internal services
- implementation models
- concurrency primitives
- utility types
- every public Swift declaration

Objective-C visible by default.

## Swift-first versus shared API

### SWIFT-API-INTEROP-020 — Decide whether one API can serve both languages cleanly

Some domain concepts map naturally to both languages:

```text
identifier
status enum
configuration object
start/stop operation
delegate
completion callback
```

One shared API may work well.

Other Swift concepts may not translate cleanly:

- generic protocols
- associated types
- Swift enums with payloads
- result builders
- opaque result types
- some value-centric APIs
- actor-specific abstractions
- advanced generic constraints

When the translation degrades the Swift API significantly, use a focused
Objective-C adapter rather than distorting the primary Swift model.

## Do not make Swift worse for Objective-C accidentally

### SWIFT-API-INTEROP-030 — Preserve expressive Swift design behind an interoperability boundary

Avoid changing:

```swift
enum Destination {
    case temporary
    case file(URL)
}
```

into a collection of loosely related Objective-C-compatible flags merely
because Objective-C cannot consume the original representation directly.

A better architecture may be:

```text
Swift domain model
        ↑
interop adapter
        ↑
Objective-C-compatible configuration
```

when Objective-C support is required.

Do not let interoperability recreate invalid states already eliminated by the
Swift model.

## Objective-C adapter

### SWIFT-API-INTEROP-040 — Introduce an adapter when language constraints materially differ

A dedicated Objective-C-facing type can translate:

```text
Objective-C compatible inputs
            ↓
Swift domain values
            ↓
authoritative Swift implementation
            ↓
Objective-C compatible outputs
```

This is appropriate when it:

- preserves one implementation
- keeps Swift API expressive
- prevents invalid Objective-C combinations
- provides stable Objective-C naming
- centralizes translation

Do not build an entirely separate Objective-C engine.

The adapter should remain a consumer boundary.

## One authoritative implementation

### SWIFT-API-INTEROP-050 — Swift and Objective-C surfaces should converge on one behavior

Prefer:

```text
Swift API ─────────┐
                   ├→ domain implementation
Objective-C API ───┘
```

over:

```text
Swift API
   ↓
Swift implementation

Objective-C API
   ↓
separate implementation
```

unless the products intentionally behave differently.

Shared implementation prevents divergence in:

- validation
- errors
- state
- cancellation
- lifecycle
- resource ownership
- compatibility

## `@objc`

### SWIFT-API-INTEROP-060 — Add `@objc` because Objective-C needs the declaration

`@objc` affects interoperability and generated Objective-C exposure.

Use it when:

- Objective-C consumers call the declaration
- selector-based framework integration requires it
- runtime dispatch requires an Objective-C selector
- protocol/delegate interoperability requires it

Do not add `@objc` merely because a declaration is `public`.

Swift visibility and Objective-C exposure are separate contracts.

## `@objcMembers`

### SWIFT-API-INTEROP-070 — Avoid broad `@objcMembers` exposure unless the complete type intentionally belongs to the Objective-C surface

`@objcMembers` can make many eligible members Objective-C visible.

This can accidentally expand the supported surface as the type grows.

Prefer explicit `@objc` exposure when only selected members belong to the
Objective-C contract.

Use `@objcMembers` when:

```text
the type is intentionally an Objective-C-facing abstraction
```

and broad exposure is part of the design.

Do not use it solely to avoid annotating individual declarations.

## Objective-C exposure is API growth

### SWIFT-API-INTEROP-080 — Treat new Objective-C visibility as a supported-surface decision

Changing:

```swift
public func start()
```

to:

```swift
@objc
public func start()
```

can create a new consumer surface even if Swift call sites are unchanged.

Review:

- naming
- representability
- lifecycle
- generated selectors
- errors
- nullability
- compatibility

before expanding exposure.

Do not classify `@objc` additions as implementation-only annotations.

## NSObject inheritance

### SWIFT-API-INTEROP-090 — Inherit from `NSObject` only when the interoperability/runtime contract requires it

`NSObject` can be required or useful for certain Objective-C runtime behaviors
and framework contracts.

Do not make every Objective-C-visible Swift type inherit from `NSObject`
automatically.

Determine whether the type actually needs:

- NSObject protocol behavior
- selector/runtime integration
- framework superclass requirements
- KVC/KVO behavior
- Objective-C object semantics

Avoid inheritance added only as a precaution.

## `dynamic`

### SWIFT-API-INTEROP-100 — Use dynamic Objective-C dispatch only when runtime dispatch is part of the contract

`dynamic` affects dispatch behavior.

Potential valid reasons include:

- KVO/runtime observation
- Objective-C runtime replacement
- framework contract requiring dynamic dispatch

Do not use `dynamic` as a synonym for:

```text
Objective-C visible
```

or:

```text
overridable
```

Use the narrowest mechanism satisfying the actual runtime requirement.

## Representability

### SWIFT-API-INTEROP-110 — Verify the generated Objective-C interface instead of assuming representability

Swift declarations do not all map directly to Objective-C.

When interoperability matters, inspect the interface generated by the configured
toolchain.

Do not rely solely on memory of compiler bridging rules for complex declarations.

Validate important surfaces through:

- generated Objective-C header
- Objective-C compilation
- actual consumer example/tests

The generated consumer interface is stronger evidence than the Swift source
alone.

## Swift-only types

### SWIFT-API-INTEROP-120 — Keep Swift-only concepts Swift-only when no useful Objective-C representation exists

Swift features such as:

- associated-type protocols
- many generic APIs
- payload enums
- tuples
- some closure/generic combinations
- opaque types

may not provide a natural Objective-C API.

Do not force them into awkward Objective-C exposure.

Provide a focused adapter only if Objective-C consumers need the capability.

## Value types

### SWIFT-API-INTEROP-130 — Do not redesign every Swift value type as a class for Objective-C

Swift structs and enums are often ideal domain representations.

If Objective-C requires an object representation, an interop wrapper can be
appropriate.

Conceptually:

```text
Objective-C DTO/class
        ↓ map
Swift value
```

Do not replace a useful immutable Swift value with shared mutable reference
semantics merely for language compatibility.

## Objective-C-compatible model classes

### SWIFT-API-INTEROP-140 — Keep Objective-C model classes valid by construction where practical

If Objective-C consumers need:

```objc
TVRecordingConfiguration *
```

avoid exposing a bag of mutable properties that permits invalid combinations
when the underlying Swift domain has stronger invariants.

Prefer:

- focused initializers
- readonly properties
- typed factory methods
- validation at construction

according to the domain.

Do not let the Objective-C surface bypass invariants guaranteed by Swift.

## Mutability

### SWIFT-API-INTEROP-150 — Do not expose Objective-C writable properties merely because Swift storage is mutable

Objective-C declarations such as:

```objc
@property(nonatomic, strong) ...
```

create consumer mutation rights.

If only the owner should mutate state, expose the property readonly.

Public mutation should follow the same domain rules in both languages.

Do not allow Objective-C to mutate state that Swift consumers can only observe.

## Nullability

### SWIFT-API-INTEROP-160 — Treat Objective-C nullability as part of the consumer contract

Objective-C declarations should communicate whether references can be absent.

When generated from Swift, verify that optionality maps as intended.

Changing Swift optionality can affect Objective-C:

- nullability annotations
- caller assumptions
- runtime validation

Do not use optionality merely to make bridging easier.

`nil` should retain one clear domain meaning.

## Unspecified nullability

### SWIFT-API-INTEROP-170 — Avoid ambiguous nullability in supported Objective-C interfaces

Where headers are maintained manually, follow the project's nullability
conventions.

Supported consumers should not need to guess whether:

```objc
id
```

can legitimately be `nil`.

Use the applicable Objective-C/header policy rather than introducing arbitrary
annotations independently.

## Objective-C names

### SWIFT-API-INTEROP-180 — Design the Objective-C call site intentionally

A Swift declaration can appear differently when imported into Objective-C.

Inspect both:

```text
Swift call site
```

and:

```text
Objective-C call site
```

when both are supported.

Neither language should receive accidental names generated from implementation
details.

## Custom `@objc` names

### SWIFT-API-INTEROP-190 — Use explicit Objective-C names when the generated selector is unclear or compatibility requires stability

An explicit:

```swift
@objc(...)
```

name can be appropriate when:

- an existing Objective-C selector must remain stable
- Swift naming would produce a poor Objective-C call site
- integration requires a known selector

Do not customize every selector unnecessarily.

Prefer compiler-generated bridging when it already produces an appropriate
consumer API.

## Swift naming from Objective-C

### SWIFT-API-INTEROP-200 — Preserve intentional Swift importer names for Objective-C-defined API

Objective-C APIs may use importer annotations/macros to produce better Swift
names.

When maintaining Objective-C headers consumed by Swift, consider both:

```objc
Objective-C selector
```

and:

```swift
Swift imported name
```

Do not optimize one language by accidentally degrading the other.

Use project-established importer annotations/macros rather than inventing a
parallel naming convention.

## Naming stability

### SWIFT-API-INTEROP-210 — Treat Objective-C selectors and imported Swift names as compatibility-sensitive

Consumers can compile directly against Objective-C selectors.

Changing an `@objc` name can therefore break Objective-C source even when the
Swift declaration remains similarly named.

Likewise, changing Objective-C importer naming can break Swift consumers of an
Objective-C header.

Route supported naming changes through `compatibility.md`.

## Selectors

### SWIFT-API-INTEROP-220 — Use selectors only where runtime selector semantics are required

Selectors are appropriate for APIs such as:

- target/action
- selector-based notifications
- framework runtime integration

Do not expose selector-based extension points where:

- protocol method
- block
- typed closure
- Swift function

provides a safer supported abstraction.

Use selectors for runtime semantics, not general API organization.

## Selector uniqueness

### SWIFT-API-INTEROP-230 — Check generated Objective-C selector collisions

Swift overloads that are distinct in Swift can map poorly or collide in
Objective-C.

When exposing overload families, inspect generated selectors.

Do not assume Swift overload resolution maps cleanly to Objective-C.

If Objective-C support is required, give exposed operations unambiguous selector
identities.

## Overloads

### SWIFT-API-INTEROP-240 — Avoid Swift overload sets that become ambiguous or unavailable in Objective-C

Swift can distinguish APIs by:

- labels
- generic constraints
- types not representable in Objective-C

Objective-C has different selector and type-system constraints.

When both languages need the operations, consider whether separate explicit
Objective-C names provide clearer usage.

Do not weaken the Swift overload design unless Objective-C actually consumes the
surface.

## Initializers

### SWIFT-API-INTEROP-250 — Make Objective-C construction produce valid objects

Objective-C initializers should preserve the same invariants as Swift
initializers.

Avoid exposing generated/default construction such as:

```objc
[[Configuration alloc] init]
```

when the object is unusable until several mutable properties are set.

Provide explicit creation APIs when required state must exist at construction.

## Factory methods

### SWIFT-API-INTEROP-260 — Use Objective-C factories when they improve representability or construction semantics

A factory can adapt Swift construction that is difficult to expose directly.

For example:

```text
Objective-C arguments
      ↓
factory
      ↓
validated Swift domain configuration
```

can be cleaner than exposing implementation-specific initializers.

Do not create factories merely because Objective-C traditionally uses them.

Use the construction mechanism that best preserves valid state.

## Enums

### SWIFT-API-INTEROP-270 — Design Objective-C-visible enums around stable discrete choices

When an enum is intended for Objective-C, ensure its representation maps
appropriately to the consumer language and configured toolchain.

Simple state/category enums often make good shared contracts.

Do not expose a Swift payload enum directly as though Objective-C consumers can
use its full Swift semantics.

Provide another representation when necessary.

## Payload enums

### SWIFT-API-INTEROP-280 — Preserve payload-enum semantics through an adapter instead of flattening them into invalid flags

For Swift:

```swift
enum AudioSource {
    case none
    case microphone(Microphone)
}
```

an Objective-C representation might need another model.

Avoid translating this into:

```text
includesAudio: Bool
microphone: nullable
```

if combinations can become contradictory.

Prefer an Objective-C abstraction that still represents valid choices.

## Raw values

### SWIFT-API-INTEROP-290 — Keep Objective-C enum raw values stable when consumers persist or transmit them

If raw values cross:

- persistence
- network
- IPC
- Objective-C archival

they can become compatibility contracts independent of Swift source names.

Do not renumber or rename serialized representation casually.

Use `compatibility.md`.

## Option sets

### SWIFT-API-INTEROP-300 — Use option sets only for genuinely combinable independent flags

Objective-C-compatible option sets can provide a natural shared representation
when several options may coexist.

Do not convert mutually exclusive domain states into bit flags merely for easy
Objective-C bridging.

Use an enum or validated configuration when choices are exclusive.

## Collections

### SWIFT-API-INTEROP-310 — Review collection element bridging, not just the collection itself

A Swift collection may map to Objective-C only if its contained values are
usable across the boundary.

Inspect:

```text
Array<Element>
Dictionary<Key, Value>
Set<Element>
```

together with the element/value contracts.

Do not assume:

```text
Array is bridgeable
```

therefore:

```text
Array<Any Swift domain type> is a good Objective-C API
```

## Foundation collection types

### SWIFT-API-INTEROP-320 — Do not replace Swift collections with Foundation collections internally merely for interoperability

Swift implementation should generally continue using its appropriate native
types.

Translate at the boundary when Objective-C representation requires it.

Do not spread:

```text
NSArray
NSDictionary
NSSet
```

through Swift domain code merely because one public adapter serves Objective-C.

## Foundation value types

### SWIFT-API-INTEROP-330 — Use Foundation types when they are the natural shared domain representation

Types such as:

- `URL`
- `Date`
- `Data`
- `UUID`
- `NSError`

can participate naturally in many Apple-platform interoperability boundaries,
subject to actual generated signatures.

Use the semantic type appropriate to the domain.

Do not convert:

```text
URL → String
```

merely because Objective-C is involved if URL semantics matter.

## Strings versus domain values

### SWIFT-API-INTEROP-340 — Do not flatten typed values into strings solely for Objective-C convenience

Avoid exposing:

```text
filePath: String
status: String
identifier: String
```

when the API can preserve stronger:

- URL
- enum
- identifier object/value representation

semantics.

Strings make invalid states easier to construct.

Use them when the domain itself is textual.

## Errors

### SWIFT-API-INTEROP-350 — Design the Objective-C error surface intentionally

Swift errors commonly bridge to Objective-C error conventions.

The consumer should receive enough stable information to:

- determine success/failure
- identify meaningful error category
- recover appropriately
- obtain diagnostics

Do not expose arbitrary implementation error text as the primary Objective-C
error contract.

## NSError

### SWIFT-API-INTEROP-360 — Treat NSError domain and code as compatibility-sensitive when Objective-C consumers use them programmatically

Objective-C consumers commonly reason using:

```objc
error.domain
error.code
```

or exported constants/types.

If those values are part of the supported API, keep them stable according to the
versioning policy.

Do not change error domain/code mapping simply because the underlying Swift
error implementation was refactored.

## Swift Error bridging

### SWIFT-API-INTEROP-370 — Keep public Swift error semantics and Objective-C error semantics aligned

If Swift consumers receive:

```text
permissionDenied
```

Objective-C consumers should not receive an unrelated generic error category for
the same operation unless there is a deliberate language-specific contract.

Both language surfaces should normally represent the same domain failure.

The concrete representation may differ.

## Underlying errors

### SWIFT-API-INTEROP-380 — Preserve useful diagnostics without leaking implementation-specific contracts

An Objective-C-facing NSError can carry underlying diagnostic information when
appropriate.

Keep the stable consumer error category separate from unstable internal
implementation details.

Do not require Objective-C consumers to decode low-level vendor/framework errors
to understand SDK-level failures.

## Exceptions

### SWIFT-API-INTEROP-390 — Do not translate ordinary Swift operation failures into Objective-C exceptions

Objective-C exceptions generally represent different failure semantics from
Swift `throws`/NSError-style recoverable failures.

Use the project's established NSError/completion conventions for recoverable
operation failure.

Do not introduce exception-based flow simply to make a Swift error visible in
Objective-C.

## Closures and blocks

### SWIFT-API-INTEROP-400 — Design block APIs around clear cardinality and ownership

A block can represent:

```text
one completion
repeated event callback
configuration callback
```

These are different contracts.

Define:

- whether it is retained
- how often it is invoked
- when invocation stops
- whether `nil` is permitted
- execution context
- error behavior

Do not expose an escaping callback without a lifecycle contract.

## One-shot completion handlers

### SWIFT-API-INTEROP-410 — Use one-shot completion handlers for Objective-C when the operation has one terminal result

A Swift async operation may need an Objective-C-compatible form conceptually
like:

```objc
- (void)loadWithCompletion:(void (^)(Value * _Nullable,
                                     NSError * _Nullable))completion;
```

or another generated/project-specific shape.

The essential contract is:

```text
one invocation
→ one terminal completion
```

Do not expose repeated progress/events through the same terminal completion
handler.

## Verify generated async bridging

### SWIFT-API-INTEROP-420 — Inspect actual generated Objective-C signatures for Swift async methods

Swift toolchains can synthesize interoperability for supported async Objective-C
boundaries.

Do not assume the exact generated selector, completion-handler shape, actor
behavior, or representability from memory.

When an async method must support Objective-C:

1. build with the configured toolchain
2. inspect the generated Objective-C interface
3. compile representative Objective-C usage
4. verify error and cancellation semantics

The generated interface is part of the consumer evidence.

## Avoid duplicate async implementations

### SWIFT-API-INTEROP-430 — If a manual Objective-C callback facade is needed, route it through the Swift async implementation when feasible

Prefer:

```text
Objective-C callback API
        ↓
adapter
        ↓
Swift async operation
```

rather than reimplementing the operation separately.

The adapter owns translation.

The domain implementation owns behavior.

## Cancellation

### SWIFT-API-INTEROP-440 — Do not promise Objective-C cancellation accidentally through an async wrapper

If Swift consumers can cancel via task cancellation, Objective-C consumers may
not naturally have the same mechanism.

If Objective-C needs cancellation, expose a domain concept such as:

```text
operation handle
cancel method
```

when appropriate.

Do not expose a raw Swift `Task` solely to achieve parity.

## Cancellation parity

### SWIFT-API-INTEROP-450 — Equivalent language surfaces should preserve equivalent domain capabilities

If cancellation is a core supported feature, both Swift and Objective-C
consumers should normally have a viable way to request it when both surfaces
support the same operation.

The syntax can differ:

```text
Swift task cancellation
```

versus:

```text
Objective-C operation handle cancel
```

but domain behavior should remain coherent.

Do not require syntactic parity.

Require semantic parity where the product promises it.

## Progress

### SWIFT-API-INTEROP-460 — Separate progress from terminal completion

If Objective-C consumers need progress:

```text
progress callback/delegate
+
terminal completion
```

or an operation object can represent this clearly.

Do not make one completion block fire repeatedly for progress and then once more
for completion unless the method is explicitly an event callback rather than a
completion handler.

## Delegates

### SWIFT-API-INTEROP-470 — Delegates are strong interoperability tools for long-lived event relationships

A delegate can be appropriate when a consumer needs:

- repeated lifecycle events
- several related callbacks
- long-lived observation
- optional event methods where supported
- clear source identity

Do not introduce a delegate for one simple terminal result that maps more
naturally to async/completion.

## Delegate ownership

### SWIFT-API-INTEROP-480 — Make delegate retention semantics explicit

Commonly:

```text
source does not own consumer
→ weak delegate
```

can avoid cycles.

But weak is not universally required.

Follow semantic ownership.

Objective-C consumers should be able to determine whether they must retain the
delegate independently.

Do not select weak/strong solely from convention without considering lifetime.

## Delegate methods

### SWIFT-API-INTEROP-490 — Keep delegate callbacks focused on consumer-observable events

Avoid exposing callbacks for:

- internal queue transitions
- internal retries
- implementation stages
- private state machinery

unless consumers need them.

The delegate is public API, not an instrumentation feed.

## Delegate callback ordering

### SWIFT-API-INTEROP-500 — Preserve meaningful event ordering across Swift and Objective-C surfaces

If both languages observe:

```text
didStart
didProgress
didFinish
```

they should receive a coherent lifecycle.

Do not allow the Objective-C adapter to reorder events by independently
dispatching each callback.

Use one authoritative event/state source.

## Optional delegate methods

### SWIFT-API-INTEROP-510 — Use optional Objective-C protocol requirements only when partial implementation is meaningful

Optional requirements can reduce implementation burden.

They can also hide whether a callback is part of the core contract.

Required lifecycle behavior should generally remain required.

Do not make every delegate method optional merely because Objective-C supports
optional protocol requirements.

## Protocols

### SWIFT-API-INTEROP-520 — Keep Objective-C-compatible protocols intentionally limited to representable contracts

A Swift protocol intended for Objective-C consumption may need restrictions
that a Swift-only protocol does not.

Do not force a generic/associated-type-heavy Swift abstraction into an
Objective-C protocol.

Use a separate consumer-facing protocol when the languages require different
abstraction shapes.

## Protocol conformance

### SWIFT-API-INTEROP-530 — Treat Objective-C protocol evolution as compatibility-sensitive

Adding a required Objective-C protocol method can break conformers.

Changing selector names, parameter types, or nullability can also affect source
compatibility.

Use `compatibility.md`.

Do not evolve externally implemented protocols as though all conformers are
owned by the repository.

## Properties

### SWIFT-API-INTEROP-540 — Verify generated property semantics

For Objective-C-visible properties, inspect:

- readonly versus readwrite
- nullability
- reference/value bridging
- ownership attributes where relevant
- naming
- getter/setter selector behavior

Do not assume a Swift property produces the exact Objective-C contract you
intend.

## Booleans

### SWIFT-API-INTEROP-550 — Keep Boolean semantics natural in both languages

Swift:

```swift
session.isRecording
```

should import/export into an Objective-C API with understandable predicate
semantics.

Do not distort the Swift name solely to imitate Objective-C prefixes if the
compiler/importer already provides an appropriate form.

Inspect both call sites.

## Objective-C ownership attributes

### SWIFT-API-INTEROP-560 — Respect ownership semantics in manually maintained Objective-C headers

For Objective-C declarations, ownership attributes such as strong/weak/copy
must reflect actual lifecycle.

Examples:

- delegates often weak when consumer-owned
- immutable copied values may use copy where appropriate
- blocks may require copy semantics according to Objective-C conventions

Follow the project's Objective-C coding/header standards.

Do not infer ownership merely from Swift property syntax when editing manual
Objective-C API.

## KVC

### SWIFT-API-INTEROP-570 — Support Key-Value Coding only when it is part of the consumer/framework contract

KVC can require Objective-C runtime compatibility.

Do not make arbitrary properties KVC-compliant just because a type inherits
from `NSObject`.

Use KVC when required by:

- framework integration
- supported binding/configuration system
- explicit consumer contract

Avoid exposing string-based property access unnecessarily.

## KVO

### SWIFT-API-INTEROP-580 — Use KVO only for actual observation requirements

If consumers already use:

- AsyncSequence
- delegate
- observation framework
- domain callbacks

do not add KVO merely for Objective-C parity unless Objective-C consumers need
it.

KVO imposes runtime and mutation semantics that should be intentional.

## Notifications

### SWIFT-API-INTEROP-590 — Use notifications for broadcast semantics, not simply because both languages can consume them

Notifications can be useful when:

```text
many independent observers
```

need process-wide or subsystem-wide events.

They provide weaker typing and ownership than many other APIs.

Do not replace a clear delegate or operation handle with notifications solely
for language neutrality.

## Notification names

### SWIFT-API-INTEROP-600 — Treat public notification identifiers and payload keys as compatibility contracts

If Objective-C/Swift consumers depend on:

```text
notification name
userInfo keys
payload types
```

changing those values can break consumers even if no Swift declaration changes.

Use typed wrappers where practical while preserving required external names.

## Objective-C runtime registration

### SWIFT-API-INTEROP-610 — Separate runtime-discovery requirements from consumer API

Some systems use Objective-C runtime behavior for:

- registration
- class discovery
- selectors
- dynamic loading

A declaration may require Objective-C exposure for infrastructure reasons
without being a supported application-developer API.

Do not classify every runtime-visible symbol as consumer-facing API.

Use `consumer-surface.md` to distinguish:

```text
runtime visibility
```

from:

```text
supported product surface
```

## C-callable bridges

### SWIFT-API-INTEROP-620 — Treat C/Objective-C runtime bridge functions as integration boundaries

Some module/bootstrap systems may require C-callable or Objective-C-visible
entry points.

Keep those bridges:

- small
- deterministic
- implementation-focused
- separate from ordinary consumer API

Do not expand a bootstrap/runtime bridge into a general API surface.

## Umbrella headers

### SWIFT-API-INTEROP-630 — Treat umbrella headers as part of Objective-C product composition

For distributed frameworks, umbrella headers can determine what Objective-C
consumers see and import.

When modifying them, verify:

- intended public headers
- imports
- module build
- framework packaging
- generated Swift interoperability

Do not expose internal headers through the umbrella merely because another
internal file needs them.

## Header visibility

### SWIFT-API-INTEROP-640 — Keep public, project, and private header roles intentional

For frameworks containing Objective-C source, header visibility can affect the
consumer surface.

A header needed by another internal target is not automatically a public
application-consumer header.

Use the project's module/package architecture to choose visibility.

## Generated Swift header

### SWIFT-API-INTEROP-650 — Treat the generated Swift-to-Objective-C header as observable consumer evidence

When Swift declarations form part of the Objective-C SDK surface, inspect the
generated interface after meaningful changes.

This catches issues such as:

- declaration disappeared
- unexpected selector
- wrong nullability
- unsupported type
- renamed imported type
- unexpected callback form

Do not assume successful Swift compilation proves the Objective-C surface is
unchanged.

## Bridging headers

### SWIFT-API-INTEROP-660 — Do not confuse application bridging headers with framework public API composition

A bridging header is commonly an implementation/build mechanism allowing mixed
language code within a target.

It is not automatically the product's public Objective-C API.

Do not export internal declarations merely because they appear in a bridging
header.

## Module imports

### SWIFT-API-INTEROP-670 — Consumers should import supported modules, not internal implementation headers

Prefer a stable integration such as:

```objc
@import ProductModule;
```

or the project's supported framework import mechanism.

Avoid requiring consumers to know internal header paths or target topology.

Public module composition should hide implementation structure.

## Objective-C++ and C boundaries

### SWIFT-API-INTEROP-680 — Keep lower-level language bridges behind Swift/Objective-C domain abstractions

When Swift ultimately integrates with:

- C
- C++
- Objective-C++

avoid leaking raw implementation handles through the public consumer API unless
direct access is the product capability.

Prefer:

```text
consumer domain API
      ↓
interop adapter
      ↓
native implementation
```

## Memory ownership

### SWIFT-API-INTEROP-690 — Verify ARC ownership across language boundaries

Mixed-language APIs can involve:

- retained delegates
- block captures
- Core Foundation references
- callback tokens
- context pointers
- framework objects

Trace actual ownership.

Do not assume ARC eliminates cross-language retain cycles.

Use concurrency memory-management guidance for long-lived asynchronous work.

## Blocks and retain cycles

### SWIFT-API-INTEROP-700 — Stored Objective-C blocks can retain Swift owners

A cycle can look like:

```text
Swift owner
    ↓
Objective-C service
    ↓
stored block
    ↓
Swift owner
```

Analyze it just as any other closure ownership graph.

Do not automatically add weak capture without first defining whether the
operation should retain its owner.

## Autorelease behavior

### SWIFT-API-INTEROP-710 — Treat autorelease concerns as implementation/runtime behavior unless consumers own the pool boundary

Objective-C/framework-heavy loops can create autoreleased temporary objects.

Use autorelease pools where profiling or framework usage demonstrates the need.

Do not expose autorelease-pool mechanics as consumer API.

## ObjC callback queues

### SWIFT-API-INTEROP-720 — Translate callback execution into semantic consumer guarantees

An Objective-C framework may invoke a callback on:

```text
main queue
internal serial queue
arbitrary queue
```

The interop adapter should establish the execution/isolation contract promised
by the supported API.

Do not leak private queue names unless consumers truly depend on them.

Use `concurrency-and-errors.md`.

## MainActor bridging

### SWIFT-API-INTEROP-730 — Verify actor-isolated API from Objective-C rather than assuming equivalent semantics

When a Swift declaration is actor-isolated and exposed to Objective-C, inspect
how the configured toolchain presents and enforces that interface.

Objective-C does not express every Swift concurrency property in the same form.

Do not assume Objective-C callers receive the same compile-time isolation
protection as Swift callers.

Runtime/API architecture must still preserve the invariant.

## Sendable

### SWIFT-API-INTEROP-740 — Do not make Objective-C reference types Sendable solely because they cross an interop adapter

Imported or Objective-C-backed reference types may lack Swift-visible transfer
guarantees.

Before crossing actor/task boundaries:

- verify framework ownership
- transfer independent value snapshots where possible
- keep confined objects in their owning domain
- synchronize appropriately when shared

Do not use unchecked sendability as automatic Objective-C bridging glue.

## Preconcurrency

### SWIFT-API-INTEROP-750 — Treat compatibility annotations around imported Objective-C APIs as boundary-specific

Older Objective-C declarations may not express modern Swift concurrency
contracts.

Compatibility mechanisms can be appropriate when the runtime contract is
understood but incompletely represented to the compiler.

Keep those mechanisms near the imported boundary.

Do not spread relaxed concurrency assumptions into internal domain models.

## Availability

### SWIFT-API-INTEROP-760 — Keep platform availability coherent across language surfaces

If an operation is introduced only on a newer platform, both Swift and
Objective-C consumers should receive appropriate availability behavior.

Do not accidentally expose an Objective-C declaration that internally requires a
newer OS without corresponding availability protection.

Use `compatibility.md`.

## Deprecation

### SWIFT-API-INTEROP-770 — Deprecate Objective-C APIs with a usable migration path

When an existing Objective-C API is replaced:

```text
old selector
      ↓ deprecated
new selector/API
```

provide migration guidance appropriate to Objective-C consumers.

Do not provide only a Swift replacement when Objective-C remains a supported
consumer.

If Objective-C support is intentionally being removed, treat that as an
explicit compatibility decision.

## Swift replacement parity

### SWIFT-API-INTEROP-780 — Do not deprecate an Objective-C API toward a Swift-only replacement while still claiming equivalent Objective-C support

If Objective-C consumers cannot call the replacement, they do not have a real
migration path.

Possible strategies include:

- Objective-C adapter
- retained compatibility surface
- explicit end-of-support/breaking release

Choose according to product policy.

## Compatibility

### SWIFT-API-INTEROP-790 — Review interoperability changes in both directions

A change can affect:

```text
Swift → Objective-C exposure
```

and:

```text
Objective-C → Swift imported API
```

Review whichever directions are supported.

Possible breakages include:

- selector changes
- declaration no longer representable
- changed nullability
- changed NSError behavior
- changed protocol requirement
- removed header
- renamed imported Swift symbol
- changed availability
- changed ownership

Do not evaluate only the source language where the declaration is implemented.

## Interop implementation details

### SWIFT-API-INTEROP-800 — Keep translation mechanics internal

Consumers should not need to understand:

- generated thunks
- bridging wrappers
- selector adaptation
- Swift Task creation
- internal dispatch queues
- C entry-point registration

unless those mechanisms themselves are the product integration contract.

Expose domain behavior.

Hide language/runtime plumbing.

## Testing

### SWIFT-API-INTEROP-810 — Compile representative Objective-C consumer code

When Objective-C is supported, a valuable integration test is actual Objective-C
source importing the distributed/module surface.

This can validate:

- header/module imports
- type visibility
- selector names
- initializer availability
- nullability
- enum availability
- block signatures

Do not rely only on Swift unit tests for an Objective-C-facing API.

## Generated-interface tests

### SWIFT-API-INTEROP-820 — Use deterministic interface comparison when the project supports it

A generated-header/API baseline can reveal unintended surface changes.

Semantic review should then determine whether the change:

- affects supported consumers
- is intentional
- needs compatibility handling

Do not manually maintain large snapshots if the repository already has
deterministic API tooling.

## Runtime interop tests

### SWIFT-API-INTEROP-830 — Test behavior that compilation cannot prove

Useful mixed-language runtime tests may verify:

- delegate delivery
- block completion exactly once
- NSError category
- cancellation
- callback ordering
- ownership/lifetime
- dynamic selector integration

Do not duplicate compiler representability checks with runtime tests unless the
behavior itself matters.

## Objective-C examples

### SWIFT-API-INTEROP-840 — Keep official examples aligned with the supported surface

Objective-C sample code can become practical integration documentation.

When the surface changes, update examples if they represent supported usage.

Do not preserve obsolete API solely because an old sample has not been updated.

The supported contract determines the sample, not vice versa.

## Documentation

### SWIFT-API-INTEROP-850 — Document language-specific differences only when consumers must account for them

Examples of useful differences include:

```text
Objective-C uses completion handler instead of Swift async call
Objective-C uses operation handle for cancellation
Swift exposes a richer enum while Objective-C uses a configuration wrapper
```

Do not document internal bridge implementation.

Focus on how each supported consumer performs the same domain workflow.

## Equivalent workflow

### SWIFT-API-INTEROP-860 — Compare interoperability by consumer workflow, not syntactic parity

Swift:

```swift
let result = try await processor.export(input)
```

Objective-C might use:

```objc
[processor exportInput:input completion:^(NSURL *result, NSError *error) {
    ...
}];
```

These can represent the same domain operation despite different syntax.

Aim for:

```text
same capability
same lifecycle semantics
same result/error meaning
```

not identical language constructs.

## Do not duplicate every Swift feature

### SWIFT-API-INTEROP-870 — Objective-C parity should follow supported capability, not declaration count

Swift may expose convenience APIs that Objective-C does not need.

Objective-C may require adapter conveniences that Swift does not need.

Do not require a one-for-one declaration mirror.

Ensure required consumer workflows remain complete and coherent.

## Review checklist

When Swift/Objective-C interoperability changes, verify when applicable:

- Objective-C is an actual supported consumer before constraining Swift API
  design around it
- Objective-C exposure is limited to declarations consumers need
- Swift-native domain models remain expressive where Objective-C cannot
  represent them naturally
- adapters translate language constraints without creating a separate
  implementation
- Swift and Objective-C surfaces converge on one authoritative behavior
- `@objc` is added because runtime/consumer exposure requires it
- `@objcMembers` does not expand the surface accidentally
- NSObject inheritance has a concrete runtime/framework reason
- `dynamic` is used only for actual dynamic-dispatch requirements
- generated Objective-C interfaces are inspected for important representability
  changes
- Swift value types are not converted unnecessarily to mutable classes
- Objective-C model objects preserve domain invariants
- Objective-C does not receive public setters that bypass Swift-side ownership
- optionality produces intentional Objective-C nullability
- Objective-C call-site names and selectors are designed intentionally
- custom Objective-C names preserve compatibility or improve a demonstrated bad
  call site
- selector collisions are checked for exposed overloads
- Objective-C initializers create valid supported objects
- enum/option-set representation matches domain semantics
- payload enums are adapted without recreating invalid flag combinations
- raw values remain stable when persisted or transmitted
- collection element types are also valid across the boundary
- Foundation/shared types preserve domain meaning instead of being flattened to
  strings
- Swift and Objective-C error categories remain semantically aligned
- NSError domains/codes remain stable when consumers rely on them
- recoverable Swift errors are not converted into Objective-C exceptions
- one-shot blocks have exactly-one terminal completion semantics
- generated async/Objective-C bridging is validated with the configured
  toolchain rather than assumed
- manual callback adapters delegate to the authoritative async/domain
  implementation
- Objective-C cancellation capability exists when the shared domain operation
  promises cancellation
- progress and terminal completion remain separate concepts
- delegates are used for genuine long-lived multi-event relationships
- delegate retention matches semantic ownership
- delegate callbacks expose consumer events rather than internal implementation
  stages
- callback/event ordering remains coherent across language surfaces
- protocol evolution considers external Objective-C conformers
- Objective-C-visible properties have intentional readonly/readwrite,
  nullability, and ownership semantics
- KVC/KVO exposure exists only for real framework/consumer requirements
- notification names and payload contracts remain stable when public
- runtime-visible bootstrap/registration symbols are not confused with
  application-consumer API
- C-callable bridges remain narrow integration boundaries
- umbrella/public headers expose only intended consumer headers
- generated Swift-to-Objective-C headers are treated as API evidence
- bridging headers are not confused with framework consumer surfaces
- consumers do not need internal header/module topology
- ARC ownership and block/delegate cycles are reviewed across the language
  boundary
- callback queue behavior is translated into semantic execution guarantees
- actor isolation and Sendability are not assumed to be enforced identically
  from Objective-C
- compatibility suppressions for imported Objective-C APIs remain localized
- availability/deprecation remain coherent across both languages
- deprecated Objective-C consumers receive an actual migration path
- interoperability compatibility is reviewed in both Swift-to-Objective-C and
  Objective-C-to-Swift directions where applicable
- representative Objective-C code compiles against the intended distributed
  surface
- runtime tests cover delegate, callback, error, cancellation, and ownership
  behavior when those contracts matter
- official Objective-C examples remain aligned with supported usage
- parity is measured by equivalent consumer workflows rather than identical
  syntax or declaration count

Do not treat `@objc`, `NSObject`, generated headers, NSError bridging, a delegate,
or successful Objective-C compilation as proof that the interoperability surface
is correctly scoped, semantically equivalent, and maintainable.