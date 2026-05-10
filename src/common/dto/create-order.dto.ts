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
  @ApiProperty({ example: 'iPhone 14 pro Max' })
  @IsString()
  content: string;

  @ApiProperty({ example: 3, description: 'Peso en libras' })
  @IsNumber()
  @Min(0)
  weightInLbs: number;

  @ApiProperty({ example: 15, description: 'Ancho en cm' })
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty({ example: 15, description: 'Alto en cm' })
  @IsNumber()
  @Min(0)
  height: number;

  @ApiProperty({ example: 15, description: 'Largo en cm' })
  @IsNumber()
  @Min(0)
  length: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Colonia Las Magnolias, calle militar 1, San Salvador' })
  @IsString()
  pickupAddress: string;

  // Destinatario
  @ApiProperty({ example: 'Gabriela Reneé' })
  @IsString()
  recipientFirstName: string;

  @ApiProperty({ example: 'Días López' })
  @IsString()
  recipientLastName: string;

  @ApiProperty({ example: 'gabbydiaz@gmail.com' })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({ example: '+503 7777 7777' })
  @IsString()
  recipientPhone: string;

  @ApiProperty({ example: 'Final 49 Av. Sur y Bulevar Los Próceres...' })
  @IsString()
  recipientAddress: string;

  @ApiProperty({ example: 'San Salvador' })
  @IsString()
  recipientMunicipality: string;

  @ApiProperty({ example: 'San Salvador' })
  @IsString()
  recipientDepartment: string;

  @ApiPropertyOptional({ example: 'Cerca de redondel Arbol de la Paz' })
  @IsOptional()
  @IsString()
  referencePoint?: string;

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
