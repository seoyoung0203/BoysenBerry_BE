import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAnswerBodyDto, UpdateAnswerBodyDto } from './dto/answer.dto';
import { Answer, Question } from '../database/entities';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async createAnswer(
    createAnswerDto: CreateAnswerBodyDto,
    user: User,
  ): Promise<Answer> {
    const { body, questionId } = createAnswerDto;

    const question = await this.questionRepository.findOne({
      where: {
        questionId,
      },
    });
    if (!question) {
      throw new Error('Question not found');
    }

    const answer = new Answer();
    answer.body = body;
    answer.question = question;
    answer.user = user;

    return this.answerRepository.save(answer);
  }

  async updateAnswer(
    answerId: number,
    updateAnswerDto: UpdateAnswerBodyDto,
    user: User,
  ): Promise<Answer> {
    const answer = await this.answerRepository.findOne({
      where: { answerId },
      relations: ['user'],
    });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${answerId} not found`);
    }

    if (answer.user.userId !== user.userId) {
      throw new UnauthorizedException(
        `You are not authorized to update this answer`,
      );
    }

    if (updateAnswerDto.body) {
      answer.body = updateAnswerDto.body;
    }

    return this.answerRepository.save(answer);
  }

  async deleteAnswer(answerId: number, user: User): Promise<void> {
    const answer = await this.answerRepository.findOne({
      where: { answerId },
      relations: ['user'],
    });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${answerId} not found`);
    }

    if (answer.user.userId !== user.userId) {
      throw new UnauthorizedException(
        `You are not authorized to delete this answer`,
      );
    }

    await this.answerRepository.remove(answer);
  }
}
