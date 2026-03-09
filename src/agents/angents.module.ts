// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { AgentsRepository } from './repositories/agents.repository';
import { AgentsService } from './service/agents.service';
import { DatabaseModule } from 'src/infraestructure/database';
import { AgentsController, AgentsSkillsController } from './controller/index';

@Module({
    controllers: [AgentsController, AgentsSkillsController],
    imports: [DatabaseModule],
    exports: [AgentsRepository, AgentsService],
    providers: [AgentsRepository, AgentsService],
})
export class AgentsModule { }
