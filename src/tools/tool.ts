// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import type { ToolContext } from "./clients/context/tool-context";

/**
 * A tool factory is a function that creates a tool.
 */
export type ToolFactory = (context: ToolContext) => Tool;

/**
 * A tool definition is a definition of a tool.
 */
export type ToolDefinition = {
    /**
     * The id of the tool.
     */
    id: string;

    /**
     * The name of the tool.
     */
    name: string;

    /**
     * The description of the tool.
     */
    description: string;
}

/**
 * A tool is a function that executes a tool.
 */
export interface Tool<Input = unknown, Output = unknown> {
    /**
     * Executes the tool with the given input.
     *
     * @param input - The input to the tool.
     * @returns The output of the tool.
     */
    execute(input: Input): Promise<Output>;
}