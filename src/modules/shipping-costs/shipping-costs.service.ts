import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DayOfWeek } from '@prisma/client';

// Mapa JS día (0=Dom, 1=Lun...) → enum Prisma
const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

@Injectable()
export class ShippingCostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el costo de envío configurado para el día de la semana
   * correspondiente a la fecha de entrega.
   */
  async getCostForDate(date: Date): Promise<number> {
    const dayEnum = JS_DAY_TO_ENUM[date.getDay()];

    const shippingCost = await this.prisma.shippingCost.findUnique({
      where: { dayOfWeek: dayEnum },
    });

    if (!shippingCost) {
      throw new NotFoundException(
        `No se encontró configuración de costo para el día ${dayEnum}.`,
      );
    }

    return shippingCost.cost;
  }

  /** Retorna todos los costos configurados por día */
  async findAll() {
    return this.prisma.shippingCost.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }
}
