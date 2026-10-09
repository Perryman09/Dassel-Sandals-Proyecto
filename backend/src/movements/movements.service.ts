import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; type?: string }) {
    const where: any = {};

    if (query?.type && query.type !== 'all') {
      where.type = query.type;
    }

    if (query?.search) {
      const s = query.search;
      where.OR = [
        { productCode: { contains: s, mode: 'insensitive' } },
        { productName: { contains: s, mode: 'insensitive' } },
        { reason: { contains: s, mode: 'insensitive' } },
      ];
    }

    return this.prisma.movement.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
    });
  }
}
