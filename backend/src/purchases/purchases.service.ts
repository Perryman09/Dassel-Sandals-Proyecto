import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async getNextPurchaseNumber(): Promise<string> {
    const purchases = await this.prisma.purchase.findMany({
      select: { purchaseNumber: true },
    });

    let maxNum = 0;
    for (const p of purchases) {
      const parts = p.purchaseNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    return `COM-${String(maxNum + 1).padStart(4, '0')}`;
  }

  async findAll(query?: {
    search?: string;
    status?: string;
    supplierId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};

    if (query?.status && query.status !== 'all') {
      where.status = query.status;
    }

    if (query?.supplierId) {
      where.supplierId = Number(query.supplierId);
    }

    if (query?.search) {
      const s = query.search;
      where.OR = [
        { purchaseNumber: { contains: s, mode: 'insensitive' } },
        { invoiceNumber: { contains: s, mode: 'insensitive' } },
        { supplierName: { contains: s, mode: 'insensitive' } },
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

    return this.prisma.purchase.findMany({
      where,
      include: {
        items: true,
        supplier: true,
        user: { select: { id: true, username: true, name: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true,
        supplier: true,
        user: { select: { id: true, username: true, name: true, role: true } },
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Compra #${id} no encontrada`);
    }

    return purchase;
  }

  async create(dto: CreatePurchaseDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La compra debe contener al menos un producto');
    }

    const purchaseNumber = dto.purchaseNumber || (await this.getNextPurchaseNumber());

    return this.prisma.$transaction(async (tx) => {
      // 1. Calcular total de la compra
      let totalAmount = 0;
      const itemsToCreate = [];

      for (const it of dto.items) {
        const lineTotal = Number(it.quantity) * Number(it.unitCost);
        totalAmount += lineTotal;
        itemsToCreate.push({
          productId: it.productId || null,
          productCode: it.productCode,
          productName: it.productName,
          category: it.category || null,
          quantity: it.quantity,
          unitCost: it.unitCost,
          subtotal: lineTotal,
          sizesBreakdown: it.sizesBreakdown || null,
        });
      }

      // 2. Crear la Compra
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          invoiceNumber: dto.invoiceNumber || 'S/N',
          supplierId: dto.supplierId || null,
          supplierName: dto.supplierName || 'Proveedor General',
          date: dto.date ? new Date(dto.date) : new Date(),
          total: totalAmount,
          paymentMethod: dto.paymentMethod || 'Transferencia',
          notes: dto.notes || null,
          status: 'received',
          userId: (dto as any).userId || 1,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
          supplier: true,
          user: { select: { id: true, username: true, name: true, role: true } },
        },
      });

      // 3. Actualizar Inventario (Stock, Costo, Tallas y Kardex)
      for (const it of dto.items) {
        let product = null;
        if (it.productId) {
          product = await tx.product.findUnique({ where: { id: it.productId } });
        } else if (it.productCode) {
          product = await tx.product.findUnique({ where: { code: it.productCode } });
        }

        if (product) {
          // Matriz de tallas
          let updatedSizesStock = product.sizesStock as Record<string, number> | null;
          if (it.sizesBreakdown && typeof it.sizesBreakdown === 'object') {
            const current = (updatedSizesStock || {}) as Record<string, number>;
            const next = { ...current };
            for (const [sz, q] of Object.entries(it.sizesBreakdown)) {
              next[sz] = (Number(next[sz]) || 0) + (Number(q) || 0);
            }
            updatedSizesStock = next;
          }

          const newStock = product.stock + it.quantity;

          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: newStock,
              costPrice: it.unitCost, // Actualiza costo unitario
              sizesStock: updatedSizesStock,
            },
          });

          // Registrar Entrada en el Kardex
          await tx.movement.create({
            data: {
              type: 'entrada',
              reason: `Compra ${purchase.purchaseNumber} (Factura Ref: ${purchase.invoiceNumber})`,
              productCode: product.code,
              productName: product.name,
              quantity: it.quantity,
              remainingStock: newStock,
              productId: product.id,
              userId: (dto as any).userId || 1,
            },
          });
        }
      }

      // 4. Si el pago fue en efectivo, registrar egreso en Caja Chica
      if (dto.paymentMethod === 'Efectivo') {
        await tx.cashMovement.create({
          data: {
            type: 'egreso',
            amount: totalAmount,
            reason: `Pago de compra ${purchase.purchaseNumber} a ${purchase.supplierName}`,
            responsible: 'Administración',
            notes: `Factura Proveedor: ${purchase.invoiceNumber}`,
            userId: (dto as any).userId || 1,
          },
        });
      }

      return purchase;
    });
  }

  async cancel(id: number) {
    const purchase = await this.findOne(id);
    if (purchase.status === 'cancelled') {
      throw new BadRequestException('Esta compra ya ha sido anulada previamente');
    }

    return this.prisma.$transaction(async (tx) => {
      // Revertir inventario
      for (const it of purchase.items) {
        if (it.productId) {
          const product = await tx.product.findUnique({ where: { id: it.productId } });
          if (product) {
            const newStock = Math.max(0, product.stock - it.quantity);

            let updatedSizesStock = product.sizesStock as Record<string, number> | null;
            if (it.sizesBreakdown && typeof it.sizesBreakdown === 'object') {
              const current = (updatedSizesStock || {}) as Record<string, number>;
              const next = { ...current };
              for (const [sz, q] of Object.entries(it.sizesBreakdown as Record<string, number>)) {
                next[sz] = Math.max(0, (Number(next[sz]) || 0) - (Number(q) || 0));
              }
              updatedSizesStock = next;
            }

            await tx.product.update({
              where: { id: product.id },
              data: {
                stock: newStock,
                sizesStock: updatedSizesStock,
              },
            });

            // Registrar salida de anulación en Kardex
            await tx.movement.create({
              data: {
                type: 'salida',
                reason: `Anulación de Compra ${purchase.purchaseNumber}`,
                productCode: product.code,
                productName: product.name,
                quantity: it.quantity,
                remainingStock: newStock,
                productId: product.id,
              },
            });
          }
        }
      }

      // Si fue pagado en efectivo, reingresar fondos a Caja Chica
      if (purchase.paymentMethod === 'Efectivo') {
        await tx.cashMovement.create({
          data: {
            type: 'ingreso',
            amount: purchase.total,
            reason: `Reintegro por anulación de Compra ${purchase.purchaseNumber}`,
            responsible: 'Administración',
          },
        });
      }

      return tx.purchase.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { items: true, supplier: true },
      });
    });
  }
}
