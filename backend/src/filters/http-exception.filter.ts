import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string) || message;
        if (Array.isArray(res.message)) {
          errors = res.message as string[];
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      // Database errors
      const dbError = exception as unknown as Record<string, unknown>;
      if (dbError.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'Duplicate entry — resource already exists';
      } else if (dbError.code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced resource does not exist';
      } else {
        this.logger.error(exception.message, exception.stack);
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      errors: errors.length > 0 ? errors : undefined,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}