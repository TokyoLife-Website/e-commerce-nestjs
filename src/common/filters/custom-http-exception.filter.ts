import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import e, { Request, Response } from 'express';

@Catch()
export class CustomHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: exception.message || 'Internal server error' };

    const errorDetails =
      typeof errorResponse === 'object'
        ? errorResponse
        : { message: errorResponse };

    response.status(status).json({
      status: false,
      path: request.url,
      statusCode: status,
      message: exception.message,
      errors: (errorDetails as any).errors || null,
      timestamp: new Date().toISOString(),
    });
  }
}
