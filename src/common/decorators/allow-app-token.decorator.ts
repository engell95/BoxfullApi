import { SetMetadata } from '@nestjs/common';

export const ALLOW_APP_TOKEN_KEY = 'allowAppToken';
export const AllowAppToken = () => SetMetadata(ALLOW_APP_TOKEN_KEY, true);
