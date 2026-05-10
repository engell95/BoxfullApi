import { Module } from '@nestjs/common';
import { ShippingCostsService } from './shipping-costs.service';

@Module({
  providers: [ShippingCostsService],
  exports: [ShippingCostsService],
})
export class ShippingCostsModule {}
