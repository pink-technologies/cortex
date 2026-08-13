# Core Data Modeling and Validation

Use this reference when the task materially affects Core Data entities,
attributes, relationships, optionality, cardinality, delete rules, uniqueness,
validation, model invariants, transient properties, derived data, or the shape
of persisted information.

Project-specific data-model conventions and persistence requirements take
precedence over this generic guidance.

## Model from persisted behavior

### CORE-DATA-MODEL-001 — Treat the managed object model as a persistence contract

The Core Data model is not merely a mechanism for generating Swift properties.

It defines persistent behavior including:

- entities
- attributes
- types
- optionality
- relationships
- cardinality
- inverse relationships
- delete rules
- uniqueness constraints
- inheritance
- validation
- indexes and fetch behavior where configured

Changes to these definitions can affect previously persisted data.

Do not treat a model edit as an ordinary source-code refactor.

### CORE-DATA-MODEL-002 — Model the invariant owned by persistence

Represent constraints in the Core Data model when they are part of the
persistence contract.

Examples can include:

```text
attribute required for every persisted record
relationship cardinality
delete behavior
uniqueness
persistent default
```

Do not move every business rule into the Core Data model.

A rule such as:

```text
customer may place an order only when account is active
```

usually belongs to a higher business boundary unless persistence itself owns
that invariant.

Keep persistence invariants and business invariants distinct.

## Entity responsibility

### CORE-DATA-MODEL-010 — Keep entities cohesive

An entity should represent a coherent persisted concept.

Be cautious when one entity accumulates unrelated state merely because all the
information is persisted.

Potential symptoms include:

- unrelated lifecycle fields
- relationships belonging to different responsibilities
- large groups of nullable attributes representing unrelated modes
- unrelated ownership semantics
- consumers constantly using only disjoint subsets

Do not split entities mechanically.

A single entity can appropriately represent a rich domain concept.

Split when persistence ownership, lifecycle, or behavior demonstrates that the
model actually represents independent concepts.

### CORE-DATA-MODEL-011 — Avoid persistence entities used only as generic bags of data

Do not model unrelated information as arbitrary:

```text
key/value pairs
JSON blobs
generic metadata dictionaries
```

when the fields have meaningful persistence semantics that Core Data should
understand.

Structured attributes and relationships provide Core Data visibility into:

- queries
- validation
- migration
- relationships
- indexing
- constraints

Opaque serialized payloads can still be appropriate when the data is:

- externally defined
- intentionally schema-less
- not queried independently
- treated atomically
- versioned by another system

Choose according to the contract.

## Attributes

### CORE-DATA-ATTR-001 — Match attribute types to persisted semantics

Choose an attribute type that accurately represents the persisted value.

Consider:

- precision
- range
- optionality
- sorting
- querying
- interoperability
- migration
- serialization boundaries

Do not store structured numeric or temporal values as strings merely because
strings are easy to inspect.

Likewise, do not introduce a custom transformable representation when a native
Core Data attribute type expresses the contract directly.

### CORE-DATA-ATTR-002 — Treat attribute type changes as schema changes

Changing:

```text
String → Int
optional → required
Date → String
transformable representation
numeric precision
```

can affect existing persisted values.

Do not assume a Swift-level conversion makes the persisted model compatible.

Evaluate model evolution and migration separately.

Use the model-evolution reference when existing stores must remain supported.

## Optionality

### CORE-DATA-ATTR-010 — Model optionality according to persisted reality

An attribute or relationship should be optional when the persisted state
legitimately allows absence.

Do not use optionality solely to avoid initialization or migration work.

Conversely, do not mark a value required when valid persisted records can
exist without it.

Ask:

```text
Can a valid persisted record exist without this value?
```

The answer should drive persistence optionality.

### CORE-DATA-ATTR-011 — Distinguish persistence optionality from Swift optionality

Core Data model optionality and the generated Swift property's type must
represent compatible assumptions.

Do not create a persistence contract that allows `nil` while application code
assumes the value can never be absent without an explicit normalization or
validation boundary.

