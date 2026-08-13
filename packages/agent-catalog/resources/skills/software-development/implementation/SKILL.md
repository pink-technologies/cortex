---
name: implementation
description: "Applies reusable software implementation guidance for features, bug fixes, refactoring, migrations, and behavior changes. Use when code must be modified safely and completely across affected execution paths, ownership boundaries, tests, documentation, cleanup, and validation."
version: 1.0.0
platforms: [linux, macos, windows]
metadata:
  cortex:
    tags: [Implementation, Refactoring, Bug-Fix, Feature-Development, Validation, Cleanup]
    related_skills: [testing, debugging, software-architecture, code-review-diff]
---

# Software Implementation

Use this skill as generic methodology for modifying software safely and
completely.

It applies to:

- feature implementation
- bug fixes
- refactoring
- migrations
- behavior changes
- focused cleanup required by those changes

This skill defines how to execute a code change.

It does not define programming-language rules, framework architecture,
concurrency semantics, API compatibility policy, testing methodology, review
format, or project-specific conventions.

## Apply project guidance first

Before changing code:

- Use applicable host, organization, repository, and project instructions.
- When repository access is available and project instructions have not already
  been resolved by the host, discover instructions applicable to the affected
  files before implementation.
- Preserve established project architecture, naming, layering, state
  management, dependency injection, error handling, testing conventions, and
  source organization when explicitly defined.
- Treat build configuration, compiler settings, formatter, linter, generated
  sources, tests, and repository scripts as executable sources of truth for
  deterministic project behavior.
- Do not replace an established project convention merely because another
  approach is common or preferred by this skill.
- Load specialized language, framework, architecture, concurrency, API,
  testing, or documentation guidance when those concerns materially affect the
  change.

## Establish the change

Before editing, understand what must change and what must remain true.

Determine when relevant:

- requested behavior
- current behavior
- affected entry points
- affected consumers or callers
- authoritative state
- ownership boundaries
- lifecycle boundaries
- data flow
- error behavior
- cancellation behavior
- concurrency or ordering constraints
- persistence or external boundaries
- compatibility requirements
- existing tests
- existing project guidance

Do not start from the assumption that the requested edit location is the full
scope of the change.

Trace enough of the relevant execution path to understand the behavior being
modified.

## Define the intended behavior

State the expected post-change behavior before modifying implementation when
the task is non-trivial.

Clarify when relevant:

- what should happen on success
- what should happen on failure
- what should happen on cancellation
- which state transitions are valid
- which inputs are supported
- which outputs or side effects are expected
- which existing behaviors must remain unchanged

For bug fixes, identify the failure condition being corrected.

For refactors, identify the behavior that must remain equivalent.

For migrations, identify both the old and new supported boundaries.

Do not use implementation details as the only definition of success.

## Load related skills

Use specialized skills when they materially affect the implementation.

Examples:

```text
Swift implementation
→ implementation
→ languages/swift
→ project guidance
```

```text
Swift concurrency fix
→ implementation
→ languages/swift
→ languages/swift/concurrency
→ testing
→ project guidance
```

```text
Flutter feature
→ implementation
→ languages/dart
→ frameworks/flutter
→ project-specific framework skills
→ testing
→ project guidance
```

```text
SDK public API change
→ implementation
→ software-architecture
→ applicable language skill
→ applicable API-design skill
→ testing
→ project guidance
```

Do not load unrelated skills merely because the repository contains the
corresponding technology.

## Inspect before editing

Before changing an affected implementation:

- inspect the declaration being changed
- inspect materially affected callers
- inspect related state and ownership
- inspect relevant error paths
- inspect relevant tests
- inspect configuration or generated contracts when they influence behavior
- inspect cleanup, replacement, and terminal paths when long-lived resources
  are involved

Read surrounding code when the local diff or requested location is insufficient
to understand the contract.

Do not modify an API, callback, protocol, schema, or lifecycle hook without
checking materially affected consumers.

## Find the authoritative owner

When a change affects mutable state, lifecycle, resources, or long-lived work,
identify the authoritative owner.

