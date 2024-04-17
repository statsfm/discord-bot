import fetch from 'node-fetch';
import { singleton } from 'tsyringe';
import { Config } from './Config';

@singleton()
export class Analytics {
  constructor(private config: Config) {}

  async track(event: string) {
    if (!this.config.analytics) return;

    await fetch(this.config.analytics.url, {
      method: 'POST',
      headers: {
        Authorization: this.config.analytics.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
      }),
    });
  }
}
