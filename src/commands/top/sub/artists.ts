import { Api, Range, TopArtist } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import type { TopCommand } from '../../../interactions/commands/top';
import type { SubcommandFunction } from '../../../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../../../util/embed';
import { getDuration } from '../../../util/getDuration';
import { getUserByDiscordId } from '../../../util/getUserByDiscordId';
import { URLs } from '../../../util/URLs';

const statsfmApi = container.resolve(Api);

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
      embeds: [unexpectedErrorEmbed(targetUser)],
    });
  }

  const embedDescription = topArtistsData
    .slice(0, 10)
    .map((artistData) => {
      const artistUrl = URLs.ArtistUrl(artistData.artist.id);

      return `${artistData.position}. [${
        artistData.artist.name
      }](${artistUrl}) • ${artistData.streams ?? 0} streams • ${getDuration(
        artistData.playedMs ?? 0
      )}`;
    })
    .join('\n');

  return respond(interaction, {
    embeds: [
      createEmbed()
        .setTitle(`${targetUser.username}'s top artists ${rangeDisplay}`)
        .setDescription(embedDescription)
        .toJSON(),
    ],
  });
};
