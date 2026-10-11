import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Injectable()
export class CashMovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { type?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};

    if (query?.type && query.type !== 'all') {
      where.type = query.type;
    }

    if (query?.dateFrom || query?.dateTo) {
      where.date = {};
      if (query.dateFrom) {
        where.date.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    return this.prisma.cashMovement.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getSummary() {
    const movements = await this.prisma.cashMovement.findMany({
      orderBy: { date: 'asc' },
    });

    let currentBalance = 0;
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const m of movements) {
      const amt = Number(m.amount);
      if (m.type === 'apertura' || m.type === 'ingreso') {
        currentBalance += amt;
        totalInflow += amt;
      } else if (m.type === 'egreso') {
        currentBalance -= amt;
        totalOutflow += amt;
      }
    }

    return {
      currentBalance,
      totalInflow,
      totalOutflow,
      movementsCount: movements.length,
    };
  }

  async create(dto: CreateCashMovementDto) {
    return this.prisma.cashMovement.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        reason: dto.reason,
        responsible: dto.responsible || 'Administración',
        notes: dto.notes || null,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }
}
