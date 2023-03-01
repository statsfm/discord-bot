import * as Sentry from '@sentry/node';
import {
  Api,
  CurrentlyPlayingTrack,
  Range,
  StreamStats,
} from '@statsfm/statsfm.js';
import { MessageFlags } from 'discord.js';
import { container } from 'tsyringe';
import { CurrentlyPlayingMinimalCommand } from '../interactions/commands/currentlyPlayingMinimal';
import { createCommand } from '../util/Command';
import {
  createEmbed,
  invalidClientEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { URLs } from '../util/URLs';
import { murmur3 } from 'murmurhash-js';
import { getDuration } from '../util/getDuration';

const statsfmApi = container.resolve(Api);

export default createCommand(CurrentlyPlayingMinimalCommand)
  .addGuild('763775648819970068')
  .addGuild('901602034443227166')
  .registerChatInput(async (interaction, args, statsfmUserSelf, respond) => {
    let experimentHash =
      murmur3(`02-2023-currently_playing_minimal|${interaction.user.id}`) % 1e3;
    await interaction.deferReply();

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
          Sentry.captureException(err, {
            user: {
              id: interaction.user.id,
              username: interaction.user.tag,
            },
            extra: {
              interaction: interaction.toJSON(),
            },
          });
          return respond(interaction, {
            embeds: [unexpectedErrorEmbed()],
          });
        }
      }
    }

    if (!currentlyPlaying) {
      return respond(interaction, {
        content: `**${targetUser.tag}** is currently not listening to anything.`,
      });
    }

    const groups: [number, number][] = [
      [0, 300],
      [300, 600],
      [600, 900],
    ];

    let stats: StreamStats | undefined;
    if (
      statsfmUser.privacySettings.streamStats &&
      isInExperimentGroup(experimentHash, [groups[0], groups[1], groups[2]])
    ) {
      try {
        stats = await statsfmApi.users.trackStats(
          statsfmUser.id,
          currentlyPlaying.track.id,
          {
            range: Range.LIFETIME,
          }
        );
      } catch (_) {
        return respond(interaction, {
          embeds: [unexpectedErrorEmbed()],
        });
      }
    }

    const songByArtist = `**[${currentlyPlaying.track.name}](${URLs.TrackUrl(
      currentlyPlaying.track.id
    )})** by ${currentlyPlaying.track.artists
      .map((artist) => `**[${artist.name}](${URLs.ArtistUrl(artist.id)})**`)
      .join(', ')}`;

    const defaultTextMessage = `**${targetUser.tag}** is currently listening to ${songByArtist}.`;

    const embed = createEmbed()
      .setAuthor({
        name: `${targetUser.tag} is currently listening to`,
        iconURL: targetUser.displayAvatarURL(),
      })
      .setDescription(songByArtist)
      .setTimestamp()
      .setThumbnail(currentlyPlaying.track.albums[0].image);

    if (isInExperimentGroup(experimentHash, [groups[0]]) && stats) {
      return respond(interaction, {
        content: `${defaultTextMessage} **${
          stats.count ?? 0
        }** lifetime streams and ${
          stats.durationMs > 0 ? getDuration(stats.durationMs) : '**0** minutes'
        } total time streamed.`,
        flags: MessageFlags.SuppressEmbeds,
      });
    }

    if (isInExperimentGroup(experimentHash, [groups[1]])) {
      return respond(interaction, {
        embeds: [embed],
      });
    }

    if (isInExperimentGroup(experimentHash, [groups[2]]) && stats) {
      embed.setFooter({
        text: `Lifetime streams: ${stats.count ?? 0} • Total time streamed: ${
          stats.durationMs > 0
            ? getDuration(stats.durationMs, true)
            : '0 minutes'
        }`,
      });

      return respond(interaction, {
        embeds: [embed],
      });
    }

    return respond(interaction, {
      content: defaultTextMessage,
      flags: MessageFlags.SuppressEmbeds,
    });
  })
  .build();

function isInExperimentGroup(
  experimentHash: number,
  groups: [number, number][]
) {
  return groups.some(
    (group) => experimentHash >= group[0] && experimentHash < group[1]
  );
}