Determine who owns:

- state
- mutation
- start
- cancellation
- completion
- replacement
- retry
- teardown
- external resources

Do not create a second source of truth to avoid modifying the real owner.

Prefer:

```text
authoritative state
      ↓
derived behavior
```

over:

```text
old state
+
new duplicate state
+
synchronization logic
```

when both representations model the same concern.

Use the architecture or concurrency skill for deeper ownership or isolation
reasoning when necessary.

## Prefer the smallest coherent change

Prefer the smallest change that completely restores or introduces the intended
behavior.

The smallest coherent change is not necessarily the smallest diff.

A small patch is insufficient when it leaves behind:

- incorrect callers
- duplicate state
- obsolete execution paths
- stale observers
- invalid transitions
- missing cleanup
- incompatible consumers
- incomplete tests
- stale documentation

Do not broaden the change merely for aesthetic cleanup.

Do broaden it when the additional edits are required to make the behavior
internally coherent.

## Preserve established architecture

Implement the change within the project's current architectural boundaries
unless changing those boundaries is part of the task or necessary to correct a
demonstrated architectural defect.

Do not introduce a new:

- service layer
- manager
- protocol
- repository
- coordinator
- wrapper
- state container
- factory
- abstraction

solely because it would make the local code look cleaner.

Introduce or move a boundary when it solves a concrete problem in:

- responsibility
- ownership
- lifecycle
- dependency direction
- testability
- substitution
- compatibility
- reuse

Use the architecture skill for substantial boundary changes.

## Complete the execution path

When behavior changes, follow every materially affected execution path.

Depending on the change, inspect:

```text
entry point
   ↓
validation
   ↓
state mutation
   ↓
dependency call
   ↓
result
   ↓
consumer
```

Also inspect relevant terminal or alternative paths:

```text
failure
cancellation
retry
replacement
interruption
cleanup
```

Do not implement a new method or component without connecting the callers that
are supposed to use it.

Do not update a caller without confirming the target contract still matches the
intended behavior.

## Preserve the last safe state

When an operation can fail, avoid leaving the system in a partially mutated
state unintentionally.

Prefer validating important preconditions before:

- changing authoritative state
- acquiring expensive resources
- publishing observable state
- starting irreversible work

when those validations can reasonably occur earlier.

When failure can occur only after mutation, determine whether the correct
behavior is:

- rollback
- cleanup
- reconciliation
- retry
- transition to a defined failure state

Do not leave partial work without an intentional state contract.

## Keep state transitions coherent

When several values participate in one logical transition, update them within
the appropriate authoritative boundary.

Examples can include:

- status
- active identifier
- current request
- stored result
- timestamps
- ownership token
- retry counter
- derived capability

Avoid temporary combinations that downstream consumers are not supposed to
observe.

When atomicity or concurrency materially affects the change, load the
appropriate specialized concurrency skill.

## Handle failure intentionally

For every materially changed operation, determine the expected failure behavior.

Do not:

- swallow errors accidentally
- convert failures into success without a contract
- replace useful diagnostic context without reason
- leave state inconsistent after failure
- emit multiple terminal results
- retry indefinitely without policy

Translate errors at the boundary that owns the translated contract.

Keep cancellation distinct from failure when the API or behavior requires that
distinction.

## Handle cancellation intentionally

When the changed behavior supports cancellation:

- determine who owns cancellation
- determine what work should stop
- determine what state remains valid
- prevent stale work from committing results after cancellation
- release resources when cancellation ends their lifetime
- preserve the documented terminal behavior

Do not assume invoking a cancellation API guarantees every underlying operation
has stopped.

Use specialized concurrency guidance when cancellation interacts with tasks,
actors, queues, streams, or callbacks.

## Prevent stale work

When overlapping operations are possible, determine whether an earlier result
can arrive after a newer operation has become authoritative.

Relevant cases include:

```text
request A starts
request B starts
request B completes
request A completes
```

If B is authoritative, ensure A cannot overwrite it.

Possible strategies may include:

