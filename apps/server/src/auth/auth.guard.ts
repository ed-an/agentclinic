import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply } from 'fastify';
import { CurrentTimeService } from '../availability/current-time.service';
import {
  AccountRole,
  AUTHENTICATED_CACHE_CONTROL,
  CSRF_HEADER,
} from './auth.constants';
import { requireTrustedOrigin } from './auth-config';
import type { AuthenticatedRequest } from './auth-request';
import { AuthService } from './auth.service';
import { parseSessionCookie } from './cookie';

export const REQUIRED_ROLE = 'agentclinic:required-role';
export const RequireRole = (role: AccountRole) =>
  SetMetadata(REQUIRED_ROLE, role);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(CurrentTimeService) private readonly clock: CurrentTimeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = this.reflector.getAllAndOverride<AccountRole>(REQUIRED_ROLE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!role) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const reply = context.switchToHttp().getResponse<FastifyReply>();
    const auth = await this.authService.authenticate(
      parseSessionCookie(request.headers.cookie),
    );
    if (!auth) throw new UnauthorizedException('Authentication required');
    if (auth.expiresAt <= this.clock.now())
      throw new UnauthorizedException('Authentication required');
    if (auth.role !== role)
      throw new ForbiddenException('Access is not allowed for this account');
    request.auth = auth;
    reply.header('cache-control', AUTHENTICATED_CACHE_CONTROL);
    if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
      requireTrustedOrigin(request.headers.origin);
      const csrf = request.headers[CSRF_HEADER];
      if (typeof csrf !== 'string' || !this.authService.verifyCsrf(auth, csrf))
        throw new ForbiddenException('CSRF validation failed');
    }
    return true;
  }
}
