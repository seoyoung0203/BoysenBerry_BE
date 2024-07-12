import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExperienceHistoryService } from './experience-history.service';
import { ExperienceHistory, User } from 'src/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([ExperienceHistory, User])],
  providers: [ExperienceHistoryService],
  exports: [ExperienceHistoryService],
})
export class ExperienceHistoryModule {}
