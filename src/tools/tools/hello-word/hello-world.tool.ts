// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/tools/tool";

/**
 * This tool is used to say hello to the world
 * @slug hello-world-tool
 * @name Hello World Tool
 * @param name - The name to greet
 * @returns The greeting
 */
@Injectable()
export class HelloWorldTool implements Tool {
    /**
     * The slug of the tool.
     */
    readonly slug = 'hello-world-tool';

    /**
     * The name of the tool.
     */
    readonly name = 'Hello World Tool';

    /**
     * Say hello to the world
     * @param parameters - The parameters to the tool
     * @returns The greeting
     */
    async execute(name: string): Promise<string> {
        return `Hello, ${name ?? 'World'}!`;
    }
}