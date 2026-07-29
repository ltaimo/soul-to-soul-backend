const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const officialProducts = [
  ['Óleo Essencial de Eucalipto', 500, 9],
  ['Óleo Essencial de Tea Tree', 500, 2],
  ['Óleo Essencial de Laranja', 500, 8],
  ['Óleo Essencial de Menta', 500, 9],
  ['Óleo Essencial de Citronela', 500, 8],
  ['Óleo Essencial de Lemongrass', 500, 2],
  ['Óleo Essencial de Lavanda', 500, 0],
  ['Vela para Massagem', 500, 10],
  ['Spray para Ambientes', 750, 13],
  ['Repelente Natural', 500, 10],
  ['Roll-on Anti-Stress', 500, 5],
  ['Roll-on Anti-Alérgico', 500, 4],
  ['Roll-on Foco', 500, 13],
  ['Roll-on Imunidade', 500, 13],
  ['Roll-on Sono Tranquilo', 500, 0],
  ['Roll-on Menta & Lavanda', 500, 1],
  ['Roll-on Baunilha & Laranja', 500, 2],
  ['Roll-on Menta & Laranja', 500, 3],
  ['Roll-on Limão & Lavanda', 500, 2],
  ['Roll-on Jojoba & Óleos Essenciais', 500, 2],
  ['Bálsamo para o Peito', 500, 21],
  ['Água de Rosas', 500, 7],
  ['Spray After Shave', 500, 10],
  ['Óleo para Barba', 800, 0],
  ['Manteiga para Barba', 500, 4],
  ['Sabão Líquido para Barba', 500, 7],
  ['Ervas para Vaporização Facial', 500, 0],
  ['Esfoliante Facial', 500, 18],
  ['Creme para Olheiras', 500, 23],
  ['Argila Branca', 500, 0],
  ['Argila Bentonítica', 500, 0],
  ['Argila Vermelha', 500, 8],
  ['Argila Natural', 500, 2],
  ['Óleo Facial de Camomila', 500, 0],
  ['Óleo Facial de Lavanda', 500, 13],
  ['Óleo Facial de Abacate', 500, 7],
  ['Óleo Facial de Rosas', 500, 0],
  ['Sombra Mágica', 500, 2],
  ['Esfoliante Labial', 200, 0],
  ['Bálsamo Labial (Tubo)', 200, 17],
  ['Bálsamo Labial (Redondo)', 200, 20],
  ['Glow Oil', 500, 5],
  ['Esfoliante Corporal de Essências', 500, 1],
  ['Esfoliante Corporal de Açúcar', 500, 1],
  ['Sais de Banho de Rosas', 500, 7],
  ['Sais de Banho de Lavanda', 500, 3],
  ['Vaselina Orgânica', 500, 13],
  ['Manteiga de Karité Virgem', 500, 3],
  ['Manteiga Corporal de Karité', 500, 6],
  ['Óleo Corporal', 500, 0],
  ['Óleo Anti-Celulite', 500, 11],
  ['Óleo de Amêndoas Doces 50 ml', 500, 0],
  ['Óleo de Amêndoas Doces 100 ml', 750, 9],
  ['Óleo de Amendoim', 500, 16],
  ['Óleo de Café', 500, 8],
  ['Óleo de Cânhu', 500, 5],
  ['Óleo de Cravo', 500, 5],
  ['Pó de Henna', 500, 1],
  ['Pó de Chebe', 500, 1],
  ['Kar Kar Oil', 500, 0],
  ['Manteiga Capilar', 500, 12],
  ['Sérum Capilar', 500, 22],
  ['Óleo de Alecrim 100 ml', 500, 0],
  ['Óleo de Rícino 30 ml', 200, 0],
  ['Óleo de Rícino 100 ml', 500, 19],
  ['Óleo de Coco 1 L', 750, 2],
  ['Óleo de Coco 500 ml', 500, 4],
  ['Óleo de Coco 100 ml', 200, 12],
  ['Óleo de Coco 30 ml', 200, 11],
  ['Cocktail de Óleos Orgânicos 100 ml', 500, 0],
  ['Óleo de Mafura', 500, 2],
  ['Óleo de Rícino 200 ml', 750, 0],
  ['Roll-on Anti-Queda', 500, 1],
  ['Soak Orgânico para Pés', 500, 0],
  ['Esfoliante para Pés', 500, 0],
  ['Bálsamo para Pés', 500, 2],
  ['Pó para Sapatos', 500, 2],
  ['Mel 500 ml', 500, 3],
  ['Mel 1 kg', 1000, 0],
  ['Sais Escaldantes (Pequenos)', 500, 2],
  ['Bálsamo para Dores', 500, 3],
  ['Bálsamo de Pimenta Caiena', 500, 6],
  ['Bálsamo para o Peito (Linha Cura)', 500, 48],
  ['Bálsamo Tigre', 500, 8],
  ['Banho de Assento Profundo', 500, 12],
  ['Banho de Assento Natural', 500, 4],
  ['Bálsamo de Calêndula', 500, 11],
  ['Bálsamo de Lavanda', 500, 8],
  ['Luvas Descartáveis', 200, 2],
  ['Cocktail de Sabão Preto 150 ml', 500, 8],
  ['Poo-Pourri', 500, 9],
  ['Difusor', 750, 0],
  ['Sabão Preto em Pasta 500 g', 1200, 14],
].map(([name, sellingPrice, quantity]) => ({ name, sellingPrice, quantity }));

