import type { FastifyRequest } from 'fastify';
import type { AuthenticatedAccount } from './auth.constants';

export type AuthenticatedRequest = FastifyRequest & {
  auth?: AuthenticatedAccount;
};
