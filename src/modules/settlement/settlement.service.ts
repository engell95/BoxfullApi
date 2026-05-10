import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus } from '@prisma/client';

const COD_COMMISSION_RATE = 0.0001; // 0.01%
const COD_COMMISSION_MAX = 25;      // Tope máximo USD

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
  async calculate(userId: string): Promise<SettlementResult> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const breakdown: OrderSettlement[] = orders.map((order) => {
      // Solo contar monto recolectado si la orden fue entregada
      const isDelivered = order.status === OrderStatus.DELIVERED;

      // Monto recolectado real (puede diferir del esperado)
      const collected =
        isDelivered && order.isCOD
          ? (order.collectedAmount ?? order.expectedAmount ?? 0)
          : 0;

      // Comisión COD: 0.01% del monto recolectado, tope $25
      const commission =
        isDelivered && order.isCOD && collected > 0
          ? Math.min(collected * COD_COMMISSION_RATE, COD_COMMISSION_MAX)
          : 0;

      // Liquidación por orden
      // COD:    collected - shippingCost - commission
      // No COD: 0 - shippingCost (negativo)
      const settlement = collected - order.shippingCost - commission;

      return {
        orderId: order.id,
        recipientName: order.recipientName,
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
