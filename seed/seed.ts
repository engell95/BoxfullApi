/**
 * Seeder: Costos de envío por día de la semana
 *
 * Ejecutar con: npm run seed
 *
 * Estos valores son configurables directamente en la base de datos.
 * No se requiere UI de administración según los requerimientos.
 */

import { PrismaClient, DayOfWeek, ParameterDataType, Role, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

const PARAMETERS = [
  {
    key: 'COD_COMMISSION_RATE',
    value: '0.0001',
    dataType: ParameterDataType.NUMBER,
    description: 'Porcentaje de comisión para órdenes COD (0.0001 = 0.01%)',
  },
  {
    key: 'COD_COMMISSION_MAX',
    value: '25',
    dataType: ParameterDataType.NUMBER,
    description: 'Tope máximo en dólares para la comisión COD',
  },
];

async function main() {
  console.log('🌱 Iniciando seeder de costos de envío...\n');

  for (const entry of SHIPPING_COSTS) {
    const exists = await prisma.shippingCost.findUnique({ where: { dayOfWeek: entry.dayOfWeek } });
    let result;
    if (exists) {
      result = await prisma.shippingCost.update({
        where: { id: exists.id },
        data: { cost: entry.cost },
      });
    } else {
      result = await prisma.shippingCost.create({
        data: { dayOfWeek: entry.dayOfWeek, cost: entry.cost },
      });
    }
    console.log(`✅ ${result.dayOfWeek.padEnd(12)} → $${result.cost.toFixed(2)}`);
  }

  console.log('\n⚙️ Iniciando seeder de parámetros globales...\n');
  for (const param of PARAMETERS) {
    const exists = await prisma.parameter.findUnique({ where: { key: param.key } });
    let result;
    if (exists) {
      result = await prisma.parameter.update({
        where: { id: exists.id },
        data: { value: param.value, dataType: param.dataType, description: param.description },
      });
    } else {
      result = await prisma.parameter.create({
        data: {
          key: param.key,
          value: param.value,
          dataType: param.dataType,
          description: param.description,
        },
      });
    }
    console.log(`✅ ${result.key.padEnd(25)} → ${result.value}`);
  }

  console.log('\n🌎 Iniciando seeder de Ubicaciones (Nicaragua)...');
  const NICARAGUA_DATA = [
    {
      department: 'Managua',
      municipalities: ['Managua', 'Ciudad Sandino', 'Tipitapa', 'Ticuantepe', 'Mateare'],
    },
    {
      department: 'León',
      municipalities: ['León', 'Nagarote', 'La Paz Centro', 'Telica'],
    },
    {
      department: 'Masaya',
      municipalities: ['Masaya', 'Nindirí', 'Catarina', 'Niquinohomo'],
    },
    {
      department: 'Granada',
      municipalities: ['Granada', 'Diriá', 'Diriomo', 'Nandaime'],
    },
  ];

  for (const data of NICARAGUA_DATA) {
    let dept = await prisma.department.findUnique({ where: { name: data.department } });
    if (!dept) {
      dept = await prisma.department.create({ data: { name: data.department } });
    }

    for (const muni of data.municipalities) {
      const existingMuni = await prisma.municipality.findFirst({
        where: { name: muni, departmentId: dept.id },
      });
      if (!existingMuni) {
        await prisma.municipality.create({
          data: { name: muni, departmentId: dept.id },
        });
      }
    }
    console.log(`✅ Departamento de ${dept.name} y sus municipios creados.`);
  }

  console.log('\n👤 Creando usuarios de prueba...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Crear Administrador del Sistema
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@boxful.com' } });
  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });
  } else {
    adminUser = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@boxful.com',
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
  }
  console.log(`✅ Admin creado/actualizado: ${adminUser.email}`);

  // 2. Crear Empresa
  let company = await prisma.company.findFirst({ where: { nit: '1234-567890-123-1' } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Mi Comercio S.A. de C.V.',
        nit: '1234-567890-123-1',
        address: 'San Salvador, El Salvador',
        phone: '+503 2222 2222',
      },
    });
  }
  console.log(`✅ Empresa creada: ${company.name}`);

  // 3. Crear Usuario Empresa (Owner)
  let companyUser = await prisma.user.findUnique({ where: { email: 'comercio@boxful.com' } });
  if (companyUser) {
    companyUser = await prisma.user.update({
      where: { id: companyUser.id },
      data: { password: hashedPassword },
    });
  } else {
    companyUser = await prisma.user.create({
      data: {
        firstName: 'Dueño',
        lastName: 'Comercio',
        whatsapp: '+503 7000 0000',
        email: 'comercio@boxful.com',
        password: hashedPassword,
        role: Role.COMPANY_OWNER,
        companyId: company.id,
      },
    });
  }
  console.log(`✅ Usuario de empresa creado/actualizado: ${companyUser.email}`);

  // 4. Crear Órdenes de prueba
  console.log('\n📦 Creando órdenes de prueba...');
  
  // Limpiar órdenes anteriores para no duplicar en el seed
  await prisma.order.deleteMany({ where: { companyId: company.id } });

  // Orden NO COD
  await prisma.order.create({
    data: {
      userId: companyUser.id,
      companyId: company.id,
      pickupAddress: 'Colonia Las Magnolias, San Salvador',
      recipientFirstName: 'Juan',
      recipientLastName: 'Pérez',
      recipientEmail: 'juan@test.com',
      recipientPhone: '+503 7000 0001',
      recipientAddress: 'Calle El Mirador #12',
      recipientMunicipality: 'Managua',
      recipientDepartment: 'Managua',
      deliveryDate: new Date(),
      instructions: 'Dejar en portería',
      isCOD: false,
      shippingCost: 5.0,
      status: OrderStatus.PENDING,
      packages: [{ content: 'Libros', weightInLbs: 3, width: 20, height: 10, length: 30 }],
    },
  });

  // Orden COD (Ya entregada para ver el settlement)
  await prisma.order.create({
    data: {
      userId: companyUser.id,
      companyId: company.id,
      pickupAddress: 'Sucursal Escalón',
      recipientFirstName: 'María',
      recipientLastName: 'García',
      recipientEmail: 'maria@test.com',
      recipientPhone: '+503 7000 0002',
      recipientAddress: 'Colonia Escalón',
      recipientMunicipality: 'Managua',
      recipientDepartment: 'Managua',
      deliveryDate: new Date(),
      instructions: 'Llamar antes de llegar',
      isCOD: true,
      expectedAmount: 25.0,
      collectedAmount: 25.0,
      shippingCost: 5.0,
      status: OrderStatus.DELIVERED,
      packages: [{ content: 'Ropa', weightInLbs: 1, width: 30, height: 5, length: 40 }],
    },
  });
  console.log('✅ 2 Órdenes de prueba creadas (1 COD, 1 No COD)');

  console.log('\n✨ Seeder completado satisfactoriamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
