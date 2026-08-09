import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AvailabilityModule } from '../availability/availability.module';
import { AuthController } from './auth.controller';
import { AuthCryptoService } from './crypto.service';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SignInThrottleService } from './sign-in-throttle.service';

@Module({
  imports: [AvailabilityModule],
  controllers: [AuthController],
  providers: [
    AuthCryptoService,
    AuthService,
    SignInThrottleService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
