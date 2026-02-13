import { IsNotEmpty, IsString } from 'class-validator';

export class OidcExchangeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
