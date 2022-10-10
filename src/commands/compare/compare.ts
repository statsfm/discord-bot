import { CompareStatsCommand } from '../../interactions';
import { createCommand } from '../../util/Command';
import { createEmbed } from '../../util/embed';
import { compareStatsOtherSubCommand } from './sub/other';
import { compareStatsSelfSubCommand } from './sub/self';

export default createCommand(CompareStatsCommand)
  .registerSubCommand(
    'self',
    CompareStatsCommand.options[0],
    compareStatsSelfSubCommand
  )
  .registerSubCommand(
    'other',
    CompareStatsCommand.options[1],
    compareStatsOtherSubCommand
  )
  .registerChatInput(
    async (interaction, args, statsfmUser, respond, subCommands) => {
      await interaction.deferReply();
      switch (Object.keys(args)[0]) {
        case 'self':
          return subCommands.self(interaction, args, statsfmUser, respond);
        case 'other':
          return subCommands.other(interaction, args, statsfmUser, respond);
        default:
          return respond(interaction, {
            embeds: [
              createEmbed()
                .setTitle(`Unknown compare command ${Object.keys(args)[0]}`)
                .toJSON(),
            ],
          });
      }
    }
  )
  .build();
