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
import * as Sentry from '@sentry/node';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);

const TopArtistsComponents = createPaginationComponentTypes('top-artists');

export const topArtistsSubCommand: SubcommandFunction<
  typeof TopCommand['options']['0']
> = async (interaction, args, statsfmUserSelf, respond) => {
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
    'topArtists',
    statsfmUser.privacySettings
  );
  if (!privacySettingCheck)
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          targetUser,
          privacyManager.getPrivacySettingsMessage('topArtists', 'topArtists')
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

  let topArtistsData: TopArtist[] = [];

  try {
    topArtistsData = await statsfmApi.users.topArtists(statsfmUser.id, {
      range,
    });
  } catch (err) {
    Sentry.captureException(err);

    return respond(interaction, {
      embeds: [unexpectedErrorEmbed()],
    });
  }

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
              }](${artistUrl}) • ${artistData.streams ?? 0} streams${
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