const officialSkuAliases = {
  'Óleo Essencial de Eucalipto': 'S2S-ARO-EUCALIPTO-10ML',
  'Óleo Essencial de Tea Tree': 'S2S-ARO-TEA-TREE-10ML',
  'Óleo Essencial de Laranja': 'S2S-ARO-LARANJA-10ML',
  'Óleo Essencial de Menta': 'S2S-ARO-MENTA-10ML',
  'Óleo Essencial de Citronela': 'S2S-ARO-CITRONELA-10ML',
  'Óleo Essencial de Lemongrass': 'S2S-ARO-LEMONGRASS-10ML',
  'Óleo Essencial de Lavanda': 'S2S-ARO-LAVANDA-10ML',
  'Spray para Ambientes': 'S2S-ARO-SPRAY-PARA-QUARTO-150ML',
  'Repelente Natural': 'S2S-CUR-REPELENTE-50ML',
  'Roll-on Anti-Stress': 'S2S-CUR-ANTI-ESTRESSE-10ML',
  'Roll-on Anti-Alérgico': 'S2S-CUR-ANTI-ALERGICO-10ML',
  'Roll-on Foco': 'S2S-ARO-FOCO-10ML',
  'Roll-on Imunidade': 'S2S-ARO-IMUNIDADE-10ML',
  'Roll-on Sono Tranquilo': 'S2S-ARO-SONO-TRANQUILO-10ML',
  'Roll-on Menta & Lavanda': 'S2S-ARO-MENTA-LAVANDA-100ML',
  'Roll-on Baunilha & Laranja': 'S2S-ARO-VANILLA-E-LARANJA-100ML',
  'Roll-on Menta & Laranja': 'S2S-ARO-MENTA-LARANJA-100ML',
  'Roll-on Limão & Lavanda': 'S2S-ARO-LIMAO-E-LAVANDA-100ML',
  'Bálsamo para o Peito': 'S2S-CUR-BALSAMO-PEITO-100G',
  'Bálsamo para o Peito (Linha Cura)': 'S2S-CUR-BALSAMO-PEITORAL-50G',
  'Ervas para Vaporização Facial': 'S2S-COR-ERVAS-PARA-VAPORIZ-100G',
  'Óleo Facial de Camomila': 'S2S-COR-OLEO-CAMOMILA-50ML',
  'Óleo Facial de Lavanda': 'S2S-FAC-OLEO-FACIAL-LAVAND-50ML',
  'Óleo Facial de Rosas': 'S2S-FAC-OLEO-FACIAL-ROSAS-50ML',
  'Bálsamo Labial (Tubo)': 'S2S-CUR-BALSAMO-LABIAL-EM--10ML',
  'Esfoliante Corporal de Essências': 'S2S-COR-ESFOLIANTE-CORPORA-250G',
  'Sais de Banho de Rosas': 'S2S-COR-SAIS-PARA-BANHO-RO-250G',
  'Sais de Banho de Lavanda': 'S2S-COR-SAIS-PARA-BANHO-LA-250G',
  'Manteiga Corporal de Karité': 'S2S-COR-MANTEIGA-DE-KARITE-250G',
  'Manteiga Capilar': 'S2S-CAP-MANTEIGA-DE-KARITE-250G',
  'Óleo de Amêndoas Doces 100 ml': 'S2S-COR-OLEO-DE-AMENDOAS-100ML',
  'Óleo de Amendoim': 'S2S-COR-OLEO-AMENDOIM-100ML',
  'Óleo de Café': 'S2S-COR-OLEO-CAFE-100ML',
  'Óleo de Cravo': 'S2S-COR-OLEO-CRAVO-100ML',
  'Óleo de Alecrim 100 ml': 'S2S-CAP-OLEO-ALECRIM-100ML',
  'Óleo de Rícino 100 ml': 'S2S-COR-OLEO-RICINO-100ML',
  'Óleo de Coco 1 L': 'S2S-COR-OLEO-COCO-1L',
  'Óleo de Coco 500 ml': 'S2S-COR-OLEO-COCO-500ML',
  'Óleo de Coco 100 ml': 'S2S-COR-OLEO-COCO-100ML',
  'Cocktail de Óleos Orgânicos 100 ml': 'S2S-CAP-COCKTAIL-DE-OLEOS--100ML',
  'Roll-on Anti-Queda': 'S2S-CAP-ANTI-QUEDA-CAPILAR-50ML',
  'Soak Orgânico para Pés': 'S2S-COR-SOAK-ORGANICO-100MG',
  'Bálsamo para Pés': 'S2S-CUR-BALSAMO-PES-100G',
  'Mel 500 ml': 'S2S-CUR-MEL-500ML',
  'Mel 1 kg': 'S2S-CUR-MEL-1KG',
  'Sais Escaldantes (Pequenos)': 'S2S-ARO-SAIS-ESCALDANTES-250G',
  'Bálsamo para Dores': 'S2S-CUR-BALSAMO-DORES-100G',
  'Bálsamo de Pimenta Caiena': 'S2S-CUR-BALSAMO-PIMENTA-CA-100G',
  'Banho de Assento Profundo': 'S2S-CUR-BANHO-DE-ASSENTO-250G',
  'Bálsamo de Calêndula': 'S2S-CUR-BALSAMO-CALENDULA-50G',
  'Bálsamo de Lavanda': 'S2S-CUR-BALSAMO-LAVANDA-50G',
  'Luvas Descartáveis': 'S2S-CAP-LUVAS-PCS',
  'Sabão Preto em Pasta 500 g': 'S2S-CAP-SABAO-PRETO-500G',
};

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slug(value) {
  return normalize(value)
    .toUpperCase()
    .replace(/ /g, '-')
    .slice(0, 42);
}

