export interface ElasticCountResponse {
  count: number;
  _shards: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
}

export interface ElasticTotalUsersResponse {
  dimensionHeaders: unknown[];
  metricHeaders: { name: string; type: string }[];
  rows: {
    dimensionValues: unknown[];
    metricValues: { value: string; oneValue: string }[];
  }[];
  totals: unknown[];
  maximums: unknown[];
  minimums: unknown[];
  rowCount: number;
  metadata: {
    dataLossFromOtherRow: boolean;
  };
  propertyQuota: unknown;
  kind: string;
}
