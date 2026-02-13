import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuthService } from '../auth/auth.service';
import { Issuer, Client, generators } from 'openid-client';
import * as crypto from 'crypto';
import { UserStatus } from '../generated/prisma/enums';

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private cachedClient: Client | null = null;
  private cachedIssuerUrl: string | null = null;

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private authService: AuthService,
  ) {}

  /**
   * Discover the OIDC issuer and build a client.
   * Caches the client until the issuer URL changes.
   */
  async getClient(): Promise<Client> {
    const issuerUrl = await this.settingsService.getOidcIssuerUrl();
    const clientId = await this.settingsService.getOidcClientId();
    const clientSecret = await this.settingsService.getOidcClientSecret();

    if (!issuerUrl || !clientId) {
      throw new BadRequestException(
        'OIDC is not configured. Set issuer URL and client ID.',
      );
    }

    // Return cached client if issuer URL hasn't changed
    if (this.cachedClient && this.cachedIssuerUrl === issuerUrl) {
      return this.cachedClient;
    }

    try {
      const issuer = await Issuer.discover(issuerUrl);
      const clientMetadata: any = {
        client_id: clientId,
        response_types: ['code'],
      };

      if (clientSecret) {
        clientMetadata.client_secret = clientSecret;
        clientMetadata.token_endpoint_auth_method = 'client_secret_basic';
      } else {
        clientMetadata.token_endpoint_auth_method = 'none';
      }

      this.cachedClient = new issuer.Client(clientMetadata);
      this.cachedIssuerUrl = issuerUrl;
      return this.cachedClient;
    } catch (error) {
      this.logger.error('Failed to discover OIDC issuer', error);
      throw new InternalServerErrorException(
        'Failed to connect to OIDC provider',
      );
    }
  }

  /**
   * Generate the authorization URL and store state/nonce/PKCE in the database.
   */
  async generateAuthorizationUrl(callbackUrl: string): Promise<string> {
    const client = await this.getClient();
    const clientSecret = await this.settingsService.getOidcClientSecret();

    const state = generators.state();
    const nonce = generators.nonce();

    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    // Use PKCE for public clients (no client secret)
    if (!clientSecret) {
      codeVerifier = generators.codeVerifier();
      codeChallenge = generators.codeChallenge(codeVerifier);
    }

    // Store state with 10-minute TTL
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.prisma.oidcState.create({
      data: {
        state,
        nonce,
        codeVerifier: codeVerifier || null,
        expiresAt,
      },
    });

    const authParams: any = {
      redirect_uri: callbackUrl,
      scope: 'openid email profile',
      state,
      nonce,
    };

    if (codeChallenge) {
      authParams.code_challenge = codeChallenge;
      authParams.code_challenge_method = 'S256';
    }

    return client.authorizationUrl(authParams);
  }

  /**
   * Handle the OIDC callback: validate state, exchange code, find/create user.
   * Returns a one-time exchange code for the frontend.
   */
  async handleCallback(
    queryParams: Record<string, string>,
    callbackUrl: string,
  ): Promise<string> {
    const state = queryParams.state;

    // Look up and validate state
    const oidcState = await this.prisma.oidcState.findUnique({
      where: { state },
    });

    if (!oidcState) {
      throw new UnauthorizedException('Invalid OIDC state');
    }

    if (oidcState.expiresAt < new Date()) {
      await this.prisma.oidcState.delete({ where: { id: oidcState.id } });
      throw new UnauthorizedException('OIDC state has expired');
    }

    const client = await this.getClient();

    try {
      // Pass the raw query params directly so all provider fields (iss, code, state) are preserved
      const tokenSet = await client.callback(callbackUrl, queryParams, {
        state,
        nonce: oidcState.nonce,
        code_verifier: oidcState.codeVerifier || undefined,
      });

      // Get user info from the ID token claims or userinfo endpoint
      const claims = tokenSet.claims();
      let userInfo: any = claims;

      // If email not in claims, try userinfo endpoint
      if (!userInfo.email) {
        try {
          userInfo = await client.userinfo(tokenSet.access_token!);
        } catch {
          throw new BadRequestException(
            'Could not retrieve email from OIDC provider. Ensure the "email" scope is configured.',
          );
        }
      }

      if (!userInfo.email) {
        throw new BadRequestException(
          'OIDC provider did not return an email address',
        );
      }

      const sub = claims.sub;
      const issuerUrl = await this.settingsService.getOidcIssuerUrl();

      // Find or create the user
      const user = await this.findOrCreateUser(
        sub,
        userInfo.email,
        userInfo.name || userInfo.preferred_username || userInfo.email.split('@')[0],
        issuerUrl,
        userInfo,
      );

      // Generate a one-time exchange code
      const exchangeCode = crypto.randomBytes(32).toString('hex');
      const exchangeExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

      // Update the OidcState with exchange code and user data
      await this.prisma.oidcState.update({
        where: { id: oidcState.id },
        data: {
          exchangeCode,
          userId: user.id,
          accessToken: tokenSet.access_token || null,
          refreshToken: tokenSet.refresh_token || null,
          expiresAt: exchangeExpiresAt,
        },
      });

      return exchangeCode;
    } catch (error) {
      // Clean up state on failure
      await this.prisma.oidcState.delete({ where: { id: oidcState.id } }).catch(() => {});

      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error('OIDC callback failed', error);
      throw new InternalServerErrorException('OIDC authentication failed');
    }
  }

  /**
   * Exchange a one-time code for JWT tokens. Single-use, deleted after exchange.
   */
  async exchangeCode(
    exchangeCode: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const oidcState = await this.prisma.oidcState.findUnique({
      where: { exchangeCode },
    });

    if (!oidcState) {
      throw new UnauthorizedException('Invalid exchange code');
    }

    if (oidcState.expiresAt < new Date()) {
      await this.prisma.oidcState.delete({ where: { id: oidcState.id } });
      throw new UnauthorizedException('Exchange code has expired');
    }

    if (!oidcState.userId) {
      await this.prisma.oidcState.delete({ where: { id: oidcState.id } });
      throw new UnauthorizedException('Invalid exchange state');
    }

    // Fetch user to get email for token generation
    const user = await this.prisma.user.findUnique({
      where: { id: oidcState.userId },
    });

    if (!user) {
      await this.prisma.oidcState.delete({ where: { id: oidcState.id } });
      throw new UnauthorizedException('User not found');
    }

    // Delete the state record (single-use)
    await this.prisma.oidcState.delete({ where: { id: oidcState.id } });

    // Generate Notara JWT tokens
    return this.authService.generateTokenPairPublic(user.id, user.email);
  }

  /**
   * Determine admin status based on admin group setting and userInfo groups claim.
   * Returns undefined if admin group is not configured (caller decides).
   */
  private async resolveAdminByGroup(
    userInfo: any,
  ): Promise<boolean | undefined> {
    const adminGroup = await this.settingsService.getOidcAdminGroup();
    if (!adminGroup) return undefined;

    const groups: string[] = Array.isArray(userInfo.groups)
      ? userInfo.groups
      : [];
    return groups.includes(adminGroup);
  }

  /**
   * Find user by oidcId+provider, then by email (if linking enabled), or auto-create.
   */
  private async findOrCreateUser(
    sub: string,
    email: string,
    name: string,
    issuerUrl: string,
    userInfo: any,
  ) {
    const isAdminByGroup = await this.resolveAdminByGroup(userInfo);

    // 1. Look up by OIDC ID + provider
    const existingByOidc = await this.prisma.user.findUnique({
      where: {
        oidcId_oidcProvider: {
          oidcId: sub,
          oidcProvider: issuerUrl,
        },
      },
    });

    if (existingByOidc) {
      if (existingByOidc.status === UserStatus.pending) {
        throw new UnauthorizedException('Account pending approval');
      }
      // Sync admin status on every login when admin group is configured
      if (isAdminByGroup !== undefined && existingByOidc.isAdmin !== isAdminByGroup) {
        return this.prisma.user.update({
          where: { id: existingByOidc.id },
          data: { isAdmin: isAdminByGroup },
        });
      }
      return existingByOidc;
    }

    // 2. Try email-based account linking if enabled
    const accountLinking = await this.settingsService.getOidcAccountLinking();
    if (accountLinking) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        const updateData: any = {
          oidcId: sub,
          oidcProvider: issuerUrl,
        };
        if (isAdminByGroup !== undefined) {
          updateData.isAdmin = isAdminByGroup;
        }

        const linked = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: updateData,
        });

        if (linked.status === UserStatus.pending) {
          throw new UnauthorizedException('Account pending approval');
        }

        return linked;
      }
    }

    // 3. Auto-create new user
    let isAdmin: boolean;
    if (isAdminByGroup !== undefined) {
      isAdmin = isAdminByGroup;
    } else {
      // Fallback: first user gets admin when admin group is not configured
      const adminCount = await this.prisma.user.count({
        where: { isAdmin: true },
      });
      isAdmin = adminCount === 0;
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        oidcId: sub,
        oidcProvider: issuerUrl,
        isAdmin,
        status: UserStatus.active,
      },
    });

    return user;
  }

  /**
   * Test the OIDC connection by discovering the issuer.
   */
  async testConnection(): Promise<{
    success: boolean;
    issuer?: string;
    endpoints?: Record<string, string>;
    error?: string;
  }> {
    try {
      const issuerUrl = await this.settingsService.getOidcIssuerUrl();
      if (!issuerUrl) {
        return { success: false, error: 'Issuer URL is not configured' };
      }

      const issuer = await Issuer.discover(issuerUrl);
      return {
        success: true,
        issuer: issuer.metadata.issuer as string,
        endpoints: {
          authorization: issuer.metadata.authorization_endpoint as string,
          token: issuer.metadata.token_endpoint as string,
          userinfo: issuer.metadata.userinfo_endpoint as string || '',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to discover issuer: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Clean up expired OidcState records.
   */
  async cleanupExpiredStates(): Promise<number> {
    const result = await this.prisma.oidcState.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }
}
