import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VoteService } from './vote.service';
import { VoteBodyDto } from './dto/vote.dto';
import { User } from '../database/entities/user.entity';

@Controller('votes')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post('questions/:id')
  @UseGuards(AuthGuard('jwt'))
  async voteQuestion(
    @Param('id') questionId: number,
    @Body() voteDto: VoteBodyDto,
    @Req() req,
  ): Promise<void> {
    const user: User = req.user;
    await this.voteService.voteQuestion(questionId, user, voteDto);
  }

  @Post('answers/:id')
  @UseGuards(AuthGuard('jwt'))
  async voteAnswer(
    @Param('id') answerId: number,
    @Body() voteDto: VoteBodyDto,
    @Req() req,
  ): Promise<void> {
    const user: User = req.user;
    await this.voteService.voteAnswer(answerId, user, voteDto);
  }
}
