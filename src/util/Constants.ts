export enum JobType {
  CHANNEL_STATISTICS = 'channelStatistics',
}

export interface JobMessage {
  op: JobType;
  d: any;
}
