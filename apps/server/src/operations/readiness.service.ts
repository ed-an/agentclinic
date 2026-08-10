import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export const REQUIRED_MIGRATION_COUNT = 9;

@Injectable()
export class ReadinessService {
  private acceptingTraffic = true;

  constructor(private readonly prisma: PrismaService) {}

  beginShutdown(): void {
    this.acceptingTraffic = false;
  }

  async isReady(): Promise<boolean> {
    if (!this.acceptingTraffic) return false;
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      const rows = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        'SELECT count(*) AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
      );
      return Number(rows[0]?.count ?? 0) === REQUIRED_MIGRATION_COUNT;
    } catch {
      return false;
    }
  }
}
