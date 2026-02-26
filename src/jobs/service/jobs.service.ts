// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Injectable } from "@nestjs/common";
import { Database } from "src/infraestructure/database";

@Injectable()
export class JobsService {
    // MARK: - constructor

    constructor(private readonly database: Database) {}

    // MARK: - Instance methods
    
    async create(parameters: CreateJobDTO) {
        return this.database.job.create();
    }
}