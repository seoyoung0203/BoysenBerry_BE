import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { Answer, Question, Vote } from 'src/database/entities';
import { ExperienceHistoryModule } from 'src/experience-history/experience-history.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Question, Answer]),
    ExperienceHistoryModule,
    NotificationModule,
  ],
  providers: [VoteService],
  controllers: [VoteController],
})
export class VoteModule {}
