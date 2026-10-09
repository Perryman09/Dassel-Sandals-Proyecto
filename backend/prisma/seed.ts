import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/prisma/prisma.adapter';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

const initialProducts = [
  { code: 'DS-ZAP-001', name: 'Sandalia Maya Artesanal', category: 'zapatos', subcategory: 'Sandalias', description: 'Sandalia artesanal con bordado maya y suela anatómica', costPrice: 350, salePrice: 650, stock: 25, minStock: 5, size: '23-26', material: 'Cuero sintético', color: 'Beige', status: 'active' },
  { code: 'DS-ZAP-002', name: 'Huarache Clásico Piel', category: 'zapatos', subcategory: 'Huaraches', description: 'Huarache tejido a mano en piel genuina con suela de hule', costPrice: 280, salePrice: 520, stock: 18, minStock: 5, size: '24-28', material: 'Cuero genuino', color: 'Café Caramelo', status: 'active' },
  { code: 'DS-ZAP-003', name: 'Sandalia Playa Sunset', category: 'zapatos', subcategory: 'Sandalias', description: 'Sandalia impermeable ultraligera para alberca y playa', costPrice: 180, salePrice: 380, stock: 40, minStock: 10, size: '22-26', material: 'EVA Premium', color: 'Negro Mate', status: 'active' },
  { code: 'DS-ZAP-004', name: 'Plataforma Yute Bohemia', category: 'zapatos', subcategory: 'Plataformas', description: 'Sandalia alta con tacón de cuña de yute trenzado', costPrice: 450, salePrice: 850, stock: 12, minStock: 5, size: '23-26', material: 'Yute y Cuero', color: 'Dorado / Natural', status: 'active' },
  { code: 'DS-ZAP-005', name: 'Flat Confort Acolchada', category: 'zapatos', subcategory: 'Flats', description: 'Sandalia de piso ultra cómoda con plantilla de memory foam', costPrice: 200, salePrice: 420, stock: 3, minStock: 5, size: '22-27', material: 'Gamuza sintética', color: 'Rosa Palo', status: 'active' },
  { code: 'DS-ZAP-006', name: 'Huarache Frida Mexicano', category: 'zapatos', subcategory: 'Huaraches', description: 'Diseño tradicional artesanal con costura reforzada', costPrice: 320, salePrice: 580, stock: 0, minStock: 5, size: '24-28', material: 'Piel Vacuna', color: 'Miel', status: 'active' },
  { code: 'DS-ZAP-007', name: 'Sandalia Tiras Brillantes', category: 'zapatos', subcategory: 'Sandalias', description: 'Sandalia de fiesta con tiras delgadas brillantes', costPrice: 400, salePrice: 750, stock: 8, minStock: 5, size: '22-26', material: 'Microfibra y Strass', color: 'Dorado', status: 'active' },
  { code: 'DS-JOY-001', name: 'Collar Turquesa Bohemio', category: 'joyas', subcategory: 'Collares', description: 'Collar con piedra natural turquesa y cadena de chapa de oro', costPrice: 150, salePrice: 350, stock: 15, minStock: 3, size: '45 cm', material: 'Chapa de oro y Turquesa', color: 'Turquesa / Oro', status: 'active' },
  { code: 'DS-JOY-002', name: 'Pulsera Conchas Marinas', category: 'joyas', subcategory: 'Pulseras', description: 'Pulsera ajustable tejida a mano con dijes de cauri natural', costPrice: 80, salePrice: 180, stock: 30, minStock: 5, size: 'Ajustable', material: 'Hilo encerado y Cauri', color: 'Blanco / Dorado', status: 'active' },
  { code: 'DS-JOY-003', name: 'Aretes Luna y Sol Filigrana', category: 'joyas', subcategory: 'Aretes', description: 'Par de aretes asimétricos con diseño grabado fino', costPrice: 120, salePrice: 280, stock: 20, minStock: 5, size: '3.5 cm', material: 'Acero quirúrgico dorado', color: 'Dorado', status: 'active' },
  { code: 'DS-JOY-004', name: 'Anillo Flor de Loto Plata', category: 'joyas', subcategory: 'Anillos', description: 'Anillo abierto ajustable con detalle en plata esterlina', costPrice: 90, salePrice: 220, stock: 2, minStock: 5, size: 'Ajustable', material: 'Plata 925', color: 'Plateado', status: 'active' },
  { code: 'DS-JOY-005', name: 'Tobillera Playera Perlas', category: 'joyas', subcategory: 'Tobilleras', description: 'Tobillera fina con perlas de río y concha marina', costPrice: 60, salePrice: 150, stock: 25, minStock: 5, size: '24 cm', material: 'Perlas de río cultivadas', color: 'Blanco Perlado', status: 'active' },
  { code: 'DS-JOY-006', name: 'Collar Mandala Sagrado', category: 'joyas', subcategory: 'Collares', description: 'Medallón con dije de geometría sagrada y cadena larga', costPrice: 130, salePrice: 300, stock: 0, minStock: 3, size: '60 cm', material: 'Bronce antiguo', color: 'Bronce Vintage', status: 'inactive' },
  { code: 'DS-JOY-007', name: 'Pulsera Piedra Volcánica', category: 'joyas', subcategory: 'Pulseras', description: 'Pulsera elástica de cuentas de lava volcánica natural', costPrice: 100, salePrice: 240, stock: 14, minStock: 5, size: '19 cm', material: 'Piedra volcánica', color: 'Negro Mate', status: 'active' },
];

