import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ShippingCostsService } from '../shipping-costs/shipping-costs.service';
import { CreateOrderDto } from '../../common/dto/create-order.dto';
import { FilterOrdersDto } from '../../common/dto/filter-orders.dto';
import { WebhookUpdateDto } from '../../common/dto/webhook-update.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shippingCosts: ShippingCostsService,
  ) {}

  // ────────────────────────────────────────────
  // CREATE ORDER
  // ────────────────────────────────────────────
  async create(userId: string, dto: CreateOrderDto) {
    const deliveryDate = new Date(dto.deliveryDate);

    // Obtener costo de envío basado en el día de entrega
    const shippingCost = await this.shippingCosts.getCostForDate(deliveryDate);

    if (dto.isCOD && !dto.expectedAmount) {
      throw new BadRequestException(
        'Las órdenes COD deben incluir un monto esperado (expectedAmount)',
      );
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        recipientName: dto.recipientName,
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        recipientAddress: dto.recipientAddress,
        recipientCity: dto.recipientCity,
        recipientDepartment: dto.recipientDepartment,
        deliveryDate,
        instructions: dto.instructions,
        packages: dto.packages,
        isCOD: dto.isCOD ?? false,
        expectedAmount: dto.expectedAmount ?? null,
        shippingCost,
        status: OrderStatus.PENDING,
      },
    });

    return order;
  }

  // ────────────────────────────────────────────
  // FIND ALL (con filtros y paginación)
  // ────────────────────────────────────────────
  async findAll(userId: string, filters: FilterOrdersDto) {
    const { status, startDate, endDate, search, page = 1, limit = 20 } = filters;

    const where: any = { userId };

    if (status) {
      where.status = status as OrderStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { recipientEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' }, // descendente como pide el requerimiento
        skip,
        take: limit,
      }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ────────────────────────────────────────────
  // FIND ONE
  // ────────────────────────────────────────────
  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    return order;
  }

  // ────────────────────────────────────────────
  // WEBHOOK: actualizar estado y monto real
  // ────────────────────────────────────────────
  async webhookUpdate(orderId: string, dto: WebhookUpdateDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status as OrderStatus,
        // Guardar monto real recolectado si viene en el webhook
        ...(dto.collectedAmount !== undefined && {
          collectedAmount: dto.collectedAmount,
        }),
      },
    });

    return updatedOrder;
  }

  // ────────────────────────────────────────────
  // EXPORT CSV
  // ────────────────────────────────────────────
  async exportCsv(userId: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID',
      'Destinatario',
      'Email',
      'Teléfono',
      'Dirección',
      'Ciudad',
      'Departamento',
      'Fecha Entrega',
      'Estado',
      'COD',
      'Monto Esperado',
      'Monto Recolectado',
      'Costo Envío',
      'Fecha Creación',
    ].join(',');

    const rows = orders.map((o) =>
      [
        o.id,
        `"${o.recipientName}"`,
        o.recipientEmail,
        o.recipientPhone,
        `"${o.recipientAddress}"`,
        o.recipientCity,
        o.recipientDepartment,
        new Date(o.deliveryDate).toLocaleDateString('es-SV'),
        o.status,
        o.isCOD ? 'Sí' : 'No',
        o.expectedAmount ?? '',
        o.collectedAmount ?? '',
        o.shippingCost,
        new Date(o.createdAt).toLocaleDateString('es-SV'),
      ].join(','),
    );

    return [headers, ...rows].join('\n');
  }
}
