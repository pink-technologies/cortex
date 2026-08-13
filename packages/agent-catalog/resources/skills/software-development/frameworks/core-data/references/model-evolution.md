# Core Data Model Evolution

Use this reference when the task materially affects Core Data model versions,
entities, attributes, relationships, optionality, uniqueness, renaming,
persistent-store compatibility, lightweight migration, custom migration,
migration sequencing, or existing persisted data.

Project-specific persistence compatibility, versioning, and migration policies
take precedence over this generic guidance.

## Model evolution baseline

### CORE-DATA-EVOL-001 — Treat model changes as persisted compatibility changes

A Core Data model can outlive the application binary that created it.

When changing the model, reason about:

```text
previous application version
        ↓
existing persistent store
        ↓
new application version
        ↓
new managed object model
```

Do not evaluate a model change only by asking whether the new application can
create a fresh store.

When existing stores remain supported, the new model must have an intentional
path from the persisted state users already have.

### CORE-DATA-EVOL-002 — Distinguish source changes from schema changes

Changing Swift source is not necessarily a Core Data schema change.

Likewise, changing the managed object model can alter persisted compatibility
even if little Swift source changes.

Keep these boundaries separate:

```text
Swift model declarations
Core Data managed object model
persistent store schema
migration behavior
```

Do not infer migration safety solely from successful Swift compilation.

## Establish the migration contract

### CORE-DATA-EVOL-010 — Determine whether existing stores must remain supported

Before designing migration behavior, establish the compatibility requirement.

Possible contracts include:

```text
all released stores must migrate
only selected previous versions are supported
data is disposable and stores may be recreated
data is synchronized and can be rebuilt
migration is handled externally
```

Do not preserve historical stores indefinitely when the product does not require
it.

Do not destroy existing data merely because migration was not considered.

### CORE-DATA-EVOL-011 — Identify the actual released baseline

When migration matters, determine which model versions have actually shipped or
otherwise produced persistent stores that must remain readable.

Do not assume every model version present in the repository represents a
released compatibility boundary.

Development-only intermediate versions may not require production migration
support.

Likewise, do not omit a released version merely because current source no
longer references it directly.

## Versioned models

### CORE-DATA-EVOL-020 — Preserve historical models required for supported migration

When previous persistent stores must remain migratable, keep the model versions
required to describe those stores.

Avoid modifying an already released historical model in place.

Conceptually:

```text
Model V1   ← represents stores written by V1
Model V2   ← represents new schema
```

rather than:

```text
Model V1 modified until it looks like V2
```

Changing the historical model can make Core Data unable to identify or migrate
stores created by the original version.

### CORE-DATA-EVOL-021 — Make the current model version intentional

When using a versioned managed object model, ensure the intended destination
version is configured as current.

Do not create a new model version and assume the runtime automatically uses it
as the active destination.

Model versioning is part of build and persistence configuration.

## Lightweight migration

### CORE-DATA-MIG-001 — Prefer inferred migration when it correctly expresses the schema change

When Core Data can infer the transformation between supported source and
destination models, lightweight migration can provide the simplest migration
path.

Typical migration-friendly changes can include certain additions, removals,
renames, optionality/default changes, and relationship changes depending on the
complete models and migration configuration.

Do not classify a migration as lightweight solely from the apparent simplicity
of one edited property.

Evaluate the actual source and destination models.

### CORE-DATA-MIG-002 — Do not use lightweight migration as a synonym for safe migration

A migration can be structurally inferable and still produce incorrect product
data.

For example, adding a new attribute may be technically migratable while still
requiring a meaningful value for existing records.

Separate:

```text
Can Core Data transform the schema?
```

from:

```text
Will the resulting data satisfy the new product invariant?
```

Both must be correct.

## Added attributes

### CORE-DATA-MIG-010 — Define existing-record behavior for new attributes

When adding an attribute, determine what value existing records should have.

Consider:

- optionality
- model default
- migration-time derived value
- post-migration normalization
- absence as a legitimate state

Do not add a new required property without accounting for records created before
that property existed.

### CORE-DATA-MIG-011 — Do not confuse defaults for new objects with migration of old objects

A model or Swift initialization default used for newly inserted objects does not
automatically define the intended value for every existing persisted record.

Reason separately about:

```text
newly created object
```

and:

```text
object migrated from an older store
```

