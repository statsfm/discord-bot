import type { ClientEvents } from 'discord.js';

export const createEvent = <K extends keyof ClientEvents>(eventType: K) =>
  new Event<K>(eventType);

function notImplemented() {
  throw new Error('Not implemented');
}

export class Event<K extends keyof ClientEvents> {
  private execute: (...args: ClientEvents[K]) => Awaitable<void> =
    notImplemented;
  private enabled = true;

  constructor(private eventType: K) {}

  public setOn(eventFunction: (...args: ClientEvents[K]) => Awaitable<void>) {
    this.execute = eventFunction;
    return this;
  }

  public disable() {
    this.enabled = false;
    return this;
  }

  public enable() {
    this.enabled = true;
    return this;
  }

  public build(): BuildedEvent<K> {
    if (this.execute === notImplemented) throw new Error('Not implemented');
    return {
      enabled: this.enabled,
      execute: this.execute,
      name: this.eventType,
    };
  }
}

export interface BuildedEvent<K extends keyof ClientEvents> {
  enabled: boolean;
  execute: (...args: ClientEvents[K]) => Awaitable<void>;
  name: K;
}
