import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import moment from 'moment';
import {
  AnswerDto,
  CreateQuestionBodyDto,
  UpdateQuestionBodyDto,
} from './dto/question.dto';
import {
  Question,
  QuestionStatus,
  User,
  Vote,
  VoteTypeEnum,
} from '../database/entities';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
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
    if (sortBy === 'popular') {
      order = { approveCount: 'ASC' };
    } else if (sortBy === 'latest') {
      order = { createdAt: 'DESC' };
    }

    const skipAmount = (page - 1) * limit;

    const questions = await this.questionRepository.find({
      select: {
        id: true,
        title: true,
        body: true,
        approveCount: true,
        rejectCount: true,
        createdAt: true,
      },
      relations: ['user', 'user.level'],
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
        id: question.id,
        title: question.title,
        content: question.body.slice(0, LIST_CONTEXT_LENGTH),
        userId: question.user.id,
        nickname: question.user.nickname,
        profileImage: question.user.profilePicture,
        level: question.user.level.level,
        voteCount: question.approveCount - question.rejectCount,
        date: moment(question.createdAt).format('YYYY-MM-DD'),
      };
    });

    return result;
  }

  async getQuestionById(questionId: number, user?) {
    const question = await this.questionRepository.findOne({
      where: {
        id: questionId,
      },
      relations: ['user', 'answers', 'answers.user', 'answers.user.level'],
    });

    let questionVote = null;
    let answerVotes = [];
    if (user) {
      questionVote = await this.voteRepository.findOne({
        where: {
          question: { id: questionId },
          voteType: VoteTypeEnum.APPROVE,
          user,
        },
      });

      answerVotes = await Promise.all(
        question.answers.map(async (answer) => {
          const approveVote = await this.voteRepository.findOne({
            where: {
              answer: { id: answer.id },
              voteType: VoteTypeEnum.APPROVE,
              user,
            },
          });

          return {
            answerId: answer.id,
            approveVoted: approveVote ? true : false,
          };
        }),
      );
    }

    let answers: AnswerDto[] = [];
    if (question.answers.length) {
      answers = question.answers.map((answer) => {
        const answerVote = answerVotes.find((av) => av.answerId === answer.id);

        return {
          answerId: answer.id,
          content: answer.body,
          voteCount: answer.approveCount - answer.rejectCount || 0,
          userId: answer.user.id,
          nickname: answer.user.nickname,
          level: answer.user.level.level,
          profileImage: answer.user.profilePicture,
          approveVoted: answerVote ? answerVote.approveVoted : false,
          date: moment(answer.createdAt).format('YYYY-MM-DD'),
        };
      });
    }

    return {
      questionId: question.id,
      title: question.title,
      content: question.body,
      approveVoted: questionVote ? true : false,
      userId: question.user.id,
      nickname: question.user.nickname,
      level: question.user.level.level,
      profileImage: question.user.profilePicture,
      voteCount: question.approveCount - question.rejectCount || 0,
      date: moment(question.createdAt).format('YYYY-DD-MM'),
      answers,
    };
  }

  async updateQuestion(
    questionId: number,
    updateQuestionDto: UpdateQuestionBodyDto,
    user: User,
  ): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['user'],
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${questionId} not found`);
    }

    if (question.user.id !== user.id) {
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

  async deleteQuestion(questionId: number, user: User): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
      relations: ['user'],
    });

    if (!question) {
      throw new NotFoundException(`Question with id ${questionId} not found`);
    }

    if (question.user.id !== user.id) {
      throw new UnauthorizedException(
        `You are not authorized to delete this question`,
      );
    }

    await this.questionRepository.remove(question);
  }
}
