// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infraestructure/database';
import { SkillsModule } from 'src/skills';
import { AgentsController, AgentsSkillsController } from './controller/index';
import { AgentsRepository } from './repositories/agents/agents.repository';
import { AgentsSkillsRepository } from './repositories/agents-skills/agents-skills.repository';
import { AgentsService } from './service/agents.service';
import { AgentsSkillsService } from './service/agents-skills/agents-skills.service';

@Module({
    controllers: [AgentsController, AgentsSkillsController],
    imports: [DatabaseModule, SkillsModule],
    exports: [AgentsRepository, AgentsService],
    providers: [
        AgentsRepository,
        AgentsService,
        AgentsSkillsRepository,
        AgentsSkillsService,
    ],
})
export class AgentsModule { }