- cancellation
- generation identifiers
- ownership tokens
- latest-wins semantics
- serialization
- state revalidation

Choose according to the existing architecture and behavior contract.

Do not rely on incidental completion order.

## Preserve compatibility when required

When changing a supported API, schema, persistence format, or consumer-visible
behavior, establish the relevant compatibility boundary.

Check when applicable:

- callers
- protocol conformers
- argument labels or signatures
- serialized values
- persisted data
- public defaults
- error behavior
- callback ordering
- cancellation semantics
- platform availability

Do not preserve compatibility that the project does not support.

Do not accidentally break supported consumers because the local implementation
still compiles.

Use an API-design or compatibility skill for deeper analysis.

## Complete migrations

When replacing an old implementation:

1. add or establish the new authoritative path
2. move affected callers
3. preserve compatibility only when required
4. remove obsolete ownership
5. remove duplicate state or behavior
6. remove stale tests and documentation only when their contract is no longer
   supported

Do not leave both implementations active accidentally.

Prefer:

```text
old entry ─┐
           ├── authoritative implementation
new entry ─┘
```

when compatibility requires both APIs but the behavior should remain unified.

## Perform a deletion pass

After implementing the new behavior, explicitly search the affected scope for
superseded artifacts.

Look for:

- unused properties
- old methods
- stale helpers
- duplicate branches
- obsolete state cases
- old callbacks
- unused dependency registrations
- stale observers
- old feature flags
- unreachable compatibility paths
- outdated tests
- stale documentation

Do not delete an apparently unused path until confirming it is not a supported
consumer, migration, generated, or externally invoked boundary.

## Avoid duplicate behavior

Do not leave two components independently responsible for the same behavior
unless dual ownership is explicitly intended.

When responsibility moves:

```text
old owner
   ↓
new owner
```

also remove the old:

- state
- mutations
- callbacks
- lifecycle work
- dependency wiring
- cleanup
- tests

that no longer belong there.

A refactor is incomplete when only the declaration moves but the responsibility
remains duplicated.

## Keep changes focused

Avoid unrelated cleanup while implementing a focused behavior change.

Do not rewrite:

- unrelated files
- unrelated naming
- unrelated formatting
- unrelated architecture
- legacy code outside the affected path

unless required to complete the change safely.

When deterministic formatter or code generation changes additional lines,
distinguish those mechanical changes from behavioral edits.

## Update tests with the behavior

When the implementation changes observable behavior, update or add appropriate
tests.

Use the testing skill for detailed test design.

At minimum, verify when applicable:

- the intended success behavior
- the corrected regression
- meaningful failure behavior
- cancellation
- state transition
- cleanup
- affected integration boundary

Do not add tests solely to increase coverage.

Do not weaken existing tests simply to make a new implementation pass unless
the previous behavior is intentionally no longer supported.

## Update documentation when the contract changes

Update documentation when the change affects a documented contract such as:

- public behavior
- defaults
- errors
- cancellation
- state requirements
- ownership
- availability
- migration
- supported usage

Do not rewrite documentation for implementation-only changes that preserve the
documented behavior.

Load specialized documentation guidance when the language or framework has its
own documentation contract.

## Validate incrementally

Run the narrowest meaningful validation first.

A useful sequence can be:

```text
affected test
    ↓
affected test target/package
    ↓
broader integration
    ↓
full relevant validation
```

depending on project size and change scope.

Also run applicable deterministic checks such as:

- compilation
- formatter
- linter
- static analysis
- code generation
- schema validation

Use the project's own commands whenever available.

Do not run unrelated expensive validation merely to create the appearance of
completeness.

## Diagnose failures before changing code again

When validation fails:

1. read the failure
2. determine whether it is caused by the implementation
3. distinguish pre-existing failures from introduced failures
4. identify the violated contract
5. correct the root cause
6. rerun the narrowest relevant check

Do not respond to every failing diagnostic by changing production behavior.

Some failures may come from:

- test assumptions
- environment
- unavailable dependencies
- project configuration
- generated files
- unrelated existing defects

Record limitations when they cannot be resolved within the task.

