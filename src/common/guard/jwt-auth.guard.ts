import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_APP_TOKEN_KEY } from '../decorators/allow-app-token.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }

    // Si el usuario es tipo APP (App Token), validar que la ruta lo permita
    if (user.role === 'APP') {
      const isAppTokenAllowed = this.reflector.getAllAndOverride<boolean>(ALLOW_APP_TOKEN_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (!isAppTokenAllowed) {
        throw new UnauthorizedException('El App Token solo puede usarse para iniciar sesión o registrarse. Requiere Token de Usuario.');
      }
    }

    return user;
  }
}
