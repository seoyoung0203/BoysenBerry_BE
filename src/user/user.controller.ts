import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/database/entities';
import { UserService } from './user.service';
import {
  UserQuestionDto,
  DashboardDto,
  UserAnswerDto,
  UpdateUserProfileBodyDto,
} from './dto/user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/dashboard')
  @UseGuards(AuthGuard('jwt'))
  async getUserStats(@Req() req): Promise<DashboardDto> {
    const user: User = req.user;
    console.log('TTTTTT');
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
  async getUserAnswers(@Req() req): Promise<UserAnswerDto[]> {
    const userId = req.user.id;
    return this.userService.getUserAnswers(userId);
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
