import { Api, Range, TopArtist } from '@statsfm/statsfm.js';
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
import { kAnalytics } from '../../../util/tokens';
import { Analytics } from '../../../util/analytics';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);
const analytics = container.resolve<Analytics>(kAnalytics);

const TopArtistsComponents = createPaginationComponentTypes('top-artists');

export const topArtistsSubCommand: SubcommandFunction<
  typeof TopCommand['options']['artists']
> = async ({ interaction, args, statsfmUser: statsfmUserSelf, respond }) => {
  const targetUser = args.user?.user ?? interaction.user;
  const statsfmUser =
    targetUser === interaction.user
      ? statsfmUserSelf
      : await getStatsfmUserFromDiscordUser(targetUser);
  if (!statsfmUser) {
    await analytics.trackEvent(
      'TOP_ARTISTS_target_user_not_linked',
      interaction.user.id
    );
    return respond(interaction, {
      embeds: [notLinkedEmbed(targetUser)],
    });
  }

  const privacySettingCheck = privacyManager.doesHaveMatchingPrivacySettings(
    'topArtists',
    statsfmUser.privacySettings
  );
  if (!privacySettingCheck) {
    await analytics.trackEvent('TOP_ARTISTS_privacy', interaction.user.id);
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          targetUser,
          privacyManager.getPrivacySettingsMessage('topArtists', 'topArtists')
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

  let topArtistsData: TopArtist[] = [];

  try {
    topArtistsData = await statsfmApi.users.topArtists(statsfmUser.id, {
      range,
    });
  } catch (err) {
    const errorId = reportError(err, interaction);

    return respond(interaction, {
      embeds: [unexpectedErrorEmbed(errorId)],
    });
  }

  await analytics.trackEvent(`TOP_ARTISTS_${range}`, interaction.user.id);

  const pagination = createPaginationManager(
    topArtistsData,
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setAuthor({
          name: `${targetUser.username}'s top ${rangeDisplay} artists`,
          url: statsfmUser.profileUrl,
        })
        .setDescription(
          currData
            .map((artistData) => {
              const artistUrl = URLs.ArtistUrl(artistData.artist.id);

              return `${artistData.position}. [${
                artistData.artist.name
              }](${artistUrl})${
                artistData.streams ? ` • **${artistData.streams}** streams` : ''
              }${
                artistData.playedMs
                  ? ` • ${getDuration(artistData.playedMs)}`
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
      TopArtistsComponents
    )
  );

  pagination.manageCollector(message, TopArtistsComponents, interaction.user);

  return message;
};
