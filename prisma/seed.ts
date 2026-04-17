import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ecoPack = await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'EcoPack Solutions', category: 'Packaging', leadTime: '5 days' },
  });

  const natureBio = await prisma.supplier.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'NatureBiotics Inc.', category: 'Raw Materials', leadTime: '12 days' },
  });

  const glassCo = await prisma.supplier.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Glass & Co.', category: 'Packaging', leadTime: '7 days' },
  });

  const productsData = [
    { sku: 'SK-001', name: 'Lavender Night Cream', category: 'Skincare', type: 'Finished', costPrice: 12.50, sellingPrice: 35.00, stock: 145, laborCostPerUnit: 1.50, overheadCostPerUnit: 0.50 },
    { sku: 'HC-001', name: 'Argan Hair Oil', category: 'Haircare', type: 'Finished', costPrice: 8.20, sellingPrice: 24.00, stock: 80, laborCostPerUnit: 1.00, overheadCostPerUnit: 0.35 },
    { sku: 'BD-001', name: 'Cedarwood Beard Balm', category: 'Beard Care', type: 'Finished', costPrice: 5.75, sellingPrice: 18.00, stock: 12 },
    { sku: 'RM-001', name: 'Raw Shea Butter', category: 'Raw Material', type: 'Raw', costPrice: 4.00, sellingPrice: 0, stock: 500, supplierId: 2 },
    { sku: 'PK-001', name: 'Amber Glass Jar 50ml', category: 'Packaging', type: 'Packaging', costPrice: 0.85, sellingPrice: 0, stock: 1200, supplierId: 3 }
  ];

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  const nightCream = await prisma.product.findUnique({ where: { sku: 'SK-001' } });
  const sheaButter = await prisma.product.findUnique({ where: { sku: 'RM-001' } });
  const glassJar = await prisma.product.findUnique({ where: { sku: 'PK-001' } });

  if (nightCream && sheaButter && glassJar) {
    await prisma.billOfMaterial.upsert({
      where: {
        finishedGoodId_componentId: { finishedGoodId: nightCream.id, componentId: sheaButter.id }
      },
      update: {},
      create: { finishedGoodId: nightCream.id, componentId: sheaButter.id, quantityRequired: 0.2 }
    });

    await prisma.billOfMaterial.upsert({
      where: {
        finishedGoodId_componentId: { finishedGoodId: nightCream.id, componentId: glassJar.id }
      },
      update: {},
      create: { finishedGoodId: nightCream.id, componentId: glassJar.id, quantityRequired: 1 }
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
