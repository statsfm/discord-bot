import { inject, singleton } from 'tsyringe';
import toml from 'toml';
import fs from 'node:fs';
import path from 'node:path';
import type {
  IConfig,
  IConfigRoles,
  IConfigStatisticChannels,
  IConfigStatus,
} from './IConfig';
import ow, { ArgumentError } from 'ow';
import type { Config as StatsfmConfig } from '@statsfm/statsfm.js';
import type { Snowflake } from 'discord-api-types/globals';
import type { Logger } from './Logger';
import { kLogger } from './tokens';

const snowflakeOw = ow.string.matches(/\d{15,20}/);

@singleton()
export class Config implements IConfig {
  mainGuild: Snowflake;
  statisticChannels: IConfigStatisticChannels;
  songChallengeChannel: Snowflake | null;
  statsfmConfig: StatsfmConfig;
  status: IConfigStatus;
  genreHubChannel: Snowflake | null;
  roles: IConfigRoles;
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
      const error = e as ArgumentError;
      logger.error(error.message);
      process.exit(1);
    }
    this.mainGuild = tomlConfig.mainGuild;
    this.statisticChannels = tomlConfig.statisticChannels;
    this.songChallengeChannel = tomlConfig.songChallengeChannel;
    this.statsfmConfig = tomlConfig.statsfmConfig;
    this.status = tomlConfig.status;
    this.genreHubChannel = tomlConfig.genreHubChannel;
    this.roles = tomlConfig.roles;
  }

  private tomlCheck(tomlConfig: IConfig) {
    ow(tomlConfig.mainGuild, snowflakeOw);
    ow(
      tomlConfig.statisticChannels,
      ow.any(
        ow.nullOrUndefined,
        ow.object.exactShape({
          users: snowflakeOw,
          plusUsers: snowflakeOw,
          streams: snowflakeOw,
          tracks: snowflakeOw,
          artists: snowflakeOw,
          albums: snowflakeOw,
        })
      )
    );
    ow(
      tomlConfig.songChallengeChannel,
      ow.any(ow.nullOrUndefined, snowflakeOw)
    );
    ow(
      tomlConfig.statsfmConfig,
      ow.object.nonEmpty.exactShape({
        baseUrl: ow.any(ow.nullOrUndefined, ow.string),
        acccessToken: ow.any(ow.nullOrUndefined, ow.string),
      })
    );
    ow(
      tomlConfig.status,
      ow.any(ow.nullOrUndefined, ow.object.hasKeys('apiUrl', 'apiAuth'))
    );
    ow(tomlConfig.genreHubChannel, ow.any(ow.nullOrUndefined, snowflakeOw));
    ow(
      tomlConfig.roles,
      ow.any(
        ow.nullOrUndefined,
        ow.object.exactShape({
          beta: snowflakeOw,
          plus: snowflakeOw,
          ios: snowflakeOw,
          android: snowflakeOw,
        })
      )
    );
  }
}
