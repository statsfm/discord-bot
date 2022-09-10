import 'reflect-metadata';
import 'dotenv/config';

import {
  Collection,
  RESTPostAPIApplicationCommandsJSONBody,
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

const logger = new Logger('Deploy');

const config = new Config(logger);

const rest = new Rest(config.discordBotToken);

const environment = process.env.NODE_ENV;

const commandFiles = readdirp(path.join(__dirname, './commands'), {
  fileFilter: '*.js',
  directoryFilter: '!sub',
});

const commands = new Collection<string, BuildedCommand<any>>();

async function bootstrap() {
  logger.info('Start refreshing interaction commands...');

  for await (const dir of commandFiles) {
    const cmdInfo = commandInfo(dir.path);
    if (!cmdInfo) continue;

    const command = (await import(dir.fullPath)).default as BuildedCommand<any>;
    // if command is class ignore it
    if (typeof command !== 'object') continue;
    logger.info(
      `Registering command: ${command.name} [Enabled: ${
        command.enabled ? 'Yes' : 'No'
      }]`
    );

    commands.set(command.name.toLowerCase(), command);
  }

  const globalCommands = commands
    .filter((cmd) => cmd.enabled)
    .map((cmd) => cmd.commandPayload as RESTPostAPIApplicationCommandsJSONBody);

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
        data: globalCommands,
      }
    );
  } else {
    await rest.put<
      RESTPutAPIApplicationCommandsResult,
      RESTPutAPIApplicationCommandsJSONBody
    >(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
      data: globalCommands,
    });
  }

  logger.info('Successfully reloaded interaction commands.');
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
