import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async getNextSupplierCode(): Promise<string> {
    const suppliers = await this.prisma.supplier.findMany({
      select: { code: true },
    });

    let maxNum = 0;
    for (const s of suppliers) {
      const parts = s.code.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    return `PROV-${String(maxNum + 1).padStart(3, '0')}`;
  }

  async findAll(query?: { search?: string; status?: string; category?: string }) {
    const where: any = {};

    if (query?.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query?.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (query?.search) {
      const s = query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
        { contactPerson: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { ruc: { contains: s, mode: 'insensitive' } },
      ];
    }

    return this.prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { purchases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Proveedor #${id} no encontrado`);
    }

    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    const code = dto.code || (await this.getNextSupplierCode());
    return this.prisma.supplier.create({
      data: {
        ...dto,
        code,
        status: dto.status || 'active',
        category: dto.category || 'zapatos',
      },
    });
  }

  async update(id: number, dto: UpdateSupplierDto) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
