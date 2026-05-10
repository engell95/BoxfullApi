import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

export enum WebhookStatus {
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  IN_TRANSIT = 'IN_TRANSIT',
}

export class WebhookUpdateDto {
  @ApiProperty({
    example: 'DELIVERED',
    enum: WebhookStatus,
    description: 'Nuevo estado de la orden',
  })
  @IsEnum(WebhookStatus)
  status: WebhookStatus;

  @ApiPropertyOptional({
    example: 15.0,
    description:
      'Monto real recolectado (puede diferir del expectedAmount). Solo aplica para órdenes COD.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  collectedAmount?: number;
}
