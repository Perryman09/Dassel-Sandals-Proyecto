import { PrismaClient } from '@prisma/client';
import { createPrismaAdapter } from '../src/prisma/prisma.adapter.ts';

const prisma = new PrismaClient({ adapter: createPrismaAdapter() });

async function main() {
  console.log('🧹 Limpiando datos de demostración para dejar la base de datos lista para producción...');

  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.movement.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();

  console.log('✅ Inventario, proveedores, compras, ventas y movimientos limpiados al 100%.');
  console.log('✨ Base de datos lista para producción (libre de datos demo).');
}

main()
  .catch((e) => {
    console.error('❌ Error al limpiar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
