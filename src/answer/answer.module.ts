import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { Answer, Question } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Answer, Question])],
  providers: [AnswerService],
  controllers: [AnswerController],
})
export class AnswerModule {}
