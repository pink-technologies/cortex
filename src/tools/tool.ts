// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

/**
 * A tool is a reusable unit of functionality that can be used to perform a task.
 *
 * @typeParam Input - The input type of the tool.
 * @typeParam Output - The output type of the tool.
 */
export interface Tool<Input = unknown, Output = unknown> {
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

    /**
     * Executes the tool with the given input.
     *
     * @param input - The input to the tool.
     * @returns The output of the tool.
     */
    execute(input: Input): Promise<Output>;
}
