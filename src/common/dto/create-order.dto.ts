import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PackageDto {
  @ApiProperty({ example: 'Ropa' })
  @IsString()
  content: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1.5, description: 'Peso en kg' })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiProperty({ example: 30, description: 'Ancho en cm' })
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty({ example: 20, description: 'Alto en cm' })
  @IsNumber()
  @Min(0)
  height: number;

  @ApiProperty({ example: 40, description: 'Largo en cm' })
  @IsNumber()
  @Min(0)
  length: number;
}

export class CreateOrderDto {
  // Destinatario
  @ApiProperty({ example: 'María García' })
  @IsString()
  recipientName: string;

  @ApiProperty({ example: 'maria@example.com' })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({ example: '+503 7000 0000' })
  @IsString()
  recipientPhone: string;

  @ApiProperty({ example: 'Calle Principal #123' })
  @IsString()
  recipientAddress: string;

  @ApiProperty({ example: 'San Salvador' })
  @IsString()
  recipientCity: string;

  @ApiProperty({ example: 'San Salvador' })
  @IsString()
  recipientDepartment: string;

  // Detalles de entrega
  @ApiProperty({ example: '2024-12-25T10:00:00.000Z' })
  @IsDateString()
  deliveryDate: string;

  @ApiPropertyOptional({ example: 'Dejar con el vecino si no hay nadie' })
  @IsOptional()
  @IsString()
  instructions?: string;

  // Paquetes
  @ApiProperty({ type: [PackageDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages: PackageDto[];

  // COD
  @ApiPropertyOptional({
    example: true,
    description: 'Indica si la orden es Cash On Delivery',
  })
  @IsOptional()
  @IsBoolean()
  isCOD?: boolean;

  @ApiPropertyOptional({
    example: 25.0,
    description: 'Monto esperado a cobrar al destinatario (solo si isCOD=true)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedAmount?: number;
}
