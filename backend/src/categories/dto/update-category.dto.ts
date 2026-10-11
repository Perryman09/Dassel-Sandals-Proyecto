import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsOptional()
  subcategories?: string[];
}
