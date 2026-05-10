import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, ParameterDataType } from '@prisma/client';

export interface SettlementResult {
  totalOrders: number;
  codOrders: number;
  nonCodOrders: number;
  totalCollected: number;
  totalShippingCosts: number;
  totalCommissions: number;
  netSettlement: number;
  breakdown: OrderSettlement[];
}

export interface OrderSettlement {
  orderId: string;
  recipientName: string;
  createdAt: Date;
  isCOD: boolean;
  expectedAmount: number | null;
  collectedAmount: number | null;
  shippingCost: number;
  commission: number;
  settlement: number;
}

@Injectable()
export class SettlementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calcula la liquidación para el comercio (usuario autenticado).
   * Solo se consideran órdenes DELIVERED para los montos recolectados.
   * Las órdenes PENDING/IN_TRANSIT ya incluyen el costo de envío como egreso.
   */
  async calculate(user: { id: string; companyId?: string; role: string }): Promise<SettlementResult> {
    const where: any = {};
    if (user.role !== 'ADMIN') {
      where.companyId = user.companyId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Obtener parámetros dinámicos de configuración
    const parameters = await this.prisma.parameter.findMany({
      where: {
        key: { in: ['COD_COMMISSION_RATE', 'COD_COMMISSION_MAX'] }
      }
    });

    let codCommissionRate = 0.0001; // Default
    let codCommissionMax = 25;      // Default

    for (const param of parameters) {
      if (param.key === 'COD_COMMISSION_RATE' && param.dataType === ParameterDataType.NUMBER) {
        codCommissionRate = parseFloat(param.value) || 0.0001;
      }
      if (param.key === 'COD_COMMISSION_MAX' && param.dataType === ParameterDataType.NUMBER) {
        codCommissionMax = parseFloat(param.value) || 25;
      }
    }

    const breakdown: OrderSettlement[] = orders.map((order) => {
      // Solo contar monto recolectado si la orden fue entregada
      const isDelivered = order.status === OrderStatus.DELIVERED;

      // Monto recolectado real (puede diferir del esperado)
      const collected =
        isDelivered && order.isCOD
          ? (order.collectedAmount ?? order.expectedAmount ?? 0)
          : 0;

      // Comisión COD: calculada dinámicamente
      const commission =
        isDelivered && order.isCOD && collected > 0
          ? Math.min(collected * codCommissionRate, codCommissionMax)
          : 0;

      // Liquidación por orden
      // COD:    collected - shippingCost - commission
      // No COD: 0 - shippingCost (negativo)
      const settlement = collected - order.shippingCost - commission;

      return {
        orderId: order.id,
        recipientName: `${order.recipientFirstName} ${order.recipientLastName}`,
        createdAt: order.createdAt,
        isCOD: order.isCOD,
        expectedAmount: order.expectedAmount,
        collectedAmount: order.collectedAmount,
        shippingCost: order.shippingCost,
        commission,
        settlement,
      };
    });

    const totalCollected = breakdown.reduce(
      (sum, o) => sum + (o.collectedAmount ?? 0),
      0,
    );
    const totalShippingCosts = breakdown.reduce(
      (sum, o) => sum + o.shippingCost,
      0,
    );
    const totalCommissions = breakdown.reduce(
      (sum, o) => sum + o.commission,
      0,
    );
    const netSettlement = breakdown.reduce((sum, o) => sum + o.settlement, 0);

    return {
      totalOrders: orders.length,
      codOrders: orders.filter((o) => o.isCOD).length,
      nonCodOrders: orders.filter((o) => !o.isCOD).length,
      totalCollected,
      totalShippingCosts,
      totalCommissions,
      netSettlement,
      breakdown,
    };
  }
}
