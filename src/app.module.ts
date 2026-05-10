import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ShippingCostsModule } from './modules/shipping-costs/shipping-costs.module';
import { SettlementModule } from './modules/settlement/settlement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OrdersModule,
    ShippingCostsModule,
    SettlementModule,
  ],
})
export class AppModule {}
