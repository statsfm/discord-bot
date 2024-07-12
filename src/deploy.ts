import 'reflect-metadata';
import 'dotenv/config';

import { Collection, Routes } from 'discord.js';
import { Logger } from './util/Logger';
import { REST } from '@discordjs/rest';
import { Config } from './util/Config';
import path from 'node:path';
import readdirp from 'readdirp';
import { BuildedCommand, commandInfo } from './util/Command';
import type { Option } from './util/SlashCommandUtils';
import { kLogger, kUserCache } from './util/tokens';
import { container } from 'tsyringe';

const logger = new Logger('Deploy');
container.register(kLogger, { useValue: logger });
container.register(kUserCache, { useValue: new Collection() });

const config = new Config(logger);

const rest = new REST({ version: '10' }).setToken(config.discordBotToken);

const environment = process.env.NODE_ENV;

const commandFiles = readdirp(path.join(__dirname, './commands'), {
  fileFilter: '*.js',
  directoryFilter: '!sub'
});

const allCommands = new Collection<string, BuildedCommand>();

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
      : undefined
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
      `Found command: ${command.name} [Enabled: ${
        command.enabled ? 'Yes' : 'No'
      }] [Requires Private API: ${command.privateApi ? 'Yes' : 'No'}]`
    );

    allCommands.set(command.name.toLowerCase(), command);
  }

  const commands = allCommands.filter((cmd) => {
    if (cmd.enabled) {
      if (cmd.privateApi && !config.privateApiToken) {
        logger.warn(`Command ${cmd.name} requires the private API but it is not enabled.`);
        return false;
      }
      return true;
    }
    logger.warn(`Command ${cmd.name} is not enabled and will not be deployed.`);
    return false;
  });

  // We need to parse the options back to an array because the options are stored as an object with the name as the key
  const mappedCommands = commands.map(parseCommandToDiscordFormat);

  if (environment && environment == 'development') {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        process.env.DISCORD_GUILD_ID!
      ),
      {
        body: mappedCommands.map((cmd) => cmd.commandPayload)
      }
    );
  } else {
    // We need to filter out the commands that are not global and make sure to publish all guild commands per guild in one put request
    const guildCommands = mappedCommands.filter((cmd) => cmd.guilds && cmd.guilds.length > 0);
    const globalCommands = mappedCommands.filter((cmd) => !cmd.guilds || cmd.guilds.length == 0);

    // Publish global commands
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
      body: globalCommands.map((cmd) => cmd.commandPayload)
    });

    // Publish guild commands
    const guilds = new Set(guildCommands.map((cmd) => cmd.guilds).flat());
    for (const guild of guilds) {
      await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guild), {
        body: guildCommands
          .filter((cmd) => cmd.guilds.includes(guild))
          .map((cmd) => cmd.commandPayload)
      });
    }
  }

  logger.info('Successfully reloaded interaction commands.');
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
