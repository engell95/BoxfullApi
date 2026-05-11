import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '../../common/dto/create-order.dto';
import { FilterOrdersDto } from '../../common/dto/filter-orders.dto';
import { WebhookUpdateDto } from '../../common/dto/webhook-update.dto';
import { JwtAuthGuard } from '../../common/guard/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ────────────────────────────────────────
  // POST /orders — Crear orden
  // ────────────────────────────────────────
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear nueva orden de envío' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Bad Request - Errores de validación (ej. orden COD sin expectedAmount)' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User Token inválido' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  create(
    @CurrentUser() user: { id: string; companyId?: string; role: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(user, dto);
  }

  // ────────────────────────────────────────
  // GET /orders — Listar órdenes con filtros
  // ────────────────────────────────────────
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Listar órdenes (filtradas por empresa si no es ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Listado de órdenes' })
  @ApiResponse({ status: 400, description: 'Bad Request - Parámetros de filtro inválidos' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User Token inválido' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  findAll(
    @CurrentUser() user: { id: string; companyId?: string; role: string },
    @Query() filters: FilterOrdersDto,
  ) {
    return this.ordersService.findAll(user, filters);
  }

  // ────────────────────────────────────────
  // GET /orders/export/csv — Exportar CSV
  // ────────────────────────────────────────
  @Get('export/csv')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Exportar órdenes como archivo CSV (opcionalmente por IDs)' })
  @ApiResponse({ status: 200, description: 'Archivo CSV generado' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User Token inválido' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async exportCsv(
    @CurrentUser() user: { id: string; companyId?: string; role: string },
    @Query('ids') ids: string,
    @Res() res: Response,
  ) {
    const idArray = ids ? ids.split(',').map((id) => id.trim()) : [];
    const csv = await this.ordersService.exportCsv(user, idArray);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ordenes-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  // ────────────────────────────────────────
  // GET /orders/:id — Obtener orden por ID
  // ────────────────────────────────────────
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener detalle de una orden por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de la orden' })
  @ApiResponse({ status: 401, description: 'Unauthorized - User Token inválido' })
  @ApiResponse({ status: 404, description: 'Not Found - Orden no encontrada' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  findOne(
    @CurrentUser() user: { id: string; companyId?: string; role: string },
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(user, id);
  }

  // ────────────────────────────────────────
  // POST /orders/webhook/:id — Webhook externo
  // (sin autenticación JWT, usa secret opcional)
  // ────────────────────────────────────────
  @Public()
  @Post('webhook/:id')
  @ApiOperation({
    summary:
      'Webhook: actualizar estado de entrega y monto real recolectado (COD)',
  })
  @ApiResponse({ status: 200, description: 'Orden actualizada' })
  @ApiResponse({ status: 400, description: 'Bad Request - Errores de validación' })
  @ApiResponse({ status: 404, description: 'Not Found - Orden no encontrada' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  webhookUpdate(
    @Param('id') id: string,
    @Body() dto: WebhookUpdateDto,
  ) {
    return this.ordersService.webhookUpdate(id, dto);
  }
}
