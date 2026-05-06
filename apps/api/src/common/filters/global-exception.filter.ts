import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ErrorCodes, type ApiResponse } from '@ai-commerce-ops/shared';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>();
    const request = ctx.getRequest<{ headers: Record<string, string | undefined> }>();
    const requestId = request.headers['x-request-id'] ?? randomUUID();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof Error ? exception.message : 'Internal server error';
    const body: ApiResponse<null> = {
      ok: false,
      data: null,
      error: {
        code: status === HttpStatus.INTERNAL_SERVER_ERROR ? ErrorCodes.INTERNAL_ERROR : ErrorCodes.VALIDATION_ERROR,
        message
      },
      requestId
    };

    response.status(status).json(body);
  }
}

