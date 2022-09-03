import { Api, Range, TopArtist } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { TopCommand } from '../../../interactions';
import type { SubcommandFunction } from '../../../util/Command';
import { createEmbed, notLinkedEmbed, privacyEmbed } from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { getUserByDiscordId } from '../../../util/getUserByDiscordId';
import {
  createPaginationComponentTypes,
  createPaginationManager,
} from '../../../util/PaginationManager';
import { PrivacyManager } from '../../../util/PrivacyManager';
import { URLs } from '../../../util/URLs';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);

const TopArtistsComponents = createPaginationComponentTypes('top-artists');

export const topArtistsSubCommand: SubcommandFunction<
  typeof TopCommand['options']['0']
> = async (interaction, args, respond) => {
  const targetUser = args.user?.user ?? interaction.user;
  const data = await getUserByDiscordId(targetUser.id);
  if (!data)
    return respond(interaction, {
      embeds: [notLinkedEmbed(targetUser)],
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
    topArtistsData = await statsfmApi.users.topArtists(data.userId, {
      range,
    });
  } catch (_) {
    return respond(interaction, {
      embeds: [
        privacyEmbed(
          targetUser,
          privacyManager.getPrivacySettingsMessage('topArtists')
        ),
      ],
    });
  }

  const pagination = createPaginationManager(
    topArtistsData,
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setAuthor({
          name: `${targetUser.username}'s top ${rangeDisplay} artists`,
          url: URLs.ProfileUrl(data.userId),
        })
        .setDescription(
          currData
            .map((artistData) => {
              const artistUrl = URLs.ArtistUrl(artistData.artist.id);

              return `${artistData.position}. [${
                artistData.artist.name
              }](${artistUrl}) • ${
                artistData.streams ?? 0
              } streams • ${getDuration(artistData.playedMs ?? 0)}`;
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
