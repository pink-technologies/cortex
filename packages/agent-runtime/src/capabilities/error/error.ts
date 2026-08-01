// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentRuntimeError } from '@/error/error'

/**
 * Thrown when a capability definition is registered with an id that already
 * exists.
 *
 * Capability ids must be unique within {@link CapabilityRegistry} because they
 * are used as stable lookup keys during scope resolution. This error is raised
 * when the registry attempts to store a definition whose id has already been
 * registered.
 */
export class CapabilityAlreadyRegisteredError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate capability registration errors.
   */
  readonly code = 'CAPABILITY_ALREADY_REGISTERED'

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate capability registration.
   *
   * @param capabilityId - The id of the capability that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(capabilityId: string, options?: ErrorOptions) {
    super(`Capability already registered: ${capabilityId}`, options)
    this.name = new.target.name
  }
}

/**
 * Thrown when a capability lookup completes successfully but no matching
 * definition is registered.
 *
 * Raised during scope resolution when an agent declares a capability the
 * runtime does not know about, so misconfigured manifests fail closed before
 * an execution starts.
 */
export class CapabilityNotFoundError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for capability-not-found errors.
   */
  readonly code = 'CAPABILITY_NOT_FOUND'

  // MARK: - Constructor

  /**
   * Creates an error describing a failed capability lookup.
   *
   * @param capabilityId - The id of the capability that could not be resolved.
   * @param options - Optional error details, including the original cause.
   */
  constructor(capabilityId: string, options?: ErrorOptions) {
    super(`Capability not found: ${capabilityId}`, options)
    this.name = new.target.name
  }
}
