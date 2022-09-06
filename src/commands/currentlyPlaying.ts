import {
  Api,
  CurrentlyPlayingTrack,
  Range,
  RecentlyPlayedTrack,
  StreamStats,
} from '@statsfm/statsfm.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import { container } from 'tsyringe';

import { CurrentlyStreamingCommand } from '../interactions';
import { createCommand } from '../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  privacyEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { getDuration } from '../util/getDuration';
import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { PrivacyManager } from '../util/PrivacyManager';
import { URLs } from '../util/URLs';

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
      } catch (_) {
        return respond(interaction, {
          embeds: [unexpectedErrorEmbed()],
        });
      }
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

    let lastPlayedSong: RecentlyPlayedTrack | undefined;

    if (statsfmUser.privacySettings.recentlyPlayed) {
      if (!currentlyPlaying) {
        try {
          const recentlyPlayedTracks = await statsfmApi.users.recentlyStreamed(
            statsfmUser.id
          );
          lastPlayedSong = recentlyPlayedTracks[0];
        } catch (_) {
          return respond(interaction, {
            embeds: [unexpectedErrorEmbed()],
          });
        }
      }
    } else {
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            targetUser,
            privacyManager.getPrivacySettingsMessage(
              'currentlyPlaying',
              'recentlyPlayed'
            )
          ),
        ],
      });
    }

    if (!currentlyPlaying && !lastPlayedSong) {
      return respond(interaction, {
        embeds: [
          createEmbed()
            .setDescription(
              `There is no song currently playing and I could not find any recently played track to show.`
            )
            .toJSON(),
        ],
      });
    }

    let stats: StreamStats | undefined;
    if (statsfmUser.privacySettings.streamStats && showStats) {
      try {
        stats = await statsfmApi.users.trackStats(
          statsfmUser.id,
          currentlyPlaying?.track.id ?? lastPlayedSong!.track.id,
          { range }
        );
      } catch (_) {
        return respond(interaction, {
          embeds: [unexpectedErrorEmbed()],
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
      name: (currentlyPlaying ?? lastPlayedSong!).track.name,
      artists: (currentlyPlaying ?? lastPlayedSong!).track.artists,
      albums: (currentlyPlaying ?? lastPlayedSong!).track.albums,
      trackId: (currentlyPlaying ?? lastPlayedSong!).track.id,
      image: (currentlyPlaying ?? lastPlayedSong!).track.albums[0].image,
    };

    return respond(interaction, {
      embeds: [
        createEmbed()
          .setTimestamp()
          .setThumbnail(songData.image)
          .setTitle(
            `${targetUser.username} ${
              currentlyPlaying ? 'is currently playing' : 'last played'
            }: ${songData.name}`
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
                        : '0 minutes'
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
              label: 'View on Stats.fm',
              style: ButtonStyle.Link,
              url: URLs.TrackUrl(songData.trackId),
              emoji: {
                name: '🔗',
              },
            },
          ],
        },
      ],
    });
  })
  .build();
