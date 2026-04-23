const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportBackup() {
  try {
    const products = await prisma.product.findMany();
    const settings = await prisma.systemSetting.findFirst();
    const users = await prisma.user.findMany({
      select: { fullName: true, email: true, role: true, status: true, createdAt: true }
    });

    const backupData = {
      timestamp: new Date().toISOString(),
      products,
      settings,
      users
    };
    
    fs.writeFileSync('v1_core_backup.json', JSON.stringify(backupData, null, 2));
    console.log('Successfully exported v1_core_backup.json');
  } catch (error) {
    console.error('Failed to export backup', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportBackup();
