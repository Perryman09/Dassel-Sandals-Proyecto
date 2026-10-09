import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      name: 'Dassel Sandals API',
      status: 'online',
      message: 'Backend NestJS + Prisma ORM + PostgreSQL funcionando correctamente',
      endpoints: {
        products: '/api/products',
        sales: '/api/sales',
        movements: '/api/movements',
        dashboardStats: '/api/dashboard/stats',
      },
      frontendUrl: 'http://localhost:5174',
    };
  }
}
