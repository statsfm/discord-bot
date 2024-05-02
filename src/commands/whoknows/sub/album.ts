import Api, { CurrentlyPlayingTrack, Range } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { WhoKnowsCommand } from '../../../interactions';
import { SubcommandFunction } from '../../../util/Command';
import { Analytics } from '../../../util/Analytics';
import {
  createEmbed,
  invalidClientEmbed,
  notLinkedEmbed,
  privacyEmbed,
  unexpectedErrorEmbed,
} from '../../../util/embed';
import { getCurrentlyPlaying } from '../../nowPlaying';
import { PrivacyManager } from '../../../util/PrivacyManager';
import { Config } from '../../../util/Config';
import {
  createPaginationComponentTypes,
  createPaginationManager,
} from '../../../util/PaginationManager';
import { getDuration } from '../../../util/getDuration';
import { setTimeout } from 'timers/promises';
import { WhoKnowsConsts } from '../whoknows';

const api = container.resolve(Api);
const config = container.resolve(Config);
const analytics = container.resolve(Analytics);
const privacyManager = container.resolve(PrivacyManager);

const WhoKnowsAlbumComponents =
  createPaginationComponentTypes('whoknows-album');

export const whoKnowsAlbumSubCommand: SubcommandFunction<
  (typeof WhoKnowsCommand)['options']['album']
> = async ({ interaction, args, statsfmUser, respond }) => {
  if (!interaction.guild || !interaction.guildId) {
    return respond(interaction, {
      content: 'This command can only be used in a server.',
    });
  }
  let albumIdStr = args.query;
  if (!albumIdStr) {
    if (!statsfmUser) {
      await analytics.track(
        'WHO_KNOWS_ALBUM_CURRENTLY_PLAYING_user_not_linked'
      );
      return respond(interaction, {
        embeds: [notLinkedEmbed(interaction.user)],
      });
    }
    // Get currently playing track
    let currentlyPlaying: CurrentlyPlayingTrack | undefined;

    if (!statsfmUser.privacySettings.currentlyPlaying) {
      await analytics.track(
        'WHO_KNOWS_ALBUM_CURRENTLY_PLAYING_user_privacy_currently_playing'
      );
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            interaction.user,
            privacyManager.getPrivacySettingsMessage(
              'nowPlaying',
              'currentlyPlaying'
            )
          ),
        ],
      });
    }
    try {
      currentlyPlaying = await getCurrentlyPlaying(statsfmUser, interaction);
    } catch (err) {
      const error = err as Error;
      if (error.message === 'invalid_client') {
        return respond(interaction, {
          embeds: [invalidClientEmbed()],
        });
      }
      return respond(interaction, {
        embeds: [unexpectedErrorEmbed(error.message)],
      });
    }

    if (!currentlyPlaying) {
      await analytics.track(
        'WHO_KNOWS_ALBUM_CURRENTLY_PLAYING_user_not_listening'
      );
      return respond(interaction, {
        content: `You currently aren't listening to anything, due to that I can't fetch the top listeners.`,
      });
    }
    albumIdStr = currentlyPlaying.track.albums[0].id.toString();
  }

  const albumId = Number(albumIdStr);
  if (isNaN(albumId)) {
    return respond(interaction, {
      content: 'Make sure to select an album from the option menu.',
      ephemeral: true,
    });
  }

  const album = await api.albums.get(albumId);

  const hasMembersCached = await api.http.get<{ success: boolean }>(
    `/private/discord/bot/servers/${interaction.guildId}/member-cache`,
    {
      headers: {
        Authorization: config.privateApiToken!,
      },
    }
  );

  if (hasMembersCached.success === false) {
    await respond(interaction, {
      content: WhoKnowsConsts.statusMessages.fetchingServerMembers,
    });
    const guildMembers = await interaction.guild.members.fetch();
    const amountOfRequests = Math.ceil(
      guildMembers.size / WhoKnowsConsts.guildMemberBatchSize
    );
    for (
      let i = 0;
      i < guildMembers.size;
      i += WhoKnowsConsts.guildMemberBatchSize
    ) {
      await api.http.post(
        `/private/discord/bot/servers/${interaction.guildId}/member-cache`,
        {
          body: JSON.stringify(
            Array.from(guildMembers)
              .slice(i, i + WhoKnowsConsts.guildMemberBatchSize)
              .map(([_, member]) => member.user.id)
          ),
          query: {
            batch: amountOfRequests > 1 ? true : false,
          },
          headers: {
            Authorization: config.privateApiToken!,
          },
        }
      );
      await setTimeout(1000);
      await respond(interaction, {
        content: WhoKnowsConsts.statusMessages.fetchingServerMembersCount(
          i,
          guildMembers.size
        ),
      });
    }
  }
  await respond(interaction, {
    content: WhoKnowsConsts.statusMessages.fetchingTopListeners,
  });

  let range = Range.LIFETIME;
  let rangeDisplay = 'lifetime';

  if (args.range === '4-weeks') {
    range = Range.WEEKS;
    rangeDisplay = 'past 4 weeks';
  }

  if (args.range === '6-months') {
    range = Range.MONTHS;
    rangeDisplay = 'past 6 months';
  }

  const data = await api.http.get<
    {
      position: number;
      streams: number;
      playedMs: number;
      user: {
        id: string;
        displayName: string;
        discordUserId: string | '';
      };
    }[]
  >(
    `/private/discord/bot/servers/${interaction.guildId}/top-listeners/albums/${albumId}`,
    {
      query: {
        range,
      },
      headers: {
        Authorization: config.privateApiToken!,
      },
    }
  );

  if (data.length === 0) {
    await analytics.track(`WHO_KNOWS_ALBUM_${range}_no_data`);
    return respond(interaction, {
      embeds: [
        createEmbed()
          .setTitle(`${album.name} by ${album.artists[0].name} in this server`)
          .setURL(`https://stats.fm/album/${albumId}`)
          .setFooter({ text: `Range: ${rangeDisplay}` })
          .setThumbnail(album.image ?? null)
          .setDescription('No listeners found.'),
      ],
    });
  }

  await analytics.track(`WHO_KNOWS_ALBUM_${range}`);

  const pagination = createPaginationManager(
    data,
    (currPage, totalPages, currData) => {
      return createEmbed()
        .setTitle(`${album.name} by ${album.artists[0].name} in this server`)
        .setURL(`https://stats.fm/album/${albumId}`)
        .setFooter({ text: `Range: ${rangeDisplay}` })
        .setThumbnail(album.image ?? null)
        .setDescription(
          currData
            .map((listener) => {
              return `${listener.position}. ${listener.user.discordUserId !== '' ? `${listener.user.displayName} (<@${listener.user.discordUserId}>)` : listener.user.displayName} • **${listener.streams}** streams • ${getDuration(listener.playedMs)}`;
            })
            .join('\n')
        )
        .setFooter({
          text: `Page ${currPage}/${totalPages} • Range: ${rangeDisplay}`,
        });
    }
  );

  const message = await respond(
    interaction,
    pagination.createMessage<'reply'>(
      await pagination.current(),
      WhoKnowsAlbumComponents
    )
  );

  pagination.manageCollector(
    message,
    WhoKnowsAlbumComponents,
    interaction.user
  );

  return message;
};
