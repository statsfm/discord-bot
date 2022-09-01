import type { User } from 'discord.js';

export const unexpectedErrorShort = (targetUser: User) =>
  `**${targetUser.username}** probably has set some [privacy settings](https://stats.fm/account/privacy) to private, if you're sure they've not, please contact bot support.`;
