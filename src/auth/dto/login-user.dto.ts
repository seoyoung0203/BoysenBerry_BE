import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserBodyDto {
  @IsEmail()
  readonly email: string;

  @IsString()
  @MinLength(6)
  readonly password: string;
}

export class userDto {}
