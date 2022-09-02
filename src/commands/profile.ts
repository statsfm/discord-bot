import { Api, Range, StreamStats, UserPublic } from '@statsfm/statsfm.js';
import { APIEmbedField, ButtonStyle, ComponentType } from 'discord.js';
import { container } from 'tsyringe';

import { ProfileCommand } from '../interactions';
import { createCommand } from '../util/Command';
import {
  createEmbed,
  notLinkedEmbed,
  unexpectedErrorEmbed,
} from '../util/embed';

import { getUserByDiscordId } from '../util/getUserByDiscordId';
import { URLs } from '../util/URLs';

const statsfmApi = container.resolve(Api);

export default createCommand(ProfileCommand)
  .registerChatInput(async (interaction, args, respond) => {
    await interaction.deferReply();
    const targetUser = args.user?.user ?? interaction.user;
    const data = await getUserByDiscordId(targetUser.id);
    if (!data)
      return respond(interaction, {
        embeds: [notLinkedEmbed(targetUser)],
      });

    let user: UserPublic;

    try {
      user = await statsfmApi.users.get(data.userId);
    } catch (_) {
      return respond(interaction, {
        embeds: [unexpectedErrorEmbed(targetUser)],
      });
    }

    if (!user)
      return respond(interaction, {
        embeds: [notLinkedEmbed(targetUser)],
      });

    let stats: StreamStats;

    try {
      stats = await statsfmApi.users.stats(data.userId, {
        range: Range.LIFETIME,
      });
    } catch (_) {
      stats = {
        count: -1,
        durationMs: -1,
      };
    }

    const fields: APIEmbedField[] = [
      {
        name: 'Pronouns',
        value: user.profile?.pronouns ?? 'Unknown',
        inline: stats.count != -1,
      },
    ];

    if (stats.count != -1) {
      fields.push({
        name: 'Streams',
        value: stats.count.toLocaleString(),
        inline: true,
      });
      fields.push({
        name: 'Minutes streamed',
        value: `${Math.round(
          (stats.durationMs ?? 0) / 1000 / 60
        ).toLocaleString()} minutes`,
        inline: true,
      });
    }

    const bio = user.profile && user.profile.bio ? user.profile.bio : 'No bio';

    fields.push({
      name: 'Bio',
      value: bio,
    });

    return respond(interaction, {
      embeds: [
        createEmbed()
          .setTimestamp()
          .setThumbnail(user.image)
          .setAuthor({
            name: user.displayName,
          })
          .addFields(fields)
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
              url: URLs.ProfileUrl(user.customId ?? user.id),
              emoji: {
                name: '🔗',
              },
            },
            {
              type: ComponentType.Button,
              label: 'View on Spotify',
              style: ButtonStyle.Link,
              url: URLs.SpotifyProfileUrl(user.id),
              emoji: {
                id: '998272544870252624',
              },
            },
          ],
        },
      ],
    });
  })
  .build();
