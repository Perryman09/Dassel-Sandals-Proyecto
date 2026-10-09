import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const products = await this.prisma.product.findMany();
    const sales = await this.prisma.sale.findMany({
      where: { status: 'completed' },
      include: { items: true },
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todaySales = sales.filter(s => s.date.toISOString().startsWith(todayStr));
    const monthSales = sales.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    let monthCost = 0;
    monthSales.forEach(s => {
      s.items.forEach(it => {
        monthCost += Number(it.costPrice) * it.quantity;
      });
    });

    const monthRevenue = monthSales.reduce((acc, s) => acc + Number(s.total), 0);
    const monthProfit = Math.max(0, monthRevenue - monthCost);
    const profitMargin = monthRevenue > 0 ? Number(((monthProfit / monthRevenue) * 100).toFixed(1)) : 0;

    const lowStockProducts = products.filter(p => p.status === 'active' && p.stock > 0 && p.stock <= p.minStock);
    const outOfStockProducts = products.filter(p => p.status === 'active' && p.stock === 0);

    // Métricas de inventario
    const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
    const totalStockCostValue = products.reduce((acc, p) => acc + p.stock * Number(p.costPrice), 0);
    const totalStockSaleValue = products.reduce((acc, p) => acc + p.stock * Number(p.salePrice), 0);

    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalStockUnits,
      totalStockCostValue,
      totalStockSaleValue,
      totalStockValue: totalStockCostValue,
      totalSaleValue: totalStockSaleValue,
      todaySalesCount: todaySales.length,
      todaysRevenue: todaySales.reduce((acc, s) => acc + Number(s.total), 0),
      monthSalesCount: monthSales.length,
      monthRevenue,
      monthProfit,
      profitMargin,
      lowStockProducts,
      outOfStockProducts,
    };
  }
}
