import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { Question, Vote } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Vote])],
  providers: [QuestionService],
  controllers: [QuestionController],
})
export class QuestionModule {}
