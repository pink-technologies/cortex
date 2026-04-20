// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from "@nestjs/common";
import type { LLM } from "@/llm/llm";
import { MessageRole, ContentKind, DEFAULT_LLM_MODEL_TOKEN, LLM_TOKEN } from "@/llm/llm";
import type { Storage } from "@/infraestructure/storage/storage";
import { STORAGE } from "@/infraestructure/storage";
import { SkillExecutor } from "@/skills/executors/skill-executor";
import type { Skill } from "@/skills/skill";
import { ExecutionContext } from "@/shared/types";

type SummarizeInput = {
    text?: string;
};

/**
 * Text summarization via LLM using chat API.
 * The prompt template is loaded from skill.md via SkillService.
 */
@Injectable()
export class TextSummarizeSkillService implements SkillExecutor<SummarizeInput, string> {
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

    async execute(input: SummarizeInput, context: ExecutionContext): Promise<string> {
        const body = this.resolveText(input, context);

        if (!body) {
            throw new Error(
                "Text is required (provide input.text or a non-empty user message)."
            );
        }

        const systemPrompt = await this.loadPromptTemplate();

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
                temperature: 0.3,
            }
        );

        return result.content
            .filter((c) => c.type === ContentKind.Text)
            .map((c) => c.text)
            .join("")
            .trim();
    }

    // MARK: - Private methods

    private resolveText(input: SummarizeInput, context: ExecutionContext): string {
        const fromInput =
            typeof input.text === "string" ? input.text.trim() : "";

        if (fromInput.length > 0) {
            return fromInput;
        }

        return this.longestUserText(context);
    }

    /**
     * Picks the longest user-authored text from current message + history.
     */
    private longestUserText(context: ExecutionContext): string {
        const chunks: string[] = [];

        const current = context.message?.trim() ?? "";
        if (current.length > 0) {
            chunks.push(current);
        }

        for (const row of context.conversationHistory ?? []) {
            if (row.role !== MessageRole.User) continue;

            const text = row.content?.trim() ?? "";
            if (text.length > 0) {
                chunks.push(text);
            }
        }

        return chunks.reduce(
            (best, next) => (next.length > best.length ? next : best),
            ""
        );
    }

    /**
     * Loads the prompt template from storage (skill.md).
     */
    private async loadPromptTemplate(): Promise<string> {
        const skill = await this.storage.read<Skill>(this.id);

        const template = skill?.promptTemplate?.trim();

        if (!template) {
            throw new Error(
                `Missing prompt for skill ${this.id}: add skill.md next to skill.toml or fix SkillService load.`
            );
        }

        return template;
    }
}