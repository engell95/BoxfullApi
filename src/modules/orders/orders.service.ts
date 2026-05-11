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
  async create(user: { id: string; companyId?: string; role: string }, dto: CreateOrderDto) {
    const deliveryDate = new Date(dto.deliveryDate);

    // Obtener costo de envío basado en el día de entrega
    const shippingCost = await this.shippingCosts.getCostForDate(deliveryDate);

    if (dto.isCOD && !dto.expectedAmount) {
      throw new BadRequestException(
        'Las órdenes COD deben incluir un monto esperado (expectedAmount)',
      );
    }

    if (!user.companyId && user.role !== 'ADMIN') {
      throw new BadRequestException('El usuario no pertenece a ninguna empresa');
    }

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        // Si un ADMIN crea una orden y no pasa companyId (por ahora simplificado a usar un companyId por defecto o requerirlo en DTO en el futuro)
        // Por seguridad, usaremos el companyId del DTO si es admin, de lo contrario el del token. Pero como DTO no lo tiene, usaremos user.companyId!
        // Asumiendo que el ADMIN debe de tener forma de asignar empresa, pero por simplicidad:
        companyId: user.companyId ?? user.id, // Hack temporal por si ADMIN crea
        pickupAddress: dto.pickupAddress,
        recipientFirstName: dto.recipientFirstName,
        recipientLastName: dto.recipientLastName,
        recipientEmail: dto.recipientEmail,
        recipientPhone: dto.recipientPhone,
        recipientAddress: dto.recipientAddress,
        recipientMunicipality: dto.recipientMunicipality,
        recipientDepartment: dto.recipientDepartment,
        referencePoint: dto.referencePoint,
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
  async findAll(user: { id: string; companyId?: string; role: string }, filters: FilterOrdersDto) {
    const { status, startDate, endDate, search, page = 1, limit = 20 } = filters;

    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.companyId = user.companyId;
    }

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
        { recipientFirstName: { contains: search, mode: 'insensitive' } },
        { recipientLastName: { contains: search, mode: 'insensitive' } },
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
  async findOne(user: { id: string; companyId?: string; role: string }, id: string) {
    const where: any = { id };
    if (user.role !== 'ADMIN') {
      where.companyId = user.companyId;
    }

    const order = await this.prisma.order.findFirst({
      where,
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

    // Validación: Si es COD y se marca como ENTREGADO, exigir el monto recolectado
    if (
      order.isCOD &&
      dto.status === OrderStatus.DELIVERED &&
      dto.collectedAmount === undefined
    ) {
      throw new BadRequestException(
        'El monto recolectado (collectedAmount) es obligatorio para órdenes COD cuando el estado cambia a DELIVERED',
      );
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
  async exportCsv(
    user: { id: string; companyId?: string; role: string },
    ids?: string[]
  ): Promise<string> {
    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.companyId = user.companyId;
    }

    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'ID',
      'Dirección Recolección',
      'Nombres Destinatario',
      'Apellidos Destinatario',
      'Email',
      'Teléfono',
      'Dirección',
      'Municipio',
      'Departamento',
      'Punto de Referencia',
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
        `"${o.pickupAddress}"`,
        `"${o.recipientFirstName}"`,
        `"${o.recipientLastName}"`,
        o.recipientEmail,
        o.recipientPhone,
        `"${o.recipientAddress}"`,
        o.recipientMunicipality,
        o.recipientDepartment,
        `"${o.referencePoint ?? ''}"`,
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
