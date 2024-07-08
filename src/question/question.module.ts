import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { Question, Vote } from '../database/entities';
import { ExperienceHistoryModule } from 'src/experience-history/experience-history.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Vote]),
    ExperienceHistoryModule,
  ],
  providers: [QuestionService],
  controllers: [QuestionController],
})
export class QuestionModule {}
