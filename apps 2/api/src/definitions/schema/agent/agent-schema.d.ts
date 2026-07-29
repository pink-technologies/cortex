import { z } from 'zod';
export declare const agentConfigurationOptionSchema: z.ZodObject<{
    value: z.ZodString;
    label: z.ZodString;
}, z.core.$strip>;
export declare const agentConfigurationSchema: z.ZodObject<{
    key: z.ZodString;
    label: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<{
        text: "text";
        multiselect: "multiselect";
        select: "select";
    }>;
    required: z.ZodBoolean;
    source: z.ZodOptional<z.ZodString>;
    default: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const agentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    capabilities: z.ZodArray<z.ZodString>;
    description: z.ZodString;
    prompt_file: z.ZodString;
    skills: z.ZodArray<z.ZodString>;
    skill_groups: z.ZodArray<z.ZodString>;
    delegates_to: z.ZodArray<z.ZodString>;
    tags: z.ZodArray<z.ZodString>;
    configuration: z.ZodOptional<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        description: z.ZodString;
        type: z.ZodEnum<{
            text: "text";
            multiselect: "multiselect";
            select: "select";
        }>;
        required: z.ZodBoolean;
        source: z.ZodOptional<z.ZodString>;
        default: z.ZodOptional<z.ZodString>;
        options: z.ZodOptional<z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            label: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    execution: z.ZodObject<{
        timeout_ms: z.ZodNumber;
        max_iterations: z.ZodNumber;
    }, z.core.$strip>;
    llm: z.ZodObject<{
        model: z.ZodString;
        max_tokens: z.ZodNumber;
        temperature: z.ZodNumber;
        provider: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodEnum<{
            anthropic: "anthropic";
            apenAI: "apenAI";
        }>>;
    }, z.core.$strip>;
    role: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodEnum<{
        main: "main";
        specialist: "specialist";
    }>>;
    safety: z.ZodObject<{
        allow_skill_use: z.ZodOptional<z.ZodBoolean>;
        allow_capability_use: z.ZodOptional<z.ZodBoolean>;
        allow_delegation: z.ZodOptional<z.ZodBoolean>;
        max_delegation_depth: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
