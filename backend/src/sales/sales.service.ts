import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getNextSaleNumber(): Promise<string> {
    const sales = await this.prisma.sale.findMany({
      select: { saleNumber: true },
    });

    let maxNum = 0;
    for (const s of sales) {
      const parts = s.saleNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    return `VTA-${String(maxNum + 1).padStart(4, '0')}`;
  }

  async findAll(query?: {
    search?: string;
    status?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};

    if (query?.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query?.paymentMethod && query.paymentMethod !== 'all') {
      where.paymentMethod = query.paymentMethod;
    }

    if (query?.search) {
      const s = query.search;
      where.OR = [
        { saleNumber: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
        { customerPhone: { contains: s, mode: 'insensitive' } },
      ];
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

    return this.prisma.sale.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!sale) {
      throw new NotFoundException(`Venta #${id} no encontrada`);
    }
    return sale;
  }

  async create(dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La venta debe contener al menos un producto');
    }

    const saleNumber = await this.getNextSaleNumber();

    return this.prisma.$transaction(async (tx) => {
      // 1. Validar productos y existencias
      const itemsToCreate = [];
      let calculatedSubtotal = 0;

      for (const item of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`Producto con ID #${item.productId} no encontrado`);
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
          );
        }

        const unitPrice = item.price ?? Number(product.salePrice);
        const unitCost = item.costPrice ?? Number(product.costPrice);
        const subtotal = unitPrice * item.quantity;
        calculatedSubtotal += subtotal;

        const newStock = product.stock - item.quantity;
        let updatedSizesStock: any = product.sizesStock;

        if (item.selectedSize && product.sizesStock && typeof product.sizesStock === 'object') {
          const currentSizes = { ...(product.sizesStock as Record<string, number>) };
          const curQty = Number(currentSizes[item.selectedSize]) || 0;
          currentSizes[item.selectedSize] = Math.max(0, curQty - item.quantity);
          updatedSizesStock = currentSizes;
        }

        // Descontar inventario
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: newStock,
            sizesStock: updatedSizesStock,
          },
        });

        // Registrar en Kardex
        await tx.movement.create({
          data: {
            date: new Date(),
            type: 'salida',
            reason: `Venta ${saleNumber}`,
            productCode: product.code,
            productName: item.selectedSize ? `${product.name} (Talla ${item.selectedSize})` : product.name,
            quantity: item.quantity,
            remainingStock: newStock,
            productId: product.id,
          },
        });

        itemsToCreate.push({
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          selectedSize: item.selectedSize || null,
          quantity: item.quantity,
          price: unitPrice,
          costPrice: unitCost,
          subtotal,
        });
      }

      const discount = dto.discount ?? 0;
      const total = Math.max(0, calculatedSubtotal - discount);

      // 2. Crear la venta con sus líneas asociadas
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          date: new Date(),
          subtotal: calculatedSubtotal,
          discount,
          total,
          paymentMethod: dto.paymentMethod,
          receivedAmount: dto.receivedAmount || null,
          customerName: dto.customerName?.trim() || 'Cliente General',
          customerPhone: dto.customerPhone?.trim() || null,
          status: 'completed',
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      return sale;
    });
  }

  async cancelSale(id: number) {
    const sale = await this.findOne(id);

    if (sale.status === 'cancelled') {
      throw new BadRequestException('Esta venta ya fue cancelada previamente');
    }

    return this.prisma.$transaction(async (tx) => {
      // Reintegrar stock y registrar en Kardex
      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const restoredStock = product.stock + item.quantity;

          await tx.product.update({
            where: { id: product.id },
            data: { stock: restoredStock },
          });

          await tx.movement.create({
            data: {
              date: new Date(),
              type: 'entrada',
              reason: `Devolución por cancelación de venta ${sale.saleNumber}`,
              productCode: item.productCode,
              productName: item.productName,
              quantity: item.quantity,
              remainingStock: restoredStock,
              productId: product.id,
            },
          });
        }
      }

      // Cambiar estado a cancelada
      return tx.sale.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { items: true },
      });
    });
  }
}
