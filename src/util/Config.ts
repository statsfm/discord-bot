import { singleton } from 'tsyringe';
import toml from 'toml';
import fs from 'node:fs';
import path from 'node:path';
import type {
  IConfig,
  IConfigRoles,
  IConfigStatisticChannels,
  IConfigStatus,
} from './IConfig';
import ow from 'ow';
import type { Config as StatsfmConfig } from '@statsfm/statsfm.js';
import type { Snowflake } from 'discord-api-types/globals';

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
  constructor() {
    const file = fs.readFileSync(
      path.resolve(__dirname, '..', '..', 'config.toml'),
      { encoding: 'utf-8' }
    );
    const tomlConfig: IConfig = toml.parse(file);
    this.tomlCheck(tomlConfig);
    this.mainGuild = tomlConfig.mainGuild;
    this.statisticChannels = tomlConfig.statisticChannels;
    this.songChallengeChannel = tomlConfig.songChallengeChannel;
    this.statsfmConfig = tomlConfig.statsfmConfig;
    this.status = tomlConfig.status;
    this.genreHubChannel = tomlConfig.genreHubChannel;
    this.roles = tomlConfig.roles;
  }

  private tomlCheck(tomlConfig: IConfig) {
    ow(tomlConfig.mainGuild, ow.string);
    ow(
      tomlConfig.statisticChannels,
      ow.any(
        ow.nullOrUndefined,
        ow.object.hasKeys(
          'users',
          'plusUsers',
          'streams',
          'tracks',
          'artists',
          'albums'
        )
      )
    );
    ow(tomlConfig.songChallengeChannel, ow.any(ow.nullOrUndefined, ow.string));
    ow(
      tomlConfig.statsfmConfig,
      ow.object.nonEmpty.exactShape({
        baseUrl: ow.string,
        acccessToken: ow.any(ow.nullOrUndefined, ow.string),
      })
    );
    ow(
      tomlConfig.status,
      ow.any(ow.nullOrUndefined, ow.object.hasKeys('apiUrl', 'apiAuth'))
    );
    ow(tomlConfig.genreHubChannel, ow.any(ow.nullOrUndefined, ow.string));
    ow(
      tomlConfig.roles,
      ow.any(ow.nullOrUndefined, ow.object.hasKeys('beta', 'plus'))
    );
  }
}
