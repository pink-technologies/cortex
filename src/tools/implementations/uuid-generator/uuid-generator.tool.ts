// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { Tool } from "src/tools/interface/tool";
import { v4 as uuid } from 'uuid';

/**
 * This tool is used to generate a UUID.
 * @slug uuid-generator-tool
 * @name UUID Generator Tool
 * @returns The UUID.
 */
@Injectable()
export class UUIDGeneratorTool implements Tool {
    /**
     * The slug of the tool.
     */
    readonly slug = 'uuid-generator-tool';

    /**
     * The name of the tool.
     */
    readonly name = 'UUID Generator Tool';

    /**
     * Generates a UUID.
     * @param input - The input to the tool.
     * @returns The UUID.
     */
    async execute(): Promise<any> {
        return {
            uuid: uuid(),
        };
    }
}