import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { MovementsModule } from './movements/movements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { CategoriesModule } from './categories/categories.module';
import { CashMovementsModule } from './cash-movements/cash-movements.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductsModule,
    SalesModule,
    MovementsModule,
    DashboardModule,
    SuppliersModule,
    PurchasesModule,
    CategoriesModule,
    CashMovementsModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