If historical records require a derived or normalized value, include that work
in the migration strategy.

## Removing attributes

### CORE-DATA-MIG-020 — Confirm that removed persisted information is intentionally discarded

Removing an attribute can permanently eliminate persisted information from the
new model.

Before removal, establish whether:

- the information is obsolete
- another property now owns the data
- consumers still require it
- migration must transform it first
- rollback to an older app version matters

Do not remove persisted data merely because the Swift property appears unused
in the currently inspected source.

## Renaming

### CORE-DATA-MIG-030 — Preserve schema identity when a declaration is renamed

A rename should not accidentally look like:

```text
delete old property
+
create unrelated new property
```

when the intent is:

```text
same persisted concept
+
new name
```

Use the model's supported renaming/migration mechanisms so the migration can
associate the old and new schema elements when required.

This applies to materially renamed:

- entities
- attributes
- relationships

Do not rely on matching data types alone to establish identity.

### CORE-DATA-MIG-031 — Distinguish schema rename from Swift-only rename

A Swift symbol can sometimes be renamed without changing the persisted schema
identity.

Likewise, a model property rename changes persistence metadata even when the
consumer-facing Swift concept remains equivalent.

Determine which boundary is actually changing before introducing a migration.

## Changing optionality

### CORE-DATA-MIG-040 — Treat optional-to-required as a data migration problem

Changing:

```text
optional
→
required
```

requires proving that every supported migrated record can satisfy the new
requirement.

Do not assume existing data contains a value merely because current application
code normally writes one.

Historical stores may contain:

- older records
- partially synchronized records
- records created before the invariant existed
- data written by extensions or other processes

Provide a valid normalization or migration path when necessary.

### CORE-DATA-MIG-041 — Required-to-optional can change domain semantics

Changing:

```text
required
→
optional
```

may be structurally easier to migrate but still broadens the set of valid
persisted states.

Ensure application code and business assumptions tolerate the newly permitted
absence if the product contract actually changes.

Do not weaken the model merely to make migration easier when `nil` is not a
valid persisted state.

## Changing attribute types

### CORE-DATA-MIG-050 — Treat type changes as data transformations

Changing the persisted representation of an attribute can require more than a
schema mapping.

Examples include:

```text
String → UUID-like representation
String → Date
Int32 → different semantic enum
transformable A → transformable B
```

Determine:

- whether existing values are convertible
- what happens to malformed historical values
- whether precision or meaning changes
- whether a custom transformation is required

Do not depend on Swift type conversion to migrate persistent-store values
automatically.

## Relationships

### CORE-DATA-MIG-060 — Evaluate relationship changes against existing object graphs

Changing relationships can affect persisted graph structure.

Relevant changes include:

- to-one ↔ to-many
- ordered ↔ unordered
- optionality
- destination entity
- inverse relationship
- relationship renaming
- delete rule
- cardinality restrictions

Determine what the existing relationship data should become in the new model.

Do not treat a relationship edit as merely changing the generated Swift
property type.

### CORE-DATA-MIG-061 — Preserve relationship meaning, not only record existence

A migration can technically retain all records while still producing an invalid
object graph.

Verify when applicable:

- intended parents remain associated
- children are not duplicated or orphaned
- order is preserved when order is semantic
- new required relationships are populated
- inverse relationships remain coherent

Migration correctness includes relationships between records, not just
individual attribute values.

## Delete rules

### CORE-DATA-MIG-070 — Treat delete-rule changes as behavioral compatibility changes

Changing a relationship delete rule may not require immediate transformation of
existing rows, but it changes future lifecycle behavior for persisted records.

Evaluate whether the new rule matches the intended ownership semantics.

For example:

```text
nullify → cascade
```

can turn future parent deletion into child deletion.

Do not classify such a change as harmless merely because migration opens the
store successfully.

## Uniqueness constraints

### CORE-DATA-MIG-080 — Validate existing data before adding uniqueness

Adding a uniqueness constraint can expose historical duplicate records.

Before enforcing the constraint, determine:

- whether duplicates already exist
- which record should survive
- whether records must be merged
- whether duplicates represent legitimate independent entities
- how future synchronization handles collisions

Do not depend on an arbitrary merge policy to resolve historical duplicates
without defining the intended identity semantics.

### CORE-DATA-MIG-081 — Normalize identity before enforcing stricter uniqueness

