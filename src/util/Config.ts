import { inject, singleton } from 'tsyringe';
import ow, { ArgumentError } from 'ow';
import type { Options } from '@statsfm/statsfm.js';
import type { Snowflake } from 'discord-api-types/globals';
import type { Logger } from './Logger';
import { kLogger } from './tokens';
import * as Sentry from '@sentry/node';

@singleton()
export class Config {
  statsfm: Options;
  discordBotToken: string;
  discordClientId: Snowflake;
  sentryDsn: string;
  analytics:
    | {
        token: string;
        fileLocation: string;
      }
    | undefined;

  // Setup all config things from the toml in class
  constructor(@inject(kLogger) public readonly logger: Logger) {
    try {
      this.envCheck();
    } catch (e) {
      Sentry.captureException(e);
      const error = e as ArgumentError;
      logger.error(error.message);
      process.exit(1);
    }
    this.statsfm = {
      http: {
        apiUrl: process.env.STATSFM_HTTP_API_URL!,
        userAgentAppendix: process.env.STATSFM_HTTP_API_USER_AGENT_APPENDIX!,
        retries: Number(process.env.STATSFM_HTTP_API_RETRIES!),
        version: process.env.STATSFM_HTTP_API_VERSION!,
      },
      auth: {
        accessToken: process.env.STATSFM_AUTH_ACCESS_TOKEN!,
      },
    };
    this.analytics =
      process.env.ANALYTICS_TOKEN && process.env.ANALYTICS_FILE_LOCATION
        ? {
            token: process.env.ANALYTICS_TOKEN!,
            fileLocation: process.env.ANALYTICS_FILE_LOCATION!,
          }
        : undefined;
    this.discordBotToken = process.env.DISCORD_BOT_TOKEN!;
    this.discordClientId = process.env.DISCORD_CLIENT_ID!;
    this.sentryDsn = process.env.SENTRY_DSN!;
  }

  private envCheck() {
    ow(process.env.DISCORD_BOT_TOKEN!, ow.string.nonEmpty);
    ow(process.env.DISCORD_CLIENT_ID!, ow.string.nonEmpty);
    ow(process.env.SENTRY_DSN!, ow.any(ow.nullOrUndefined, ow.string.nonEmpty));
    ow(
      process.env.STATSFM_HTTP_API_URL!,
      ow.any(ow.nullOrUndefined, ow.string.nonEmpty)
    );
    ow(
      process.env.STATSFM_HTTP_API_USER_AGENT_APPENDIX!,
      ow.any(ow.nullOrUndefined, ow.string.nonEmpty)
    );
    ow(
      process.env.STATSFM_HTTP_API_RETRIES!,
      ow.any(ow.nullOrUndefined, ow.number)
    );
    ow(
      process.env.STATSFM_HTTP_API_VERSION!,
      ow.any(ow.nullOrUndefined, ow.string.nonEmpty)
    );
    ow(
      process.env.STATSFM_AUTH_ACCESS_TOKEN!,
      ow.any(ow.nullOrUndefined, ow.string.nonEmpty)
    );
    ow(
      process.env.ANALYTICS_TOKEN!,
      ow.any(ow.nullOrUndefined, ow.string.nonEmpty)
    );
    ow(
      process.env.ANALYTICS_FILE_LOCATION!,
      ow.any(ow.nullOrUndefined, ow.string.nonEmpty)
    );
  }
}
