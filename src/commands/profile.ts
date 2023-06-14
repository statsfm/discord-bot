import { Api, Range, StreamStats } from '@statsfm/statsfm.js';
import {
  APIEmbedField,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { container } from 'tsyringe';

import { ProfileCommand } from '../interactions';
import { Analytics } from '../util/analytics';
import { createCommand } from '../util/Command';
import { createEmbed, notLinkedEmbed, privacyEmbed } from '../util/embed';

import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { PrivacyManager } from '../util/PrivacyManager';
import { kAnalytics } from '../util/tokens';

const statsfmApi = container.resolve(Api);
const privacyManager = container.resolve(PrivacyManager);
const analytics = container.resolve<Analytics>(kAnalytics);

export default createCommand(ProfileCommand)
  .registerChatInput(async ({ interaction, args, statsfmUser: statsfmUserSelf, respond }) => {
    await interaction.deferReply();
    const targetUser = args.user?.user ?? interaction.user;
    const statsfmUser =
      targetUser === interaction.user
        ? statsfmUserSelf
        : await getStatsfmUserFromDiscordUser(targetUser);
    if (!statsfmUser) {
      await analytics.trackEvent('PROFILE_target_user_not_linked', interaction.user.id);
      return respond(interaction, {
        embeds: [notLinkedEmbed(targetUser)],
      });
    }

    const privacySettingCheck = privacyManager.doesHaveMatchingPrivacySettings(
      'profile',
      statsfmUser.privacySettings
    );
    if (!privacySettingCheck) {
      await analytics.trackEvent('PROFILE_privacy', interaction.user.id);
      return respond(interaction, {
        embeds: [
          privacyEmbed(
            targetUser,
            privacyManager.getPrivacySettingsMessage('profile', 'profile')
          ),
        ],
      });
    }

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
        value: statsfmUser.profile.pronouns ?? 'Not assigned',
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

    await analytics.trackEvent('PROFILE', interaction.user.id);

    return respond(interaction, {
      embeds: [
        createEmbed()
          .setTimestamp()
          .setThumbnail(statsfmUser.image ?? '')
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
              label: 'View on stats.fm',
              style: ButtonStyle.Link,
              url: statsfmUser.profileUrl,
              emoji: {
                name: '🔗',
              },
            },
            ...(statsfmUser.privacySettings.connections
              ? [
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel('View on Spotify')
                  .setURL(statsfmUser.profileUrlSpotify)
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
