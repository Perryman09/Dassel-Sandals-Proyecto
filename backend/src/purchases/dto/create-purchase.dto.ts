import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @IsNumber()
  @IsOptional()
  productId?: number;

  @IsString()
  @IsNotEmpty()
  productCode: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsOptional()
  sizesBreakdown?: Record<string, number>;
}

export class CreatePurchaseDto {
  @IsString()
  @IsOptional()
  purchaseNumber?: string;

  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @IsNumber()
  @IsOptional()
  supplierId?: number;

  @IsString()
  @IsOptional()
  supplierName?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
