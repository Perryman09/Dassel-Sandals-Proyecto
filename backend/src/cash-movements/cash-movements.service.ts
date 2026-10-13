import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Injectable()
export class CashMovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { type?: string; dateFrom?: string; dateTo?: string }) {
    const where: any = {};

    if (query?.type && query.type !== 'all') {
      const typeNorm = query.type === 'salida' ? 'egreso' : query.type === 'entrada' ? 'ingreso' : query.type;
      where.type = typeNorm;
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

    const movements = await this.prisma.cashMovement.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return movements.map(m => ({
      ...m,
      amount: Number(m.amount),
      category: m.notes || (m.type === 'egreso' ? 'Gasto Menor' : m.type === 'ingreso' ? 'Aporte de Efectivo' : 'Caja'),
      description: m.reason || m.notes || 'Movimiento de caja',
    }));
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
    const rawType = (dto.type || '').toLowerCase();
    const type = rawType === 'salida' ? 'egreso' : rawType === 'entrada' ? 'ingreso' : rawType;
    const reason = dto.reason || dto.description || dto.category || 'Movimiento de caja';
    const notes = dto.notes || dto.category || null;

    const created = await this.prisma.cashMovement.create({
      data: {
        type,
        amount: Number(dto.amount),
        reason,
        responsible: dto.responsible || 'Administración',
        notes,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });

    return {
      ...created,
      amount: Number(created.amount),
      category: created.notes || (created.type === 'egreso' ? 'Gasto Menor' : created.type === 'ingreso' ? 'Aporte de Efectivo' : 'Caja'),
      description: created.reason || created.notes || 'Movimiento de caja',
    };
  }
}
