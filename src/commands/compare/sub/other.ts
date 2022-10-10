import type { CompareStatsCommand } from '../../../interactions';
import type { SubcommandFunction } from '../../../util/Command';
import { getStatsfmUserFromDiscordUser } from '../../../util/getStatsfmUserFromDiscordUser';
import {
  createEmbed,
  notLinkedEmbed,
  privacyEmbed,
  unexpectedErrorEmbed,
} from '../../../util/embed';
import { container } from 'tsyringe';
import { Api, ExtendedDateStats, Range } from '@statsfm/statsfm.js';
import { PrivacyManager } from '../../../util/PrivacyManager';
import * as Sentry from '@sentry/node';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);

export const compareStatsOtherSubCommand: SubcommandFunction<
  typeof CompareStatsCommand['options']['1']
> = async (interaction, args, statsfmUserSelf, respond) => {
  await interaction.deferReply();
  const userA = args.usera;
  const userB = args.userb;
  const statsfmUserA =
    userA.user === interaction.user
      ? statsfmUserSelf
      : await getStatsfmUserFromDiscordUser(userA.user);
  const statsfmUserB =
    userB.user === interaction.user
      ? statsfmUserSelf
      : await getStatsfmUserFromDiscordUser(userB.user);
  if (!statsfmUserA)
    return respond(interaction, {
      embeds: [notLinkedEmbed(userA.user)],
    });
  if (!statsfmUserB)
    return respond(interaction, {
      embeds: [notLinkedEmbed(userB.user)],
    });
  const privacySettingCheckA = privacyManager.doesHaveMatchingPrivacySettings(
    'stats',
    statsfmUserA.privacySettings
  );
  const privacySettingCheckB = privacyManager.doesHaveMatchingPrivacySettings(
    'stats',
    statsfmUserB.privacySettings
  );
  if (!privacySettingCheckA)
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          userA.user,
          privacyManager.getPrivacySettingsMessage('stats', 'streamStats')
        ),
      ],
    });
  if (!privacySettingCheckB)
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          userB.user,
          privacyManager.getPrivacySettingsMessage('stats', 'streamStats')
        ),
      ],
    });

  let range = Range.WEEKS;
  let rangeDisplay = 'past 4 weeks';

  if (args.range === '6-months') {
    range = Range.MONTHS;
    rangeDisplay = 'past 6 months';
  }

  if (args.range === 'lifetime') {
    range = Range.LIFETIME;
    rangeDisplay = 'lifetime';
  }

  let statsA: ExtendedDateStats;
  let statsB: ExtendedDateStats;

  try {
    statsA = await statsfmApi.users.stats(userA.user.id, {
      range,
    });
    statsB = await statsfmApi.users.stats(userB.user.id, {
      range,
    });
  } catch (err) {
    Sentry.captureException(err);

    return respond(interaction, {
      embeds: [unexpectedErrorEmbed()],
    });
  }

  return respond(interaction, {
    embeds: [
      createEmbed()
        .setAuthor({
          name: `${userA.user.username}'s stats VS ${userB.user.username}'s stats - ${rangeDisplay}`,
          url: statsfmUserA.profileUrl,
        })
        .addFields([
          {
            name: `Streams`,
            value: `${userA.user.username}: ${
              statsA.count.toLocaleString() ?? 0
            }\n${userB.user.username}: ${statsB.count.toLocaleString() ?? 0}`,
            inline: true,
          },
          {
            name: `Minutes streamed`,
            value: `${userA.user.username}: ${Math.round(
              (statsA.durationMs ?? 0) / 1000 / 60
            ).toLocaleString()} minutes\n${userB.user.username}: ${Math.round(
              (statsB.durationMs ?? 0) / 1000 / 60
            ).toLocaleString()} minutes`,
            inline: true,
          },
          {
            name: `Hours streamed`,
            value: `${userA.user.username}: ${Math.round(
              (statsA.durationMs ?? 0) / 1000 / 60 / 60
            ).toLocaleString()} hours\n${userB.user.username}: ${Math.round(
              (statsB.durationMs ?? 0) / 1000 / 60 / 60
            ).toLocaleString()} hours`,
            inline: true,
          },
          {
            name: `Different tracks`,
            value: `${userA.user.username}: ${
              statsA.cardinality.tracks.toLocaleString() ?? 0
            } tracks\n${userB.user.username}: ${
              statsB.cardinality.tracks.toLocaleString() ?? 0
            } tracks`,
            inline: true,
          },
          {
            name: `Different artists`,
            value: `${userA.user.username}: ${
              statsA.cardinality.artists.toLocaleString() ?? 0
            } artists\n${userB.user.username}: ${
              statsB.cardinality.artists.toLocaleString() ?? 0
            } artists`,
            inline: true,
          },
          {
            name: `Different albums`,
            value: `${userA.user.username}: ${
              statsA.cardinality.albums.toLocaleString() ?? 0
            } albums\n${userB.user.username}: ${
              statsB.cardinality.albums.toLocaleString() ?? 0
            } albums`,
            inline: true,
          },
        ])
        .toJSON(),
    ],
  });
};
