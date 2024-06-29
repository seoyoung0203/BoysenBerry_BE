import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import moment from 'moment';
import {
  CreateQuestionBodyDto,
  UpdateQuestionBodyDto,
} from './dto/question.dto';
import { Question, QuestionStatus, User } from '../database/entities';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async createQuestion(
    createQuestionDto: CreateQuestionBodyDto,
    user: User,
  ): Promise<Question> {
    const { title, body, status } = createQuestionDto;

    const question = new Question();
    question.title = title;
    question.body = body;
    question.status = status;
    question.user = user;

    const savedQuestion = await this.questionRepository.save(question);

    return this.questionRepository.save(savedQuestion);
  }

  async getQuestionTotalCount() {
    const QuestionCount = await this.questionRepository.count({
      where: {
        status: QuestionStatus.PUBLISHED,
      },
    });
    return QuestionCount;
  }

  async getQuestions(sortBy: string, page: number = 1, limit: number = 10) {
    let order = {};
    if (sortBy === 'answers') {
      order = { answers: 'DESC' };
    } else if (sortBy === 'latest') {
      order = { createdAt: 'DESC' };
    }

    const skipAmount = (page - 1) * limit;

    const questions = await this.questionRepository.find({
      select: { questionId: true, title: true, body: true, createdAt: true },
      relations: ['user'],
      where: {
        status: QuestionStatus.PUBLISHED,
        isVisible: true,
      },
      order,
      skip: skipAmount, // 건너뛸 항목 수 설정
      take: limit,
    });

    const result = questions.map((question) => {
      const LIST_CONTEXT_LENGTH = 100;
      return {
        id: question.questionId,
        title: question.title,
        content: question.body.slice(0, LIST_CONTEXT_LENGTH),
        userNickname: question.user.nickname,
        userProfile: question.user.profilePicture,
        userLevel: question.user.level,
        date: moment(question.createdAt).format('YYYY-DD-MM'),
      };
    });

    return result;
  }

  async getQuestionById(id: number) {
    const question = await this.questionRepository.findOne({
      where: {
        questionId: id,
      },
      relations: ['user', 'answers', 'answers.user'],
    });

    let answers = [];
    if (question.answers.length) {
      answers = question.answers.map((answer) => {
        return {
          answerId: answer.answerId,
          content: answer.body,
          voteCount: answer.approveCount - answer.rejectCount || 0,
          userNickname: answer.user.nickname,
          userLevel: answer.user.level,
          userProfile: answer.user.profilePicture,
          date: moment(answer.createdAt).format('YYYY-DD-MM'),
        };
      });
    }

    const result = {
      questionId: question.questionId,
      title: question.title,
      content: question.body,
      userNickname: question.user.nickname,
      userLevel: question.user.level,
      userProfile: question.user.profilePicture,
      voteCount: question.approveCount - question.rejectCount || 0,
      date: moment(question.createdAt).format('YYYY-DD-MM'),
      answers,
    };

    return result;
  }

  async updateQuestion(
    id: number,
    updateQuestionDto: UpdateQuestionBodyDto,
    user: User,
  ): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { questionId: id },
      relations: ['user'],
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${id} not found`);
    }

    if (question.user.userId !== user.userId) {
      throw new NotFoundException(
        `You are not authorized to update this question`,
      );
    }

    if (updateQuestionDto.title) {
      question.title = updateQuestionDto.title;
    }

    if (updateQuestionDto.body) {
      question.body = updateQuestionDto.body;
    }

    return this.questionRepository.save(question);
  }

  async deleteQuestion(id: number, user: User): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { questionId: id },
      relations: ['user'],
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${id} not found`);
    }

    if (question.user.userId !== user.userId) {
      throw new UnauthorizedException(
        `You are not authorized to delete this question`,
      );
    }

    await this.questionRepository.remove(question);
  }
}
