import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const DEFAULT_CATEGORIES = [
  {
    id: 'zapatos',
    name: 'Zapatos & Tacones',
    icon: '👡',
    type: 'zapatos',
    subcategories: [
      'Sandalias',
      'Huaraches',
      'Plataformas',
      'Flats',
      'Tacones',
      'Tacones Altos',
      'Stilettos',
      'Botines',
      'Otro',
    ],
  },
  {
    id: 'joyas',
    name: 'Joyas & Accesorios',
    icon: '💎',
    type: 'joyas',
    subcategories: [
      'Collares',
      'Pulseras',
      'Aretes',
      'Anillos',
      'Tobilleras',
      'Dijes',
      'Cadenas',
      'Juegos',
      'Otro',
    ],
  },
];

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    const count = await this.prisma.category.count();
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await this.prisma.category.create({
          data: {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            type: cat.type,
            subcategories: cat.subcategories,
          },
        });
      }
    }
  }

  async findAll() {
    await this.seedDefaults();
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Categoría "${id}" no encontrada`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const id = dto.id.toLowerCase().trim().replace(/\s+/g, '-');
    return this.prisma.category.create({
      data: {
        id,
        name: dto.name,
        icon: dto.icon || '📁',
        type: dto.type || 'zapatos',
        subcategories: dto.subcategories || [],
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.subcategories !== undefined && { subcategories: dto.subcategories }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
