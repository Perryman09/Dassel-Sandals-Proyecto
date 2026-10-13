import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      name: 'Dassel Sandals API',
      status: 'online',
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
