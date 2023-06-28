import type { Options } from '@statsfm/statsfm.js';

export interface AnalyticsConfig {
  token: string;
  fileLocation: string;
}

export interface IConfig {
  statsfm: Options;
  analytics: AnalyticsConfig | undefined;
}
