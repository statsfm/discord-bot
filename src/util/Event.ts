import type { ClientEvents } from 'discord.js';

export const createEvent = <K extends keyof ClientEvents>(eventType: K) =>
  new Event<K>(eventType);

function notImplemented() {
  throw new Error('Not implemented');
}

export class Event<K extends keyof ClientEvents> {
  private execute: (...args: ClientEvents[K]) => Awaitable<void> =
    notImplemented;
  private disabled = false;

  constructor(private eventType: K) {}

  public setOn(eventFunction: (...args: ClientEvents[K]) => Awaitable<void>) {
    this.execute = eventFunction;
    return this;
  }

  public setDisabled(disabled: boolean) {
    this.disabled = disabled;
    return this;
  }

  public build(): BuildedEvent<K> {
    if (this.execute === notImplemented) throw new Error('Not implemented');
    return {
      disabled: this.disabled,
      execute: this.execute,
      name: this.eventType,
    };
  }
}

export interface BuildedEvent<K extends keyof ClientEvents> {
  disabled: boolean;
  execute: (...args: ClientEvents[K]) => Awaitable<void>;
  name: K;
}
