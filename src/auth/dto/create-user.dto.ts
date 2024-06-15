import { IsString, IsEmail, MinLength, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  readonly email: string;

  @IsString()
  @MinLength(6)
  readonly password: string;

  @IsBoolean()
  isEmailConsent: boolean;
}
