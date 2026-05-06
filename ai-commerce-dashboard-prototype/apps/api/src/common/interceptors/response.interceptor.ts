import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { map, Observable } from 'rxjs';
import type { ApiResponse } from '@ai-commerce-ops/shared';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const requestId = request.headers['x-request-id'] ?? randomUUID();

    return next.handle().pipe(
      map((data) => ({
        ok: true,
        data,
        error: null,
        requestId
      }))
    );
  }
}