Likewise, a Swift optional does not automatically mean the persistent attribute
must be optional.

Generated declarations, defaults, validation, and initialization strategy all
participate in the contract.

## Defaults

### CORE-DATA-ATTR-020 — Treat defaults as persistence behavior

A model default can affect newly created persisted objects.

Before changing a default, determine whether consumers rely on the old behavior.

Do not assume changing a default updates existing persisted records.

Conceptually:

```text
model default
      ↓
newly initialized value
```

is different from:

```text
migration of existing values
```

When existing records need the new value, handle that through the appropriate
migration or reconciliation path.

### CORE-DATA-ATTR-021 — Do not duplicate defaults inconsistently

Avoid independent defaults in:

```text
Core Data model
Swift initialization
repository layer
UI layer
migration
```

when all of them claim to define the same authoritative persistence behavior.

One boundary should define the contract, with other layers deriving or
deliberately overriding it.

If multiple defaults intentionally exist for different contexts, make that
difference explicit.

## Relationships

### CORE-DATA-REL-001 — Model relationships as persistence semantics

A Core Data relationship describes more than a convenient object reference.

It can define:

- cardinality
- optionality
- inverse behavior
- ownership relationships
- delete behavior
- object-graph traversal

Treat relationship changes as persistence-contract changes.

### CORE-DATA-REL-002 — Define inverse relationships when the relationship is bidirectional

When two entities represent opposite sides of the same logical relationship,
model the inverse relationship consistently when the architecture expects Core
Data to maintain both sides.

For example:

```text
Department.employees
        ↕
Employee.department
```

Avoid independently managed relationship properties representing the same
association without an intentional reason.

Inverse relationships help Core Data maintain object-graph consistency.

Do not add an inverse merely because every relationship "should have one" if the
data genuinely represents only one direction.

## To-one relationships

### CORE-DATA-REL-010 — Model to-one optionality according to lifecycle

For a required relationship, ensure the related object exists at every
persistence point where the object is considered valid.

Do not mark a relationship required when valid creation requires temporarily
missing the related object unless that temporary state is resolved before
validation/save or represented through another workflow.

For optional relationships, ensure callers handle legitimate absence rather
than force-unwrapping based on historical assumptions.

## To-many relationships

### CORE-DATA-REL-020 — Choose relationship cardinality based on the data contract

Use to-many relationships when a persisted concept can own or reference
multiple related records.

When cardinality limits matter, encode and validate them at the boundary that
owns that rule.

Do not infer ordering from an unordered to-many relationship.

If persistent ordering is part of the contract, model it intentionally.

### CORE-DATA-REL-021 — Do not use array semantics for unordered relationships accidentally

An unordered Core Data relationship represents a set-like association.

Do not depend on incidental enumeration order.

When consumers require a stable order, define that order through:

- an ordered relationship when appropriate
- a persisted ordering attribute
- a sort descriptor
- another explicit ordering contract

Do not assume insertion order survives persistence unless the model guarantees
it.

## Ordered relationships

### CORE-DATA-REL-030 — Use ordered relationships only when persistent order belongs to the relationship

Persistent ordering can be useful when the sequence itself is part of the
stored contract.

Do not use ordered relationships merely because a UI currently displays items
in an order.

If ordering can be derived from:

```text
creationDate
position
priority
name
```

a regular relationship plus explicit sorting may provide a clearer persistence
model.

Choose according to whether order is intrinsic state or derived presentation.

## Delete rules

### CORE-DATA-DELETE-001 — Treat delete rules as ownership behavior

A relationship delete rule determines what happens to related objects when one
side is deleted.

Evaluate delete rules according to actual ownership semantics.

Common behaviors include:

```text
nullify
cascade
deny
no action
```

Do not select a delete rule merely to make deletion succeed.

It is part of the persistence lifecycle contract.

### CORE-DATA-DELETE-002 — Use cascade only for true owned lifetime

Cascade is appropriate when related data should cease to exist with its owner.

Conceptually:

