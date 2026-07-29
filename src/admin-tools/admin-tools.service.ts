import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { randomInt, randomUUID, createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

type ResetOptions = {
  clearSales?: boolean;
  clearPurchases?: boolean;
  clearStockHistory?: boolean;
  clearTransfers?: boolean;
  clearHrOperations?: boolean;
  clearCustomers?: boolean;
  clearAuditLogs?: boolean;
  zeroStock?: boolean;
};

const SECURITY_SCOPE = 'RESET_OPERATIONS';
const CODE_TTL_MINUTES = 10;

@Injectable()
export class AdminToolsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private hashCode(code: string, nonce: string) {
    return createHash('sha256')
      .update(`${code}:${nonce}:${process.env.JWT_SECRET || 'super-secret-key-v1'}`)
      .digest('hex');
  }

  private requireAdmin(user: any) {
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Only administrators can use critical tools.');
    }
  }

  async getResetPreview() {
    const [
      sales,
      saleItems,
      purchases,
      purchaseItems,
      stockMovements,
      transfers,
      transferItems,
      batches,
      customers,
      hrPayments,
      attendance,
      goals,
      auditLogs,
      productsWithStock,
      warehouseRowsWithStock,
    ] = await Promise.all([
      this.prisma.sale.count(),
      this.prisma.saleItem.count(),
      this.prisma.purchase.count(),
      this.prisma.purchaseItem.count(),
      this.prisma.stockMovement.count(),
      this.prisma.stockTransfer.count(),
      this.prisma.stockTransferItem.count(),
      this.prisma.inventoryBatch.count(),
      this.prisma.customer.count(),
      this.prisma.hrPayment.count(),
      this.prisma.attendanceRecord.count(),
      this.prisma.workGoal.count(),
      this.prisma.auditLog.count(),
      this.prisma.product.count({ where: { stock: { gt: 0 } } }),
      this.prisma.warehouseStock.count({ where: { quantity: { gt: 0 } } }),
    ]);

    return {
      sales,
      saleItems,
      purchases,
      purchaseItems,
      stockMovements,
      transfers,
      transferItems,
      batches,
      customers,
      hrPayments,
      attendance,
      goals,
      auditLogs,
      productsWithStock,
      warehouseRowsWithStock,
    };
  }

  async generateSecurityCode(user: any, data: { reason?: string; scope?: string }) {
    this.requireAdmin(user);
    const reason = String(data?.reason || '').trim();
    if (reason.length < 8) {
      throw new BadRequestException('A clear reason with at least 8 characters is required.');
    }

    const code = String(randomInt(100000, 999999));
    const nonce = randomUUID();
    const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
    const payload = {
      hash: this.hashCode(code, nonce),
      nonce,
      scope: data?.scope || SECURITY_SCOPE,
      expiresAt: expiresAt.toISOString(),
      usedAt: null,
      reason,
    };

    await this.prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        userName: user?.fullName || null,
        userEmail: user?.email || null,
        userRole: user?.role || null,
        action: 'SECURITY_CODE_ISSUED',
        entityType: 'admin-tools',
        entityId: payload.scope,
        method: 'POST',
        path: '/api/admin-tools/security-code',
        metadata: JSON.stringify(payload),
        statusCode: 201,
      },
    });

    return {
      success: true,
      code,
      scope: payload.scope,
      expiresAt,
      warning: 'This code is shown once, expires in 10 minutes, and can be used only one time.',
    };
  }

  private async verifySecurityCode(user: any, code: string, scope = SECURITY_SCOPE) {
    this.requireAdmin(user);
    const candidates = await this.prisma.auditLog.findMany({
      where: {
        action: 'SECURITY_CODE_ISSUED',
        entityType: 'admin-tools',
        entityId: scope,
        userId: user?.id || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    for (const candidate of candidates) {
      const metadata = candidate.metadata ? JSON.parse(candidate.metadata) : null;
      if (!metadata || metadata.usedAt) continue;
      if (new Date(metadata.expiresAt).getTime() < Date.now()) continue;
      if (metadata.hash !== this.hashCode(String(code || ''), metadata.nonce)) continue;

      await this.prisma.auditLog.update({
        where: { id: candidate.id },
        data: {
          metadata: JSON.stringify({
            ...metadata,
            usedAt: new Date().toISOString(),
          }),
        },
      });
      return;
    }

    throw new BadRequestException('Security code is invalid, expired, or already used.');
  }

  async executeReset(
    user: any,
    data: {
      code?: string;
      reason?: string;
      confirmText?: string;
      scope?: string;
      options?: ResetOptions;
    },
  ) {
    this.requireAdmin(user);
    const reason = String(data?.reason || '').trim();
    if (reason.length < 8) {
      throw new BadRequestException('A clear reset reason is required.');
    }
    if (data?.confirmText !== 'RESET SOUL2SOUL') {
      throw new BadRequestException('Confirmation text must be RESET SOUL2SOUL.');
    }

    const options = data?.options || {};
    if (!Object.values(options).some(Boolean)) {
      throw new BadRequestException('Select at least one reset option.');
    }
    if (options.clearCustomers && !options.clearSales && (await this.prisma.sale.count()) > 0) {
      throw new BadRequestException('Customers can be deleted only when sales are cleared too.');
    }

    await this.verifySecurityCode(user, String(data?.code || ''), data?.scope || SECURITY_SCOPE);
    const before = await this.getResetPreview();

    const summary = await this.prisma.$transaction(async (tx) => {
      const result: Record<string, number> = {};

      if (options.clearSales) {
        result.saleItemsDeleted = (await tx.saleItem.deleteMany()).count;
        result.salesDeleted = (await tx.sale.deleteMany()).count;
      }

      if (options.clearPurchases) {
        result.purchaseItemsDeleted = (await tx.purchaseItem.deleteMany()).count;
        result.purchasesDeleted = (await tx.purchase.deleteMany()).count;
      }

      if (options.clearTransfers) {
        result.transferItemsDeleted = (await tx.stockTransferItem.deleteMany()).count;
        result.transfersDeleted = (await tx.stockTransfer.deleteMany()).count;
      }

      if (options.clearStockHistory) {
        result.stockMovementsDeleted = (await tx.stockMovement.deleteMany()).count;
        result.inventoryBatchesDeleted = (await tx.inventoryBatch.deleteMany()).count;
      }

      if (options.clearHrOperations) {
        result.attendanceDeleted = (await tx.attendanceRecord.deleteMany()).count;
        result.goalsDeleted = (await tx.workGoal.deleteMany()).count;
        result.hrPaymentsDeleted = (await tx.hrPayment.deleteMany()).count;
      }

      if (options.clearCustomers) {
        result.customersDeleted = (await tx.customer.deleteMany()).count;
      } else if (options.clearSales) {
        await tx.customer.updateMany({
          data: { loyaltyPoints: 0, discountPercent: 0, loyaltyTier: 'Standard' },
        });
        result.customersLoyaltyReset = await tx.customer.count();
      }

      if (options.zeroStock) {
        await tx.warehouseStock.updateMany({ data: { quantity: 0 } });
        await tx.product.updateMany({ data: { stock: 0 } });
        result.stockRowsZeroed = await tx.warehouseStock.count();
        result.productsZeroed = await tx.product.count();
      }

      if (options.clearAuditLogs) {
        result.auditLogsDeleted = (await tx.auditLog.deleteMany({
          where: {
            action: {
              notIn: ['SECURITY_CODE_ISSUED', 'CRITICAL_RESET_EXECUTED'],
            },
          },
        })).count;
      }

      await tx.auditLog.create({
        data: {
          userId: user?.id || null,
          userName: user?.fullName || null,
          userEmail: user?.email || null,
          userRole: user?.role || null,
          action: 'CRITICAL_RESET_EXECUTED',
          entityType: 'admin-tools',
          entityId: data?.scope || SECURITY_SCOPE,
          method: 'POST',
          path: '/api/admin-tools/reset',
          metadata: JSON.stringify({ reason, options, before, result }),
          statusCode: 200,
        },
      });

      return result;
    }, { maxWait: 30000, timeout: 120000 });

    const after = await this.getResetPreview();
    void this.auditService.record({
      user,
      action: 'CRITICAL_RESET_SUMMARY',
      entityType: 'admin-tools',
      method: 'POST',
      path: '/api/admin-tools/reset',
      metadata: { reason, options, summary },
      statusCode: 200,
    });

    return { success: true, before, after, summary };
  }
}
