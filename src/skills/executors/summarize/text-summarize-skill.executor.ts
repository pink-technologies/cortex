// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from "@nestjs/common";

import type { Storage } from "@/infraestructure/storage/storage";
import { STORAGE } from "@/infraestructure/storage";
import { SkillExecutor } from "@/skills/executors/skill-executor";
import type { Skill } from "@/skills/skill";
import { ExecutionContext } from "@/shared/types";
import type { LLM } from "@/llm/llm";
import { 
    MessageRole,
    ContentKind, 
    DEFAULT_LLM_MODEL_TOKEN, 
    LLM_TOKEN,
} from "@/llm/llm";

import { 
    ExecutorPromptLoadError, 
    ExecutorTextBuildError,
} from "../error/error";

/**
 * Input for the text summarize skill.
 */
interface SummarizeInput {
    /**
     * The text to summarize.
     */
    text?: string;
}

/**
 * Text summarize skill executor.
 *
 * This executor is responsible for generating a summary from a given text
 * using a configured Large Language Model (LLM).
 *
 * Responsibilities:
 * - Resolve the input text (from input or execution context)
 * - Load the prompt template from storage
 * - Invoke the LLM with the appropriate configuration
 * - Extract and return the summarized text
 *
 * The executor is stateless and relies on injected dependencies.
 */
@Injectable()
export class TextSummarizeSkillExecutor implements SkillExecutor<SummarizeInput, string> {
    // MARK: - Properties

    /**
     * The id of the skill.
     */
    readonly id = "text.summarize";

    // MARK: - Constructor

    /**
     * Creates a new TextSummarizeSkillService.
     *
     * @param llm - The LLM to use.
     * @param llmModel - The LLM model to use.
     * @param storage - The storage to use.
     */
    constructor(
        @Inject(LLM_TOKEN)
        private readonly llm: LLM,
    
        @Inject(DEFAULT_LLM_MODEL_TOKEN)
        private readonly llmModel: string,
    
        @Inject(STORAGE)
        private readonly storage: Storage,
    ) {}

    // MARK: - SkillExecutor

    /**
     * Executes the text summarize skill.
     *
     * @param input - The input containing the text to summarize.
     * @param context - Execution context with fallback message data.
     *
     * @returns A promise that resolves to the summarized text.
     *
     * @throws ExecutorTextBuildError
     * Thrown when no valid input text is available.
     *
     * @throws ExecutorPromptLoadError
     * Thrown when the prompt template cannot be loaded.
     */
    async execute(input: SummarizeInput, context: ExecutionContext): Promise<string> {
        const body = this.buildText(input, context);

        if (!body) throw new ExecutorTextBuildError();

        const systemPrompt = await this.loadPrompt();

        const result = await this.llm.chat(
            [
                {
                    role: MessageRole.User,
                    content: [
                        {
                            type: ContentKind.Text,
                            text: body,
                        },
                    ],
                },
            ],
            {
                model: this.llmModel,
                systemPrompt,
            }
        );

        return result.content
            .filter((c) => c.type === ContentKind.Text)
            .map((c) => c.text)
            .join("")
            .trim();
    }

    // MARK: - Private methods

    private buildText(input: SummarizeInput, context: ExecutionContext): string {
        const fromInput =
            typeof input.text === "string" ? input.text.trim() : "";

        if (fromInput.length > 0) {
            return fromInput;
        }

        return context.message?.trim() ?? "";
    }

    private async loadPrompt(): Promise<string> {
        const skill = await this.storage.read<Skill>(this.id);

        const template = skill?.promptTemplate?.trim();

        if (!template) throw new ExecutorPromptLoadError();

        return template;
    }
}