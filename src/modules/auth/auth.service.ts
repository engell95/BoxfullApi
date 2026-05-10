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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

    const token = this.generateToken(user);

    return {
      user: { id: user.id, email: user.email, role: user.role, company: user.company },
      access_token: token,
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

    const token = this.generateToken(user);

    return {
      user: { id: user.id, email: user.email, role: user.role, company: user.company },
      access_token: token,
    };
  }

  private generateToken(user: any): string {
    return this.jwtService.sign({ 
      sub: user.id, 
      email: user.email,
      companyId: user.companyId,
      role: user.role 
    });
  }
}
