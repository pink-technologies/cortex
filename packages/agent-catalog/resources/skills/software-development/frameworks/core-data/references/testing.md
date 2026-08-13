# Core Data Testing

Use this reference when the task materially affects Core Data persistence tests,
context behavior, fetches, saves, relationships, merge behavior, conflicts,
background work, migration, store configuration, or persistence regressions.

Use the generic testing skill for test methodology such as regression design,
test levels, deterministic async testing, test doubles, and validation
reporting.

This reference owns the Core Data-specific testing concerns.

Project-specific test infrastructure, fixtures, store configuration, and
persistence architecture take precedence over this generic guidance.

## Testing baseline

### CORE-DATA-TEST-001 — Test persistence behavior, not Core Data itself

Tests should protect application-specific persistence contracts.

Useful behavior can include:

- insertion
- fetching
- updates
- deletion
- relationships
- delete rules
- validation
- uniqueness
- save behavior
- merge behavior
- conflict resolution
- background persistence
- synchronization boundaries
- migration
- stale-state handling

Do not add tests merely to prove that standard Core Data APIs behave as
documented.

For example, a test proving that:

```swift
context.hasChanges == true
```

after an ordinary property mutation usually adds little value unless the
application depends on a custom behavior around that state.

Test the contract your persistence layer adds.

## Choose a representative test boundary

### CORE-DATA-TEST-010 — Use the smallest persistence boundary that proves the behavior

A test should include enough of Core Data to exercise the behavior it claims to
protect.

For persistence logic, this often means using a real:

```text
NSManagedObjectModel
+
NSPersistentStoreCoordinator / NSPersistentContainer
+
NSManagedObjectContext
```

rather than mocking Core Data internals.

Do not replace context, fetch, save, or relationship behavior with mocks when
the test specifically claims to verify persistence behavior.

### CORE-DATA-TEST-011 — Use broader integration tests when context interaction is the contract

A single-context test is insufficient when correctness depends on:

```text
context A
    ↓
save
    ↓
store
    ↓
context B
    ↓
merge/refetch
```

Likewise, migration behavior requires an actual source store and destination
model.

Choose a test boundary that includes every persistence component required by
the observable contract.

## Test stack

### CORE-DATA-TEST-020 — Build test persistence stacks intentionally

A test Core Data stack should make its persistence assumptions explicit.

Determine:

- managed object model
- store type
- store location
- migration configuration
- context topology
- merge policies
- automatic merge behavior
- persistent-history configuration
- CloudKit or external synchronization behavior when relevant

Do not rely on whatever default configuration happens to be convenient if the
behavior under test depends on different production settings.

### CORE-DATA-TEST-021 — Keep test stacks isolated

Each test or intentionally shared test scope should operate against independent
persistence state unless cross-test sharing is explicitly part of the test
architecture.

Avoid accidental dependence on:

- previous test data
- previous context state
- another test's store
- execution order
- shared mutable singleton stacks

A test should produce the same result when:

```text
run alone
run after another test
run in a different suite order
```

unless its contract explicitly tests shared persistence.

## In-memory stores

### CORE-DATA-TEST-030 — Use in-memory stores when they represent the contract being tested

In-memory stores are useful for many tests involving:

- ordinary insertion
- fetch predicates
- relationships
- validation
- context saves
- basic merge behavior
- repository logic

They provide fast isolated persistence without filesystem cleanup.

Do not assume they are representative of every production behavior.

### CORE-DATA-TEST-031 — Use the production-relevant store type when store behavior matters

An in-memory store is not sufficient evidence for behavior that depends on:

- SQLite persistence
- store files
- process restart
- migration from an existing SQLite store
- filesystem errors
- store metadata
- WAL behavior
- persistent history characteristics
- external binary resources
- store corruption or incompatibility

When the contract materially depends on the production store type, test against
a representative temporary persistent store.

Use the smallest representative environment, not necessarily the fastest one.

