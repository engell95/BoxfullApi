/**
 * Seeder: Costos de envío por día de la semana
 *
 * Ejecutar con: npm run seed
 *
 * Estos valores son configurables directamente en la base de datos.
 * No se requiere UI de administración según los requerimientos.
 */

import { PrismaClient, DayOfWeek } from '@prisma/client';

const prisma = new PrismaClient();

const SHIPPING_COSTS: { dayOfWeek: DayOfWeek; cost: number }[] = [
  { dayOfWeek: DayOfWeek.MONDAY,    cost: 5.0 },
  { dayOfWeek: DayOfWeek.TUESDAY,   cost: 5.0 },
  { dayOfWeek: DayOfWeek.WEDNESDAY, cost: 5.0 },
  { dayOfWeek: DayOfWeek.THURSDAY,  cost: 5.0 },
  { dayOfWeek: DayOfWeek.FRIDAY,    cost: 6.0 },
  { dayOfWeek: DayOfWeek.SATURDAY,  cost: 7.0 },
  { dayOfWeek: DayOfWeek.SUNDAY,    cost: 8.0 },
];

async function main() {
  console.log('🌱 Iniciando seeder de costos de envío...\n');

  for (const entry of SHIPPING_COSTS) {
    const result = await prisma.shippingCost.upsert({
      where: { dayOfWeek: entry.dayOfWeek },
      update: { cost: entry.cost },
      create: { dayOfWeek: entry.dayOfWeek, cost: entry.cost },
    });

    console.log(`✅ ${result.dayOfWeek.padEnd(12)} → $${result.cost.toFixed(2)}`);
  }

  console.log('\n✨ Seeder completado. Costos de envío configurados correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
