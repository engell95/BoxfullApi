import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let title = 'Error';
    let detail = '';

    if (typeof exceptionResponse === 'string') {
      detail = exceptionResponse;
      title = exception instanceof HttpException ? exception.name : 'Error';
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const errObj = exceptionResponse as any;
      title = errObj.error || exception.constructor.name || 'Error';
      
      // Si el ValidationPipe devuelve un array de errores
      if (Array.isArray(errObj.message)) {
        detail = errObj.message.join('. ');
      } else {
        detail = errObj.message || 'Error inesperado';
      }
    }

    const problemDetails = {
      type: `https://httpstatuses.com/${status}`,
      title,
      status,
      detail,
      instance: request.url,
      timestamp: new Date().toISOString(),
    };

    // Registrar en el log de aplicación
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${title}: ${detail}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${title}: ${detail}`);
    }

    response.setHeader('Content-Type', 'application/problem+json');
    response.status(status).json(problemDetails);
  }
}
