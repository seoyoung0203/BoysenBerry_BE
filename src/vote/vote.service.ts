import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContentType,
  Vote,
  VoteTypeEnum,
} from '../database/entities/vote.entity';
import { Question } from '../database/entities/question.entity';
import { User } from '../database/entities/user.entity';
import { VoteBodyDto } from './dto/vote.dto';
import { Answer } from 'src/database/entities';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  async modifyVote(user, question, voteDto, contentType) {
    let vote = await this.voteRepository.findOne({
      where: { user, question, voteType: voteDto.voteType, contentType },
    });

    if (voteDto.value) {
      if (vote) {
        if (vote.voteType === voteDto.voteType) {
          throw new BadRequestException('You have already voted');
        }
      }

      vote = this.voteRepository.create({
        user,
        question,
      });

      await this.voteRepository.save(vote);
    } else {
      if (vote) {
        await this.voteRepository.remove(vote);
      }
    }
  }

  async voteQuestion(
    questionId: number,
    user: User,
    voteDto: VoteBodyDto,
  ): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: {
        questionId,
      },
    });
    if (!question) {
      throw new NotFoundException(`Question with id ${questionId} not found`);
    }

    await this.modifyVote(questionId, user, voteDto, ContentType.QUESTION);

    if (voteDto.voteType === VoteTypeEnum.APPROVE) {
      question.approveCount += voteDto.value;
    } else if (voteDto.voteType === VoteTypeEnum.REJECT) {
      question.rejectCount += voteDto.value;
    }

    await this.questionRepository.save(question);
  }

  async voteAnswer(
    answerId: number,
    user: User,
    voteDto: VoteBodyDto,
  ): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: {
        answerId,
      },
    });
    if (!answer) {
      throw new NotFoundException(`Question with id ${answerId} not found`);
    }

    await this.modifyVote(answerId, user, voteDto, ContentType.ANSWER);

    if (voteDto.voteType === VoteTypeEnum.APPROVE) {
      answer.approveCount += voteDto.value;
    } else if (voteDto.voteType === VoteTypeEnum.REJECT) {
      answer.rejectCount += voteDto.value;
    }

    await this.answerRepository.save(answer);
  }
}
