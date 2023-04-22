import {
  Api,
  CurrentlyPlayingTrack,
  Range,
  StreamStats,
} from '@statsfm/statsfm.js';
import { MessageFlags } from 'discord.js';
import { container } from 'tsyringe';
import { NowPlayingCommand } from '../interactions/commands/nowPlaying';
import { createCommand } from '../util/Command';
import {
  createEmbed,
  invalidClientEmbed,
  notLinkedEmbed,
  privacyEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { reportError } from '../util/Sentry';
import { URLs } from '../util/URLs';
import { getDuration } from '../util/getDuration';
import { PrivacyManager } from '../util/PrivacyManager';
import { CooldownManager } from '../util/CooldownManager';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);
const cooldownManager = container.resolve(CooldownManager);

export default createCommand(NowPlayingCommand)
  .setOwnCooldown()
  .registerChatInput(async (interaction, args, statsfmUserSelf, respond) => {
    await interaction.deferReply();
    const moreInfo = args['show-info'] ?? false;

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
          currentlyPlaying = await statsfmApi.users
            .currentlyStreaming(statsfmUser.id)
            .catch(() => undefined);
          if (!currentlyPlaying) {
            const errorId = reportError(err, interaction);

            return respond(interaction, {
              embeds: [unexpectedErrorEmbed(errorId)],
            });
          }
        }
      }
    } else {
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            targetUser,
            privacyManager.getPrivacySettingsMessage(
              'currentlyPlayingMinimal',
              'currentlyPlaying'
            )
          ),
        ],
      });
    }

    if (!currentlyPlaying) {
      cooldownManager.set(interaction.commandName, interaction.user.id, 30 * 1_000)
      return respond(interaction, {
        content: `**${targetUser.tag}** is currently not listening to anything.`,
      });
    }

    let stats: StreamStats | undefined;
    if (statsfmUser.privacySettings.streamStats && moreInfo && statsfmUser.isPlus) {
      try {
        stats = await statsfmApi.users.trackStats(
          statsfmUser.id,
          currentlyPlaying.track.id,
          {
            range: Range.LIFETIME,
          }
        );
      } catch (err) {
        stats = await statsfmApi.users
          .trackStats(statsfmUser.id, currentlyPlaying.track.id, {
            range: Range.LIFETIME,
          })
          .catch(() => undefined);
        if (!stats) {
          const errorId = reportError(err, interaction);

          return respond(interaction, {
            embeds: [unexpectedErrorEmbed(errorId)],
          });
        }
      }
    } else if (!statsfmUser.privacySettings.streamStats && moreInfo && statsfmUser.isPlus) {
      cooldownManager.set(interaction.commandName, interaction.user.id, 30 * 1_000)
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            targetUser,
            privacyManager.getPrivacySettingsMessage(
              'currentlyPlayingMinimal',
              'streamStats'
            )
          ),
        ],
      });
    }

    const artists = currentlyPlaying.track.artists;

    const songByArtist = `**[${currentlyPlaying.track.name}](${URLs.TrackUrl(
      currentlyPlaying.track.id
    )})** by ${artists.slice(0, 3).map((artist) => `**[${artist.name}](${URLs.ArtistUrl(artist.id)})**`).join(', ')}${artists.length > 3 ? ` and [${artists.length - 3} more](${URLs.TrackUrl(currentlyPlaying.track.id)})` : ''}`;


    if (
      moreInfo
    ) {
      const embed = createEmbed()
        .setAuthor({
          name: `${targetUser.tag} is currently listening to`,
          iconURL: targetUser.displayAvatarURL(),
        })
        .setDescription(songByArtist)
        .setTimestamp()
        .setThumbnail(currentlyPlaying.track.albums[0].image);

      if (statsfmUser.isPlus && stats) {
        embed.setFooter({
          text: `Lifetime streams: ${stats.count ?? 0} • Total time streamed: ${stats.durationMs > 0
            ? getDuration(stats.durationMs, true)
            : '0 minutes'
            }`,
        });
      }

      cooldownManager.set(interaction.commandName, interaction.user.id, 120 * 1_000)

      return respond(interaction, {
        embeds: [embed],
      });
    }

    cooldownManager.set(interaction.commandName, interaction.user.id, 60 * 1_000)

    return respond(interaction, {
      content: `**${targetUser.tag}** is currently listening to ${songByArtist}.`,
      flags: MessageFlags.SuppressEmbeds,
    });
  })
  .build();