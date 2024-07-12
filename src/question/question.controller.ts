import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import {
  CreateQuestionBodyDto,
  GetQuestionsQueryDto,
  GetSearchQuestionsQueryDto,
  QuestionDetailDto,
  QuestionListDto,
  UpdateQuestionBodyDto,
} from './dto/question.dto';
import { AuthGuard } from '@nestjs/passport';
import { Question, User } from '../database/entities';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // 질문 작성 API
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionBodyDto,
    @Req() req,
  ) {
    const user: User = req.user;
    return this.questionService.createQuestion(createQuestionDto, user);
  }

  @Post(':id/views')
  async incrementViewCount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.questionService.incrementViewCount(id);
  }

  // 질문 리스트 조회 API
  @Get()
  async getQuestions(
    @Query() getQuestionsQuery: GetQuestionsQueryDto,
  ): Promise<{ questions: QuestionListDto[]; count: number }> {
    const { sortBy, page, limit } = getQuestionsQuery;
    const questions = await this.questionService.getQuestions(
      sortBy,
      page,
      limit,
    );
    const count = await this.questionService.getQuestionTotalCount();
    return { questions, count };
  }

  @Get('search')
  async searchQuestions(
    @Query() query: GetSearchQuestionsQueryDto,
  ): Promise<{ questions: QuestionListDto[]; count: number }> {
    const { searchText, sortBy, page, limit } = query;
    const questions = await this.questionService.searchQuestions(
      searchText,
      sortBy,
      page,
      limit,
    );

    const count =
      await this.questionService.getSearchQuestionTotalCount(searchText);
    return { questions, count };
  }

  // 질문 상세 조회 API
  @Get(':id')
  @UseGuards(OptionalAuthGuard)
  async getQuestionById(
    @Param('id') id: number,
    @Req() req,
  ): Promise<QuestionDetailDto> {
    const user: User = req.user;
    return this.questionService.getQuestionById(id, user);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateQuestion(
    @Param('id') id: number,
    @Body() updateQuestionDto: UpdateQuestionBodyDto,
    @Req() req,
  ): Promise<Question> {
    const user: User = req.user;
    return this.questionService.updateQuestion(id, updateQuestionDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteQuestion(@Param('id') id: number, @Req() req): Promise<void> {
    const userId = req.user.id;
    return this.questionService.deleteQuestion(id, userId);
  }
}
