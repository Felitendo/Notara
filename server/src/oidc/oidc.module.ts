import { Module } from '@nestjs/common';
import { OidcService } from './oidc.service';
import { OidcController } from './oidc.controller';
import { OidcCleanupService } from './oidc-cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, SettingsModule, AuthModule],
  controllers: [OidcController],
  providers: [OidcService, OidcCleanupService],
  exports: [OidcService],
})
export class OidcModule {}
