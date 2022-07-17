import {
  APIUser,
  CDNRoutes,
  DefaultUserAvatarAssets,
  ImageFormat,
  RouteBases,
} from 'discord-api-types/v9';
import { EmbedBuilder } from '@discordjs/builders';

export const createEmbed = (issuer: APIUser | null = null) => {
  let userAvatar: string | null = issuer
    ? CDNRoutes.defaultUserAvatar(
        (parseInt(issuer?.discriminator) % 5) as DefaultUserAvatarAssets
      )
    : null;
  if (issuer && issuer.avatar)
    userAvatar = CDNRoutes.userAvatar(
      issuer.id,
      issuer.avatar,
      issuer.avatar.startsWith('_a') ? ImageFormat.GIF : ImageFormat.PNG
    );
  return new EmbedBuilder()
    .setColor(2021216)
    .setFooter(
      issuer
        ? {
            text: `Requested by ${issuer.username}#${issuer.discriminator}`,
            iconURL: `${RouteBases.cdn}${userAvatar}`,
          }
        : null
    )
    .setTimestamp();
};

export const notLinkedEmbed = (issuer: APIUser, targetUser: APIUser) =>
  createEmbed(issuer)
    .setTitle(
      `${targetUser.username} did not link their Discord account to their Stats.fm account`
    )
    .toJSON();

export const unexpectedErrorEmbed = (issuer: APIUser, targetUser: APIUser) =>
  createEmbed(issuer)
    .setTitle('An unexpected error occurred')
    .setDescription(
      `**${targetUser.username}** probably has set some privacy settings to private, if you're sure they've not, please contact bot support.`
    )
    .toJSON();
