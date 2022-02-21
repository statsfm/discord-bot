import type { Snowflake } from 'discord-api-types/globals';
import type { Config as StatsfmConfig } from '@statsfm/statsfm.js';

export interface Config {
  mainGuild: Snowflake;

  statisticChannels: null | Record<
    'users' | 'plusUsers' | 'streams' | 'tracks' | 'artists' | 'albums',
    Snowflake
  >;

  songChallengeChannel: null | Snowflake;

  statsfmConfig: StatsfmConfig;

  status: null | Record<'apiUrl' | 'apiAuth', string>;

  genreHubChannel: null | Snowflake;

  roles: null | Record<'beta' | 'plus', Snowflake>;
}