## Do not game validation

Do not make checks pass by:

- disabling tests
- weakening assertions without behavioral justification
- suppressing diagnostics broadly
- adding fake `await` operations
- swallowing errors
- skipping supported environments
- hard-coding test-only behavior into production
- bypassing the code path the test is intended to validate

A passing check is valuable only when the intended behavior remains protected.

## Verify refactor completeness

For refactors and migrations, verify both presence and absence.

Confirm that:

### The new behavior exists

- the new owner or path is implemented
- callers use it
- required state is connected
- tests cover it

### The old behavior is gone when no longer supported

- obsolete methods are unused or removed
- duplicate state is removed
- stale dependency bindings are removed
- old observers or tasks no longer run
- obsolete tests are removed or updated
- old documentation no longer describes unsupported behavior

Do not declare a refactor complete based only on the new code compiling.

## Verify call sites after contract changes

When changing a function, method, protocol, callback, type, schema, or other
contract, inspect materially affected call sites.

Check:

- name
- arguments
- labels
- types
- optionality
- async/throwing behavior
- ownership
- callback shape
- expected state
- return value usage

Do not assume compiler coverage is sufficient when dynamic dispatch, reflection,
configuration, serialization, generated bindings, or external consumers are
involved.

## Verify external boundaries

When the implementation affects an external boundary, validate the contract at
that boundary.

Examples include:

```text
API request ↔ response
database ↔ model
serializer ↔ schema
SDK ↔ consumer
client ↔ service
UI ↔ navigation
application ↔ platform API
```

A local unit test may be insufficient when correctness depends on both sides
agreeing.

Use the testing or API-design skill for deeper boundary validation.

## Report validation accurately

When reporting completed work, distinguish checks that actually ran.

For example:

```text
format        PASS
analysis      PASS
unit tests    PASS
integration   NOT_RUN
device tests  NOT_RUN
```

Use project-specific terminology when available.

Do not state:

```text
all tests pass
```

when only a subset was executed.

Do not treat `NOT_RUN` as success.

If validation could not run, report the reason.

## Report limitations

At completion, identify unresolved limitations that materially affect
confidence.

Examples include:

- unavailable build environment
- unavailable device or simulator
- missing credentials
- inaccessible external service
- unsupported local platform
- missing fixture
- incomplete migration information
- unresolved consumer compatibility

Do not invent limitations simply to appear cautious.

Report only those that materially constrain verification.

## Completion criteria

An implementation is complete when the affected scope satisfies the intended
behavior and relevant supporting work.

Depending on the task, this can mean:

- expected behavior is implemented
- affected callers are connected
- state ownership remains coherent
- terminal paths are correct
- obsolete behavior is removed
- tests protect the change
- documentation reflects changed contracts
- relevant validation passes
- unresolved limitations are reported

Compilation alone is not sufficient evidence of behavioral completeness.

## Use with other skills

Examples:

```text
Implement Flutter feature
→ implementation
→ languages/dart
→ frameworks/flutter
→ testing
→ project guidance
```

```text
Fix Swift concurrency bug
→ implementation
→ languages/swift
→ languages/swift/concurrency
→ testing
→ project guidance
```

```text
Refactor stateful service
→ implementation
→ software-architecture
→ applicable language skill
→ testing
→ project guidance
```

```text
Change public Swift SDK API
→ implementation
→ languages/swift
→ languages/swift/api-design
→ testing
→ project guidance
```

```text
Implement issue end to end
→ issue-to-pr
→ implementation
→ applicable language/framework skills
→ testing
→ project guidance
```

When another skill defines a larger workflow, preserve that workflow and use
this skill only as the implementation methodology within it.

## Validation

When execution tools are available:

- Prefer project-provided commands.
- Start with the narrowest meaningful check.
- Expand validation according to the affected behavior.
- Run deterministic static checks separately from behavioral checks when useful.
- Re-run affected validation after correcting failures.
- Report unavailable checks explicitly.

Do not claim a build, test, formatter, linter, static-analysis, or other
validation check passed unless it was actually executed successfully.