import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';
import { Answer, Question, User, Vote } from 'src/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, Question, Answer])],
  providers: [VoteService],
  controllers: [VoteController],
})
export class VoteModule {}