## Temporary persistent stores

### CORE-DATA-TEST-040 — Give disk-backed test stores unique temporary locations

When a test requires a persistent store on disk, create it in an isolated
temporary location.

Avoid fixed shared paths such as:

```text
/tmp/test.sqlite
```

when tests can execute concurrently.

Use a unique directory or identifier for each independently owned test stack.

### CORE-DATA-TEST-041 — Clean up all store artifacts

A disk-backed Core Data store may involve more than one file.

Do not assume deleting only:

```text
database.sqlite
```

always removes every store artifact.

Prefer destroying/removing the persistent store through the persistence stack
or deleting the entire uniquely owned temporary directory after the store has
been closed.

Cleanup should not race active contexts or coordinators.

## Model loading

### CORE-DATA-TEST-050 — Load the model used by the code under test

Do not silently construct a simplified test model that omits constraints,
relationships, defaults, indexes, or delete rules relevant to the production
behavior.

A different model can make invalid production behavior appear correct.

When practical, use the same managed object model resource or model-construction
path as production.

A custom minimal model is appropriate when the test intentionally isolates a
small persistence component and the reduced schema fully represents its
contract.

## Persistence readiness

### CORE-DATA-TEST-060 — Await store readiness deterministically

If persistent-store initialization is asynchronous, do not begin the test based
on timing assumptions.

Prefer:

```text
construct stack
    ↓
await required store loading
    ↓
start test behavior
```

Do not use:

```swift
sleep(...)
```

to give the store "enough time" to load.

The test should synchronize with the actual initialization contract.

## Managed-object lifetime

### CORE-DATA-TEST-070 — Exercise objects through their owning context

Test code must obey the same context ownership rules as production code.

Do not make a test simpler by reading or mutating managed objects outside their
owning context when production code is expected to respect confinement.

A test that violates Core Data's ownership contract can hide production defects
or introduce failures unrelated to the behavior under test.

### CORE-DATA-TEST-071 — Do not leak managed objects between test contexts

When a test involves multiple contexts, transfer:

- object IDs
- stable identifiers
- independent values

instead of passing one context's managed-object instance into another.

The test should model the intended production boundary accurately.

## Fixtures

### CORE-DATA-TEST-080 — Create fixtures through intentional persistence APIs

A fixture should establish only the state needed by the scenario.

Depending on the test, setup can use:

- direct context insertion
- repository APIs
- factories
- fixture builders
- source-model stores for migration

Use the lowest boundary that preserves the contract being tested.

For example, a repository fetch test may insert fixture records directly into a
context rather than exercising an unrelated application workflow.

### CORE-DATA-TEST-081 — Keep persistence fixtures behaviorally meaningful

Prefer fixtures that express domain-relevant states.

For example:

```text
active record
archived record
record missing optional value
record with related children
```

is more useful than creating many arbitrary records with meaningless values.

Fixture values should make assertions understandable.

### CORE-DATA-TEST-082 — Avoid oversized default fixtures

Do not populate every test with a complete production-like object graph.

Large generic fixtures:

- slow tests
- obscure the relevant state
- increase accidental coupling
- make failures harder to diagnose

Build the smallest data graph that exercises the required persistence behavior.

Use larger representative datasets only when scale or query behavior is itself
under test.

## Inserts

### CORE-DATA-TEST-090 — Verify inserted state at the required durability boundary

If the contract is:

```text
object exists in current context
```

an unsaved insertion may be sufficient.

If the contract is:

```text
object persists and can be observed by a new context
```

the test must cross the save/store boundary.

Do not claim persistence based only on inspecting the same managed object that
was inserted.

For durable behavior, prefer:

```text
insert
  ↓
save
  ↓
new context / refetch
  ↓
assert persisted state
```

when that matches the production contract.

## Fetches

### CORE-DATA-TEST-100 — Assert fetch semantics, not implementation details

