import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsIn,
  IsArray,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import { UserProfileDto } from 'src/common/dto/user.dto';
import { QuestionStatus } from 'src/database/entities';

export class CreateQuestionBodyDto {
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @IsString()
  @IsNotEmpty()
  readonly body: string;

  @IsEnum(QuestionStatus)
  status: 'draft' | 'published';
}

export class GetQuestionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['answers', 'latest'], {
    message: 'sortBy must be either "answers" or "latest"',
  })
  sortBy?: string;
}

export class QuestionListDto extends UserProfileDto {
  @IsNumber()
  readonly id: number;

  @IsString()
  readonly title: string;

  @IsString()
  readonly content: string;

  @IsString()
  readonly date: string;
}

export class AnswerDto extends UserProfileDto {
  @IsNumber()
  readonly answerId: number;

  @IsString()
  readonly content: string;

  @IsString()
  readonly date: string;
}

export class QuestionDetailDto extends UserProfileDto {
  @IsNumber()
  readonly questionId: number;

  @IsString()
  readonly title: string;

  @IsString()
  readonly content: string;

  @IsString()
  readonly date: string;

  @IsArray()
  readonly answers: AnswerDto[];
}

export class UpdateQuestionBodyDto {
  @IsString()
  @IsOptional()
  readonly title?: string;

  @IsString()
  @IsOptional()
  readonly body?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  readonly tags?: string[];
}
