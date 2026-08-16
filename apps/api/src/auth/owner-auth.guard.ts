import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { readAuthCookie } from './cookies';

@Injectable()
export class OwnerAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      this.authService.requireSession(readAuthCookie(request));
      return true;
    } catch {
      throw new UnauthorizedException('Authentication required');
    }
  }
}
