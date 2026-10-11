import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  ruc?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
