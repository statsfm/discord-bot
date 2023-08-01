import { User } from 'discord.js';

export class Util {
  static isNullOrUndefined<T>(
    obj: T | null | undefined
  ): obj is null | undefined {
    return typeof obj === 'undefined' || obj === null;
  }

  static getDiscordUserTag(user: User) {
    if (user.discriminator === '0') {
      return user.displayName;
    }
    return user.tag;
  }
}
