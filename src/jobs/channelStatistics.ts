import { parentPort } from 'node:worker_threads';
import { JobType } from '../util/Constants';

if (parentPort) {
  parentPort.postMessage({
    op: JobType.CHANNEL_STATISTICS,
  });
} else {
  process.exit(0);
}
