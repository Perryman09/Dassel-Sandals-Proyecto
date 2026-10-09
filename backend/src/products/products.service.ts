import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getNextCode(category: string): Promise<string> {
    const prefix = category.toLowerCase() === 'zapatos' ? 'DS-ZAP' : 'DS-JOY';
    const products = await this.prisma.product.findMany({
      where: { code: { startsWith: prefix } },
      select: { code: true },
    });

    let maxNum = 0;
    for (const p of products) {
      const parts = p.code.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  }

  async findAll(query?: { search?: string; category?: string; status?: string; stock?: string }) {
    const where: any = {};

    if (query?.category && query.category !== 'all') {
      where.category = query.category;
    }

    if (query?.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query?.search) {
      const s = query.search;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { code: { contains: s, mode: 'insensitive' } },
        { subcategory: { contains: s, mode: 'insensitive' } },
        { color: { contains: s, mode: 'insensitive' } },
        { material: { contains: s, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { id: 'asc' },
    });

    if (query?.stock && query.stock !== 'all') {
      if (query.stock === 'out') {
        return products.filter(p => p.stock === 0);
      }
      if (query.stock === 'low') {
        return products.filter(p => p.stock > 0 && p.stock <= p.minStock);
      }
      if (query.stock === 'ok') {
        return products.filter(p => p.stock > p.minStock);
      }
    }

    return products;
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        movements: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });
    if (!product) {
      throw new NotFoundException(`Producto con ID #${id} no encontrado`);
    }
    return product;
  }

  async create(dto: CreateProductDto) {
    const code = await this.getNextCode(dto.category);

    let finalStock = dto.stock ?? 0;
    let computedSize = dto.size || null;

    if (dto.category === 'zapatos' && dto.sizesStock && typeof dto.sizesStock === 'object') {
      const sum = Object.values(dto.sizesStock).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      finalStock = sum;
      if (!computedSize) {
        const activeSizes = Object.entries(dto.sizesStock)
          .filter(([_, q]) => Number(q) > 0)
          .map(([sz]) => sz)
          .sort();
        if (activeSizes.length > 0) {
          computedSize = `${activeSizes[0]}-${activeSizes[activeSizes.length - 1]}`;
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          code,
          name: dto.name,
          category: dto.category,
          subcategory: dto.subcategory,
          description: dto.description || null,
          costPrice: dto.costPrice,
          salePrice: dto.salePrice,
          stock: finalStock,
          minStock: dto.minStock ?? 5,
          size: computedSize,
          sizesStock: dto.sizesStock || null,
          material: dto.material || null,
          color: dto.color || null,
          status: dto.status || 'active',
        },
      });

      if (finalStock > 0) {
        await tx.movement.create({
          data: {
            date: new Date(),
            type: 'entrada',
            reason: 'Inventario inicial al registrar producto',
            productCode: product.code,
            productName: product.name,
            quantity: finalStock,
            remainingStock: finalStock,
            productId: product.id,
          },
        });
      }

      return product;
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    const updateData: any = { ...dto };

    if (dto.category === 'zapatos' && dto.sizesStock && typeof dto.sizesStock === 'object') {
      updateData.sizesStock = dto.sizesStock;
      if (dto.stock === undefined) {
        updateData.stock = Object.values(dto.sizesStock).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async adjustStock(id: number, dto: AdjustStockDto) {
    const product = await this.findOne(id);
    let qtyDelta = dto.quantity !== undefined ? dto.quantity : 0;
    let newStock = Math.max(0, product.stock + qtyDelta);
    let updatedSizesStock: any = product.sizesStock;
    let movementProductName = product.name;

    if (dto.size) {
      movementProductName = `${product.name} (Talla ${dto.size})`;
      const currentSizes = (product.sizesStock && typeof product.sizesStock === 'object')
        ? { ...(product.sizesStock as Record<string, number>) }
        : {};
      const currentQty = Number(currentSizes[dto.size]) || 0;
      const newQty = Math.max(0, currentQty + qtyDelta);
      currentSizes[dto.size] = newQty;
      updatedSizesStock = currentSizes;
      newStock = Object.values(currentSizes).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      qtyDelta = newStock - product.stock;
    } else if (dto.sizesStock && typeof dto.sizesStock === 'object') {
      updatedSizesStock = dto.sizesStock;
      newStock = Object.values(dto.sizesStock).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      qtyDelta = dto.quantity !== undefined ? dto.quantity : (newStock - product.stock);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          stock: newStock,
          sizesStock: updatedSizesStock,
        },
      });

      await tx.movement.create({
        data: {
          date: new Date(),
          type: qtyDelta >= 0 ? 'entrada' : 'salida',
          reason: dto.reason || (qtyDelta >= 0 ? 'Entrada manual de existencias' : 'Salida manual / Merma'),
          productCode: product.code,
          productName: movementProductName,
          quantity: Math.abs(qtyDelta),
          remainingStock: newStock,
          productId: product.id,
        },
      });

      return updated;
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
