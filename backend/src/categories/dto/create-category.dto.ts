import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'El identificador (slug) de la categoría es obligatorio' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsArray()
  @IsOptional()
  subcategories?: string[];
}
