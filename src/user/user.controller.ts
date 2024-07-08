import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/database/entities';
import { UserService } from './user.service';
import {
  UserQuestionDto,
  DashboardDto,
  UserAnswerDto,
  UpdateUserProfileBodyDto,
  UserRankDto,
} from './dto/user.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/dashboard')
  @UseGuards(AuthGuard('jwt'))
  async getUserStats(@Req() req): Promise<DashboardDto> {
    const user: User = req.user;
    return this.userService.getDashboard(user.id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getUserData(@Req() req) {
    const user: User = req.user;
    return this.userService.getUserData(user.id);
  }

  @Get('questions')
  @UseGuards(AuthGuard('jwt'))
  async getUserQuestions(@Req() req): Promise<UserQuestionDto[]> {
    const userId = req.user.id;
    return this.userService.getUserQuestions(userId);
  }

  @Get('answers')
  @UseGuards(AuthGuard('jwt'))
  async getUserAnswers(
    @Req() req,
    @Query() query: PaginationQueryDto,
  ): Promise<UserAnswerDto[]> {
    const userId = req.user.id;
    return this.userService.getUserAnswers(userId, query.limit, query.page);
  }

  @Get('rankings')
  async getUserRankings(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<UserRankDto[]> {
    return this.userService.getUserRankings(
      paginationQuery.page,
      paginationQuery.limit,
    );
  }

  @Get('rankings/top')
  async getUserTopRanking() {
    return this.userService.getUserTopRanking();
  }

  @Put()
  @UseGuards(AuthGuard('jwt'))
  async updateUserProfile(
    @Req() req,
    @Body() updateUserProfileDto: UpdateUserProfileBodyDto,
  ): Promise<User> {
    const userId = req.user.is;
    return this.userService.updateUserProfile(userId, updateUserProfileDto);
  }
}
