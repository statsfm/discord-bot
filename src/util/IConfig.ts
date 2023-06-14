import type { Config as StatsfmConfig } from '@statsfm/statsfm.js';

export interface AnalyticsConfig {
  token: string;
  fileLocation: string;
}

export interface IConfig {
  statsfmConfig: StatsfmConfig;
  analytics: AnalyticsConfig | undefined;
}
