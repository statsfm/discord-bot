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

export const compareStatsOtherSubCommand: SubcommandFunction<
  (typeof CompareStatsCommand)['options']['other']
> = async ({ interaction, args, statsfmUser: statsfmUserSelf, respond }) => {
  const discordUserOne = args['user-one'].user;
  const discordUserTwo = args['user-two'].user;
  if (discordUserOne.id === discordUserTwo.id) {
    await analytics.track('COMPARE_STATS_OTHER_same_user');
    return respond(interaction, {
      embeds: [
        createEmbed().setTitle(
          "You can't compare the same user to themselves!"
        ),
      ],
    });
  }
  const statsfmUserOne =
    discordUserOne.id === interaction.user.id
      ? statsfmUserSelf
      : await getStatsfmUserFromDiscordUser(discordUserOne);
  const statsfmUserTwo =
    discordUserTwo.id === interaction.user.id
      ? statsfmUserSelf
      : await getStatsfmUserFromDiscordUser(discordUserTwo);
  if (!statsfmUserOne || !statsfmUserTwo)
    return respond(interaction, {
      embeds: [
        notLinkedEmbed(!statsfmUserOne ? discordUserOne : discordUserTwo),
      ],
    });

  const privacySettingCheckUserOne =
    privacyManager.doesHaveMatchingPrivacySettings(
      'stats',
      statsfmUserOne.privacySettings
    );
  const privacySettingCheckUserTwo =
    privacyManager.doesHaveMatchingPrivacySettings(
      'stats',
      statsfmUserTwo.privacySettings
    );
  if (!privacySettingCheckUserOne || !privacySettingCheckUserTwo) {
    await analytics.track('COMPARE_STATS_OTHER_privacy');
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          !privacySettingCheckUserOne ? discordUserOne : discordUserTwo,
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
    statsA = await statsfmApi.users.stats(statsfmUserOne.id, {
      range,
    });
    statsB = await statsfmApi.users.stats(statsfmUserTwo.id, {
      range,
    });
  } catch (err) {
    const errorId = reportError(err, interaction);

    return respond(interaction, {
      embeds: [unexpectedErrorEmbed(errorId)],
    });
  }

  await analytics.track(`COMPARE_OTHER_${range}`);

  return respond(interaction, {
    embeds: [
      createEmbed()
        .setAuthor({
          name: `${discordUserOne.username}'s stats VS ${discordUserTwo.username}'s stats - ${rangeDisplay}`,
          url: statsfmUserOne.profileUrl,
        })
        .addFields([
          {
            name: `Streams`,
            value: `${discordUserOne.username}: ${
              statsA.count.toLocaleString() ?? 0
            }\n${discordUserTwo.username}: ${
              statsB.count.toLocaleString() ?? 0
            }`,
            inline: true,
          },
          {
            name: `Minutes streamed`,
            value: `${discordUserOne.username}: ${Math.round(
              (statsA.durationMs ?? 0) / 1000 / 60
            ).toLocaleString()} minutes\n${
              discordUserTwo.username
            }: ${Math.round(
              (statsB.durationMs ?? 0) / 1000 / 60
            ).toLocaleString()} minutes`,
            inline: true,
          },
          {
            name: `Hours streamed`,
            value: `${discordUserOne.username}: ${Math.round(
              (statsA.durationMs ?? 0) / 1000 / 60 / 60
            ).toLocaleString()} hours\n${discordUserTwo.username}: ${Math.round(
              (statsB.durationMs ?? 0) / 1000 / 60 / 60
            ).toLocaleString()} hours`,
            inline: true,
          },
          {
            name: `Different tracks`,
            value: `${discordUserOne.username}: ${
              statsA.cardinality.tracks.toLocaleString() ?? 0
            } tracks\n${discordUserTwo.username}: ${
              statsB.cardinality.tracks.toLocaleString() ?? 0
            } tracks`,
            inline: true,
          },
          {
            name: `Different artists`,
            value: `${discordUserOne.username}: ${
              statsA.cardinality.artists.toLocaleString() ?? 0
            } artists\n${discordUserTwo.username}: ${
              statsB.cardinality.artists.toLocaleString() ?? 0
            } artists`,
            inline: true,
          },
          {
            name: `Different albums`,
            value: `${discordUserOne.username}: ${
              statsA.cardinality.albums.toLocaleString() ?? 0
            } albums\n${discordUserTwo.username}: ${
              statsB.cardinality.albums.toLocaleString() ?? 0
            } albums`,
            inline: true,
          },
        ])
        .toJSON(),
    ],
  });
};
