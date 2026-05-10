import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrae el token JWT del encabezado de Autorización (Bearer Token)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Rechaza peticiones si el token ha expirado
      ignoreExpiration: false,
      // La misma clave secreta que se usó para firmar el token en el AuthModule
      secretOrKey: process.env.JWT_SECRET || 'secretKey', 
    });
  }

  /**
   * Este método se ejecuta automáticamente si la firma del token es válida.
   * El parámetro "payload" contiene la información decodificada del JWT.
   */
  async validate(payload: any) {
    // Aquí puedes buscar el usuario en la base de datos (Prisma) usando payload.sub o payload.email
    // para verificar que el usuario todavía existe y no ha sido desactivado.
    
    return { 
      id: payload.sub, 
      email: payload.email, 
      companyId: payload.companyId, 
      role: payload.role 
    };
  }
}
