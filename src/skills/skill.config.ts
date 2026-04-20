// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

export interface SkillConfiguration {
    /**
     * The id of the skill.
     */
    readonly id: string;
    /**
     * The model to use for the skill.
     */
    readonly model: string;
    /**
     * The system prompt to use for the skill.
     */
    readonly systemPrompt: string;
}