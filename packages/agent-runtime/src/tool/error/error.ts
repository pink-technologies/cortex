// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ZodError } from 'zod';
import { AgentRuntimeError } from '../../error/agent-runtime-error';

/**
 * Thrown when a tool is registered with an id that already exists.
 *
 * Tool ids must be unique within the current registry because they are used
 * as stable lookup keys for tool resolution and execution. This error is raised
 * when the service attempts to register a tool whose id has already been stored.
 */
export class AgentToolAlreadyRegisteredError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for duplicate tool id registration errors.
   */
  readonly code = 'AGENT_TOOL_ALREADY_REGISTERED';

  // MARK: - Constructor

  /**
   * Creates an error describing a duplicate tool registration.
   *
   * @param toolId - The id of the tool that was already registered.
   * @param options - Optional error details, including the original cause.
   */
  constructor(toolId: string, options?: ErrorOptions) {
    super(`Tool already registered: ${toolId}`, options);
    this.name = new.target.name;
  }
}

/**
 * Thrown when an agent tool fails during execution.
 *
 * This error wraps the underlying failure produced by the tool while preserving
 * the originating tool request identity for correlation and diagnostics.
 */
export class AgentToolExecutionError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for tool execution errors.
   */
  readonly code = 'AGENT_TOOL_EXECUTION_ERROR';

  /**
   * Name of the tool that failed.
   */
  readonly toolName: string;

  /**
   * Identifier of the originating tool request.
   */
  readonly toolUseId: string;

  // MARK: - Constructor

  /**
   * Creates an error describing a tool execution failure.
   *
   * @param toolName - Name of the tool that failed.
   * @param toolUseId - Identifier of the originating tool request.
   * @param cause - Error produced by the tool.
   */
  constructor(toolName: string, toolUseId: string, cause: unknown) {
    super(`The agent tool '${toolName}' failed during execution.`, { cause });

    this.name = new.target.name;
    this.toolName = toolName;
    this.toolUseId = toolUseId;
  }
}

/**
 * Thrown when a tool's input fails validation against its Zod input schema.
 *
 * This error preserves the originating tool request identity and the Zod
 * validation failure so callers can surface schema issues back to the model
 * or to diagnostics without losing context.
 */
export class AgentToolInputValidationError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for tool input validation errors.
   */
  readonly code = 'AGENT_TOOL_INPUT_VALIDATION_ERROR';

  /**
   * Name of the tool whose input failed validation.
   */
  readonly toolName: string;

  /**
   * Identifier of the originating tool request.
   */
  readonly toolUseId: string;

  /**
   * Validation error produced by the tool input schema.
   */
  readonly validationError: ZodError;

  // MARK: - Constructor

  /**
   * Creates an error describing invalid tool input.
   *
   * @param toolName - Name of the requested tool.
   * @param toolUseId - Identifier of the originating tool request.
   * @param validationError - Error produced by the input schema.
   */
  constructor(toolName: string, toolUseId: string, validationError: ZodError) {
    super(`The input for agent tool '${toolName}' is invalid.`, {
      cause: validationError,
    });

    this.name = new.target.name;
    this.toolName = toolName;
    this.toolUseId = toolUseId;
    this.validationError = validationError;
  }
}

/**
 * Thrown when a tool lookup completes successfully but no matching tool is
 * registered.
 *
 * This error should be used only when the lookup mechanism is working as
 * expected, but the requested tool cannot be found. Examples include an unknown
 * tool identifier, a stale reference to a tool that is no longer registered,
 * or a tool that was never registered in the current context.
 */
export class AgentToolNotFoundError extends AgentRuntimeError {
  // MARK: - Properties

  /**
   * Machine-readable code for tool not found errors.
   */
  readonly code = 'AGENT_TOOL_NOT_FOUND';

  // MARK: - Constructor

  /**
   * Creates an error describing a missing tool.
   *
   * @param toolId - The id of the tool that could not be found.
   * @param options - Optional error details, including the original cause.
   */
  constructor(toolId: string, options?: ErrorOptions) {
    super(`Tool not found: ${toolId}`, options);
    this.name = new.target.name;
  }
}
