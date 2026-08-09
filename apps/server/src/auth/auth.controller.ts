import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  ForbiddenException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AUTHENTICATED_CACHE_CONTROL } from './auth.constants';
import { requireTrustedOrigin, safeReturnPath } from './auth-config';
import { AuthService } from './auth.service';
import {
  clearSessionCookie,
  parseCsrfCookie,
  parseSessionCookie,
  setAuthCookies,
} from './cookie';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('sign-in')
  @HttpCode(200)
  async signIn(
    @Body() body: unknown,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    requireTrustedOrigin(request.headers.origin);
    const input = this.parseSignIn(body);
    const result = await this.auth.signIn(
      input.email,
      input.password,
      request.ip,
      parseSessionCookie(request.headers.cookie),
    );
    setAuthCookies(
      reply,
      result.token,
      result.session.csrfToken,
      new Date(result.session.expiresAt),
    );
    reply.header('cache-control', AUTHENTICATED_CACHE_CONTROL);
    return { ...result.session, returnTo: safeReturnPath(input.returnTo) };
  }

  @Get('session')
  async session(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const identity = await this.auth.authenticate(
      parseSessionCookie(request.headers.cookie),
    );
    if (!identity) throw new UnauthorizedException('Authentication required');
    reply.header('cache-control', AUTHENTICATED_CACHE_CONTROL);
    const csrfToken = parseCsrfCookie(request.headers.cookie);
    if (!csrfToken) throw new UnauthorizedException('Authentication required');
    return this.auth.safeCurrentSession(identity, csrfToken);
  }

  @Post('sign-out')
  @HttpCode(204)
  async signOut(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const token = parseSessionCookie(request.headers.cookie);
    const identity = await this.auth.authenticate(token);
    if (identity) {
      requireTrustedOrigin(request.headers.origin);
      const csrf = request.headers['x-agentclinic-csrf'];
      if (typeof csrf !== 'string' || !this.auth.verifyCsrf(identity, csrf))
        throw new ForbiddenException('CSRF validation failed');
    }
    await this.auth.signOut(token);
    clearSessionCookie(reply);
    reply.header('cache-control', AUTHENTICATED_CACHE_CONTROL);
  }

  private parseSignIn(body: unknown): {
    email: string;
    password: string;
    returnTo?: string;
  } {
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new BadRequestException('Invalid sign-in request');
    const record = body as Record<string, unknown>;
    if (
      Object.keys(record).some(
        (key) => !['email', 'password', 'returnTo'].includes(key),
      )
    )
      throw new BadRequestException('Invalid sign-in request');
    if (
      typeof record.email !== 'string' ||
      record.email.length < 3 ||
      record.email.length > 254 ||
      typeof record.password !== 'string' ||
      record.password.length < 1 ||
      record.password.length > 1024 ||
      (record.returnTo !== undefined && typeof record.returnTo !== 'string')
    )
      throw new BadRequestException('Invalid sign-in request');
    return {
      email: record.email,
      password: record.password,
      returnTo: record.returnTo,
    };
  }
}
