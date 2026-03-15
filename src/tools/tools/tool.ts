// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Interface for a tool contract.
 * A tool contract is a contract that defines the behavior of a tool.
 */
export interface Tool {
    /**
     * The slug of the tool.
     */
    slug: string;

    /**
     * The name of the tool.
     */
    name: string;

    /**
     * Executes the tool.
     * @param name - Input passed to the tool (e.g. tool name or serialized parameters).
     * @returns The tool result as a string.
     * @throws When the tool execution fails.
     */
    execute(name: string): Promise<string>;
}