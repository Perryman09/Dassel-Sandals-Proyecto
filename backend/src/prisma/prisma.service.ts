import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from './prisma.adapter';

const PUBLIC_TABLES = [
  'Product',
  'SaleItem',
  'Sale',
  'PurchaseItem',
  'Movement',
  'Supplier',
  'CashMovement',
  'Role',
  'Purchase',
  'User',
  'Category',
] as const;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ adapter: createPrismaAdapter() });
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureRowLevelSecurity();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureRowLevelSecurity() {
    try {
      for (const table of PUBLIC_TABLES) {
        await this.$executeRawUnsafe(
          `ALTER TABLE IF EXISTS public."${table}" ENABLE ROW LEVEL SECURITY;`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo verificar RLS automaticamente al iniciar: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
