# Engineering philosophy

Apply these principles when writing, modifying, refactoring, or reviewing Cortex
code.

## 1. Start with the consumer workflow

Reconstruct how a caller reaches the changed API and what they observe on
success, failure, cancellation, interruption, and retry.

Review declarations in the context of the complete workflow. A locally elegant
type is not enough when its call site is confusing, unsafe, or incomplete.

## 2. Establish ownership before abstractions

Identify who owns mutable state, async work, observers/callbacks, temporary
resources, cancellation, and terminal cleanup.

Require one authoritative owner for every lifecycle. Do not accept a manager,
factory, wrapper, or interface until its responsibility and lifetime are clear.

## 3. Prefer direct, expressive designs

Every interface, factory, wrapper, generic abstraction, or extra state layer
must solve a demonstrated current problem.

Prefer:

- Concrete types when no real substitution boundary exists
- Small public surfaces
- One source of truth
- Typed states and errors
- Configuration near the operation that consumes it
- Designs that make invalid combinations hard to represent

Reject speculative architecture and abstractions introduced only for symmetry.

## 4. Validate behavior, not declarations

Do not claim safety because a type uses a lock, a queue, weak references, or
async primitives. Trace every entry point through mutation, await, callback,
completion, cancellation, cleanup, and retry.

## 5. Preserve existing compliant style

Enforce objective Cortex rules strictly. When multiple compliant layouts exist,
preserve the author's naming, formatting, member ordering, MARK sections, and
documentation wording outside the necessary change.

## 6. Complete the deletion pass

After every refactor, remove obsolete state, helpers, dual paths, compatibility
shims, dead docs, and dead tests. An additive refactor is incomplete while the
superseded path remains active or discoverable.

## 7. Evidence over preference

Report only validated findings with a concrete failure or misuse scenario.
Do not manufacture polish comments on compliant code.
