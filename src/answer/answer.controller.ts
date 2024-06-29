import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { AnswerService } from './answer.service';
import { CreateAnswerBodyDto, UpdateAnswerBodyDto } from './dto/answer.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../database/entities/user.entity';

@Controller('answers')
export class AnswerController {
  constructor(private readonly answerService: AnswerService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createAnswer(@Body() createAnswerDto: CreateAnswerBodyDto, @Req() req) {
    const user: User = req.user;
    return this.answerService.createAnswer(createAnswerDto, user);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateAnswer(
    @Param('id') id: number,
    @Body() updateAnswerDto: UpdateAnswerBodyDto,
    @Req() req,
  ): Promise<any> {
    const user: User = req.user;
    return this.answerService.updateAnswer(id, updateAnswerDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteAnswer(@Param('id') id: number, @Req() req): Promise<void> {
    const user: User = req.user;
    return this.answerService.deleteAnswer(id, user);
  }
}
