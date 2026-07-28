import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private static productionUpgradePromise: Promise<void> | null = null;

  async onModuleInit() {
    await this.$connect();
    await this.ensureProductionSchema().catch((error) => {
      console.warn(
        `Production schema bootstrap skipped: ${error?.message || error}`,
      );
    });
  }

  private async ensureProductionSchema() {
    const databaseUrl = process.env.DATABASE_URL || '';
    if (
      !databaseUrl.startsWith('postgresql://') &&
      !databaseUrl.startsWith('postgres://')
    ) {
      return;
    }

    if (!PrismaService.productionUpgradePromise) {
      PrismaService.productionUpgradePromise = this.runProductionUpgrade();
    }

    await Promise.race([
      PrismaService.productionUpgradePromise,
      new Promise<void>((resolve) => setTimeout(resolve, 12000)),
    ]);
  }

  private async runProductionUpgrade() {
    const upgradePath = join(
      process.cwd(),
      'prisma',
      'manual-production-upgrade-20260727.sql',
    );
    if (!existsSync(upgradePath)) {
      return;
    }

    const sql = readFileSync(upgradePath, 'utf8');
    for (const statement of this.splitSqlStatements(sql)) {
      await this.$executeRawUnsafe(statement);
    }
  }

  private splitSqlStatements(sql: string) {
    const statements: string[] = [];
    let current = '';
    let inDollarBlock = false;

    for (let i = 0; i < sql.length; i += 1) {
      if (sql.slice(i, i + 2) === '$$') {
        inDollarBlock = !inDollarBlock;
        current += '$$';
        i += 1;
        continue;
      }

      const char = sql[i];
      if (char === ';' && !inDollarBlock) {
        const trimmed = current.trim();
        if (trimmed) statements.push(trimmed);
        current = '';
        continue;
      }

      current += char;
    }

    const trimmed = current.trim();
    if (trimmed) statements.push(trimmed);
    return statements;
  }
}
