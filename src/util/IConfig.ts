import type { Snowflake } from 'discord-api-types/globals';
import type { Config as StatsfmConfig } from '@statsfm/statsfm.js';

export interface IConfig {
  mainGuild: Snowflake;

  statisticChannels: IConfigStatisticChannels;

  songChallengeChannel: null | Snowflake;

  statsfmConfig: StatsfmConfig;

  status: IConfigStatus;

  genreHubChannel: null | Snowflake;

  roles: IConfigRoles;
}

export type IConfigStatisticChannels = null | Record<
  'users' | 'plusUsers' | 'streams' | 'tracks' | 'artists' | 'albums',
  Snowflake
>;

export type IConfigStatus = null | Record<'apiUrl' | 'apiAuth', string>;

export type IConfigRoles = null | Record<'beta' | 'plus', Snowflake>;