When testing a fetch, verify relevant behavior such as:

- included records
- excluded records
- ordering
- fetch limit
- uniqueness
- result representation

Do not assert private predicate construction or helper invocation when the
observable fetch result proves the behavior.

### CORE-DATA-TEST-101 — Include records that challenge the predicate

A predicate test should include both:

```text
matching records
```

and:

```text
non-matching records
```

when exclusion is part of the contract.

A test containing only matching records cannot prove that filtering works.

For compound predicates, include representative boundary cases when they are
material to the behavior.

## Ordering

### CORE-DATA-TEST-110 — Make ordering assertions only when ordering is part of the contract

If a fetch promises:

```text
newest first
alphabetical order
explicit position order
```

assert that behavior.

Do not assert incidental fetch order when the persistence contract does not
guarantee one.

For unordered relationships, avoid converting the result into an array and
asserting an arbitrary sequence.

## Updates

### CORE-DATA-TEST-120 — Verify persisted updates through an independent observation boundary when durability matters

A test such as:

```swift
object.name = "New"
XCTAssertEqual(object.name, "New")
```

proves ordinary property mutation, not persistence.

When the behavior promises persisted update:

```text
mutate
  ↓
save
  ↓
resolve/refetch
  ↓
assert
```

through an appropriate context.

Do not over-expand tests when only local unsaved mutation is actually the
contract.

## Deletion

### CORE-DATA-TEST-130 — Verify deletion through the relevant persistence boundary

When deletion should be durable, verify the record cannot be fetched after the
appropriate save.

Also test related records when delete rules are material.

Do not infer correct deletion solely because:

```swift
context.deletedObjects.contains(object)
```

if consumer behavior depends on the persisted result.

## Delete rules

### CORE-DATA-TEST-140 — Test application-relevant delete-rule behavior

When changing or relying on:

```text
cascade
nullify
deny
no action
```

create the relevant relationship graph and verify the resulting state.

Examples:

```text
delete parent
    ↓
child removed
```

for intentional cascade behavior.

Or:

```text
delete parent
    ↓
child survives
    ↓
relationship cleared
```

for intentional nullification.

Do not test every Core Data delete rule generically.

Test the relationships whose product behavior depends on them.

## Relationships

### CORE-DATA-TEST-150 — Verify both relationship structure and persistence when relevant

When a relationship is part of the contract, verify:

- expected related records
- cardinality
- inverse consistency when relevant
- ordering when intentionally ordered
- behavior after save/refetch

Do not assert only that one side's generated property changed when persistence
depends on the complete graph.

## Validation

### CORE-DATA-TEST-160 — Test persistence invariants at the save/validation boundary

When the managed object model or custom validation rejects invalid state,
construct representative invalid data and assert the meaningful failure.

Verify:

- failure occurs at the intended boundary
- valid records still succeed
- error classification/context is preserved when the application contract
  depends on it

Do not only test the valid path for newly introduced persistence constraints.

### CORE-DATA-TEST-161 — Test boundary values for changed validation rules

If a model introduces constraints such as:

```text
minimum
maximum
required value
relationship cardinality
cross-property invariant
```

include relevant boundary cases.

Do not create exhaustive combinatorial tests when only a few meaningful
boundaries define the invariant.

## Uniqueness

### CORE-DATA-TEST-170 — Verify the intended duplicate-record behavior

When uniqueness constraints or duplicate reconciliation are material, create
competing records representing the same unique identity.

Assert the product's intended behavior:

- duplicate rejected
- existing record updated
- records reconciled
- particular side wins

Do not assert merely that `save()` succeeds when the important question is
which record/value remains authoritative.

## Save failures

### CORE-DATA-TEST-180 — Verify failure and context state after a failed save

When production behavior handles save failure, test both:

```text
reported error
```

and, when relevant:

```text
context state afterward
```

The contract may require:

- pending changes preserved
- rollback
- failed operation state
- retryability
- cleanup

