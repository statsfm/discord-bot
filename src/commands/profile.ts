import { Api, Range, StreamStats } from '@statsfm/statsfm.js';
import { APIEmbedField, ButtonStyle, ComponentType } from 'discord.js';
import { container } from 'tsyringe';

import { ProfileCommand } from '../interactions';
import { createCommand } from '../util/Command';
import { createEmbed, notLinkedEmbed, privacyEmbed } from '../util/embed';

import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { PrivacyManager } from '../util/PrivacyManager';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);

export default createCommand(ProfileCommand)
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

    const privacySettingCheck = privacyManager.doesHaveMatchingPrivacySettings(
      'profile',
      statsfmUser.privacySettings
    );
    if (!privacySettingCheck)
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            targetUser,
            privacyManager.getPrivacySettingsMessage('profile', 'profile')
          ),
        ],
      });

    let stats: StreamStats;

    try {
      stats = await statsfmApi.users.stats(statsfmUser.id, {
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
        value: statsfmUser.profile.pronouns ?? 'Unknown',
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

    const bio =
      statsfmUser.profile && statsfmUser.profile.bio
        ? statsfmUser.profile.bio
        : 'No bio';

    fields.push({
      name: 'Bio',
      value: bio,
    });

    return respond(interaction, {
      embeds: [
        createEmbed()
          .setTimestamp()
          .setThumbnail(statsfmUser.image)
          .setAuthor({
            name: statsfmUser.displayName,
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
              url: statsfmUser.profileUrl,
              emoji: {
                name: '🔗',
              },
            },
            {
              type: ComponentType.Button,
              label: 'View on Spotify',
              style: ButtonStyle.Link,
              url: statsfmUser.profileUrlSpotify,
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
