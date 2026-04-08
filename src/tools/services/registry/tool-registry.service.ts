// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from '@nestjs/common';

import type { ToolContext } from '../../clients/context/tool-context';
import {
    Tool,
    ToolDefinition,
    ToolFactory,
} from '../../tool';
import {
    ToolAlreadyRegisteredError,
    ToolNotFoundError,
    ToolRequiredIdError,
} from '../error/tool.error';

/**
 * A tool entry is a definition and a factory for a tool.
 */
type ToolEntry = {
    /**
     * The definition of the tool.
     */
    definition: ToolDefinition;

    /**
     * The factory for the tool.
     */
    create: ToolFactory;
}

/**
 * In-memory registry of tools based on the Factory Pattern.
 *
 * Each tool is registered as a {@link ToolEntry}, which contains:
 * - a {@link ToolDefinition} (metadata for discovery, LLMs, UI, etc.)
 * - a {@link ToolFactory} (responsible for creating a runnable tool instance)
 *
 * This registry does NOT store tool instances. Instead, it stores factories
 * and creates tools on demand using a {@link ToolContext}.
 *
 * ## Responsibilities
 *
 * - Maintain a catalog of available tools (metadata only)
 * - Lazily instantiate tools per execution via factories
 * - Ensure tools are uniquely registered by id
 *
 * ## Typical flow
 *
 * 1. Tools are registered at application bootstrap:
 *    `registry.register(definition, factory)`
 *
 * 2. At runtime, a capability resolves a tool:
 *    `const tool = registry.create(toolId, context)`
 *
 * 3. The tool is executed:
 *    `await tool.execute(input)`
 *
 * ## Design notes
 *
 * - Follows Factory Pattern: tools are created per execution, not reused
 * - Enables multi-tenant setups (each execution can have a different context)
 * - Decouples metadata (definition) from behavior (tool implementation)
 * - Keeps the registry free of infrastructure concerns
 */
@Injectable()
export class ToolRegistryService {
    // MARK: - Properties

    /**
     * Registered tool entries by trimmed id.
     */
    private tools: Map<string, ToolEntry> = new Map();

    // MARK: - ToolRegistryService

    /**
     * Creates a runnable tool instance for the given id and execution context.
     *
     * This method looks up the registered factory and invokes it with the provided
     * {@link ToolContext}, allowing tools to be instantiated with user-specific
     * dependencies (e.g. API clients, tokens, etc.).
     *
     * @param id - The tool identifier.
     * @param context - Execution context containing resolved dependencies.
     * @returns A fresh tool instance ready to execute.
     *
     * @throws {@link ToolRequiredIdError} If the id is empty or whitespace.
     * @throws {@link ToolNotFoundError} If no tool is registered with the given id.
     */
    create(id: string, context: ToolContext): Tool {
        if (!id.trim()) throw new ToolRequiredIdError();

        const tool = this.tools.get(id.trim());

        if (!tool) throw new ToolNotFoundError();

        return tool.create(context);
    }

    /**
     * Registers a tool definition and its corresponding factory.
     *
     * This method is typically called at application bootstrap time.
     * Each tool must have a unique id.
     *
     * The factory will later be used to create tool instances at runtime.
     *
     * @param definition - Static metadata describing the tool (id, name, description).
     * @param factory - Factory function that creates tool instances using a {@link ToolContext}.
     *
     * @throws {@link ToolRequiredIdError} If the definition id is empty or whitespace.
     * @throws {@link ToolAlreadyRegisteredError} If a tool with the same id is already registered.
     */
    register(definition: ToolDefinition, factory: ToolFactory): void {
        if (!definition.id.trim()) throw new ToolRequiredIdError();

        if (this.tools.has(definition.id)) throw new ToolAlreadyRegisteredError();

        this.tools.set(definition.id, {
            definition,
            create: factory,
        });
    }

    /**
     * Returns a metadata-only snapshot of all registered tools.
     *
     * This is the preferred method for:
     * - LLM tool/function calling
     * - UI tool listings
     * - External integrations
     *
     * It avoids instantiating tools and exposes only their definitions.
     *
     * @returns An array of {@link ToolDefinition}.
     */
    retrieveCatalogEntries(): ToolDefinition[] {
        return Array.from(
            this.tools.values(),
            (entry) => entry.definition,
        );
    }
}
