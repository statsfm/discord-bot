import {
  Api,
  CurrentlyPlayingTrack,
  Range,
  StreamStats,
} from '@statsfm/statsfm.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  Collection,
  ChatInputCommandInteraction,
  CollectedInteraction,
  User,
  escapeMarkdown,
  ComponentType,
} from 'discord.js';
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
import { StatsfmUser } from '../util/StatsfmUser';
import { Util } from '../util/Util';
import { Analytics } from '../util/Analytics';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);
const cooldownManager = container.resolve(CooldownManager);
const analytics = container.resolve(Analytics);

const cache = new Collection<string, Collection<number, StreamStats>>();

async function getStats(
  statsfmUser: StatsfmUser,
  currentlyPlaying: CurrentlyPlayingTrack
) {
  return statsfmApi.users
    .trackStats(statsfmUser.id, currentlyPlaying.track.id, {
      range: Range.LIFETIME,
    })
    .catch((error) => {
      if (!(error && error.message == 'Forbidden resource')) throw new Error();
      return undefined;
    });
}

async function getCurrentlyPlaying(
  statsfmUser: StatsfmUser,
  interaction: ChatInputCommandInteraction
) {
  return statsfmApi.users.currentlyStreaming(statsfmUser.id).catch((error) => {
    if (
      error.message == 'Nothing playing' ||
      error.message == 'User is playing local track'
    ) {
      return undefined;
    }
    if (error.message.includes('invalid_client')) {
      throw new Error('invalid_client');
    }
    throw new Error(reportError(error, interaction));
  });
}

function getFormattedSongArtist(currentlyPlaying: CurrentlyPlayingTrack) {
  const artists = currentlyPlaying.track.artists;

  // Add ...s to the end of the song name if it's too long
  const songUrl = `[${escapeMarkdown(
    currentlyPlaying.track.name.length > 50
      ? `${currentlyPlaying.track.name.slice(0, 50)}...`
      : currentlyPlaying.track.name
  )}](${URLs.TrackUrl(currentlyPlaying.track.id)})`;

  const artistUrl = (artist: { name: string; id: number }) =>
    `[${escapeMarkdown(artist.name)}](${URLs.ArtistUrl(artist.id)})`;

  const artistText = `${artists.slice(0, 3).map(artistUrl).join(', ')}`;

  const moreArtists =
    artists.length > 3
      ? ` and [${artists.length - 3} more](${URLs.TrackUrl(
          currentlyPlaying.track.id
        )})`
      : '';

  return `${songUrl} by ${artistText}${moreArtists}`;
}

async function onCollector(
  statsfmUser: StatsfmUser,
  targetUser: User,
  currentlyPlaying: CurrentlyPlayingTrack,
  componentInteraction: CollectedInteraction
) {
  await componentInteraction.deferReply({ ephemeral: true });

  if (!componentInteraction.isButton()) return;
  if (!componentInteraction.customId.endsWith('more-info')) return;

  if (!cache.has(statsfmUser.id)) cache.set(statsfmUser.id, new Collection());
  const userCache = cache.get(statsfmUser.id)!;

  let stats = userCache.get(currentlyPlaying.track.id);

  if (!stats && statsfmUser.privacySettings.streamStats && statsfmUser.isPlus) {
    try {
      stats = await getStats(statsfmUser, currentlyPlaying);
    } catch (err: any) {
      return void componentInteraction.editReply({
        embeds: [unexpectedErrorEmbed(reportError(err, componentInteraction))],
      });
    }
  }

  if (stats) userCache.set(currentlyPlaying.track.id, stats);

  const embed = createEmbed()
    .setAuthor({
      name: `${Util.getDiscordUserTag(targetUser)} is currently listening to`,
      iconURL: targetUser.displayAvatarURL(),
    })
    .setDescription(getFormattedSongArtist(currentlyPlaying))
    .setTimestamp()
    .setThumbnail(currentlyPlaying.track.albums[0].image);

  if (statsfmUser.isPlus && stats) {
    const statsDuration =
      stats.durationMs > 0 ? getDuration(stats.durationMs, true) : '0 minutes';
    embed.setFooter({
      text: `Lifetime streams: ${stats.count} • Total time streamed: ${statsDuration}`,
    });
  }

  await analytics.track('NOW_PLAYING_more_info_button');

  return void componentInteraction.editReply({
    embeds: [embed],
    components: [
      ...(currentlyPlaying.track.externalIds.spotify
        ? [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setLabel('View on Spotify')
                .setStyle(ButtonStyle.Link)
                .setEmoji({ id: '998272544870252624' })
                .setURL(
                  URLs.TrackUrlSpotify(
                    currentlyPlaying.track.externalIds.spotify[0]
                  )
                )
            ),
          ]
        : []),
    ],
  });
}

export default createCommand(NowPlayingCommand)
  .setOwnCooldown()
  .registerChatInput(
    async ({ interaction, args, statsfmUser: statsfmUserSelf, respond }) => {
      await interaction.deferReply();

      const targetUser = args.user?.user ?? interaction.user;
      const statsfmUser =
        targetUser === interaction.user
          ? statsfmUserSelf
          : await getStatsfmUserFromDiscordUser(targetUser);

      if (!statsfmUser) {
        await analytics.track('NOW_PLAYING_target_user_not_linked');
        return respond(interaction, {
          embeds: [notLinkedEmbed(targetUser)],
        });
      }

      let currentlyPlaying: CurrentlyPlayingTrack | undefined;

      if (!statsfmUser.privacySettings.currentlyPlaying) {
        await analytics.track(
          'NOW_PLAYING_target_user_privacy_currently_playing'
        );
        return respond(interaction, {
          embeds: [
            privacyEmbed(
              targetUser,
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
        cooldownManager.set(
          interaction.commandName,
          interaction.guildId ?? interaction.channelId,
          interaction.user.id,
          30 * 1_000
        );
        await analytics.track('NOW_PLAYING_target_user_not_listening');
        return respond(interaction, {
          content: `**${Util.getDiscordUserTag(
            targetUser
          )}** is currently not listening to anything or is listening to a local track.`,
        });
      }

      cooldownManager.set(
        interaction.commandName,
        interaction.guildId ?? interaction.channelId,
        interaction.user.id,
        120 * 1_000
      );

      const message = await respond(interaction, {
        content: `**${Util.getDiscordUserTag(
          targetUser
        )}** is currently listening to ${getFormattedSongArtist(
          currentlyPlaying
        )}.`,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel('More info')
              .setCustomId(`${interaction.id}:more-info`)
              .setStyle(ButtonStyle.Secondary)
          ),
        ],
        flags: MessageFlags.SuppressEmbeds,
      });

      await analytics.track('NOW_PLAYING_command_run');

      const collector =
        message.createMessageComponentCollector<ComponentType.Button>({
          filter: (componentInteraction) =>
            componentInteraction.customId.startsWith(interaction.id),
          time: 5 * 60 * 1_000,
        });

      collector.on(
        'collect',
        onCollector.bind(this, statsfmUser, targetUser, currentlyPlaying)
      );

      collector.on('end', async (buttonInteractions) => {
        const userCache = cache.get(statsfmUser.id);
        if (userCache) userCache.delete(currentlyPlaying!.track.id);
        const lastInteraction = buttonInteractions.last();
        if (lastInteraction)
          await lastInteraction.update({
            components: [],
          });
      });
    }
  )
  .build();
