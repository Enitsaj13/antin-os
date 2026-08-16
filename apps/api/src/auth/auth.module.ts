import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OwnerAuthGuard } from './owner-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OwnerAuthGuard],
  exports: [AuthService, OwnerAuthGuard],
})
export class AuthModule {}