Do not assert only that an error was thrown if recovery depends on the resulting
context state.

## Rollback

### CORE-DATA-TEST-190 — Test rollback at the transaction scope it actually affects

If rollback is part of recovery, include any unrelated pending changes that
matter to the contract.

This can reveal accidental transaction boundaries where rolling back one
operation also discards another.

Do not add complicated rollback tests when the architecture intentionally uses
one operation per context and the scope is already unambiguous.

## Multiple contexts

### CORE-DATA-TEST-200 — Use multiple real contexts for cross-context behavior

When production behavior depends on separate contexts, tests should use separate
contexts.

For example:

```text
background context
        ↓
write + save
        ↓
view context
        ↓
merge/refetch
        ↓
expected state
```

Do not simulate this behavior with two variables referencing the same context.

### CORE-DATA-TEST-201 — Verify the receiving context, not only the writer

A background-save test that asserts only the writer's state does not prove that
the consumer receives the update.

When merge behavior matters, assert from the context that production consumers
actually use.

## Automatic merging

### CORE-DATA-TEST-210 — Test automatic merge behavior through observable state

When a context is configured to merge changes automatically:

1. establish initial state in the receiving context
2. write from the external/background context
3. save
4. synchronize with the expected merge boundary
5. assert receiving-context state

Do not manually refresh or refetch in the test if production behavior claims
automatic merging handles the update.

Doing so would bypass the contract being tested.

## Explicit merging

### CORE-DATA-TEST-220 — Exercise the actual explicit merge mechanism

If production uses:

- save notifications
- object-ID change dictionaries
- persistent history
- custom synchronization

the test should exercise that mechanism.

Do not call `refresh` manually simply to make the expected value appear if
production is supposed to merge changes another way.

## Merge policies

### CORE-DATA-TEST-230 — Assert conflict outcomes, not only successful saves

When merge policy matters, construct conflicting writes.

For example:

```text
context A reads value V1
context B reads value V1

A writes V2
B writes V3

A saves
B saves
```

Then assert the intended final value.

The important contract is:

```text
which state wins?
```

not merely:

```text
did both save calls return?
```

### CORE-DATA-TEST-231 — Keep conflict ordering deterministic

Do not rely on two uncontrolled concurrent saves and hope they race in the
desired order.

Control:

- initial reads
- mutations
- save ordering
- merge point

so the conflict condition is reproducible.

Use the generic testing and Swift Concurrency guidance for deterministic
coordination.

## Stale state

### CORE-DATA-TEST-240 — Reproduce stale state with independent contexts

When testing stale-state bugs:

```text
context A loads record
context B updates record
context B saves
context A still owns older state
```

is a representative setup.

Then exercise the production reconciliation behavior.

Do not fake staleness by manually overwriting properties on one object if the
bug is specifically about cross-context synchronization.

## Background work

### CORE-DATA-TEST-250 — Await the operation's actual persistence completion

For background persistence operations, synchronize with the operation's real
completion boundary.

Do not use arbitrary delays such as:

```swift
try await Task.sleep(...)
```

as evidence that background Core Data work has probably finished.

Await:

- the async operation
- an explicit completion
- an observable state transition
- another deterministic synchronization point

according to the production contract.

## Context confinement

### CORE-DATA-TEST-260 — Do not rely on concurrency violations to test confinement

Testing that intentionally accesses managed objects from incorrect execution
boundaries can produce framework diagnostics or undefined timing rather than a
stable behavioral test.

Prefer testing the application's boundary:

```text
does this API transfer identity/value correctly?
```

rather than deliberately violating Core Data confinement and expecting a
particular crash or warning.

Framework-debug assertions can support development diagnostics but are usually
not the primary regression contract.

## Async persistence

### CORE-DATA-TEST-270 — Assert persisted outcomes after async workflows

For an operation such as:

```text
read persistent state
    ↓
await external operation
    ↓
apply result
    ↓
save
```

