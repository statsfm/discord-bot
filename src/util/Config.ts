import { inject, singleton } from 'tsyringe';
import toml from 'toml';
import fs from 'node:fs';
import path from 'node:path';
import type { IConfig } from './IConfig';
import ow, { ArgumentError } from 'ow';
import type { Config as StatsfmConfig } from '@statsfm/statsfm.js';
import type { Snowflake } from 'discord-api-types/globals';
import type { Logger } from './Logger';
import { kLogger } from './tokens';
import * as Sentry from '@sentry/node';

@singleton()
export class Config implements IConfig {
  statsfmConfig: StatsfmConfig;
  discordBotToken: string;
  discordClientId: Snowflake;
  sentryDsn: string;

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
    this.statsfmConfig = tomlConfig.statsfmConfig;
    this.discordBotToken = process.env.DISCORD_BOT_TOKEN!;
    this.discordClientId = process.env.DISCORD_CLIENT_ID!;
    this.sentryDsn = process.env.SENTRY_DSN!;
  }

  private tomlCheck(tomlConfig: IConfig) {
    ow(process.env.DISCORD_BOT_TOKEN!, ow.string.nonEmpty);
    ow(
      tomlConfig.statsfmConfig,
      ow.object.nonEmpty.exactShape({
        baseUrl: ow.any(ow.nullOrUndefined, ow.string),
        acccessToken: ow.any(ow.nullOrUndefined, ow.string),
      })
    );
  }
}
