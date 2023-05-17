import {
  Api,
  CurrentlyPlayingTrack,
  Range,
  StreamStats
} from '@statsfm/statsfm.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, escapeMarkdown, Collection } from 'discord.js';
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
import { PrivacyManager } from '../util/PrivacyManager';
import { CooldownManager } from '../util/CooldownManager';
import { getDuration } from '../util/getDuration';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);
const cooldownManager = container.resolve(CooldownManager);

const cache = new Collection<string, Collection<number, StreamStats>>();

export default createCommand(NowPlayingCommand)
  .setOwnCooldown()
  .registerChatInput(async ({ interaction, args, statsfmUser: statsfmUserSelf, respond }) => {
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

    const artists = currentlyPlaying.track.artists;

    const songByArtist = `**[${escapeMarkdown(currentlyPlaying.track.name)}](${URLs.TrackUrl(
      currentlyPlaying.track.id
    )})** by ${artists.slice(0, 3).map((artist) => `**[${escapeMarkdown(artist.name)}](${URLs.ArtistUrl(artist.id)})**`).join(', ')}${artists.length > 3 ? ` and [${artists.length - 3} more](${URLs.TrackUrl(currentlyPlaying.track.id)})` : ''}`;

    cooldownManager.set(interaction.commandName, interaction.user.id, 120 * 1_000)

    const message = await respond(interaction, {
      content: `**${targetUser.tag}** is currently listening to ${songByArtist}.`,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel('More info').setCustomId(`${interaction.id}:more-info`).setStyle(ButtonStyle.Secondary))
      ],
      flags: MessageFlags.SuppressEmbeds,
    });

    const collector = await message.createMessageComponentCollector({
      filter: (componentInteraction) => componentInteraction.customId.startsWith(interaction.id),
      time: 5 * 60 * 1_000,
    });

    collector.on('collect', async (componentInteraction) => {
      await componentInteraction.deferReply({ ephemeral: true });
      if (componentInteraction.customId.endsWith('more-info') && componentInteraction.isButton()) {
        const userCache = cache.get(statsfmUser.id) ?? cache.set(statsfmUser.id, new Collection()).get(statsfmUser.id)!;
        let stats = userCache.get(currentlyPlaying!.track.id);
        if (!stats && statsfmUser.privacySettings.streamStats && statsfmUser.isPlus) {
          try {
            stats = await statsfmApi.users.trackStats(statsfmUser.id, currentlyPlaying!.track.id, { range: Range.LIFETIME });

            userCache.set(currentlyPlaying!.track.id, stats);
          } catch (err: any) {
            if (err.data && err.data.message == "Forbidden resource") { } else {
              const errorId = reportError(err, componentInteraction);

              return void componentInteraction.editReply({
                embeds: [unexpectedErrorEmbed(errorId)],
              });
            }
          }
        }

        return void componentInteraction.editReply({
          embeds: [
            createEmbed()
              .setAuthor({
                name: `${targetUser.tag} is currently listening to`,
                iconURL: targetUser.displayAvatarURL(),
              })
              .setDescription(songByArtist)
              .setTimestamp()
              .setThumbnail(currentlyPlaying!.track.albums[0].image)
              .setFooter(statsfmUser.isPlus && stats ? {
                text: `Lifetime streams: ${stats!.count ?? 0} • Total time streamed: ${stats!.durationMs > 0
                  ? getDuration(stats!.durationMs, true)
                  : '0 minutes'
                  }`,
              } : null)
          ],
          components: [
            ...(currentlyPlaying!.track.externalIds.spotify ? [new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setLabel('View on Spotify').setStyle(ButtonStyle.Link).setEmoji({ id: '998272544870252624' }).setURL(
              URLs.TrackUrlSpotify(currentlyPlaying!.track.externalIds.spotify[0])
            ))] : []),
          ],
        });
      }
      return;
    });

    collector.on('end', async () => {
      const userCache = cache.get(statsfmUser.id);
      if (userCache) userCache.delete(currentlyPlaying!.track.id);
      await message.edit({
        components: [],
      });
    });

    return;
  })
  .build();
