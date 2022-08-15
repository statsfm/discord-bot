import type { APIUser } from 'discord-api-types/v9';
import { EmbedBuilder } from '@discordjs/builders';
import { unexpectedErrorShort } from './texts';

export const createEmbed = () => {
  return new EmbedBuilder().setColor(2021216).setTimestamp();
};

export const notLinkedEmbed = (targetUser: APIUser) =>
  createEmbed()
    .setTitle(
      `${targetUser.username} did not link their Discord account to their Stats.fm account`
    )
    .setDescription(
      'You can link your Discord account to your Stats.fm account by going to <https://stats.fm/account/connections>!'
    )
    .toJSON();

export const unexpectedErrorEmbed = (targetUser: APIUser) =>
  createEmbed()
    .setTitle('An unexpected error occurred')
    .setDescription(unexpectedErrorShort(targetUser))
    .toJSON();
