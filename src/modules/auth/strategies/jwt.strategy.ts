import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Extrae el token JWT del encabezado de Autorización (Bearer Token)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rechaza peticiones si el token ha expirado
      ignoreExpiration: false,
      // La misma clave secreta que se usó para firmar el token en el AuthModule
      secretOrKey: configService.get<string>('JWT_SECRET'), 
    });
  }

  async validate(payload: any) {
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('No se puede usar un refresh token para consumir APIs');
    }

    if (payload.sub === 'APP') {
      return { id: 'APP', role: 'APP' };
    }

    return { 
      id: payload.sub, 
      email: payload.email, 
      companyId: payload.companyId, 
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName
    };
  }
}
