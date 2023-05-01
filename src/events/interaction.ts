import {
  MessageFlags,
  InteractionReplyOptions,
  ApplicationCommandType,
  Message,
  CommandInteraction,
} from 'discord.js';
import { container } from 'tsyringe';
import type { BuildedCommand } from '../util/Command';
import { createEvent } from '../util/Event';
import { getStatsfmUserFromDiscordUser } from '../util/getStatsfmUserFromDiscordUser';
import { transformInteraction } from '../util/InteractionOptions';
import type { Logger } from '../util/Logger';
import { reportError } from '../util/Sentry';
import { kCommands, kLogger } from '../util/tokens';
import { CooldownManager } from '../util/CooldownManager';
import { getDuration } from '../util/getDuration';
const commands =
  container.resolve<Map<string, BuildedCommand<any, any>>>(kCommands);
const logger = container.resolve<Logger>(kLogger);
const cooldownManager = container.resolve(CooldownManager);

function respond(
  interaction: CommandInteraction,
  data: InteractionReplyOptions
): Promise<Message<boolean>> {
  if (interaction.deferred) {
    return interaction.editReply(data);
  }
  return interaction.reply({ ...data, fetchReply: true });
}

export default createEvent('interactionCreate')
  .setOn(async (interaction) => {
    if (
      !interaction.isCommand() &&
      !interaction.isUserContextMenuCommand() &&
      !interaction.isMessageContextMenuCommand() &&
      !interaction.isAutocomplete() && !interaction.isMessageComponent()
    )
      return;

    // We don't handle DM interactions.
    if (!interaction.inCachedGuild()) return;

    if (interaction.isMessageComponent()) {
      const command = commands.get(interaction.message.interaction!.commandName);
      if (command && command.enabled) {
        return;
        // if (command.buttons.get(interaction.customId)) {
        //   const statsfmUser = await getStatsfmUserFromDiscordUser(
        //     interaction.user
        //   );

        //   if (
        //     command.guilds &&
        //     command.guilds.length > 0 &&
        //     interaction.guildId
        //   ) {
        //     if (!command.guilds.includes(interaction.guildId)) {
        //       await interaction.reply({
        //         content: 'This command is not available in this guild!',
        //         flags: MessageFlags.Ephemeral,
        //       });
        //       return;
        //     }
        //   }

        //   await command.buttons.get(interaction.customId)({ interaction });

        //   return;
        // } else {
        //   await interaction.reply({
        //     content: 'This button is not available!',
        //     flags: MessageFlags.Ephemeral,
        //   });
        //   return;
        // }
      } else {
        await interaction.reply({
          content: 'This command is not available!',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    const command = commands.get(interaction.commandName.toLowerCase());
    const statsfmUser = await getStatsfmUserFromDiscordUser(interaction.user);

    if (command && command.enabled) {
      try {
        // TODO: Store command stats
        // Check if command is guild locked
        if (
          command.guilds &&
          command.guilds.length > 0 &&
          interaction.guildId
        ) {
          if (!command.guilds.includes(interaction.guildId)) {
            if (!interaction.isAutocomplete())
              await respond(interaction, {
                content: 'This command is not available in this guild!',
                flags: MessageFlags.Ephemeral,
              });
            return;
          }
        }
        switch (interaction.commandType) {
          case ApplicationCommandType.ChatInput:
            const isAutocomplete = interaction.isAutocomplete();

            logger.info(
              `Executing ${isAutocomplete ? 'autocomplete' : 'chat input'
              } command ${interaction.commandName} by ${interaction.user.tag
              } (${interaction.user.id}) in ${interaction.guildId}`
            );

            if (isAutocomplete) {
              if (command.functions.autocomplete)
                await command.functions.autocomplete({
                  interaction,
                  args: transformInteraction(interaction.options.data),
                  statsfmUser,
                  respond
                });
              break;
            }
            if (command.functions.chatInput) {
              // Check for cooldown
              if (command.managedCooldown || command.ownCooldown) {
                const cooldown = cooldownManager.get(
                  interaction.commandName,
                  interaction.user.id
                );
                if (cooldown) {
                  await respond(interaction, {
                    content: `Please wait ${getDuration(
                      cooldown
                    )} before using this command again.`,
                    flags: MessageFlags.Ephemeral,
                  });
                  return;
                }
              }
              if (command.managedCooldown)
                cooldownManager.set(
                  interaction.commandName,
                  interaction.user.id,
                  command.managedCooldown
                );
              await command.functions.chatInput({
                interaction,
                args: transformInteraction(interaction.options.data),
                statsfmUser,
                respond,
                subCommands: command.subCommands
              });
            }
            break;

          case ApplicationCommandType.Message:
            logger.info(
              `Executing message context command ${interaction.commandName} by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId}`
            );

            if (command.functions.messageContext) {
              await command.functions.messageContext({
                interaction,
                args: transformInteraction(interaction.options.data),
                statsfmUser,
                respond
              });
            }
            break;

          case ApplicationCommandType.User:
            logger.info(
              `Executing user context command ${interaction.commandName} by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guildId}`
            );

            if (command.functions.userContext) {
              await command.functions.userContext({
                interaction,
                args: transformInteraction(interaction.options.data),
                statsfmUser,
                respond
              });
            }
            break;
        }
      } catch (e) {
        reportError(e, interaction);
      }
    } else {
      if (!interaction.isAutocomplete())
        await respond(interaction, {
          content: 'This command is not available!',
          flags: MessageFlags.Ephemeral,
        });
      else
        logger.warn(`Unknown autocomplete command ${interaction.commandName}`);
    }
  })
  .build();
