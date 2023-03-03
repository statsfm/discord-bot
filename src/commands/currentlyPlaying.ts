import {
  Api,
  CurrentlyPlayingTrack,
  Range,
  StreamStats,
} from '@statsfm/statsfm.js';
import { ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { container } from 'tsyringe';
import { CurrentlyStreamingCommand } from '../interactions';
import { createCommand } from '../util/Command';
import {
  createEmbed,
  invalidClientEmbed,
  notLinkedEmbed,
  privacyEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { getDuration } from '../util/getDuration';
import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { PrivacyManager } from '../util/PrivacyManager';
import { URLs } from '../util/URLs';
import { reportError } from '../util/Sentry';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);

export default createCommand(CurrentlyStreamingCommand)
  .registerChatInput(async (interaction, args, statsfmUserSelf, respond) => {
    await interaction.deferReply();
    const showStats = args['show-stats'] ?? false;

    const targetUser = args.user?.user ?? interaction.user;
    const statsfmUser =
      targetUser === interaction.user
        ? statsfmUserSelf
        : await getStatsfmUserFromDiscordUser(targetUser);
    if (!statsfmUser)
      return respond(interaction, {
        embeds: [notLinkedEmbed(targetUser)],
      });

    let currentlyPlaying: CurrentlyPlayingTrack | undefined;

    if (statsfmUser.privacySettings.currentlyPlaying) {
      try {
        currentlyPlaying = await statsfmApi.users.currentlyStreaming(
          statsfmUser.id
        );
      } catch (err) {
        const error = err as any;
        if (
          error.data &&
          error.data.message &&
          error.data.message == 'Nothing playing'
        ) {
          currentlyPlaying = undefined;
        } else if (
          error.data &&
          error.data.message &&
          error.data.message.includes('invalid_client')
        ) {
          return respond(interaction, {
            embeds: [invalidClientEmbed()],
          });
        } else {
          const errorId = reportError(err, interaction);
          return respond(interaction, {
            embeds: [unexpectedErrorEmbed(errorId)],
          });
        }
      }
    }

    if (!currentlyPlaying) {
      return respond(interaction, {
        embeds: [
          createEmbed()
            .setDescription(
              `There is no song currently playing. Use </recently-played:0> to see what you've been listening to recently.`
            )
            .toJSON(),
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

    let stats: StreamStats | undefined;
    if (statsfmUser.privacySettings.streamStats && showStats) {
      try {
        stats = await statsfmApi.users.trackStats(
          statsfmUser.id,
          currentlyPlaying?.track.id,
          { range }
        );
      } catch (err) {
        const errorId = reportError(err, interaction);

        return respond(interaction, {
          embeds: [unexpectedErrorEmbed(errorId)],
        });
      }
    } else if (!statsfmUser.privacySettings.streamStats) {
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            targetUser,
            privacyManager.getPrivacySettingsMessage(
              'currentlyPlaying',
              'streamStats'
            )
          ),
        ],
      });
    }

    const songData = {
      name: currentlyPlaying.track.name,
      artists: currentlyPlaying.track.artists,
      albums: currentlyPlaying.track.albums,
      trackId: currentlyPlaying.track.id,
      image: currentlyPlaying.track.albums[0].image,
      externalIds: currentlyPlaying.track.externalIds,
    };

    return respond(interaction, {
      embeds: [
        createEmbed()
          .setTimestamp()
          .setThumbnail(songData.image)
          .setTitle(
            `${targetUser.username} is currently playing: ${songData.name}`
          )
          .addFields([
            {
              name: `Artist${songData.artists.length > 1 ? 's' : ''}`,
              inline: showStats ? false : true,
              value: songData.artists
                .map(
                  (artist) => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`
                )
                .join(', '),
            },
            {
              name: `Album${songData.albums.length > 1 ? 's' : ''}`,
              inline: showStats ? false : true,
              value:
                songData.albums
                  .slice(0, 3)
                  .map((album) => `[${album.name}](${URLs.AlbumUrl(album.id)})`)
                  .join(', ') +
                (songData.albums.length > 3
                  ? ` + [${songData.albums.length - 3} more](${URLs.TrackUrl(
                      songData.trackId
                    )})`
                  : ''),
            },
            ...(showStats && stats
              ? [
                  {
                    name: `Streams ${rangeDisplay}`,
                    value: `${stats.count}x`,
                    inline: true,
                  },
                  {
                    name: `Time streamed (${rangeDisplay})`,
                    value: `${
                      stats.durationMs > 0
                        ? getDuration(stats.durationMs)
                        : '**0** minutes'
                    }`,
                    inline: true,
                  },
                ]
              : []),
          ])
          .toJSON(),
      ],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: 'View on stats.fm',
              style: ButtonStyle.Link,
              url: URLs.TrackUrl(songData.trackId),
              emoji: {
                name: '🔗',
              },
            },
            ...(songData.externalIds.spotify?.length
              ? [
                  new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setURL(
                      URLs.TrackUrlSpotify(songData.externalIds.spotify[0])
                    )
                    .setEmoji({
                      id: '998272544870252624',
                    }),
                ]
              : []),
          ],
        },
      ],
    });
  })
  .build();
