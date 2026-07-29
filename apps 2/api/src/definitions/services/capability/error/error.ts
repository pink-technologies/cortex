// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { DefinitionModuleError } from '@/definitions/error/definition-module-error';

/**
 * Thrown when a capability is registered with an id that already exists in storage.
 *
 * Capability ids must be unique for the bundled catalog because they are stable
 * lookup keys for agents, skills, and orchestration. This error is raised when
 * registration detects an existing persisted definition for the same id.
 *
 * This usually indicates a misconfigured bundle (two manifests sharing an `id`) or
 * a repeated registration attempt during startup.
 */
export class CapabilityAlreadyRegisteredError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate capability id registration errors.
   */
  readonly code = 'CAPABILITY_ALREADY_REGISTERED';

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate capability registration.
   *
   * @param capabilityId - The id of the capability that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(capabilityId: string, options?: ErrorOptions) {
    super(`Capability already registered: ${capabilityId}`, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when a bundled capability definition cannot be loaded or registered from
 * the configured capabilities root on disk.
 *
 * Use this for failures while scanning capability directories, reading
 * `capability.toml`, decoding TOML, validating against the capability schema,
 * persisting to storage, or other unexpected errors during the registration loop.
 * Callers that wrap every per-capability failure in a single type may surface
 * duplicate-id failures here as well, depending on catch scope.
 */
export class CapabilityLoadError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for capability load or registration failures.
   */
  readonly code = 'CAPABILITY_LOAD_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a failure while loading or registering a capability definition.
   *
   * @param message - Human-readable description of what went wrong.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when a capability lookup succeeds technically but no matching definition
 * exists in the definitions store (or equivalent registry).
 *
 * Use this only when storage and resolution are behaving as expected and the
 * requested capability id is simply absent—for example an unknown id referenced
 * from an agent manifest or a stale id after definitions were rebuilt.
 */
export class CapabilityNotFoundError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for missing capability definition errors.
   */
  readonly code = 'CAPABILITY_NOT_FOUND_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a capability that could not be found by id.
   *
   * @param message - Human-readable explanation (often includes the requested capability id).
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown for capability-definition–layer failures that are not specifically a load,
 * duplicate registration, or not-found case.
 *
 * Prefer the more specific errors above when the failure mode is known; reserve
 * this type for infrastructure or unexpected errors surfaced by capability
 * services (for example storage failures outside the narrow registration path).
 */
export class CapabilityServiceError extends DefinitionModuleError {
  // MARK: - Properties

  /**
   * Machine-readable code for generic capability service errors.
   */
  readonly code = 'CAPABILITY_SERVICE_ERROR';

  // MARK: - Constructor

  /**
   * Creates an error describing a capability definitions service failure.
   *
   * @param message - Human-readable description of what went wrong.
   * @param options - Optional error details, including the original cause.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
