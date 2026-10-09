import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustStockDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  quantity?: number; // positive for entry, negative for removal

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  size?: string; // Talla específica que se ajusta si es calzado

  @IsOptional()
  sizesStock?: any; // Opcional: matriz completa actualizada
}
