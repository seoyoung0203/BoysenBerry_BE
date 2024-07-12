import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAnswerBodyDto, UpdateAnswerBodyDto } from './dto/answer.dto';
import { Answer, ExType, Question } from '../database/entities';
import { User } from '../database/entities/user.entity';
import { ExperienceHistoryService } from 'src/experience-history/experience-history.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class AnswerService {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    private readonly experienceHistoryService: ExperienceHistoryService,
    private readonly notificationService: NotificationService,
  ) {}

  async createAnswer(
    createAnswerDto: CreateAnswerBodyDto,
    user: User,
  ): Promise<Answer> {
    const { body, questionId } = createAnswerDto;

    const question = await this.questionRepository.findOne({
      where: {
        id: questionId,
      },
    });
    if (!question) {
      throw new Error('Question not found');
    }

    const answer = new Answer();
    answer.body = body;
    answer.question = question;
    answer.user = user;

    const savedAnswer = await this.answerRepository.save(answer);

    // xp 추가
    await this.experienceHistoryService.gainExperience(user.id, ExType.ANSWER);

    // 동기처리 TODO. 메세지 다시 생각하기 - 알림
    this.notificationService.createNotificationForQuestion(
      user,
      question,
      '질문에 새로운 답변이 달렸습니다.',
    );

    return savedAnswer;
  }

  async updateAnswer(
    answerId: number,
    updateAnswerDto: UpdateAnswerBodyDto,
    user: User,
  ): Promise<Answer> {
    const answer = await this.answerRepository.findOne({
      where: { id: answerId },
      relations: ['user'],
    });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${answerId} not found`);
    }

    if (answer.user.id !== user.id) {
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
      where: { id: answerId },
      relations: ['user'],
    });

    if (!answer) {
      throw new NotFoundException(`Answer with id ${answerId} not found`);
    }

    if (answer.user.id !== user.id) {
      throw new UnauthorizedException(
        `You are not authorized to delete this answer`,
      );
    }

    await this.experienceHistoryService.loseExperience(
      answer.user.id,
      ExType.ANSWER,
    );

    await this.answerRepository.remove(answer);
  }
}
