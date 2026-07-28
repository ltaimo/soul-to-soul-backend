import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;

    if (
      !mutationMethods.includes(method) ||
      request.path?.startsWith('/api/auth/login')
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const entityType = this.inferEntityType(
          request.path || request.url || '',
        );
        const entityId =
          request.params?.id ||
          request.params?.productId ||
          request.params?.warehouseId ||
          null;
        void this.auditService.record({
          user: request.user,
          action: `${method} ${request.path || request.url}`,
          entityType,
          entityId: entityId ? String(entityId) : undefined,
          method,
          path: request.path || request.url,
          ipAddress: this.getIpAddress(request),
          userAgent: request.headers?.['user-agent'],
          machine:
            request.headers?.['sec-ch-ua-platform'] ||
            request.headers?.['x-client-machine'] ||
            null,
          metadata: {
            params: request.params || {},
            query: request.query || {},
            body: request.body || {},
          },
          statusCode: response.statusCode,
        });
      }),
    );
  }

  private inferEntityType(path: string) {
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'api') return parts[1] || 'api';
    return parts[0] || 'system';
  }

  private getIpAddress(request: any) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    if (forwardedFor) return String(forwardedFor).split(',')[0].trim();
    return request.ip || request.socket?.remoteAddress || null;
  }
}
