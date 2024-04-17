import { Api, Range, TopTrack } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { TopCommand } from '../../../interactions';
import type { SubcommandFunction } from '../../../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  privacyEmbed,
  unexpectedErrorEmbed,
} from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { getStatsfmUserFromDiscordUser } from '../../../util/getStatsfmUserFromDiscordUser';
import {
  createPaginationComponentTypes,
  createPaginationManager,
} from '../../../util/PaginationManager';
import { PrivacyManager } from '../../../util/PrivacyManager';
import { URLs } from '../../../util/URLs';
import { reportError } from '../../../util/Sentry';
import { Analytics } from '../../../util/Analytics';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);
const analytics = container.resolve(Analytics);

const TopTracksComponents = createPaginationComponentTypes('top-tracks');

export const topTracksSubCommand: SubcommandFunction<
  (typeof TopCommand)['options']['tracks']
> = async ({ interaction, args, statsfmUser: statsfmUserSelf, respond }) => {
  const targetUser = args.user?.user ?? interaction.user;
  const statsfmUser =
    targetUser === interaction.user
      ? statsfmUserSelf
      : await getStatsfmUserFromDiscordUser(targetUser);
  if (!statsfmUser) {
    await analytics.track('TOP_TRACKS_target_user_not_linked');
    return respond(interaction, {
      embeds: [notLinkedEmbed(targetUser)],
    });
  }

  const privacySettingCheck = privacyManager.doesHaveMatchingPrivacySettings(
    'topTracks',
    statsfmUser.privacySettings
  );
  if (!privacySettingCheck) {
    await analytics.track('TOP_TRACKS_privacy');
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          targetUser,
          privacyManager.getPrivacySettingsMessage('topTracks', 'topTracks')
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

  let topTracksData: TopTrack[] = [];

  try {
    topTracksData =
      (await statsfmApi.users.topTracks(statsfmUser.id, {
        range,
      })) ?? [];
  } catch (err) {
    const errorId = reportError(err, interaction);

    return respond(interaction, {
      embeds: [unexpectedErrorEmbed(errorId)],
    });
  }

  if (topTracksData.length === 0) {
    await analytics.track(`TOP_ARTISTS_${range}_no_data`);
    return respond(interaction, {
      embeds: [
        createEmbed()
          .setAuthor({
            name: `${targetUser.username}'s top ${rangeDisplay} tracks`,
            url: statsfmUser.profileUrl,
          })
          .setDescription('No tracks found.'),
      ],
    });
  }

  await analytics.track(`TOP_TRACKS_${range}`);

  const pagination = createPaginationManager(
    topTracksData ?? [],
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setAuthor({
          name: `${targetUser.username}'s top ${rangeDisplay} tracks`,
          url: statsfmUser.profileUrl,
        })
        .setDescription(
          currData
            .map((tracksData) => {
              const trackUrl = URLs.TrackUrl(tracksData.track.id);

              return `${tracksData.position}. [${
                tracksData.track.name
              }](${trackUrl})${
                tracksData.streams ? ` • **${tracksData.streams}** streams` : ''
              }${
                tracksData.playedMs
                  ? ` • ${getDuration(tracksData.playedMs)}`
                  : ''
              }`;
            })
            .join('\n')
        )
        .setFooter({ text: `Page ${currPage}/${totalPages}` });
    }
  );

  const message = await respond(
    interaction,
    pagination.createMessage<'reply'>(
      await pagination.current(),
      TopTracksComponents
    )
  );

  pagination.manageCollector(message, TopTracksComponents, interaction.user);

  return message;
};