test the resulting persistent state, including stale-work protection when
material.

Do not stop the assertion at:

```text
external service was called
```

when the operation's contract includes persistence.

## Cancellation

### CORE-DATA-TEST-280 — Test cancellation at meaningful persistence stages

When cancellation affects persistence, construct the stage the contract cares
about.

Examples:

```text
cancel before mutation
→ no persistent change
```

```text
cancel after local mutation but before save
→ changes discarded when contract requires
```

```text
cancel after durable save
→ committed data remains
```

Do not assume task cancellation means Core Data automatically rolled back.

The test should establish the intended persistent outcome.

## Stale asynchronous work

### CORE-DATA-TEST-290 — Control completion order explicitly

When older asynchronous work must not overwrite newer state, create the
ordering deliberately:

```text
operation A reads state
operation B reads state
B completes and persists
A completes later
```

Assert that A cannot overwrite B when B is authoritative.

Do not rely on scheduler timing to create the race.

## Batch operations

### CORE-DATA-TEST-300 — Verify both store mutation and active-context reconciliation

For a batch update or delete, test:

```text
store-level operation
        ↓
persistent data changed
```

and, when required:

```text
active consumer context
        ↓
reconciled state
```

Do not assert only the batch operation's reported affected count when the
product relies on already-registered managed objects becoming consistent.

## Fetch performance behavior

### CORE-DATA-TEST-310 — Do not over-specify query implementation in correctness tests

Avoid tests coupled to details such as:

- exact number of internal Core Data faults
- private fetch-helper calls
- exact SQL text
- incidental query implementation

unless those details are intentionally part of a performance or diagnostics
test.

Correctness tests should assert persisted results.

Use dedicated performance instrumentation for query efficiency.

## Large datasets

### CORE-DATA-TEST-320 — Use representative volume only when scale affects the contract

Do not create tens of thousands of managed objects in every persistence test.

Use large fixtures when testing behavior such as:

- batching
- import scalability
- memory growth
- pagination
- query performance
- batch operations

Ordinary behavioral tests should remain small and focused.

## Migration

### CORE-DATA-TEST-330 — Migration tests must start from a source-model store

A migration test should represent:

```text
old managed object model
        ↓
old persistent store
        ↓
destination stack/model
        ↓
migration
```

Do not create the test store with the destination model and call that migration
coverage.

### CORE-DATA-TEST-331 — Populate source stores through the source model

Migration fixtures should represent data the old application could actually
persist.

Use the source model to create:

- old attributes
- old relationships
- old optional states
- old defaults
- historical duplicates
- old serialized representations

when materially relevant.

Do not construct historical data using assumptions that exist only in the
destination model.

### CORE-DATA-TEST-332 — Verify migrated values and relationships

Successful store opening is only one migration assertion.

When the migration transforms behavior, verify:

- values
- identities
- relationships
- cardinality
- defaults
- required fields
- uniqueness
- deleted or preserved records
- transformed payloads

according to the intended destination contract.

### CORE-DATA-TEST-333 — Cover every supported migration origin

If production users can arrive with:

```text
V1
V2
V3
```

stores and the current model is V4, test the supported migration origins
according to project policy.

Do not assume:

```text
V3 → V4 passes
```

therefore:

```text
V1 → V4 works
```

Users can skip application releases.

## Migration fixtures

### CORE-DATA-TEST-340 — Preserve representative historical fixtures when they protect released compatibility

A persisted source-store fixture can provide strong regression protection when
historical schema behavior is difficult to recreate accurately in code.

Keep such fixtures when they represent a supported released version.

Do not regenerate historical fixtures from the newest model because doing so
destroys their value as compatibility evidence.

### CORE-DATA-TEST-341 — Keep historical fixtures minimal and intentional

A migration fixture should contain enough data to exercise the migration
contract.

Avoid committing unnecessarily large persistent stores containing unrelated
data.

