import type { APIUser } from 'discord-api-types/v9';

export const unexpectedErrorShort = (targetUser: APIUser) =>
  `**${targetUser.username}** probably has set some [privacy settings](https://stats.fm/account/privacy) to private, if you're sure they've not, please contact bot support.`;
