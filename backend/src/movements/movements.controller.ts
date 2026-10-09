import { Controller, Get, Query } from '@nestjs/common';
import { MovementsService } from './movements.service';

@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('type') type?: string) {
    return this.movementsService.findAll({ search, type });
  }
}
