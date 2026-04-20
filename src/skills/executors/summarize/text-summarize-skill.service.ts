// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from "@nestjs/common";
import type { LLM, TextContent } from "@/llm/llm";
import { ContentKind, LLM_TOKEN, MessageRole } from "@/llm/llm";
import { STORAGE, type Storage } from "@/infraestructure/storage/storage";
import { SkillExecutor } from "@/skills/executors/skill-executor";
import type { Skill } from "@/skills/skill";
import { ExecutionContext } from "@/shared/types";
import type { SkillConfiguration } from "@/skills/skill.config";

/**
 * The input for the text summarize skill.
 */
type SummarizeInput = {
    /**
     * The text to summarize.
     */
    text?: string;
};

/**
 * Text summarization via {@link LLM}; prompt body comes from {@link Skill.promptTemplate}
 * loaded by {@link SkillService} from `skill.md` beside `skill.toml`.
 */
@Injectable()
export class TextSummarizeSkillService implements SkillExecutor<SummarizeInput, string> {
    /**
     * The id of the skill.
     */
    readonly id = "text.summarize";

    /**
     * @param llm - Chat completion port.
     * @param storage - Same store {@link SkillService} writes bundled skill records into.
     */
    constructor(
        @Inject(LLM_TOKEN)
        private readonly llm: LLM,
        @Inject(STORAGE)
        private readonly storage: Storage,
        private readonly configuration: SkillConfiguration,
    ) { }

    /**
     * Executes the text summarize skill.
     *
     * @param input - Optional explicit `text`; otherwise the longest **user** segment from
     * {@link ExecutionContext.message} plus {@link ExecutionContext.conversationHistory} is used
     * so short follow-ups like “y el resumen?” still see the prior pasted essay.
     * @param context - The execution context.
     * @returns The skill result; shape matches `Output`.
     */
    async execute(input: SummarizeInput, context: ExecutionContext): Promise<string> {
        const { model, systemPrompt } = this.configuration;
        const result = await this.llm.chat(
          [
            {
              role: MessageRole.User,
              content: [
                {
                  type: ContentKind.Text,
                  text: this.buildPrompt(input, context),
                },
              ],
            },
          ],
          {
            model,
            systemPrompt,
          },
        );

        return result.content
            .filter((content): content is TextContent => content.type === ContentKind.Text)
            .map((textContent) => textContent.text)
            .join('');
    }

    // MARK: - Private methods

    private buildPrompt(input: SummarizeInput, context: ExecutionContext): string {
        const { text } = input;
        return [
            `Execution id: ${context.executionId}`,
            `User message:\n${text}`,
        ].join('\n\n');
    }
}
