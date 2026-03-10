// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { AgentsController, AgentsSkillsController } from './controller/index';
import { AgentsRepository } from './repositories/agents.repository';
import { AgentsSkillsRepository } from './repositories/agents-skills/agents-skills.repository';
import { AgentsService } from './service/agents.service';
import { AgentsSkillsService } from './service/agents-skills/agents-skills.service';
import { DatabaseModule } from 'src/infraestructure/database';
import { Module } from '@nestjs/common';
import { SkillsModule } from 'src/skills';

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
