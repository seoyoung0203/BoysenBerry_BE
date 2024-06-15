import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../database/entities';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  // 회원가입
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.register(createUserDto);
  }

  // 로그인
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginUserDto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      // secure 옵션이 설정된 쿠키는 클라이언트와 서버 간의 통신이 HTTPS를 통해 암호화될 때만 전송된다.
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken });
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    return this.authService.refreshToken(refreshToken);
  }
}
