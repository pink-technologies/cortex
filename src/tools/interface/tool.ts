// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * Interface for a tool.
 * A tool is a tool that defines the behavior of a tool.
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
     * @param input - The input to the tool.
     * @returns The output of the tool.
     */
    execute(input?: any): Promise<any>;
}