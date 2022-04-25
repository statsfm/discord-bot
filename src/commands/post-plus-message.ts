import {
  SlashCommand,
  SlashCreator,
  MessageOptions,
  ApplicationCommandPermissionType,
  CommandPermissions
} from 'slash-create';
import { MessageActionRow, MessageButton, TextChannel } from 'discord.js';
import { config } from '../util/config';
import { client } from '..';

const permissions: CommandPermissions = {};
permissions[config.discord.guildId] = [
  {
    id: config.discord.roles.admin,
    permission: true,
    type: ApplicationCommandPermissionType.ROLE
  }
];

export default class UnlinkCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'post-plus-message',
      description: 'Post the plus link message in the rules-and-info-channel',
      guildIDs: config.discord.guildId,
      permissions,
      defaultPermission: false
    });
  }

  async run(): Promise<string | MessageOptions | void> {
    const rulesAndInfoChannel = (await client.channels.fetch(
      config.discord.rolesAndInfoChannel
    )) as TextChannel;
    await rulesAndInfoChannel.send({
      content: [
        '**➥ Linking your Discord with your Spotistats account**',
        '**1.** Click the "Link" button below to start the process.',
        '**2.** After you have clicked on the button below, please click on the "Authorize" button.',
        '**3.** Once the authentication is finished, you can close the tab.',
        '**3.** If you bought Spotistats Plus, please cick on the "Plus" button to receive your plus role.'
      ].join('\n'),
      components: [
        new MessageActionRow().addComponents([
          new MessageButton().setCustomId('link-account').setLabel('Link').setStyle('PRIMARY'),
          new MessageButton()
            .setCustomId('plus-role')
            .setLabel('Claim Spotistats Plus role')
            .setStyle('SECONDARY')
        ])
      ]
    });
    return {
      content: 'Plus link message posted!'
    };
  }
}
