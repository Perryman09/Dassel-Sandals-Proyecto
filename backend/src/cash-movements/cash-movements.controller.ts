import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CashMovementsService } from './cash-movements.service';
import { CreateCashMovementDto } from './dto/create-cash-movement.dto';

@Controller('cash-movements')
export class CashMovementsController {
  constructor(private readonly cashMovementsService: CashMovementsService) {}

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.cashMovementsService.findAll({ type, dateFrom, dateTo });
  }

  @Get('summary')
  getSummary() {
    return this.cashMovementsService.getSummary();
  }

  @Post()
  create(@Body() createCashMovementDto: CreateCashMovementDto) {
    return this.cashMovementsService.create(createCashMovementDto);
  }
}
