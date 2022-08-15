import {
  Api,
  CurrentlyPlayingTrack,
  Range,
  StreamStats,
} from '@statsfm/statsfm.js';
import {
  APIInteraction,
  ButtonStyle,
  ComponentType,
  InteractionResponseType,
} from 'discord-api-types/v9';
import { container } from 'tsyringe';

import { CurrentlyStreamingCommand } from '../interactions';
import type { ArgumentsOf } from '../util/ArgumentsOf';
import { Command, RespondFunction } from '../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { getDuration } from '../util/getDuration';
import { getUserByDiscordId } from '../util/getUserByDiscordId';
import { getUserFromInteraction } from '../util/getUserFromInteraction';
import { URLs } from '../util/URLs';

const statsfmApi = container.resolve(Api);

export default class CurrentlyStreaming extends Command<
  typeof CurrentlyStreamingCommand
> {
  constructor() {
    super({
      commandObject: CurrentlyStreamingCommand,
    });
  }

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof CurrentlyStreamingCommand>,
    respond: RespondFunction
  ): Promise<void> {
    await respond(interaction, {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    const showStats = args['show-stats'] ?? false;

    const interactionUser = getUserFromInteraction(interaction);
    const targetUser =
      args.user?.member?.user ?? args.user?.user ?? interactionUser;
    const data = await getUserByDiscordId(targetUser.id);
    if (!data)
      return respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { embeds: [notLinkedEmbed(targetUser)] },
      });

    let currentlyPlaying: CurrentlyPlayingTrack | undefined;

    try {
      currentlyPlaying = await statsfmApi.users.currentlyStreaming(data.userId);
    } catch (err) {
      const error = err as any;
      if (
        error.data &&
        error.data.message &&
        error.data.message == 'Nothing playing'
      ) {
        currentlyPlaying = undefined;
      } else
        return respond(interaction, {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            embeds: [unexpectedErrorEmbed(targetUser)],
          },
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

    if (!currentlyPlaying) {
      return respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [
            createEmbed()
              .setTitle(`${targetUser.username} is not playing any music.`)
              .toJSON(),
          ],
        },
      });
    }

    let stats: StreamStats;

    try {
      stats = await statsfmApi.users.trackStats(
        data.userId,
        currentlyPlaying.track.id,
        { range }
      );
    } catch (_) {
      return respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [unexpectedErrorEmbed(targetUser)],
        },
      });
    }

    await respond(interaction, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          createEmbed()
            .setTimestamp()
            .setThumbnail(currentlyPlaying.track.albums[0].image)
            .setTitle(
              `${targetUser.username} is currently playing: ${currentlyPlaying.track.name}`
            )
            .addFields([
              {
                name: `Artist${
                  currentlyPlaying.track.artists.length > 1 ? 's' : ''
                }`,
                inline: showStats ? false : true,
                value: currentlyPlaying.track.artists
                  .map(
                    (artist) => `[${artist.name}](${URLs.ArtistUrl(artist.id)})`
                  )
                  .join(', '),
              },
              {
                name: `Album${
                  currentlyPlaying.track.albums.length > 1 ? 's' : ''
                }`,
                inline: showStats ? false : true,
                value:
                  currentlyPlaying.track.albums
                    .slice(0, 3)
                    .map(
                      (album) => `[${album.name}](${URLs.AlbumUrl(album.id)})`
                    )
                    .join(', ') +
                  (currentlyPlaying.track.albums.length > 3
                    ? ` + [${
                        currentlyPlaying.track.albums.length - 3
                      } more](${URLs.TrackUrl(currentlyPlaying.track.id)})`
                    : ''),
              },
              ...(showStats
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
                disabled: true,
                type: ComponentType.Button,
                custom_id: 'is_playing',
                style: ButtonStyle.Secondary,
                label: currentlyPlaying.isPlaying ? 'Playing' : 'Paused',
              },
              {
                type: ComponentType.Button,
                label: 'View on Stats.fm',
                style: ButtonStyle.Link,
                url: URLs.TrackUrl(currentlyPlaying.track.id),
                emoji: {
                  name: '🔗',
                },
              },
            ],
          },
        ],
      },
    });
  }
}
