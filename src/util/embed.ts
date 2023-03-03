import { unexpectedErrorShort } from './texts';
import { EmbedBuilder, User } from 'discord.js';

export const createEmbed = () => {
  return new EmbedBuilder().setColor(2021216).setTimestamp();
};

export const notLinkedEmbed = (targetUser: User) =>
  createEmbed()
    .setTitle(
      `${targetUser.username} did not link their Discord account to their stats.fm account`
    )
    .setDescription(
      'You can link your Discord account to your stats.fm account by going to <https://stats.fm/settings/connections>!'
    );

export const unexpectedErrorEmbed = (errorId: string) =>
  createEmbed()
    .setTitle('An unexpected error occurred')
    .setDescription(unexpectedErrorShort + `\n\nReference ID: \`${errorId}\``);

export const invalidClientEmbed = () =>
  createEmbed().setDescription(
    'Please try to login to the app app and then try to execute the command!'
  );

export const privacyEmbed = (targetUser: User, message: string) =>
  createEmbed()
    .setTitle(
      'Some privacy settings are preventing me from running this command'
    )
    .setDescription(message.replace('{TARGET_USER}', targetUser.tag));
