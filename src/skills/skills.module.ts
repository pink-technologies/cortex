// Copyright (c) 2026, PinkTech
// https://pink-tech.io/

import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infraestructure/database';
import { SkillsRepository } from './repositories/skills.repository';
import { SkillsController } from './controller/skills.controller';
import { SkillsService } from './service/skills.service';

@Module({
    controllers: [SkillsController],
    imports: [DatabaseModule],
    exports: [SkillsRepository, SkillsService],
    providers: [SkillsRepository, SkillsService],
})
export class SkillsModule { }
