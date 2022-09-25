import { StatsCommand } from '../interactions';
import { createCommand } from '../util/Command';
import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import {
  createEmbed,
  notLinkedEmbed,
  privacyEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { container } from 'tsyringe';
import { Api, ExtendedDateStats, Range } from '@statsfm/statsfm.js';
import { PrivacyManager } from '../util/PrivacyManager';
import * as Sentry from '@sentry/node';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);

export default createCommand(StatsCommand)
  .registerChatInput(async (interaction, args, statsfmUserSelf, respond) => {
    await interaction.deferReply();
    const targetUser = args.user?.user ?? interaction.user;
    const statsfmUser =
      targetUser === interaction.user
        ? statsfmUserSelf
        : await getStatsfmUserFromDiscordUser(targetUser);
    if (!statsfmUser)
      return respond(interaction, {
        embeds: [notLinkedEmbed(targetUser)],
      });
    const privacySettingCheck = privacyManager.doesHaveMatchingPrivacySettings(
      'stats',
      statsfmUser.privacySettings
    );
    if (!privacySettingCheck)
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            targetUser,
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

    let stats: ExtendedDateStats;

    try {
      stats = await statsfmApi.users.stats(statsfmUser.id, {
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
            name: `${targetUser.username}'s stats - ${rangeDisplay}`,
            url: statsfmUser.profileUrl,
          })
          .addFields([
            {
              name: `Streams`,
              value: `${stats.count.toLocaleString() ?? 0}`,
              inline: true,
            },
            {
              name: `Minutes streamed`,
              value: `${Math.round(
                (stats.durationMs ?? 0) / 1000 / 60
              ).toLocaleString()} minutes`,
              inline: true,
            },
            {
              name: `Hours streamed`,
              value: `${Math.round(
                (stats.durationMs ?? 0) / 1000 / 60 / 60
              ).toLocaleString()} hours`,
              inline: true,
            },
            {
              name: `Different tracks`,
              value: `${stats.cardinality.tracks.toLocaleString() ?? 0} tracks`,
              inline: true,
            },
            {
              name: `Different artists`,
              value: `${
                stats.cardinality.artists.toLocaleString() ?? 0
              } artists`,
              inline: true,
            },
            {
              name: `Different albums`,
              value: `${stats.cardinality.albums.toLocaleString() ?? 0} albums`,
              inline: true,
            },
          ])
          .toJSON(),
      ],
    });
  })
  .build();
