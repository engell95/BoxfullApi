import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from '../../common/dto/register.dto';
import { LoginDto } from '../../common/dto/login.dto';
import { AppLoginDto } from '../../common/dto/app-login.dto';
import { RefreshTokenDto } from '../../common/dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('app-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a nivel de aplicación (retorna token base)' })
  @ApiResponse({ status: 200, description: 'Token de aplicación generado exitosamente' })
  appLogin(@Body() dto: AppLoginDto) {
    return this.authService.appLogin(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar tokens usando un refresh token' })
  @ApiResponse({ status: 200, description: 'Nuevos tokens generados' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('register')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Registrar nuevo usuario (comercio)' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
