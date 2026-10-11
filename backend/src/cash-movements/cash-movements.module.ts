import { Module } from '@nestjs/common';
import { CashMovementsService } from './cash-movements.service';
import { CashMovementsController } from './cash-movements.controller';

@Module({
  controllers: [CashMovementsController],
  providers: [CashMovementsService],
  exports: [CashMovementsService],
})
export class CashMovementsModule {}
