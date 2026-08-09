import { timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CurrentTimeService } from '../availability/current-time.service';
import { PrismaService } from '../database/prisma.service';
import {
  AccountRole,
  AuthenticatedAccount,
  SESSION_LIFETIME_MS,
} from './auth.constants';
import { AuthCryptoService } from './crypto.service';
import { SignInThrottleService } from './sign-in-throttle.service';

export interface SafeSession {
  accountId: string;
  email: string;
  role: AccountRole;
  agent: { id: string; name: string } | null;
  expiresAt: string;
  csrfToken: string;
}

@Injectable()
export class AuthService {
  private readonly dummyHash: Promise<string>;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CurrentTimeService) private readonly clock: CurrentTimeService,
    @Inject(AuthCryptoService) private readonly crypto: AuthCryptoService,
    @Inject(SignInThrottleService)
    private readonly throttle: SignInThrottleService,
  ) {
    this.dummyHash = this.crypto.hashPassword(this.crypto.randomToken());
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async signIn(
    emailInput: string,
    password: string,
    source: string,
    previousToken: string | null,
  ): Promise<{ token: string; session: SafeSession }> {
    const email = this.normalizeEmail(emailInput);
    const throttleKeys = [`source:${source}`, `email:${email}`];
    this.throttle.assertAllowed(throttleKeys);
    const account = await this.prisma.userAccount.findUnique({
      where: { email },
      include: { agent: { select: { id: true, name: true } } },
    });
    const valid = await this.crypto.verifyPassword(
      password,
      account?.passwordHash ?? (await this.dummyHash),
    );
    if (!account || !account.isActive || !valid) {
      this.throttle.recordFailure(throttleKeys);
      throw new UnauthorizedException('Email or password is incorrect');
    }
    if (
      (account.role === 'AGENT' && !account.agent) ||
      (account.role === 'STAFF' && account.agent)
    )
      throw new UnauthorizedException('Email or password is incorrect');

    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    const token = this.crypto.randomToken();
    const csrfToken = this.crypto.randomToken();
    await this.prisma.$transaction(async (tx) => {
      if (previousToken) {
        await tx.authSession.updateMany({
          where: {
            tokenHash: this.crypto.tokenHash(previousToken),
            revokedAt: null,
          },
          data: { revokedAt: now },
        });
      }
      await tx.authSession.create({
        data: {
          id: this.crypto.randomId(),
          accountId: account.id,
          tokenHash: this.crypto.tokenHash(token),
          csrfTokenHash: this.crypto.tokenHash(csrfToken),
          createdAt: now,
          expiresAt,
        },
      });
    });
    this.throttle.clear(throttleKeys);
    return {
      token,
      session: this.safeSession(account, expiresAt, csrfToken),
    };
  }

  async authenticate(
    token: string | null,
  ): Promise<AuthenticatedAccount | null> {
    if (!token) return null;
    const record = await this.prisma.authSession.findUnique({
      where: { tokenHash: this.crypto.tokenHash(token) },
      include: {
        account: { include: { agent: { select: { id: true, name: true } } } },
      },
    });
    const now = this.clock.now();
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt <= now ||
      !record.account.isActive
    )
      return null;
    return {
      accountId: record.account.id,
      email: record.account.email,
      role: record.account.role as AccountRole,
      agentId: record.account.agent?.id ?? null,
      agentName: record.account.agent?.name ?? null,
      sessionId: record.id,
      expiresAt: record.expiresAt,
      csrfTokenHash: record.csrfTokenHash,
    };
  }

  safeCurrentSession(
    auth: AuthenticatedAccount,
    csrfToken: string,
  ): SafeSession {
    if (!this.verifyCsrf(auth, csrfToken))
      throw new UnauthorizedException('Authentication required');
    return this.safeSession(
      {
        id: auth.accountId,
        email: auth.email,
        role: auth.role,
        agent:
          auth.agentId && auth.agentName
            ? { id: auth.agentId, name: auth.agentName }
            : null,
      },
      auth.expiresAt,
      csrfToken,
    );
  }

  verifyCsrf(auth: AuthenticatedAccount, raw: string | undefined): boolean {
    if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) return false;
    const actual = Buffer.from(this.crypto.tokenHash(raw));
    const expected = Buffer.from(auth.csrfTokenHash);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  async signOut(token: string | null): Promise<void> {
    if (!token) return;
    await this.prisma.authSession.updateMany({
      where: { tokenHash: this.crypto.tokenHash(token), revokedAt: null },
      data: { revokedAt: this.clock.now() },
    });
  }

  private safeSession(
    account: {
      id: string;
      email: string;
      role: string;
      agent: { id: string; name: string } | null;
    },
    expiresAt: Date,
    csrfToken: string,
  ): SafeSession {
    return {
      accountId: account.id,
      email: account.email,
      role: account.role as AccountRole,
      agent: account.agent,
      expiresAt: expiresAt.toISOString(),
      csrfToken,
    };
  }
}
