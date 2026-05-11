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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear nueva orden de envío' })
  @ApiResponse({ status: 201, description: 'Orden creada exitosamente' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Listar órdenes (filtradas por empresa si no es ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Listado de órdenes' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Exportar órdenes como archivo CSV' })
  async exportCsv(
    @CurrentUser() user: { id: string; companyId?: string; role: string },
    @Res() res: Response,
  ) {
    const csv = await this.ordersService.exportCsv(user);

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener detalle de una orden por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de la orden' })
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
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
  @ApiResponse({ status: 404, description: 'Orden no encontrada' })
  webhookUpdate(
    @Param('id') id: string,
    @Body() dto: WebhookUpdateDto,
  ) {
    return this.ordersService.webhookUpdate(id, dto);
  }
}