```text
owner deleted
    ↓
owned children deleted
```

Do not use cascade for shared records that can outlive one relationship.

A wrong cascade rule can turn a local deletion into unintended persistent data
loss.

### CORE-DATA-DELETE-003 — Use nullification only when the surviving state remains valid

A nullify relationship leaves the related object alive while removing the
relationship.

Ensure the resulting record is still valid.

For example, if:

```text
Child.parent
```

is required by the actual data contract, nullifying it during parent deletion
can create an invalid persisted state.

Do not choose nullify solely because preserving records seems safer.

### CORE-DATA-DELETE-004 — Use deny when deletion must be prevented by existing relationships

A deny rule can represent a persistence invariant such as:

```text
cannot delete parent while children still reference it
```

Use it when that restriction belongs to persistence behavior.

Do not use deny as a substitute for richer business authorization rules that
belong above persistence.

### CORE-DATA-DELETE-005 — Understand no-action responsibilities

A no-action rule places more responsibility on application logic to maintain
relationship consistency.

Use it only when the architecture intentionally owns that behavior.

Do not select it merely to avoid Core Data relationship updates.

## Uniqueness

### CORE-DATA-UNIQUE-001 — Define uniqueness when persistence owns identity uniqueness

When two persisted records must not represent the same unique key, a Core Data
uniqueness constraint may help express that invariant.

Examples can include:

```text
remote identifier
stable business identifier
externally unique key
```

Do not add uniqueness constraints without understanding:

- existing duplicate data
- merge policy
- insertion behavior
- synchronization behavior
- migration impact

A uniqueness constraint changes how conflicting inserts are reconciled.

### CORE-DATA-UNIQUE-002 — Do not replace business identity with Core Data object identity

An `NSManagedObjectID` identifies a Core Data record.

It does not necessarily represent domain uniqueness.

If the business contract says:

```text
customer.id is globally unique
```

model that identity explicitly rather than assuming two Core Data records cannot
represent the same business entity.

## Validation

### CORE-DATA-VALID-001 — Validate persistence invariants at the persistence boundary

Core Data validation is appropriate for rules required for a persisted object
to be structurally valid.

Examples can include:

- required values
- valid ranges
- valid relationships
- cross-property persistence constraints
- persistence-specific formatting requirements

Do not use Core Data validation as the sole location for every business rule.

Business operations may need validation before persistence is even involved.

### CORE-DATA-VALID-002 — Preserve validation failures

When Core Data rejects an object during validation or save, preserve enough
information for the owning layer to understand what failed.

Do not broadly catch validation failures and convert them into successful saves.

Translate them only at the boundary that owns the consumer-facing error
contract.

### CORE-DATA-VALID-003 — Validate before irreversible external side effects when practical

When an operation combines persistence with external side effects, validate
known local invariants before performing irreversible external work when the
architecture permits it.

Prefer:

```text
validate data
    ↓
perform operation
    ↓
persist
```

or another intentionally transactional sequence over discovering obvious
invalid state only after external mutation.

Not every persistence constraint can be validated safely ahead of save.

Keep final Core Data validation as authoritative for constraints owned by the
store/context.

## Custom validation

### CORE-DATA-VALID-010 — Keep custom validation deterministic

Custom managed-object validation should depend on data and relationships
available within the persistence contract.

Avoid validation whose result unpredictably depends on:

- network requests
- external mutable services
- UI state
- arbitrary asynchronous work

Such behavior usually belongs to a higher application boundary.

Core Data validation should remain suitable for save-time evaluation.

### CORE-DATA-VALID-011 — Avoid mutating unrelated state during validation

Validation should primarily determine whether the current state satisfies the
required invariant.

Do not use validation hooks as general lifecycle callbacks that mutate unrelated
objects or trigger external work.

Hidden mutation during validation makes save behavior difficult to reason
about and can create recursion or inconsistent transactions.

## Cross-property invariants

### CORE-DATA-VALID-020 — Validate related properties together when they form one persistence invariant

