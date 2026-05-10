import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Settlement (Punto Extra)')
@Controller('settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Calcular liquidación del comercio',
    description: `
Calcula el monto neto a liquidar al comercio aplicando las reglas de negocio:

- **Orden COD (entregada):** Monto Recolectado - Costo de Envío - Comisión (0.01%, tope $25)
- **Orden Sin Cobro:** -(Costo de Envío) — valor negativo
- El monto neto total puede ser negativo si predominan órdenes sin cobro
    `,
  })
  @ApiResponse({ status: 200, description: 'Resumen de liquidación' })
  calculate(@CurrentUser() user: { id: string }) {
    return this.settlementService.calculate(user.id);
  }
}
