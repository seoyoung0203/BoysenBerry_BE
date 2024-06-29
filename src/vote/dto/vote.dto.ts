import { IsEnum, IsNumber } from 'class-validator';
import { VoteTypeEnum } from 'src/database/entities';

export class VoteBodyDto {
  @IsEnum(VoteTypeEnum)
  readonly voteType: VoteTypeEnum;

  @IsNumber()
  readonly value: number;
}