function inferCategory(name) {
  const n = normalize(name);
  if (n.includes('oleo essencial') || n.includes('roll on')) return 'Aromaterapia';
  if (n.includes('barba') || n.includes('after shave')) return 'Barba';
  if (n.includes('facial') || n.includes('olheiras') || n.includes('argila')) return 'Rosto';
  if (n.includes('labial')) return 'Lábios';
  if (n.includes('corporal') || n.includes('banho') || n.includes('karite')) return 'Corpo';
  if (n.includes('capilar') || n.includes('henna') || n.includes('chebe')) return 'Cabelo';
  if (n.includes('pes') || n.includes('sapatos')) return 'Pés';
  if (n.includes('mel')) return 'Mel';
  return 'Geral';
}

async function ensureDefaultWarehouse(tx) {
  let warehouse = await tx.warehouse.findFirst({
    where: { isDefault: true },
    orderBy: { id: 'asc' },
  });
  if (!warehouse) {
    warehouse = await tx.warehouse.upsert({
      where: { code: 'MAIN' },
      update: { isDefault: true, status: 'Active', name: 'Soul2Soul Baia Mall' },
      create: {
        code: 'MAIN',
        name: 'Soul2Soul Baia Mall',
        type: 'Shop',
        status: 'Active',
        isDefault: true,
      },
    });
  }
  return warehouse;
}

