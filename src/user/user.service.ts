import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import {
  UserAnswerDto,
  UserQuestionDto,
  DashboardDto,
  UpdateUserProfileBodyDto,
} from './dto/user.dto';
import { ContentType, VoteTypeEnum } from 'src/database/entities';
import moment from 'moment';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getUserActivity(user: User) {
    const questionsWithApproveCount = user.questions.map((question) => ({
      contentId: question.id,
      title: `${question.title.replace(/<[^>]+>/g, '').slice(0, 20)} ..`,
      contentType: ContentType.QUESTION,
      voteCount: question.votes.filter(
        (vote) => vote.voteType === VoteTypeEnum.APPROVE,
      ).length,
      date: moment(question.createdAt).format('YYYY-MM-DD'),
    }));

    const answersWithApproveCount = user.answers.map((answer) => ({
      contentId: answer.id,
      title: `${answer.body.replace(/<[^>]+>/g, '').slice(0, 20)} ..`, // 답변은 제목이 없으므로
      contentType: ContentType.ANSWER,
      voteCount: answer.votes.filter(
        (vote) => vote.voteType === VoteTypeEnum.APPROVE,
      ).length,
      date: moment(answer.createdAt).format('YYYY-MM-DD'),
    }));

    const allContents = [
      ...questionsWithApproveCount,
      ...answersWithApproveCount,
    ];

    const top3Contents = allContents
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 3);

    const questionCount = user.questions.length;
    const answerCount = user.answers.length;
    const receivedVoteCount = allContents.reduce(
      (acc, content) => acc + content.voteCount,
      0,
    );

    return {
      topContents: top3Contents,
      contentCounts: { questionCount, answerCount, receivedVoteCount },
    };
  }

  async getDashboard(userId: number): Promise<DashboardDto> {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        email: true,
        nickname: true,
        experience: true,
        totalExperience: true,
        previousRank: true,
      },
      where: { id: userId },
      relations: [
        'level',
        'questions',
        'answers',
        'answers.votes',
        'questions.votes',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const userDashboard = await this.getUserDashboard(user);
    const { topContents, contentCounts } = await this.getUserActivity(user);

    const dashboard: DashboardDto = {
      user: userDashboard,
      topContents: topContents,
      contentCounts: contentCounts,
    };

    return dashboard;
  }

  async getUserDashboard(user: User) {
    const totalUserCount = await this.userRepository.count();
    const usersRank = await this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.experience', 'DESC')
      .getMany();

    const userRank = usersRank.findIndex((u) => u.id === user.id) + 1;
    const topPercentage = (userRank / totalUserCount) * 100;

    const userDashboard = {
      userId: user.id,
      nickname: user.nickname,
      level: user.level.level,
      levelName: user.level.name,
      rank: userRank,
      rankChange: user.previousRank - userRank || 0,
      topPercentage: Math.floor(topPercentage * 100) / 100,
      totalUserCount,
      totalExperience: user.totalExperience,
      currentExperience: user.experience,
      experienceToNextLevel: user.level.experienceThreshold - user.experience,
    };

    return userDashboard;
  }

  async getUserData(userId: number) {
    const user = await this.userRepository.findOne({
      select: {
        id: true,
        nickname: true,
        email: true,
        isEmailConsent: true,
      },
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user;
  }

  async updateUserProfile(
    userId: number,
    updateUserProfileDto: UpdateUserProfileBodyDto,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    if (updateUserProfileDto.nickname) {
      user.nickname = updateUserProfileDto.nickname;
    }
    if (updateUserProfileDto.isEmailConsent !== undefined) {
      user.isEmailConsent = updateUserProfileDto.isEmailConsent;
    }

    return this.userRepository.save(user);
  }

  async getUserQuestions(userId: number): Promise<UserQuestionDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['questions'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const userQuestions: UserQuestionDto[] = user.questions.map((question) => ({
      questionId: question.id,
      title: question.title,
      body: question.body,
      createdAt: moment(question.createdAt).format('YYYY-MM-DD'),
    }));

    return userQuestions;
  }

  async getUserAnswers(userId: number): Promise<UserAnswerDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['answers'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const userAnswers: UserAnswerDto[] = user.answers.map((answer) => ({
      answerId: answer.id,
      body: answer.body,
      createdAt: moment(answer.createdAt).format('YYYY-MM-DD'),
    }));

    return userAnswers;
  }
}
