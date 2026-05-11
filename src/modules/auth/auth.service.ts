import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';

import { AppLoginDto } from '../../common/dto/app-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ────────────────────────────────────────────
  // APP LOGIN
  // ────────────────────────────────────────────
  async appLogin(dto: AppLoginDto) {
    const validAppId = process.env.APP_ID || 'boxful-frontend';
    const validSecret = process.env.APP_SECRET || 'secret123';

    if (dto.appId !== validAppId || dto.appSecret !== validSecret) {
      throw new UnauthorizedException('Credenciales de aplicación inválidas');
    }

    // Retorna un JWT de nivel aplicación
    const payload = { sub: 'APP' };
    return this.generateTokens(payload);
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        whatsapp: dto.whatsapp,
        email: dto.email,
        password: hashedPassword,
        role: 'COMPANY_OWNER',
        company: {
          create: {
            name: `Comercio de ${dto.firstName} ${dto.lastName}`,
          },
        },
      },
      include: { company: true },
    });

    const payload = { 
      sub: user.id, 
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    const tokens = this.generateTokens(payload);

    return {
      user: { id: user.id, email: user.email, role: user.role, company: user.company },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { company: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { 
      sub: user.id, 
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    const tokens = this.generateTokens(payload);

    return {
      user: { id: user.id, email: user.email, role: user.role, company: user.company },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token no es un refresh token');
      }

      delete payload.exp;
      delete payload.iat;
      delete payload.type;

      return this.generateTokens(payload);
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  private generateTokens(payload: any) {
    const access_token = this.jwtService.sign(
      { ...payload, type: 'access' },
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );
    const refresh_token = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    return { access_token, refresh_token };
  }
}
