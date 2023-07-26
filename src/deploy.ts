import 'reflect-metadata';
import 'dotenv/config';

import {
  Collection,
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationCommandsResult,
  Routes,
} from 'discord.js';
import { Logger } from './util/Logger';
import { Rest } from '@cordis/rest';
import { Config } from './util/Config';
import path from 'node:path';
import readdirp from 'readdirp';
import { BuildedCommand, commandInfo } from './util/Command';
import type { Option } from './util/SlashCommandUtils';
import { container } from 'tsyringe';
import { kAnalytics } from './util/tokens';
import { Analytics, NoAnayltics } from './util/analytics';

const logger = new Logger('Deploy');

const config = new Config(logger);

const rest = new Rest(config.discordBotToken);

const environment = process.env.NODE_ENV;

const commandFiles = readdirp(path.join(__dirname, './commands'), {
  fileFilter: '*.js',
  directoryFilter: '!sub',
});

container.register<Analytics>(kAnalytics, {
  useValue: new NoAnayltics(),
});

const commands = new Collection<string, BuildedCommand>();

function parseCommandOptionsToDiscordFormat(options: Record<string, Option>) {
  const newOptions: any = [];

  for (const [key, value] of Object.entries(options)) {
    const newOption = { ...value };
    newOption.name = key;
    // do it recursively if the option has sub options
    if ('options' in newOption) {
      newOption.options = parseCommandOptionsToDiscordFormat(
        newOption.options as Record<string, Option>
      );
    }
    newOptions.push(newOption);
  }
  return newOptions;
}

function parseCommandToDiscordFormat(command: BuildedCommand) {
  // Make use of the parseCommandOptionsToDiscordFormat function to parse the options
  const newCommandPayload = {
    ...command.commandPayload,
    options: command.commandPayload.options
      ? parseCommandOptionsToDiscordFormat(command.commandPayload.options)
      : undefined,
  };

  return { ...command, commandPayload: newCommandPayload };
}

async function bootstrap() {
  logger.info('Start refreshing interaction commands...');

  for await (const dir of commandFiles) {
    const cmdInfo = commandInfo(dir.path);
    if (!cmdInfo) continue;

    const command = (await import(dir.fullPath)).default as BuildedCommand;
    // if command is class ignore it
    if (typeof command !== 'object') continue;
    logger.info(
      `Registering command: ${command.name} [Enabled: ${
        command.enabled ? 'Yes' : 'No'
      }]`
    );

    commands.set(command.name.toLowerCase(), command);
  }

  const enabledCommands = commands.filter((cmd) => cmd.enabled);

  // We need to parse the options back to an array because the options are stored as an object with the name as the key
  const mappedCommands = enabledCommands.map(parseCommandToDiscordFormat);

  if (environment && environment == 'development') {
    await rest.put<
      RESTPutAPIApplicationCommandsResult,
      RESTPutAPIApplicationCommandsJSONBody
    >(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        process.env.DISCORD_GUILD_ID!
      ),
      {
        data: mappedCommands.map((cmd) => cmd.commandPayload),
      }
    );
  } else {
    // We need to filter out the commands that are not global and make sure to publish all guild commands per guild in one put request
    const guildCommands = mappedCommands.filter(
      (cmd) => cmd.guilds && cmd.guilds.length > 0
    );
    const globalCommands = mappedCommands.filter(
      (cmd) => !cmd.guilds || cmd.guilds.length == 0
    );

    // Publish global commands
    await rest.put<
      RESTPutAPIApplicationCommandsResult,
      RESTPutAPIApplicationCommandsJSONBody
    >(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
      data: globalCommands.map((cmd) => cmd.commandPayload),
    });

    // Publish guild commands
    const guilds = new Set(guildCommands.map((cmd) => cmd.guilds).flat());
    for (const guild of guilds) {
      await rest.put<
        RESTPutAPIApplicationCommandsResult,
        RESTPutAPIApplicationCommandsJSONBody
      >(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guild),
        {
          data: guildCommands
            .filter((cmd) => cmd.guilds.includes(guild))
            .map((cmd) => cmd.commandPayload),
        }
      );
    }
  }

  logger.info('Successfully reloaded interaction commands.');
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
