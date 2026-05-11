import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AppLoginDto {
  @ApiProperty({ example: 'boxful-frontend' })
  @IsString()
  appId: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  appSecret: string;
}
