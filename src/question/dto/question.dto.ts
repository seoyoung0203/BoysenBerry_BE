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

export class GetQuestionsQueryDto {
  @IsOptional()
  @IsIn(['answers', 'latest'], {
    message: 'sortBy must be either "answers" or "latest"',
  })
  sortBy?: string;

  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  limit?: number = 10;
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