Some validity rules cannot be expressed by one attribute alone.

For example:

```text
startDate <= endDate
```

or:

```text
type == .remote
    requires
remoteIdentifier != nil
```

When such a rule belongs to persisted structural validity, validate the
complete invariant rather than validating individual fields independently.

Do not duplicate the same invariant across multiple setters when a coherent
object-level validation boundary represents it more reliably.

## Relationship validation

### CORE-DATA-VALID-030 — Validate relationship constraints at the owning persistence boundary

When a relationship requires specific cardinality or consistency beyond what
the model directly enforces, validate the meaningful invariant before save.

Examples can include:

```text
at least one owner
exactly one active configuration
no duplicate relationship roles
```

Do not add application-level relationship validation when Core Data already
expresses and enforces the required invariant adequately.

## Derived values

### CORE-DATA-DERIVED-001 — Persist derived data only when persistence benefits justify duplication

A value derivable from other persisted state does not automatically need its
own stored attribute.

Persisting derived data can be useful when:

- computation is expensive
- querying by the result matters
- historical value must be preserved
- synchronization requires the materialized value
- performance evidence justifies denormalization

It also introduces synchronization responsibility.

If:

```text
total = sum(items)
```

and both `total` and `items` are independently persisted, determine who keeps
them consistent.

Do not duplicate state without a concrete persistence reason.

### CORE-DATA-DERIVED-002 — Keep one authoritative representation of derived state

When a derived value is persisted, define when it is recomputed and who owns
that mutation.

Avoid:

```text
UI computes total
repository computes total
managed object computes total
importer writes total
```

independently.

Multiple writers make stale derived data likely.

## Transient properties

### CORE-DATA-TRANSIENT-001 — Use transient model properties only when their lifecycle matches Core Data object lifecycle

Transient properties are managed by the object model but are not persisted to
the store.

Use them when the value meaningfully belongs to the managed object's in-memory
lifecycle.

Do not use transient properties as arbitrary application state merely because a
managed object is already available.

State belonging to UI, workflow, networking, or unrelated application
responsibilities should remain at those boundaries.

## Transformable attributes

### CORE-DATA-TRANSFORM-001 — Use transformable storage deliberately

Transformable attributes can store values that do not map directly to standard
Core Data attribute types.

They introduce additional considerations around:

- serialization
- secure coding
- type evolution
- migration
- querying
- portability

Do not use transformable attributes as the default solution for structured
data.

If fields must be queried or migrated independently, modeling them explicitly
may provide a better persistence contract.

### CORE-DATA-TRANSFORM-002 — Treat transformable representation changes as persisted compatibility changes

Changing the serialized representation of a transformable value can make
existing stored values unreadable.

Do not change the Swift type or transformer and assume existing data will
automatically adapt.

Establish the compatibility or migration path when existing stores matter.

## Binary data

### CORE-DATA-BINARY-001 — Model binary payloads according to size and access behavior

Binary attributes can be appropriate for persisted opaque data.

Before storing substantial binary payloads directly in Core Data, consider:

- expected size
- access frequency
- memory behavior
- backup/synchronization implications
- whether the payload is queried
- whether external file storage is more appropriate

Do not apply a universal rule that binary data must always be either inside or
outside Core Data.

Choose according to actual persistence and lifecycle requirements.

## Normalization and denormalization

### CORE-DATA-MODEL-020 — Normalize where shared identity matters

Separate entities can be useful when several records intentionally reference
one persistent concept.

For example:

```text
Order → Customer
Invoice → Customer
```

can preserve one customer identity.

Do not duplicate the full customer payload into every record when those records
are expected to observe one shared persistent entity.

### CORE-DATA-MODEL-021 — Denormalize only with an explicit consistency strategy

Duplicating values can improve read simplicity or performance but creates
multiple representations of the same information.

When denormalizing, define:

- authoritative source
- update owner
- reconciliation behavior
- migration behavior
- stale-value expectations

Do not denormalize solely because joining relationships appears inconvenient.

## External identifiers

