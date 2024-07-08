import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from 'src/database/entities';

export class UserRankDto {
  @IsNumber()
  rank: number;

  @IsString()
  nickname: string;

  @IsNumber()
  level: number;

  @IsString()
  levelName: string;

  @IsString()
  profilePicture: string;

  @IsNumber()
  totalExperience: number;

  @IsNumber()
  daysSinceJoined: number;
}

class TopContentDto {
  @IsNumber()
  contentId: number;

  @IsString()
  title: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsNumber()
  voteCount: number;

  @IsString()
  date: string;
}

class ContentCountDto {
  @IsNumber()
  questionCount: number;

  @IsNumber()
  answerCount: number;

  @IsNumber()
  receivedVoteCount: number;
}

class UserDashboardDto {
  @IsNumber()
  userId: number;

  @IsString()
  nickname: string;

  @IsNumber()
  level: number;

  @IsString()
  levelName: string;

  @IsNumber()
  topPercentage: number;

  @IsNumber()
  totalUserCount: number;

  @IsNumber()
  totalExperience: number;

  @IsNumber()
  currentExperience: number; // experience -> currentExperience로 변경하여 명확히 함

  @IsNumber()
  experienceToNextLevel: number; // neededForNextLevel -> experienceToNextLevel로 변경하여 명확히 함

  @IsNumber()
  rank: number;

  @IsNumber()
  rankChange: number;
}

export class DashboardDto {
  @ValidateNested()
  @Type(() => UserDashboardDto)
  user: UserDashboardDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopContentDto)
  topContents: TopContentDto[];

  @ValidateNested()
  @Type(() => ContentCountDto)
  contentCounts: ContentCountDto;
}

export class UserQuestionDto {
  @IsNumber()
  id: number;

  @IsNumber()
  approveCount: number;

  @IsNumber()
  receivedAnswersCount: number;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

export class UserAnswerDto {
  @IsNumber()
  id: number;

  @IsNumber()
  questionId: number;

  @IsString()
  body: string;

  @IsNumber()
  approveCount: number;

  @IsString()
  createdAt: string;
}

export class UpdateUserProfileBodyDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsBoolean()
  isEmailConsent?: boolean;
}
