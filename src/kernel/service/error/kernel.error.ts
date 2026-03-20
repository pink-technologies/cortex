// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all skill service–level errors.
 *
 * This abstract error represents failures that occur within the
 * skill application layer and serves as a boundary
 * between orchestration logic and transport-level concerns
 * (e.g. HTTP, GraphQL).
 *
 * Responsibilities:
 * - expose a stable, machine-readable {@link code},
 * - provide user-safe, provider-agnostic error messages,
 * - optionally wrap an underlying cause for internal diagnostics,
 * - prevent lower-level errors from leaking beyond the service layer.
 */
export abstract class KernelServiceError extends Error {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * skill service error.
     */
    abstract readonly code: string;
}

/**
 * Error thrown when an attempt is made to find or act on a kernel origin
 * that does not exist in the system.
 *
 * This typically occurs when a requested kernel origin cannot be found
 * using its unique identifier or name.
 */
export class KernelOriginNotFoundError extends KernelServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying kernel origin-not-found errors.
     */
    readonly code = 'KERNEL_ORIGIN_NOT_FOUND';
}


/**
 * Error thrown when no agents exist in the system and the kernel
 * attempts to resolve a default agent (no intent provided).
 */
export class KernelNoAgentsError extends KernelServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying kernel no-agents errors.
     */
    readonly code = 'KERNEL_NO_AGENTS';
}

/**
 * Error thrown when an attempt is made to handle a kernel chat input
 * that does not have a valid chat ID.
 */
export class KernelChatRequiredIdError extends KernelServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying kernel chat-required-id errors.
     */
    readonly code = 'KERNEL_CHAT_REQUIRED_ID';
}

/**
 * Error thrown when no webhook provider handler is registered for the given provider name.
 */
export class WebhookProviderNotFoundError extends KernelServiceError {
    readonly code = 'WEBHOOK_PROVIDER_NOT_FOUND';
}

/**
 * Error thrown when two webhook provider handlers are registered for the same provider name.
 * Occurs at application bootstrap when building the provider registry.
 */
export class WebhookProviderDuplicateError extends KernelServiceError {
    readonly code = 'WEBHOOK_PROVIDER_DUPLICATE';
}

/**
 * Error thrown when an attempt is made to handle a webhook input
 * with an invalid context.
 */
export class WebhookProviderContextError extends KernelServiceError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying webhook provider context errors.
     */
    readonly code = 'WEBHOOK_PROVIDER_CONTEXT_ERROR';
}
