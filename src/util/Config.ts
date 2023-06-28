import { inject, singleton } from 'tsyringe';
import toml from 'toml';
import fs from 'node:fs';
import path from 'node:path';
import type { AnalyticsConfig, IConfig } from './IConfig';
import ow, { ArgumentError } from 'ow';
import type { Options } from '@statsfm/statsfm.js';
import type { Snowflake } from 'discord-api-types/globals';
import type { Logger } from './Logger';
import { kLogger } from './tokens';
import * as Sentry from '@sentry/node';

@singleton()
export class Config implements IConfig {
  statsfm: Options;
  discordBotToken: string;
  discordClientId: Snowflake;
  sentryDsn: string;
  analytics: AnalyticsConfig | undefined;

  // Setup all config things from the toml in class
  constructor(@inject(kLogger) public readonly logger: Logger) {
    const file = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'config.toml'),
      { encoding: 'utf-8' }
    );
    const tomlConfig: IConfig = toml.parse(file);
    try {
      this.tomlCheck(tomlConfig);
    } catch (e) {
      Sentry.captureException(e);
      const error = e as ArgumentError;
      logger.error(error.message);
      process.exit(1);
    }
    this.statsfm = tomlConfig.statsfm;
    this.analytics = tomlConfig.analytics;
    this.discordBotToken = process.env.DISCORD_BOT_TOKEN!;
    this.discordClientId = process.env.DISCORD_CLIENT_ID!;
    this.sentryDsn = process.env.SENTRY_DSN!;
  }

  private tomlCheck(tomlConfig: IConfig) {
    ow(process.env.DISCORD_BOT_TOKEN!, ow.string.nonEmpty);
    ow(process.env.DISCORD_CLIENT_ID!, ow.string.nonEmpty);
    ow(process.env.SENTRY_DSN!, ow.optional.string.nonEmpty);
    ow(
      tomlConfig.statsfm,
      ow.any(
        ow.nullOrUndefined,
        ow.object.exactShape({
          http: ow.any(
            ow.nullOrUndefined,
            ow.object.exactShape({
              apiUrl: ow.any(ow.nullOrUndefined, ow.string.nonEmpty),
              userAgentAppendix: ow.any(ow.nullOrUndefined, ow.string.nonEmpty),
              retries: ow.any(ow.nullOrUndefined, ow.number),
              version: ow.any(ow.nullOrUndefined, ow.string.nonEmpty),
            })
          ),
          auth: ow.any(
            ow.nullOrUndefined,
            ow.object.exactShape({
              accessToken: ow.any(ow.nullOrUndefined, ow.string.nonEmpty),
            })
          ),
        })
      )
    );
    ow(
      tomlConfig.analytics,
      ow.any(
        ow.nullOrUndefined,
        ow.object.exactShape({
          token: ow.string.nonEmpty,
          fileLocation: ow.string.nonEmpty,
        })
      )
    );
  }
}
