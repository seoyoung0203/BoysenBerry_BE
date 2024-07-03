import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  Get,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserBodyDto } from './dto/login-user.dto';
import { User } from '../database/entities';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

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
  async login(@Body() loginUserDto: LoginUserBodyDto, @Res() res: Response) {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginUserDto);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      // secure 옵션이 설정된 쿠키는 클라이언트와 서버 간의 통신이 HTTPS를 통해 암호화될 때만 전송된다.
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 1 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken, user: {} });
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Res() res: Response): Promise<void> {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
    });
    res.status(200).send({ message: 'Logged out successfully' });
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('No refresh token provided');
    }

    return this.authService.refreshToken(refreshToken);
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    return res.redirect(
      `${this.configService.get<string>('GITHUB_CALLBACK_URL')}?accessToken=${result.accessToken}`,
    );
  }

  @Get('github/redirect')
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.gitHubAuth(String(req.query.code));
    res.redirect(
      `${this.configService.get<string>('GITHUB_CALLBACK_URL')}?accessToken=${result.accessToken}`,
    );
  }
}
