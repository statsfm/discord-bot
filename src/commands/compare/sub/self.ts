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
import { reportError } from '../../../util/Sentry';
import { Analytics } from '../../../util/Analytics';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);
const analytics = container.resolve(Analytics);

export const compareStatsSelfSubCommand: SubcommandFunction<
  (typeof CompareStatsCommand)['options']['self']
> = async ({ interaction, args, statsfmUser: statsfmUserSelf, respond }) => {
  const discordUserSelf = interaction.user;
  const discordUserOther = args.user.user;
  if (discordUserOther.id === discordUserSelf.id) {
    await analytics.track('COMPARE_STATS_SELF_yourself');
    return respond(interaction, {
      embeds: [
        createEmbed().setTitle("You can't compare yourself to yourself!"),
      ],
    });
  }

  const statsfmUserOther = await getStatsfmUserFromDiscordUser(
    discordUserOther
  );
  if (!statsfmUserSelf || !statsfmUserOther)
    return respond(interaction, {
      embeds: [
        notLinkedEmbed(!statsfmUserSelf ? discordUserSelf : discordUserOther),
      ],
    });
  const privacySettingCheckSelf =
    privacyManager.doesHaveMatchingPrivacySettings(
      'stats',
      statsfmUserSelf.privacySettings
    );
  const privacySettingCheckOther =
    privacyManager.doesHaveMatchingPrivacySettings(
      'stats',
      statsfmUserOther.privacySettings
    );
  if (!privacySettingCheckSelf || !privacySettingCheckOther) {
    await analytics.track('COMPARE_STATS_SELF_privacy');
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          !privacySettingCheckSelf ? discordUserSelf : discordUserOther,
          privacyManager.getPrivacySettingsMessage('stats', 'streamStats')
        ),
      ],
    });
  }

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
    statsA = await statsfmApi.users.stats(statsfmUserSelf.id, {
      range,
    });
    statsB = await statsfmApi.users.stats(statsfmUserOther.id, {
      range,
    });
  } catch (err) {
    const errorId = reportError(err, interaction);

    return respond(interaction, {
      embeds: [unexpectedErrorEmbed(errorId)],
    });
  }

  await analytics.track(`COMPARE_STATS_SELF_${range}`);

  return respond(interaction, {
    embeds: [
      createEmbed()
        .setAuthor({
          name: `${discordUserSelf.username}'s stats VS ${discordUserOther.username}'s stats - ${rangeDisplay}`,
          url: statsfmUserSelf.profileUrl,
        })
        .addFields([
          {
            name: 'Streams',
            value: `${discordUserSelf.username}: ${
              statsA.count.toLocaleString() ?? 0
            }\n${discordUserOther.username}: ${
              statsB.count.toLocaleString() ?? 0
            }`,
            inline: true,
          },
          {
            name: 'Minutes streamed',
            value: `${discordUserSelf.username}: ${Math.round(
              (statsA.durationMs ?? 0) / 1000 / 60
            ).toLocaleString()} minutes\n${
              discordUserOther.username
            }: ${Math.round(
              (statsB.durationMs ?? 0) / 1000 / 60
            ).toLocaleString()} minutes`,
            inline: true,
          },
          {
            name: 'Hours streamed',
            value: `${discordUserSelf.username}: ${Math.round(
              (statsA.durationMs ?? 0) / 1000 / 60 / 60
            ).toLocaleString()} hours\n${
              discordUserOther.username
            }: ${Math.round(
              (statsB.durationMs ?? 0) / 1000 / 60 / 60
            ).toLocaleString()} hours`,
            inline: true,
          },
          {
            name: 'Different tracks',
            value: `${discordUserSelf.username}: ${
              statsA.cardinality.tracks.toLocaleString() ?? 0
            } tracks\n${discordUserOther.username}: ${
              statsB.cardinality.tracks.toLocaleString() ?? 0
            } tracks`,
            inline: true,
          },
          {
            name: 'Different artists',
            value: `${discordUserSelf.username}: ${
              statsA.cardinality.artists.toLocaleString() ?? 0
            } artists\n${discordUserOther.username}: ${
              statsB.cardinality.artists.toLocaleString() ?? 0
            } artists`,
            inline: true,
          },
          {
            name: 'Different albums',
            value: `${discordUserSelf.username}: ${
              statsA.cardinality.albums.toLocaleString() ?? 0
            } albums\n${discordUserOther.username}: ${
              statsB.cardinality.albums.toLocaleString() ?? 0
            } albums`,
            inline: true,
          },
        ])
        .toJSON(),
    ],
  });
};
