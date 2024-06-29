import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAnswerBodyDto {
  @IsString()
  @IsNotEmpty()
  readonly body: string;

  @IsNotEmpty()
  readonly questionId: number;
}

export class UpdateAnswerBodyDto {
  @IsString()
  @IsOptional()
  readonly body?: string;
}
