import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OidcService } from './oidc.service';

@Injectable()
export class OidcCleanupService {
  private readonly logger = new Logger(OidcCleanupService.name);

  constructor(private readonly oidcService: OidcService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredStates() {
    const count = await this.oidcService.cleanupExpiredStates();
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} expired OIDC state records`);
    }
  }
}
