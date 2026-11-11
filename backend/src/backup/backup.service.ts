import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BackupService {
  constructor(private prisma: PrismaService) {}

  async exportBackup() {
    const [
      categories,
      suppliers,
      products,
      purchases,
      sales,
      movements,
      cashMovements,
    ] = await Promise.all([
      this.prisma.category.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.supplier.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.product.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.purchase.findMany({
        orderBy: { id: 'asc' },
        include: { items: true },
      }),
      this.prisma.sale.findMany({
        orderBy: { id: 'asc' },
        include: { items: true },
      }),
      this.prisma.movement.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.cashMovement.findMany({ orderBy: { id: 'asc' } }),
    ]);

    return {
      app: 'Dassel Sandals',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      summary: {
        categories: categories.length,
        suppliers: suppliers.length,
        products: products.length,
        purchases: purchases.length,
        sales: sales.length,
        movements: movements.length,
        cashMovements: cashMovements.length,
      },
      data: {
        categories,
        suppliers,
        products,
        purchases,
        sales,
        movements,
        cashMovements,
      },
    };
  }

  async restoreBackup(backup: any) {
    if (!backup || !backup.data || (backup.app !== 'Dassel Sandals' && backup.app !== 'Dassel_Sandals')) {
      throw new BadRequestException('El archivo de respaldo no es válido o no corresponde a Dassel Sandals.');
    }

    const {
      categories = [],
      suppliers = [],
      products = [],
      purchases = [],
      sales = [],
      movements = [],
      cashMovements = [],
    } = backup.data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Eliminar datos existentes en orden de dependencias
      await tx.cashMovement.deleteMany();
      await tx.movement.deleteMany();
      await tx.saleItem.deleteMany();
      await tx.sale.deleteMany();
      await tx.purchaseItem.deleteMany();
      await tx.purchase.deleteMany();
      await tx.product.deleteMany();
      await tx.supplier.deleteMany();
      await tx.category.deleteMany();

      // 2. Restaurar Categorías
      if (categories.length > 0) {
        for (const cat of categories) {
          await tx.category.create({
            data: {
              id: cat.id,
              name: cat.name,
              icon: cat.icon || 'folder',
              type: cat.type || 'zapatos',
              subcategories: cat.subcategories || [],
              createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
              updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
            },
          });
        }
      }

      // 3. Restaurar Proveedores
      if (suppliers.length > 0) {
        for (const sup of suppliers) {
          await tx.supplier.create({
            data: {
              id: sup.id,
              code: sup.code,
              name: sup.name,
              contactPerson: sup.contactPerson || null,
              phone: sup.phone,
              email: sup.email || null,
              ruc: sup.ruc || null,
              category: sup.category || 'zapatos',
              address: sup.address || null,
              notes: sup.notes || null,
              status: sup.status || 'active',
              createdAt: sup.createdAt ? new Date(sup.createdAt) : new Date(),
              updatedAt: sup.updatedAt ? new Date(sup.updatedAt) : new Date(),
            },
          });
        }
      }

      // 4. Restaurar Productos
      if (products.length > 0) {
        for (const prod of products) {
          await tx.product.create({
            data: {
              id: prod.id,
              code: prod.code,
              name: prod.name,
              category: prod.category,
              subcategory: prod.subcategory,
              description: prod.description || null,
              costPrice: prod.costPrice,
              salePrice: prod.salePrice,
              stock: Number(prod.stock) || 0,
              minStock: Number(prod.minStock) || 5,
              size: prod.size || null,
              sizesStock: prod.sizesStock || null,
              material: prod.material || null,
              color: prod.color || null,
              status: prod.status || 'active',
              createdAt: prod.createdAt ? new Date(prod.createdAt) : new Date(),
              updatedAt: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
            },
          });
        }
      }

      // 5. Restaurar Compras con Items
      if (purchases.length > 0) {
        for (const pur of purchases) {
          const items = pur.items || [];
          await tx.purchase.create({
            data: {
              id: pur.id,
              purchaseNumber: pur.purchaseNumber,
              invoiceNumber: pur.invoiceNumber || 'S/N',
              date: pur.date ? new Date(pur.date) : new Date(),
              supplierId: pur.supplierId || null,
              supplierName: pur.supplierName || 'Proveedor General',
              total: pur.total,
              paymentMethod: pur.paymentMethod || 'Transferencia',
              status: pur.status || 'received',
              notes: pur.notes || null,
              userId: pur.userId || null,
              createdAt: pur.createdAt ? new Date(pur.createdAt) : new Date(),
              updatedAt: pur.updatedAt ? new Date(pur.updatedAt) : new Date(),
              items: {
                create: items.map((it: any) => ({
                  id: it.id,
                  productId: it.productId || null,
                  productCode: it.productCode,
                  productName: it.productName,
                  category: it.category || null,
                  quantity: Number(it.quantity) || 1,
                  unitCost: it.unitCost,
                  subtotal: it.subtotal,
                  sizesBreakdown: it.sizesBreakdown || null,
                })),
              },
            },
          });
        }
      }

      // 6. Restaurar Ventas con Items
      if (sales.length > 0) {
        for (const s of sales) {
          const items = s.items || [];
          await tx.sale.create({
            data: {
              id: s.id,
              saleNumber: s.saleNumber,
              date: s.date ? new Date(s.date) : new Date(),
              subtotal: s.subtotal,
              discount: s.discount || 0,
              total: s.total,
              paymentMethod: s.paymentMethod || 'Efectivo',
              receivedAmount: s.receivedAmount || null,
              customerName: s.customerName || 'Cliente General',
              customerPhone: s.customerPhone || null,
              status: s.status || 'completed',
              cancelledAt: s.cancelledAt ? new Date(s.cancelledAt) : null,
              cancelReason: s.cancelReason || null,
              cancelledBy: s.cancelledBy || null,
              userId: s.userId || null,
              createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
              items: {
                create: items.map((it: any) => ({
                  id: it.id,
                  productId: it.productId || null,
                  productCode: it.productCode,
                  productName: it.productName,
                  selectedSize: it.selectedSize || null,
                  color: it.color || null,
                  quantity: Number(it.quantity) || 1,
                  price: it.price,
                  costPrice: it.costPrice || 0,
                  subtotal: it.subtotal,
                })),
              },
            },
          });
        }
      }

      // 7. Restaurar Movimientos de Inventario (Kardex)
      if (movements.length > 0) {
        for (const m of movements) {
          await tx.movement.create({
            data: {
              id: m.id,
              date: m.date ? new Date(m.date) : new Date(),
              type: m.type,
              reason: m.reason,
              productCode: m.productCode,
              productName: m.productName,
              quantity: Number(m.quantity) || 0,
              remainingStock: Number(m.remainingStock) || 0,
              productId: m.productId || null,
              userId: m.userId || null,
            },
          });
        }
      }

      // 8. Restaurar Movimientos de Caja Chica
      if (cashMovements.length > 0) {
        for (const cm of cashMovements) {
          await tx.cashMovement.create({
            data: {
              id: cm.id,
              date: cm.date ? new Date(cm.date) : new Date(),
              type: cm.type,
              amount: cm.amount,
              reason: cm.reason || cm.description || 'Movimiento de caja',
              responsible: cm.responsible || 'Administrador',
              notes: cm.notes || null,
              userId: cm.userId || null,
              createdAt: cm.createdAt ? new Date(cm.createdAt) : new Date(),
            },
          });
        }
      }

      // 9. Actualizar secuencias de autoincrement en PostgreSQL para evitar colisiones
      const tablesWithSerial = [
        'Product',
        'Sale',
        'SaleItem',
        'Purchase',
        'PurchaseItem',
        'Movement',
        'Supplier',
        'CashMovement',
      ];

      for (const table of tablesWithSerial) {
        await tx.$executeRawUnsafe(`
          SELECT setval(
            pg_get_serial_sequence('public."${table}"', 'id'),
            COALESCE((SELECT MAX(id) FROM public."${table}"), 1),
            (SELECT COUNT(*) > 0 FROM public."${table}")
          );
        `);
      }

      return {
        success: true,
        message: 'Copia de seguridad restaurada correctamente',
        summary: {
          categories: categories.length,
          suppliers: suppliers.length,
          products: products.length,
          purchases: purchases.length,
          sales: sales.length,
          movements: movements.length,
          cashMovements: cashMovements.length,
        },
      };
    });
  }
}