If existing data violates a new uniqueness invariant, perform intentional
normalization before or as part of the migration strategy.

Conceptually:

```text
existing duplicate data
        ↓
identify canonical records
        ↓
merge/relink/remove duplicates
        ↓
enforce new uniqueness contract
```

Do not add the constraint first and discover its semantics from migration
failures in production.

## Entity splitting

### CORE-DATA-MIG-090 — Treat splitting one entity into several as a semantic transformation

Changing:

```text
OldEntity
```

into:

```text
EntityA
EntityB
```

often requires deciding:

- which records create which destination entities
- how identity maps
- how relationships move
- whether one source record creates multiple destination records
- what happens to optional historical values

This usually requires deeper migration reasoning than a simple declaration
change.

Do not force such transformations through inferred migration if the intended
mapping cannot be represented safely.

## Entity merging

### CORE-DATA-MIG-100 — Define collision and identity semantics when combining entities

When several previous entities become one destination entity, determine:

- how identifiers map
- how overlapping fields combine
- how relationships are preserved
- how type-specific behavior is represented
- how duplicate destination identities are resolved

Do not merge schema concepts solely to simplify the new Swift type hierarchy
without accounting for persisted identity.

## Custom migration

### CORE-DATA-MIG-110 — Use custom migration when the transformation requires domain knowledge

A custom migration can be appropriate when the destination state cannot be
derived safely through ordinary inferred mapping.

Examples can include:

- complex data transformation
- entity splitting or merging
- normalization
- deduplication
- computed values derived from several source fields
- relationship reconstruction
- representation changes requiring domain logic

Do not introduce custom migration merely because it provides more control.

Custom migration creates additional code, testing, sequencing, and long-term
maintenance responsibility.

### CORE-DATA-MIG-111 — Keep custom migration deterministic

Migration should produce the same valid destination state from the same source
store.

Avoid migration logic that unpredictably depends on:

- network access
- current UI state
- unrelated live services
- uncontrolled wall-clock behavior
- mutable external configuration

When external reconciliation is necessary, separate durable schema migration
from later application-level synchronization when practical.

## Migration stages

### CORE-DATA-MIG-120 — Use staged migration when direct migration is not the supported path

Some schema evolutions are safer or only possible through intermediate models.

Conceptually:

```text
V1
 ↓
V2
 ↓
V3
```

instead of:

```text
V1 ─────────→ V3
```

when the intermediate transformation is required.

Do not assume every historical model can migrate directly to the newest model.

Define the supported migration graph explicitly when multiple versions matter.

## Skipped application versions

### CORE-DATA-MIG-130 — Support valid upgrade paths that skip releases

Users do not necessarily install every application version.

If the product promises migration from an older released store to the current
version, verify that a user can upgrade through the supported migration path
even when intermediate application releases were never installed.

For example:

```text
installed app produced V1
user skipped V2 release
current app uses V3
```

must still have an intentional migration path when V1 remains supported.

Do not test only:

```text
V2 → V3
```

if production users can legitimately arrive with V1 stores.

## Migration ordering

### CORE-DATA-MIG-140 — Complete schema migration before exposing incompatible persistence behavior

Do not allow new-model persistence operations to begin against a store whose
migration has not completed successfully.

A safe conceptual sequence is:

```text
identify store/model
        ↓
perform required migration
        ↓
load compatible persistent store
        ↓
expose persistence boundary
```

Do not report persistence readiness while migration is still unresolved unless
the architecture explicitly exposes a migration state.

## Store metadata

### CORE-DATA-MIG-150 — Determine store compatibility from model/store metadata rather than filename assumptions

A persistent store's filename or application version does not by itself prove
which managed object model created it.

When migration logic needs to identify compatibility, use the persistence
metadata and configured models appropriate to the project's stack.

Do not encode migration behavior from assumptions such as:

```text
database-v2.sqlite
therefore
model V2
```

unless that naming is itself an explicit and validated project contract.

## Failed migration

### CORE-DATA-MIG-160 — Preserve the original store when recovery requires it

When migration fails, avoid destructive actions that eliminate the only copy of
the user's data unless destructive recovery is explicitly authorized.

An appropriate recovery strategy may include:

- surfacing the failure
- retaining the original store
- retrying after a corrected migration
- restoring from a known backup
- rebuilding only when data is disposable

