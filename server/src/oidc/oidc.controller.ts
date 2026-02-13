import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { OidcService } from './oidc.service';
import { SettingsService } from '../settings/settings.service';
import { OidcExchangeDto } from './dto/oidc-exchange.dto';

@Controller('api/auth/oidc')
export class OidcController {
  constructor(
    private readonly oidcService: OidcService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Public config endpoint -- tells the frontend whether OIDC is enabled.
   */
  @Get('config')
  async getConfig() {
    const [oidcEnabled, providerName, passwordAuthDisabled, autoRedirect] =
      await Promise.all([
        this.settingsService.getOidcEnabled(),
        this.settingsService.getOidcProviderName(),
        this.settingsService.getPasswordAuthDisabled(),
        this.settingsService.getOidcAutoRedirect(),
      ]);

    return {
      oidcEnabled,
      providerName,
      passwordAuthDisabled,
      autoRedirect,
    };
  }

  /**
   * Redirect the user to the OIDC provider's authorization endpoint.
   */
  @Get('authorize')
  async authorize(@Req() req: any, @Res() res: any) {
    const enabled = await this.settingsService.getOidcEnabled();
    if (!enabled) {
      throw new BadRequestException('OIDC authentication is not enabled');
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const callbackUrl = `${protocol}://${host}/api/auth/oidc/callback`;

    const authorizationUrl =
      await this.oidcService.generateAuthorizationUrl(callbackUrl);
    res.redirect(authorizationUrl);
  }

  /**
   * Handle the IdP redirect after authentication.
   */
  @Get('callback')
  async callback(
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    if (error) {
      const message = errorDescription || error;
      res.redirect(`/login?error=${encodeURIComponent(message)}`);
      return;
    }

    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      res.redirect('/login?error=Missing+code+or+state');
      return;
    }

    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const callbackUrl = `${protocol}://${host}/api/auth/oidc/callback`;

      // Pass the full query params so openid-client can validate iss, etc.
      const exchangeCode = await this.oidcService.handleCallback(
        req.query,
        callbackUrl,
      );

      // Redirect to frontend with the one-time exchange code
      res.redirect(`/auth/oidc/callback?code=${exchangeCode}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Authentication failed';
      res.redirect(`/login?error=${encodeURIComponent(message)}`);
    }
  }

  /**
   * Frontend exchanges the one-time code for JWT tokens.
   */
  @Post('exchange')
  async exchange(@Body() dto: OidcExchangeDto) {
    return this.oidcService.exchangeCode(dto.code);
  }
}
