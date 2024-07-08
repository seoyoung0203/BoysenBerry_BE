import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Answer,
  User,
  Question,
  ContentType,
  Vote,
  VoteTypeEnum,
  ExType,
} from '../database/entities/';
import { VoteBodyDto } from './dto/vote.dto';
import { ExperienceHistoryService } from 'src/experience-history/experience-history.service';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    private readonly experienceHistoryService: ExperienceHistoryService,
  ) {}

  async modifyVote(
    user,
    content: Question | Answer,
    voteDto,
    contentType: ContentType,
  ) {
    let where = {};
    if (contentType === ContentType.QUESTION) {
      where = {
        user: { userId: user.userId },
        question: content,
        voteType: voteDto.voteType,
        contentType,
      };
    }

    if (contentType === ContentType.ANSWER) {
      where = {
        user: { userId: user.userId },
        answer: content,
        voteType: voteDto.voteType,
        contentType,
      };
    }
    let vote = await this.voteRepository.findOne({
      where,
    });

    if (voteDto.value === 1) {
      if (vote) {
        if (vote.voteType === voteDto.voteType) {
          throw new BadRequestException('You have already voted');
        }
      }

      const createdVote = new Vote();
      createdVote.contentType = contentType;
      if (contentType === ContentType.QUESTION) {
        createdVote.question = content as Question;
      }

      if (contentType === ContentType.ANSWER) {
        createdVote.answer = content as Answer;
      }

      createdVote.user = user;
      createdVote.voteType = voteDto.voteType;

      // xp 쌓기
      await this.experienceHistoryService.gainExperience(
        content.user.id,
        ExType.APPROVE_VOTE,
      );

      await this.voteRepository.save(createdVote);
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
        id: questionId,
      },
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${questionId} not found`);
    }

    await this.modifyVote(user, question, voteDto, ContentType.QUESTION);

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
        id: answerId,
      },
    });
    if (!answer) {
      throw new NotFoundException(`Question with id ${answerId} not found`);
    }

    await this.modifyVote(user, answer, voteDto, ContentType.ANSWER);

    if (voteDto.voteType === VoteTypeEnum.APPROVE) {
      answer.approveCount += voteDto.value;
    } else if (voteDto.voteType === VoteTypeEnum.REJECT) {
      answer.rejectCount += voteDto.value;
    }

    await this.answerRepository.save(answer);
  }
}
