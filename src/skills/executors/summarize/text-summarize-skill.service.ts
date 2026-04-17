// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Inject, Injectable } from "@nestjs/common";
import { LLM_TOKEN } from "@/llm/llm.tokens";
import type { LLM } from "@/llm/llm";
import { MessageRole } from "@/llm/llm";
import type { Storage } from "@/infraestructure/storage/storage";
import { STORAGE } from "@/infraestructure/storage/storage.tokens";
import { SkillExecutor } from "@/skills/executors/skill-executor";
import type { Skill } from "@/skills/skill";
import { ExecutionContext } from "@/shared/types";

type SummarizeInput = {
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
    ) { }

    /**
     * Executes the text summarize skill.
     *
     * @param input - Optional explicit `text`; otherwise the longest **user** segment from
     * {@link ExecutionContext.message} plus {@link ExecutionContext.conversationHistory} is used
     * so short follow-ups like “y el resumen?” still see the prior pasted essay.
     * @param context - The execution context.
     * @returns Concise summary text from the model.
     */
    async execute(input: SummarizeInput, context: ExecutionContext): Promise<string> {
        const body = this.resolveText(input, context);
        if (!body) {
            throw new Error("Text is required (provide input.text or a non-empty user message).");
        }

        const systemPrompt = (await this.loadPromptTemplate()).replace(
            /\{\{\s*text\s*\}\}/,
            body,
        );
        const result = await this.llm.generate({
            systemPrompt,
            messages: [{ role: MessageRole.User, content: "\n" }],
            metadata: { executionId: context.executionId },
        });

        return result.content.trim();
    }

    private resolveText(input: SummarizeInput, context: ExecutionContext): string {
        const fromInput = typeof input.text === "string" ? input.text.trim() : "";
        if (fromInput.length > 0) {
            return fromInput;
        }
        return this.longestUserText(context);
    }

    /**
     * Picks the longest non-empty user-authored string so a brief “summarize that” turn still
     * binds to an earlier long message in the thread.
     */
    private longestUserText(context: ExecutionContext): string {
        const chunks: string[] = [];
        const current = context.message?.trim() ?? "";
        if (current.length > 0) {
            chunks.push(current);
        }
        for (const row of context.conversationHistory ?? []) {
            if (row.role !== MessageRole.User) {
                continue;
            }
            const t = row.content?.trim() ?? "";
            if (t.length > 0) {
                chunks.push(t);
            }
        }
        return chunks.reduce((best, next) => (next.length > best.length ? next : best), "");
    }

    private async loadPromptTemplate(): Promise<string> {
        const skill = await this.storage.read<Skill>(this.id);
        const template = skill?.promptTemplate?.trim();
        if (!template) {
            throw new Error(
                `Missing prompt for skill ${this.id}: add skill.md next to skill.toml or fix SkillService load.`,
            );
        }
        return template;
    }
}
