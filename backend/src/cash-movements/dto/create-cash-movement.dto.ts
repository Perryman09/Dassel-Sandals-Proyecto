import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCashMovementDto {
  @IsString()
  @IsNotEmpty({ message: 'El tipo de movimiento es obligatorio (apertura, ingreso, egreso, salida, entrada, cierre)' })
  type: string;

  @IsNumber()
  @Min(0, { message: 'El monto debe ser positivo' })
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  responsible?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  date?: string;
}