Do not delete the source store simply to make the new application launch.

### CORE-DATA-MIG-161 — Distinguish incompatible data from corrupt data

A store failing to open with the current model does not automatically mean the
store is corrupted.

The problem may instead be:

- missing migration configuration
- unsupported model version
- invalid model mapping
- deployment/configuration mismatch

Do not classify every store-loading failure as data corruption.

Diagnose the compatibility boundary first.

## Destructive migration

### CORE-DATA-MIG-170 — Use destructive recreation only for intentionally disposable data

Deleting and recreating a store can be appropriate for persistence that is
explicitly reconstructable, such as some caches.

Before destructive recreation, establish:

- whether the data has another authoritative source
- whether reconstruction is complete
- whether unsynchronized local state exists
- whether user-created information would be lost
- whether the product explicitly permits reset

Do not make destructive migration the generic fallback for migration failure.

## Synced data

### CORE-DATA-MIG-180 — Do not assume server synchronization makes local stores disposable

A synchronized store can still contain local information not yet reflected
remotely.

This may include:

- pending uploads
- locally created records
- local-only metadata
- sync progress
- conflict state

Before rebuilding a synchronized store, establish which data is authoritative
and whether all required state can actually be reconstructed.

## Transformable attributes

### CORE-DATA-MIG-190 — Treat transformable representation evolution separately from model compatibility

A Core Data model may remain structurally compatible while the serialized
payload inside a transformable attribute changes incompatibly.

When changing:

- transformer
- encoded class
- serialized schema
- secure-coding representation

determine whether old persisted payloads remain decodable.

Do not assume Core Data schema migration automatically migrates application-
defined serialized contents.

## External files and related persistence

### CORE-DATA-MIG-200 — Include external persisted resources in migration reasoning

Some persistence models reference data outside the main Core Data store.

Examples can include:

- file paths
- external binary resources
- application-managed attachments
- cached assets with persistent references

When schema migration changes those references, ensure the related resources
remain coherent.

A successful Core Data migration is not sufficient if migrated records point to
invalid external resources.

## Derived data

### CORE-DATA-MIG-210 — Recompute persisted derived data when its definition changes

If a persisted attribute is derived from other state and the derivation changes,
existing values may become stale even when the schema itself remains compatible.

Determine whether the new version should:

- preserve historical derived values
- recompute them during migration
- recompute lazily
- remove the duplicated value

Do not assume schema compatibility means behavioral data compatibility.

## Data normalization

### CORE-DATA-MIG-220 — Separate schema migration from data normalization when useful

Some changes require both:

```text
schema transformation
+
data correction/normalization
```

These can occur in one migration or in intentionally sequenced phases.

Keep the boundary explicit.

Do not hide substantial business-data rewriting inside an apparently trivial
model-version bump without tests and ownership.

## Application-level reconciliation

### CORE-DATA-MIG-230 — Use post-migration reconciliation for behavior that does not belong to schema migration

Not every upgrade transformation belongs inside Core Data migration.

Application-level reconciliation can be more appropriate when the work:

- depends on current application policy
- can occur incrementally
- uses external services
- is recoverable independently
- is not necessary to open the persistent store safely

Keep schema migration focused on reaching a valid destination persistence
model.

Then run higher-level reconciliation through its own owned workflow when
appropriate.

## Idempotency

### CORE-DATA-MIG-240 — Make restartable migration/reconciliation stages safe to repeat where possible

Application upgrade can be interrupted by:

- process termination
- crash
- device shutdown
- insufficient storage
- operational failure

When migration-related work occurs outside Core Data's atomic migration
mechanism, define what happens if it runs again.

Use:

- completion markers
- versioned normalization state
- idempotent transformations
- transactional checkpoints

when the operation can otherwise produce duplicate or partially repeated work.

Do not mark a migration stage complete before its corresponding transformation
has completed successfully.

## Migration and concurrency

### CORE-DATA-MIG-250 — Do not run incompatible persistence operations concurrently with migration

Migration changes the persistence schema underlying later operations.

Avoid allowing ordinary reads/writes to race the migration of the same store
unless the persistence architecture explicitly supports such behavior.

Treat migration/startup coordination as part of persistence readiness.

Use the Core Data concurrency reference when tasks or contexts can overlap
initialization.

## Migration and CloudKit/external synchronization

