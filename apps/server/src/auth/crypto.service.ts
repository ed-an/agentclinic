import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from 'node:crypto';
import { Injectable } from '@nestjs/common';

const N = 2 ** 17;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;

@Injectable()
export class AuthCryptoService {
  async hashPassword(
    password: string,
    salt = randomBytes(32),
  ): Promise<string> {
    const key = await this.derive(password, salt);
    return `scrypt-v1$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
  }

  async verifyPassword(password: string, encoded: string): Promise<boolean> {
    try {
      const [version, n, r, p, saltText, keyText, extra] = encoded.split('$');
      if (version !== 'scrypt-v1' || extra !== undefined) return false;
      const salt = Buffer.from(saltText, 'base64url');
      const expected = Buffer.from(keyText, 'base64url');
      if (
        Number(n) !== N ||
        Number(r) !== R ||
        Number(p) !== P ||
        salt.length !== 32 ||
        expected.length !== KEY_LENGTH
      )
        return false;
      const actual = await this.derive(password, salt);
      return timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }

  randomToken(): string {
    return randomBytes(32).toString('base64url');
  }

  tokenHash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('base64url');
  }

  randomId(): string {
    return randomUUID();
  }

  private derive(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      nodeScrypt(
        password,
        salt,
        KEY_LENGTH,
        { N, r: R, p: P, maxmem: MAX_MEMORY },
        (error, key) => (error ? reject(error) : resolve(key)),
      );
    });
  }
}
