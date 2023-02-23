import * as Sentry from '@sentry/node';
import { Api, CurrentlyPlayingTrack } from '@statsfm/statsfm.js';
import { MessageFlags } from 'discord.js';
import { container } from 'tsyringe';
import { CurrentlyPlayingMinimalCommand } from '../interactions/commands/currentlyPlayingMinimal';
import { createCommand } from '../util/Command';
import {
  invalidClientEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';
import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { URLs } from '../util/URLs';

const statsfmApi = container.resolve(Api);

export default createCommand(CurrentlyPlayingMinimalCommand)
  .addGuild('763775648819970068')
  .registerChatInput(async (interaction, args, statsfmUserSelf, respond) => {
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

    return respond(interaction, {
      content: `**${targetUser.tag}** is currently listening to **[${
        currentlyPlaying.track.name
      }](${URLs.TrackUrl(
        currentlyPlaying.track.id
      )})** by ${currentlyPlaying.track.artists
        .map((artist) => `**[${artist.name}](${URLs.ArtistUrl(artist.id)})**`)
        .join(', ')}.`,
      flags: MessageFlags.SuppressEmbeds,
    });
  })
  .build();
