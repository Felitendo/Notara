import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export type RegistrationMode = 'disabled' | 'enabled' | 'review';

export interface OidcSettingValue {
  value: string;
  isLocked: boolean;
}

export interface OidcSettings {
  oidcEnabled: OidcSettingValue;
  providerName: OidcSettingValue;
  issuerUrl: OidcSettingValue;
  clientId: OidcSettingValue;
  clientSecret: OidcSettingValue;
  accountLinking: OidcSettingValue;
  adminGroup: OidcSettingValue;
  disablePasswordAuth: OidcSettingValue;
}

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Get the current registration mode.
   * Priority: env var > DB setting > default "enabled"
   */
  async getRegistrationMode(): Promise<RegistrationMode> {
    // Check environment variable first
    const envMode = this.configService.get<string>('USER_SIGNUP');
    if (envMode && ['disabled', 'enabled', 'review'].includes(envMode)) {
      return envMode as RegistrationMode;
    }

    // Check database setting
    const setting = await this.prisma.settings.findUnique({
      where: { key: 'user_signup' },
    });

    if (setting) {
      return setting.value as RegistrationMode;
    }

    // Default to enabled
    return 'enabled';
  }

  /**
   * Check if registration mode is locked by environment variable
   */
  isRegistrationModeLocked(): boolean {
    const envMode = this.configService.get<string>('USER_SIGNUP');
    return !!envMode && ['disabled', 'enabled', 'review'].includes(envMode);
  }

  /**
   * Get registration settings including lock status and source
   */
  async getRegistrationSettings(): Promise<{
    mode: RegistrationMode;
    isLocked: boolean;
    source: 'env' | 'database' | 'default';
  }> {
    const envMode = this.configService.get<string>('USER_SIGNUP');
    const isLocked =
      !!envMode && ['disabled', 'enabled', 'review'].includes(envMode);

    if (isLocked) {
      return {
        mode: envMode as RegistrationMode,
        isLocked: true,
        source: 'env',
      };
    }

    const setting = await this.prisma.settings.findUnique({
      where: { key: 'user_signup' },
    });

    if (setting) {
      return {
        mode: setting.value as RegistrationMode,
        isLocked: false,
        source: 'database',
      };
    }

    return {
      mode: 'enabled',
      isLocked: false,
      source: 'default',
    };
  }

  /**
   * Set registration mode (only works if not locked by env)
   */
  async setRegistrationMode(mode: RegistrationMode): Promise<void> {
    if (this.isRegistrationModeLocked()) {
      throw new ForbiddenException(
        'Registration mode is locked by USER_SIGNUP environment variable',
      );
    }

    if (!['disabled', 'enabled', 'review'].includes(mode)) {
      throw new Error('Invalid registration mode');
    }

    // Upsert the setting
    await this.prisma.settings.upsert({
      where: { key: 'user_signup' },
      update: { value: mode },
      create: {
        key: 'user_signup',
        value: mode,
      },
    });
  }

  // --- OIDC Settings ---

  /**
   * Generic helper: env > DB > default, with lock status
   */
  private async getSettingWithPriority(
    envKey: string,
    dbKey: string,
    defaultValue: string,
  ): Promise<OidcSettingValue> {
    const envVal = this.configService.get<string>(envKey);
    if (envVal !== undefined && envVal !== '') {
      return { value: envVal, isLocked: true };
    }

    const setting = await this.prisma.settings.findUnique({
      where: { key: dbKey },
    });

    if (setting) {
      return { value: setting.value, isLocked: false };
    }

    return { value: defaultValue, isLocked: false };
  }

  private isSettingLocked(envKey: string): boolean {
    const envVal = this.configService.get<string>(envKey);
    return envVal !== undefined && envVal !== '';
  }

  async getOidcEnabled(): Promise<boolean> {
    const setting = await this.getSettingWithPriority(
      'OIDC_ENABLED',
      'oidc_enabled',
      'false',
    );
    return setting.value === 'true';
  }

  async getPasswordAuthDisabled(): Promise<boolean> {
    const setting = await this.getSettingWithPriority(
      'DISABLE_PASSWORD_AUTH',
      'disable_password_auth',
      'false',
    );
    return setting.value === 'true';
  }

  async getOidcProviderName(): Promise<string> {
    const setting = await this.getSettingWithPriority(
      'OIDC_PROVIDER_NAME',
      'oidc_provider_name',
      'OIDC',
    );
    return setting.value;
  }

  async getOidcIssuerUrl(): Promise<string> {
    const setting = await this.getSettingWithPriority(
      'OIDC_ISSUER_URL',
      'oidc_issuer_url',
      '',
    );
    return setting.value;
  }

  async getOidcClientId(): Promise<string> {
    const setting = await this.getSettingWithPriority(
      'OIDC_CLIENT_ID',
      'oidc_client_id',
      '',
    );
    return setting.value;
  }

  async getOidcClientSecret(): Promise<string> {
    const setting = await this.getSettingWithPriority(
      'OIDC_CLIENT_SECRET',
      'oidc_client_secret',
      '',
    );
    return setting.value;
  }

  async getOidcAccountLinking(): Promise<boolean> {
    const setting = await this.getSettingWithPriority(
      'OIDC_ACCOUNT_LINKING',
      'oidc_account_linking',
      'false',
    );
    return setting.value === 'true';
  }

  async getOidcAdminGroup(): Promise<string> {
    const setting = await this.getSettingWithPriority(
      'OIDC_ADMIN_GROUP',
      'oidc_admin_group',
      '',
    );
    return setting.value;
  }

  async getOidcSettings(): Promise<OidcSettings> {
    const [
      oidcEnabled,
      providerName,
      issuerUrl,
      clientId,
      clientSecret,
      accountLinking,
      adminGroup,
      disablePasswordAuth,
    ] = await Promise.all([
      this.getSettingWithPriority('OIDC_ENABLED', 'oidc_enabled', 'false'),
      this.getSettingWithPriority(
        'OIDC_PROVIDER_NAME',
        'oidc_provider_name',
        'OIDC',
      ),
      this.getSettingWithPriority('OIDC_ISSUER_URL', 'oidc_issuer_url', ''),
      this.getSettingWithPriority('OIDC_CLIENT_ID', 'oidc_client_id', ''),
      this.getSettingWithPriority(
        'OIDC_CLIENT_SECRET',
        'oidc_client_secret',
        '',
      ),
      this.getSettingWithPriority(
        'OIDC_ACCOUNT_LINKING',
        'oidc_account_linking',
        'false',
      ),
      this.getSettingWithPriority(
        'OIDC_ADMIN_GROUP',
        'oidc_admin_group',
        '',
      ),
      this.getSettingWithPriority(
        'DISABLE_PASSWORD_AUTH',
        'disable_password_auth',
        'false',
      ),
    ]);

    // Never expose the actual client secret value — only whether it's set
    return {
      oidcEnabled,
      providerName,
      issuerUrl,
      clientId,
      clientSecret: {
        value: clientSecret.value ? '••••••••' : '',
        isLocked: clientSecret.isLocked,
      },
      accountLinking,
      adminGroup,
      disablePasswordAuth,
    };
  }

  async setOidcSetting(key: string, value: string): Promise<void> {
    const envKeyMap: Record<string, string> = {
      oidc_enabled: 'OIDC_ENABLED',
      oidc_provider_name: 'OIDC_PROVIDER_NAME',
      oidc_issuer_url: 'OIDC_ISSUER_URL',
      oidc_client_id: 'OIDC_CLIENT_ID',
      oidc_client_secret: 'OIDC_CLIENT_SECRET',
      oidc_account_linking: 'OIDC_ACCOUNT_LINKING',
      oidc_admin_group: 'OIDC_ADMIN_GROUP',
      disable_password_auth: 'DISABLE_PASSWORD_AUTH',
    };

    const envKey = envKeyMap[key];
    if (!envKey) {
      throw new Error(`Unknown OIDC setting: ${key}`);
    }

    if (this.isSettingLocked(envKey)) {
      throw new ForbiddenException(
        `Setting "${key}" is locked by ${envKey} environment variable`,
      );
    }

    await this.prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}