Include cases relevant to:

- changed attributes
- relationships
- optionality
- uniqueness
- transformables
- previous defaults

according to the migration being protected.

## Transformable attributes

### CORE-DATA-TEST-350 — Test decoding of previously persisted transformable representations

When a transformable payload or transformer changes, create data using the
previous supported representation and verify the current application can read
or migrate it.

A fresh write/read round trip using only the new representation does not prove
backward persistence compatibility.

## Persistent history

### CORE-DATA-TEST-360 — Test history processing from durable transaction state

When persistent history is part of synchronization, test the meaningful
workflow:

```text
writer commits transaction
        ↓
history consumer fetches unseen history
        ↓
processes transaction
        ↓
advances token
```

Assert the resulting consumer state and token behavior.

Do not test only that a history-fetch API returns a non-empty result.

### CORE-DATA-TEST-361 — Test replay when history processing is expected to be restartable

If processing can restart after failure, verify that replay does not create
incorrect duplicate effects.

For example:

```text
process transaction
fail before checkpoint
restart
process same transaction again
```

should produce the intended final behavior.

Do not assume exactly-once delivery unless the architecture guarantees it.

## Test doubles

### CORE-DATA-TEST-370 — Mock above Core Data when the test does not concern persistence

A feature test that only needs:

```text
load users
save preference
delete item
```

does not necessarily need a real Core Data stack if persistence behavior itself
is outside the test contract.

Use the project's repository/store abstraction or another appropriate test
double.

Conversely, when testing the Core Data implementation of that abstraction, use
real Core Data behavior rather than mocking the framework internals.

This creates a useful boundary:

```text
feature behavior
→ persistence abstraction may be doubled

Core Data adapter behavior
→ use representative Core Data stack
```

## Repository tests

### CORE-DATA-TEST-380 — Verify repository contracts through persisted behavior

For a repository backed by Core Data, useful tests can assert:

- correct records returned
- values persisted
- updates replace intended records
- deletion affects intended entities
- identity mapping is correct
- background writes become observable
- errors are translated appropriately

Do not bind repository tests to private helper methods or exact fetch-request
construction unless that construction is itself part of the supported
repository behavior.

## Failure injection

### CORE-DATA-TEST-390 — Inject failures at an owned seam

Some persistence failures are difficult to reproduce reliably using a real
store.

When production code has an intentional persistence abstraction or context/save
seam, a controlled failure can be injected there to test:

- error translation
- application state recovery
- retry policy
- rollback ownership

Do not distort the production architecture solely to make every possible
Core Data error injectable.

Use real Core Data failures when they can be reproduced deterministically and
representatively.

## Test cleanup

### CORE-DATA-TEST-400 — Release persistence ownership before deleting test resources

Before removing a temporary store directory, ensure contexts, persistent store
coordinators, and other owners no longer actively use that store.

Avoid cleanup races where:

```text
test ends
    ↓
files deleted
    ↓
background context still saving
```

Such failures can appear intermittent and unrelated.

Await all owned persistence work before teardown.

## Parallel test execution

### CORE-DATA-TEST-410 — Make persistence tests safe under parallel execution

When the test runner may execute tests concurrently, avoid shared:

- persistent-store paths
- singleton containers
- global context state
- fixture directories
- migration outputs

unless the suite deliberately serializes access.

A persistence test that passes only with test parallelization disabled has an
ownership problem unless serialization is an intentional suite requirement.

## Do not use production stores

### CORE-DATA-TEST-420 — Never point ordinary automated tests at production user data

Tests should use isolated stores and fixtures.

Do not depend on:

- a developer's application store
- device user data
- cloud production data
- shared mutable staging persistence

unless the test is explicitly designed as a controlled environment integration
test with appropriate safeguards.

Ordinary test execution should be destructive only to resources it owns.

## Determinism

### CORE-DATA-TEST-430 — Remove timing assumptions from persistence tests