async function main() {
  console.log('🌱 Iniciando carga de datos iniciales en PostgreSQL para Dassel Sandals...');

  // Limpiar tablas previas
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.product.deleteMany();

  // 1. Insertar Productos
  const createdProducts = [];
  for (const prod of initialProducts) {
    const p = await prisma.product.create({
      data: prod,
    });
    createdProducts.push(p);

    if (p.stock > 0) {
      await prisma.movement.create({
        data: {
          date: new Date(),
          type: 'entrada',
          reason: 'Inventario inicial de apertura de boutique',
          productCode: p.code,
          productName: p.name,
          quantity: p.stock,
          remainingStock: p.stock,
          productId: p.id,
        },
      });
    }
  }

  console.log(`✅ ${createdProducts.length} productos registrados correctamente.`);

  // 2. Insertar Ventas de demostración
  const p1 = createdProducts[0]; // Sandalia Maya
  const p3 = createdProducts[2]; // Sandalia Playa
  const p8 = createdProducts[7]; // Collar Turquesa

  const sale1 = await prisma.sale.create({
    data: {
      saleNumber: 'VTA-0001',
      date: new Date('2026-10-07T10:30:00Z'),
      subtotal: 1650,
      discount: 0,
      total: 1650,
      paymentMethod: 'Efectivo',
      receivedAmount: 2000,
      customerName: 'María García',
      customerPhone: '5512345678',
      status: 'completed',
      items: {
        create: [
          {
            productId: p1.id,
            productCode: p1.code,
            productName: p1.name,
            quantity: 2,
            price: Number(p1.salePrice),
            costPrice: Number(p1.costPrice),
            subtotal: 1300,
          },
          {
            productId: p8.id,
            productCode: p8.code,
            productName: p8.name,
            quantity: 1,
            price: Number(p8.salePrice),
            costPrice: Number(p8.costPrice),
            subtotal: 350,
          },
        ],
      },
    },
  });

  const sale2 = await prisma.sale.create({
    data: {
      saleNumber: 'VTA-0002',
      date: new Date('2026-10-07T12:15:00Z'),
      subtotal: 1140,
      discount: 100,
      total: 1040,
      paymentMethod: 'Tarjeta',
      customerName: 'Ana López',
      customerPhone: '5598765432',
      status: 'completed',
      items: {
        create: [
          {
            productId: p3.id,
            productCode: p3.code,
            productName: p3.name,
            quantity: 3,
            price: Number(p3.salePrice),
            costPrice: Number(p3.costPrice),
            subtotal: 1140,
          },
        ],
      },
    },
  });

  console.log(`✅ Ventas iniciales VTA-0001 y VTA-0002 cargadas con éxito.`);
  console.log('✨ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