### CORE-DATA-MIG-260 — Respect synchronization-specific schema constraints

When Core Data participates in CloudKit or another synchronization system,
model evolution may have requirements beyond ordinary local-store migration.

Follow the project's synchronization and deployment rules.

Do not assume a schema transformation safe for a local SQLite store is
automatically safe for every external synchronization backend.

Keep generic Core Data migration guidance subordinate to the actual
synchronization contract.

## Compatibility versus rollback

### CORE-DATA-MIG-270 — Distinguish forward migration from downgrade compatibility

Successfully migrating:

```text
old store → new model
```

does not imply an older application can reopen the migrated store.

If application rollback or downgrade is a supported operational scenario,
evaluate that separately.

Do not promise bidirectional compatibility merely because forward migration
works.

## Model-version cleanup

### CORE-DATA-MIG-280 — Remove historical model versions only when no supported store requires them

Old model versions can appear unused by current application source while still
being required to migrate historical persistent stores.

Before deleting one, determine whether any supported upgrade path uses it.

Do not perform model-version cleanup as ordinary dead-code deletion.

Historical models can be compatibility artifacts.

## Testing baseline

### CORE-DATA-TEST-001 — Test migration from real source-model state

Migration tests should begin with a store representing the old supported model.

Conceptually:

```text
source model
     ↓
populate representative old data
     ↓
persist source store
     ↓
open/migrate with destination stack
     ↓
verify destination state
```

Do not create data using the destination model and call that a migration test.

### CORE-DATA-TEST-002 — Validate migrated data, not only store opening

A migration test that proves only:

```text
persistent store loaded
```

is incomplete when behavior depends on transformed data.

Verify relevant:

- values
- relationships
- identities
- defaults
- optionality
- uniqueness
- derived state
- deleted/retained records

according to the migration contract.

### CORE-DATA-TEST-003 — Test every supported source version

When the current application supports migration from several released model
versions, include representative coverage for those supported paths.

For example:

```text
V1 → current
V2 → current
V3 → current
```

when all remain valid upgrade origins.

Do not assume testing only the immediately previous model proves older upgrade
paths.

### CORE-DATA-TEST-004 — Include data that exercises the changed invariant

Migration fixtures should include records relevant to the schema change.

For example, when changing optionality, include:

```text
record with value
record without value
```

when both were valid historically.

When adding uniqueness, include representative historical duplicates if those
could exist.

Avoid fixtures containing only ideal modern data.

## Representative fixtures

### CORE-DATA-TEST-010 — Preserve historical behavior in migration fixtures

A useful migration fixture represents data the old application could actually
produce.

Do not populate old stores using assumptions introduced only by the new model.

Fixtures should exercise the previous contract.

This can include:

- old defaults
- missing fields
- old relationship structures
- old serialized formats
- previously permitted duplicates

according to the changed behavior.

## Migration regression tests

### CORE-DATA-TEST-020 — Add regression coverage for migration defects

When fixing a migration bug, preserve a fixture or setup that recreates the
failing historical state.

The regression test should fail if the defective migration behavior is
reintroduced.

Do not test only the newly corrected happy path when the bug depended on a
specific previous-store condition.

## Validation checklist

When a Core Data model evolves, verify when applicable:

- the actual supported source model versions are known
- released historical models required for migration remain unchanged
- the intended destination model is current
- existing stores have an intentional migration path
- lightweight migration is used only when it represents the actual
  transformation
- new required fields have values for historical records
- removed fields contain no data that must be transformed first
- renamed entities/properties preserve schema identity when required
- optionality changes account for historical data
- attribute type changes have a valid value transformation
- relationship changes preserve the intended object graph
- delete-rule changes are reviewed as lifecycle behavior
- uniqueness constraints account for existing duplicates
- custom migration is used only when inferred migration cannot safely express
  the transformation
- users skipping application releases can still follow supported upgrade paths
- migration failure does not silently destroy authoritative data
- synced data is not assumed disposable without proof
- transformable payload evolution is compatible independently from model
  evolution
- post-migration reconciliation has explicit ownership when required
- historical model versions are not removed while supported stores depend on
  them
- tests begin from representative source-model stores
- migration tests validate resulting data, not only successful store loading
- every supported migration origin has appropriate coverage

Do not classify a Core Data model evolution as safe solely because a fresh
installation, empty store, or current-model test passes.