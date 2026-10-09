import { IsString, IsNotEmpty, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['zapatos', 'joyas'])
  category: string;

  @IsString()
  @IsNotEmpty()
  subcategory: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costPrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minStock?: number;

  @IsString()
  @IsOptional()
  size?: string;

  @IsOptional()
  sizesStock?: any;

  @IsString()
  @IsOptional()
  material?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