async function nextSku(tx, name) {
  const base = `S2S-${slug(name)}` || 'S2S-PRODUTO';
  let candidate = base;
  let suffix = 2;
  while (await tx.product.findUnique({ where: { sku: candidate } })) {
    candidate = `${base.slice(0, 45)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function audit(prisma, summary, dryRun) {
  await prisma.auditLog.create({
    data: {
      userName: 'Codex',
      userEmail: 'codex@soul2soul.local',
      userRole: 'system',
      action: dryRun
        ? 'DRY_RUN_OFFICIAL_CATALOG_SYNC'
        : 'APPLY_OFFICIAL_CATALOG_SYNC',
      entityType: 'products',
      method: dryRun ? 'READ' : 'SCRIPT',
      path: 'backend/scripts/sync-official-catalog.js',
      metadata: JSON.stringify(summary),
      statusCode: 200,
    },
  });
}

async function analyze(prisma) {
  const officialKeys = new Set();
  const duplicateOfficial = [];
  for (const item of officialProducts) {
    const key = normalize(item.name);
    if (officialKeys.has(key)) duplicateOfficial.push(item.name);
    officialKeys.add(key);
  }
  if (duplicateOfficial.length) {
    throw new Error(`Duplicate official products: ${duplicateOfficial.join(', ')}`);
  }

  const products = await prisma.product.findMany({
    include: { warehouseStocks: { include: { warehouse: true } } },
    orderBy: { name: 'asc' },
  });
  const byName = new Map();
  const bySku = new Map();
  for (const product of products) {
    const key = normalize(product.name);
    const existing = byName.get(key) || [];
    existing.push(product);
    byName.set(key, existing);
    bySku.set(product.sku, product);
  }

  const matched = [];
  const toCreate = [];
  const matchedIds = new Set();
  for (const item of officialProducts) {
    const aliasSku = officialSkuAliases[item.name];
    const aliasMatch = aliasSku ? bySku.get(aliasSku) : null;
    const exactRows = byName.get(normalize(item.name)) || [];
    if (aliasSku && !aliasMatch) {
      throw new Error(`Alias SKU not found for ${item.name}: ${aliasSku}`);
    }
    if (!aliasMatch && exactRows.length > 1) {
      throw new Error(
        `Ambiguous product match for ${item.name}: ${exactRows
          .map((row) => `${row.id}/${row.sku}`)
          .join(', ')}`,
      );
    }
    const match = aliasMatch || exactRows[0];
    if (match) {
      matched.push({ item, product: match });
      matchedIds.add(match.id);
    } else {
      toCreate.push(item);
    }
  }

  const toDeactivate = products.filter((product) => !matchedIds.has(product.id));
  const stockByProduct = products.reduce((acc, product) => {
    acc[product.id] = product.warehouseStocks.reduce(
      (sum, row) => sum + row.quantity,
      0,
    );
    return acc;
  }, {});

  return {
    officialCount: officialProducts.length,
    officialTotalQuantity: officialProducts.reduce((sum, item) => sum + item.quantity, 0),
    currentProductCount: products.length,
    matchedCount: matched.length,
    createCount: toCreate.length,
    deactivateCount: toDeactivate.filter((product) => product.status !== 'Inactive').length,
    totalProductsOutsideOfficial: toDeactivate.length,
    priceChanges: matched.filter(
      ({ item, product }) => Number(product.sellingPrice) !== Number(item.sellingPrice),
    ).length,
    stockChanges: matched.filter(
      ({ item, product }) => stockByProduct[product.id] !== item.quantity,
    ).length,
    toCreate: toCreate.map((item) => item.name),
    toDeactivate: toDeactivate.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      status: product.status,
      stock: stockByProduct[product.id],
    })),
  };
}

async function applySync(prisma) {
  return prisma.$transaction(
    async (tx) => {
      const warehouse = await ensureDefaultWarehouse(tx);
      const warehouses = await tx.warehouse.findMany({ orderBy: { id: 'asc' } });
      let products = await tx.product.findMany({
        include: { warehouseStocks: true },
        orderBy: { id: 'asc' },
      });

      for (const wh of warehouses) {
        const existing = new Set(
          (
            await tx.warehouseStock.findMany({
              where: { warehouseId: wh.id },
              select: { productId: true },
            })
          ).map((row) => row.productId),
        );
        const missing = products
          .filter((product) => !existing.has(product.id))
          .map((product) => ({
            warehouseId: wh.id,
            productId: product.id,
            quantity: 0,
            minStock: product.minStock || 0,
          }));
        if (missing.length) {
          await tx.warehouseStock.createMany({ data: missing, skipDuplicates: true });
        }
      }

      products = await tx.product.findMany({
        include: { warehouseStocks: true },
        orderBy: { id: 'asc' },
      });

  const productByName = new Map(products.map((product) => [normalize(product.name), product]));
  const productBySku = new Map(products.map((product) => [product.sku, product]));
  const officialByName = new Map(officialProducts.map((item) => [normalize(item.name), item]));
  const officialProductIds = new Set();
      const summary = {
        officialCount: officialProducts.length,
        officialTotalQuantity: officialProducts.reduce((sum, item) => sum + item.quantity, 0),
        createdProducts: 0,
        activatedProducts: 0,
        updatedProducts: 0,
        deactivatedProducts: 0,
        resetRows: 0,
        stockSetRows: 0,
        stockMovementRows: 0,
      };

      for (const product of products) {
        for (const stock of product.warehouseStocks) {
          if (stock.quantity !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: product.id,
                warehouseId: stock.warehouseId,
                quantity: -stock.quantity,
                movementType: 'OFFICIAL_CATALOG_RESET',
                unitCost: product.costPrice || 0,
                responsibleName: 'Codex',
                reference: 'Official catalog reset before production launch',
              },
            });
            summary.stockMovementRows += 1;
          }
          await tx.warehouseStock.update({
            where: {
              warehouseId_productId: {
                warehouseId: stock.warehouseId,
                productId: product.id,
              },
            },
            data: { quantity: 0 },
          });
          summary.resetRows += 1;
        }
      }

      for (const item of officialProducts) {
        const aliasSku = officialSkuAliases[item.name];
        const exactRows = productByName.has(normalize(item.name))
          ? [productByName.get(normalize(item.name))]
          : [];
        const product = aliasSku ? productBySku.get(aliasSku) : exactRows[0];
        if (product) officialProductIds.add(product.id);
      }

      for (const product of products) {
        if (officialProductIds.has(product.id)) continue;
        if (product.status !== 'Inactive') summary.deactivatedProducts += 1;
        await tx.product.update({
          where: { id: product.id },
          data: { stock: 0, status: 'Inactive' },
        });
      }

      for (const item of officialProducts) {
        const aliasSku = officialSkuAliases[item.name];
        let product = aliasSku
          ? productBySku.get(aliasSku)
          : productByName.get(normalize(item.name));
        if (!product) {
          product = await tx.product.create({
            data: {
              sku: await nextSku(tx, item.name),
              name: item.name,
              category: inferCategory(item.name),
              type: 'Finished Good',
              unit: 'pcs',
              costPrice: 0,
              sellingPrice: item.sellingPrice,
              minStock: 0,
              stock: item.quantity,
              status: 'Active',
            },
          });
          for (const wh of warehouses) {
            await tx.warehouseStock.create({
              data: {
                warehouseId: wh.id,
                productId: product.id,
                quantity: 0,
                minStock: 0,
              },
            });
            summary.resetRows += 1;
          }
          productByName.set(normalize(item.name), product);
          productBySku.set(product.sku, product);
          summary.createdProducts += 1;
        } else {
          if (product.status !== 'Active') summary.activatedProducts += 1;
          await tx.product.update({
            where: { id: product.id },
            data: {
              name: item.name,
              sellingPrice: item.sellingPrice,
              stock: item.quantity,
              status: 'Active',
            },
          });
          summary.updatedProducts += 1;
        }

        if (!productByName.get(normalize(item.name))) {
          productByName.set(normalize(item.name), product);
        }

        await tx.warehouseStock.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: warehouse.id,
              productId: product.id,
            },
          },
          update: { quantity: item.quantity },
          create: {
            warehouseId: warehouse.id,
            productId: product.id,
            quantity: item.quantity,
            minStock: product.minStock || 0,
          },
        });
        if (item.quantity !== 0) {
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              quantity: item.quantity,
              movementType: 'OFFICIAL_CATALOG_SET',
              unitCost: product.costPrice || 0,
              responsibleName: 'Codex',
              reference: 'Official catalog quantity loaded for production launch',
            },
          });
          summary.stockMovementRows += 1;
        }
        summary.stockSetRows += 1;
      }

      await tx.auditLog.create({
        data: {
          userName: 'Codex',
          userEmail: 'codex@soul2soul.local',
          userRole: 'system',
          action: 'APPLY_OFFICIAL_CATALOG_SYNC',
          entityType: 'products',
          method: 'SCRIPT',
          path: 'backend/scripts/sync-official-catalog.js',
          metadata: JSON.stringify(summary),
          statusCode: 200,
        },
      });

      return { success: true, warehouse, summary };
    },
    { maxWait: 30000, timeout: 240000 },
  );
}

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const prisma = new PrismaClient();
  try {
    const before = await analyze(prisma);
    if (dryRun) {
      console.log(JSON.stringify({ mode: 'dry-run', summary: before }, null, 2));
      return;
    }
    const result = await applySync(prisma);
    const after = await analyze(prisma);
    console.log(JSON.stringify({ mode: 'apply', before, result, after }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
