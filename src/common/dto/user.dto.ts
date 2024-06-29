import { IsString, IsNumber, IsUrl, IsOptional } from 'class-validator';

export class UserProfileDto {
  @IsString()
  readonly userNickname: string;

  @IsNumber()
  readonly userLevel: number;

  @IsUrl()
  @IsOptional()
  readonly userProfile?: string;
}
