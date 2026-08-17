import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

// Every controller returns its raw payload (or { data, meta } for paginated
// endpoints); this interceptor normalizes it into one envelope so frontend
// clients never need per-endpoint response parsing logic.
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        const isPaginated = payload && typeof payload === 'object' && 'data' in payload && 'meta' in payload;
        return {
          success: true as const,
          data: isPaginated ? payload.data : payload,
          ...(isPaginated ? { meta: payload.meta } : {}),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
