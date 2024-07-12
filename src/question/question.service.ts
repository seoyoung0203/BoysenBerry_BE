import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import moment from 'moment';
import {
  AnswerDto,
  CreateQuestionBodyDto,
  UpdateQuestionBodyDto,
} from './dto/question.dto';
import {
  ExType,
  Question,
  QuestionStatus,
  User,
  Vote,
  VoteTypeEnum,
} from '../database/entities';
import { ExperienceHistoryService } from 'src/experience-history/experience-history.service';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    private readonly experienceHistoryService: ExperienceHistoryService,
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
    await this.experienceHistoryService.gainExperience(
      user.id,
      ExType.QUESTION,
    );

    return savedQuestion;
  }

  async getQuestionTotalCount() {
    const QuestionCount = await this.questionRepository.count({
      where: {
        status: QuestionStatus.PUBLISHED,
      },
    });
    return QuestionCount;
  }

  async getSearchQuestionTotalCount(searchText: string): Promise<number> {
    const searchQuery = this.questionRepository
      .createQueryBuilder('question')
      .where('question.title LIKE :query', { query: `%${searchText}%` })
      .orWhere('question.body LIKE :query', { query: `%${searchText}%` });

    return searchQuery.getCount();
  }

  async searchQuestions(
    searchText: string,
    sort: string,
    page: number,
    limit: number,
  ) {
    const whereCondition = [
      { title: Like(`%${searchText}%`) },
      { body: Like(`%${searchText}%`) },
    ];

    const orderCondition = {};
    if (sort === 'popular') {
      orderCondition['approveCount'] = 'ASC';
    } else if (sort === 'latest') {
      orderCondition['updatedAt'] = 'ASC';
    }

    const questions = await this.questionRepository.find({
      select: [
        'id',
        'title',
        'body',
        'updatedAt',
        'approveCount',
        'rejectCount',
      ],
      relations: ['user', 'user.level'],
      where: whereCondition,
      order: orderCondition,
      skip: (page - 1) * limit,
      take: limit,
    });

    return questions.map((question) => {
      return {
        id: question.id,
        title: question.title,
        body: question.body,
        userId: question.user.id,
        nickname: question.user.nickname,
        profileImage: question.user.profilePicture,
        level: question.user.level.level,
        voteCount: question.approveCount - question.rejectCount,
        lastUpdated: moment(question.updatedAt).format('YYYY-MM-DD'),
      };
    });
  }

  async getQuestions(sortBy: string, page: number = 1, limit: number = 10) {
    let order = {};
    if (sortBy === 'popular') {
      order = { approveCount: 'ASC' };
    } else if (sortBy === 'latest') {
      order = { updatedAt: 'DESC' };
    }

    const skipAmount = (page - 1) * limit;

    const questions = await this.questionRepository.find({
      select: {
        id: true,
        title: true,
        body: true,
        approveCount: true,
        rejectCount: true,
        updatedAt: true,
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
      return {
        id: question.id,
        title: question.title,
        body: question.body,
        userId: question.user.id,
        nickname: question.user.nickname,
        profileImage: question.user.profilePicture,
        level: question.user.level.level,
        voteCount: question.approveCount - question.rejectCount,
        lastUpdated: moment(question.updatedAt).format('YYYY-MM-DD'),
      };
    });

    return result;
  }

  async getQuestionById(questionId: number, user?) {
    const question = await this.questionRepository.findOne({
      where: {
        id: questionId,
      },
      relations: [
        'user',
        'user.level',
        'answers',
        'answers.user',
        'answers.user.level',
      ],
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
        const isEdited = !moment(answer.createdAt).isSame(
          moment(answer.updatedAt),
        );
        return {
          id: answer.id,
          body: answer.body,
          voteCount: answer.approveCount - answer.rejectCount || 0,
          userId: answer.user.id,
          nickname: answer.user.nickname,
          level: answer.user.level.level,
          profileImage: answer.user.profilePicture,
          approveVoted: answerVote ? answerVote.approveVoted : false,
          isEdited,
          lastUpdated: moment(answer.updatedAt).format('YYYY-MM-DD'),
        };
      });
    }

    const isEdited = !moment(question.createdAt).isSame(
      moment(question.updatedAt),
    );

    return {
      questionId: question.id,
      title: question.title,
      body: question.body,
      approveVoted: questionVote ? true : false,
      userId: question.user.id,
      nickname: question.user.nickname,
      level: question.user.level.level,
      profileImage: question.user.profilePicture,
      voteCount: question.approveCount - question.rejectCount || 0,
      isEdited,
      lastUpdated: moment(question.updatedAt).format('YYYY-DD-MM'),
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

    await this.experienceHistoryService.loseExperience(
      question.user.id,
      ExType.QUESTION,
    );

    await this.questionRepository.remove(question);
  }

  async incrementViewCount(questionId: number): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id: questionId },
    });
    if (!question) {
      throw new NotFoundException(`Question with id ${questionId} not found`);
    }

    question.viewsCount += 1;
    await this.questionRepository.save(question);
  }
}
