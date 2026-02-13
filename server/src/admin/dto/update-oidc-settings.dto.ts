import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateOidcSettingsDto {
  @IsOptional()
  @IsBoolean()
  oidcEnabled?: boolean;

  @IsOptional()
  @IsString()
  providerName?: string;

  @IsOptional()
  @IsString()
  issuerUrl?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsBoolean()
  accountLinking?: boolean;

  @IsOptional()
  @IsString()
  adminGroup?: string;

  @IsOptional()
  @IsBoolean()
  disablePasswordAuth?: boolean;

  @IsOptional()
  @IsBoolean()
  autoRedirect?: boolean;
}
