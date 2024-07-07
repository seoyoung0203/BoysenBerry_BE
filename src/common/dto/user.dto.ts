import { IsString, IsNumber, IsUrl, IsOptional } from 'class-validator';

export class UserProfileDto {
  @IsNumber()
  readonly userId: number;

  @IsString()
  readonly nickname: string;

  @IsNumber()
  readonly level: number;

  @IsUrl()
  @IsOptional()
  readonly profileImage?: string;

  @IsString()
  @IsOptional()
  readonly createdAt?: string;
}