### CORE-DATA-ID-001 — Preserve external identity explicitly

When records synchronize with a server or another persistent system, model the
external identifier deliberately.

Do not use local Core Data object identity as a substitute unless the external
system explicitly understands that identity.

Consider whether the identifier must be:

- required
- optional until synchronization
- unique
- immutable
- namespaced by source

Model according to the synchronization contract.

### CORE-DATA-ID-002 — Handle unsynchronized records intentionally

If a local record can exist before receiving a remote identifier, represent that
state explicitly.

Do not invent placeholder remote IDs merely to satisfy a non-optional model
unless placeholders are part of the actual protocol.

A local identifier and remote identifier can be distinct concepts.

## Inheritance

### CORE-DATA-INHERIT-001 — Use entity inheritance only when persisted polymorphism is intentional

Entity inheritance can model related persisted types sharing common structure.

Do not introduce inheritance merely to remove duplicated attributes.

Consider:

- query behavior
- migration
- storage implications
- consumer polymorphism
- actual domain semantics

Composition or independent entities may be clearer when shared fields do not
represent true persisted substitutability.

## Model-generated source

### CORE-DATA-MODEL-030 — Keep the managed object model and generated declarations aligned

When source generation is enabled, the model is the authoritative schema input.

Do not manually alter generated properties to express a model change.

When source is maintained manually, ensure declarations remain compatible with
the configured model.

A mismatch between:

```text
.xcdatamodel
```

and:

```text
NSManagedObject subclass
```

can produce runtime failures even when Swift compilation succeeds.

## Model changes and existing stores

### CORE-DATA-MODEL-040 — Evaluate existing data before tightening constraints

Changes such as:

```text
optional → required
new uniqueness constraint
relationship cardinality restriction
new validation
```

may be valid for new records but incompatible with existing persisted data.

Before tightening a constraint, determine whether old stores contain records
that violate it.

If existing data must remain supported, migration or normalization may be
required.

Use the model-evolution reference for deeper migration reasoning.

## Queryability

### CORE-DATA-MODEL-050 — Model query-critical information explicitly

If consumers frequently need to:

```text
filter by value
sort by value
group by value
enforce uniqueness by value
```

consider whether that information should be represented explicitly in the Core
Data model rather than hidden in an opaque serialized payload.

Do not remodel data solely for hypothetical future queries.

Let demonstrated query requirements influence persistence structure.

## Security and sensitive values

### CORE-DATA-MODEL-060 — Treat persistence of sensitive data as an explicit product decision

Do not persist sensitive information merely because a field is available.

Determine:

- whether persistence is necessary
- expected lifetime
- protection requirements
- deletion requirements
- backup/synchronization behavior
- diagnostic exposure
- regulatory/project constraints

This reference does not define the application's security policy.

Follow project-specific security requirements for protected or sensitive data.

## Avoid model convenience fields

### CORE-DATA-MODEL-070 — Do not persist presentation-only state without a persistence requirement

Examples can include:

```text
isSelected
isExpanded
temporaryLoadingState
currentTab
formattedDisplayText
```

These typically belong to presentation/application state rather than the
persistent data model.

Persist them only when restoring that state across launches or sharing it across
persistence consumers is an intentional product requirement.

## Validation checklist

When the managed object model changes, verify when applicable:

- entity responsibility remains coherent
- attribute types match persisted semantics
- optionality represents valid persisted states
- defaults have intentional behavior for new versus existing records
- relationships have the correct cardinality
- inverse relationships represent the intended association
- ordered versus unordered semantics are intentional
- delete rules match ownership and surviving-state requirements
- uniqueness constraints do not conflict with existing data
- business identity and Core Data identity remain distinct where necessary
- persistence validation protects the correct invariants
- derived persisted values have one authoritative update strategy
- transformable values remain compatible with existing data
- generated/manual managed-object declarations match the model
- schema changes are evaluated against existing persistent stores
- presentation-only state is not being persisted accidentally

Do not treat successful compilation as proof that a Core Data model change is
safe for existing persisted data.