import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerService } from './answer.service';
import { AnswerController } from './answer.controller';
import { Answer, Question } from '../database/entities';
import { ExperienceHistoryModule } from 'src/experience-history/experience-history.module';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Answer, Question]),
    ExperienceHistoryModule,
    NotificationModule,
  ],
  providers: [AnswerService],
  controllers: [AnswerController],
})
export class AnswerModule {}
