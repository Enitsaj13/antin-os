import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { AdminSessionResponse } from '@antin-os/shared';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { clearAuthCookie, readAuthCookie, setAuthCookie } from './cookies';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): AdminSessionResponse {
    const result = this.authService.login({
      username: dto.username,
      password: dto.password,
      ip: request.ip,
    });

    setAuthCookie(response, result.token, this.authService.getConfig());

    return result.session;
  }

  @Get('session')
  session(@Req() request: Request): AdminSessionResponse {
    return this.authService.restore(readAuthCookie(request));
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response): AdminSessionResponse {
    clearAuthCookie(response, this.authService.getConfig());

    return {
      authenticated: false,
      user: null,
    };
  }
}
