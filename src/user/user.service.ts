import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import {
  UserAnswerDto,
  UserQuestionDto,
  DashboardDto,
  UpdateUserProfileBodyDto,
  UserRankDto,
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
      relations: ['questions', 'questions.votes', 'questions.answers'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const userQuestions = user.questions.map((question) => {
      const approveCount = question.votes.filter(
        (vote) => vote.voteType === VoteTypeEnum.APPROVE,
      ).length;
      const receivedAnswersCount = question.answers.length;

      return {
        id: question.id,
        approveCount,
        receivedAnswersCount,
        title: question.title,
        body: question.body.slice(0, 100),
        createdAt: question.createdAt.toISOString(),
      } as UserQuestionDto;
    });

    return userQuestions;
  }

  async getUserAnswers(userId: number, limit, page): Promise<UserAnswerDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['answers', 'answers.votes', 'answers.question'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const userAnswers = user.answers.map((answer) => {
      const approveCount = answer.votes.filter(
        (vote) => vote.voteType === VoteTypeEnum.APPROVE,
      ).length;

      return {
        id: answer.id,
        questionId: answer.question.id,
        body: answer.body.slice(0, 100),
        approveCount,
        createdAt: answer.createdAt.toISOString(),
      } as UserAnswerDto;
    });

    return userAnswers;
  }

  async getUserRankings(page: number, limit: number): Promise<UserRankDto[]> {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['level'],
      order: { totalExperience: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const userRankings = users.map((user, index) => {
      const daysSinceJoined = Math.floor(
        (new Date().getTime() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        rank: (page - 1) * limit + index + 1,
        nickname: user.nickname,
        level: user.level.level,
        levelName: user.level.name,
        profilePicture: user.profilePicture,
        totalExperience: user.totalExperience,
        daysSinceJoined,
      } as UserRankDto;
    });

    return userRankings;
  }
}