Avoid tests that depend on:

```text
wait 0.5 seconds
then fetch
```

to allow:

- saves
- merges
- notifications
- background tasks
- persistent history

to complete.

Synchronize with the actual event or operation.

Timing-based waits can hide ordering defects while making the suite flaky.

## Error assertions

### CORE-DATA-TEST-440 — Assert meaningful persistence failure semantics

When the application translates Core Data failures, test the stable error
contract rather than brittle implementation strings.

Prefer asserting:

```text
expected error category
+
relevant associated context
+
expected final state
```

over:

```text
exact localized error description
```

unless the string itself is intentionally consumer-facing behavior.

## Regression testing

### CORE-DATA-TEST-450 — Reproduce the original persistence failure

For a Core Data bug fix, preserve the condition that triggered the defect.

Examples include:

- stale context after background save
- missing inverse relationship
- wrong delete rule
- duplicate synchronization record
- save failure leaving invalid state
- temporary object ID escaping
- migration of historical `nil`
- old transformable payload failing to decode

The regression test should fail if the defect is reintroduced.

Do not create a test that merely runs the corrected code path without proving
the previously incorrect outcome.

## Performance tests

### CORE-DATA-TEST-460 — Keep persistence benchmarks separate from ordinary correctness tests

Use performance tests when the requirement concerns:

- fetch latency
- import throughput
- batch update cost
- migration duration
- memory growth

Do not put fragile machine-dependent time limits into ordinary unit tests
unless timing is itself part of the supported contract.

### CORE-DATA-TEST-461 — Benchmark representative persistence conditions

Performance measurements should use:

- relevant store type
- representative data volume
- representative relationship shape
- realistic query predicates
- relevant indexes

An empty in-memory store is not evidence for production SQLite performance.

## Debugging support

### CORE-DATA-TEST-470 — Preserve failure diagnostics without exposing persisted secrets

When persistence tests fail, useful diagnostics can include:

- context role
- object ID
- entity
- operation
- insertion/update/delete state
- underlying error category
- migration source/destination version

Avoid dumping complete managed objects or sensitive fixture payloads without a
reason.

Diagnostics should make the failing persistence contract understandable.

## What not to test

### CORE-DATA-TEST-480 — Avoid tests with no application-specific contract

Usually low-value examples include tests proving only that:

```text
NSManagedObjectContext can insert an object
NSFetchRequest can return inserted objects
hasChanges becomes true
Core Data supports relationships
```

when no custom application behavior is involved.

Focus instead on:

```text
our model constraint
our repository query
our merge policy
our migration
our synchronization behavior
our error mapping
our lifecycle contract
```

## Validation checklist

When Core Data tests are added or changed, verify when applicable:

- the test uses a persistence boundary representative of the behavior
- Core Data itself is not mocked when persistence semantics are under test
- test stores are isolated
- the model matches the relevant production model
- store readiness is synchronized deterministically
- managed objects remain within their owning contexts
- persistent assertions cross a save/refetch boundary when durability matters
- fetch tests include both matching and non-matching records
- ordering assertions represent an actual contract
- relationships and delete rules are verified through persisted state when
  required
- save-failure tests assert relevant resulting context state
- cross-context behavior uses multiple contexts
- merge tests assert from the receiving context
- conflicts use controlled ordering
- background work is awaited rather than delayed heuristically
- cancellation tests assert persistent outcomes
- batch-operation tests reconcile active contexts when required
- migration tests begin from historical source-model stores
- migration tests validate data and relationships, not only store loading
- historical compatibility fixtures are not regenerated from the destination
  model
- tests do not depend unintentionally on execution order or shared state
- disk-backed stores are cleaned up only after persistence work terminates
- performance tests use representative conditions
- regression tests fail when the original defect is restored

Do not treat a test suite as meaningful Core Data coverage merely because it
creates a persistent container and executes without throwing.