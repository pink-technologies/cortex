// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Base class for all executor-level errors.
 */
export abstract class ExecutorError extends Error {
    // MARK: - Properties
  
    /**
     * A machine-readable error code identifying the type of
     * executor error.
     */
    abstract readonly code: string;
}

/**
 * Thrown when a skill fails to load from a file.
 */
export class ExecutorPromptLoadError extends ExecutorError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * executor file load error.
     */
    readonly code = 'EXECUTOR_PROMPT_LOAD_ERROR';
}

/**
 * Thrown when a skill fails to build the text.
 */
export class ExecutorTextBuildError extends ExecutorError {
    // MARK: - Properties

    /**
     * A machine-readable error code identifying the type of
     * executor text build error.
     */
    readonly code = 'EXECUTOR_TEXT_BUILD_ERROR';
}