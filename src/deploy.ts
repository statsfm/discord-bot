import 'reflect-metadata';
import 'dotenv/config';

import {
  RESTPutAPIApplicationCommandsJSONBody,
  RESTPutAPIApplicationCommandsResult,
  Routes,
} from 'discord.js';
import {
  CurrentlyStreamingCommand,
  PingCommand,
  ProfileCommand,
  RecentlyStreamedCommand,
  StatsCommand,
} from './interactions';
import { Logger } from './util/Logger';
import { Rest } from '@cordis/rest';
import { Config } from './util/Config';
import { TopCommand } from './interactions/commands/top';
import { ChartsCommand } from './interactions/commands/charts';

const logger = new Logger('Deploy');

const config = new Config(logger);

const rest = new Rest(config.discordBotToken);

const environment = process.env.NODE_ENV;

async function bootstrap() {
  logger.info('Start refreshing interaction commands...');

  const globalCommands = [
    PingCommand,
    ProfileCommand,
    CurrentlyStreamingCommand,
    StatsCommand,
    RecentlyStreamedCommand,
    TopCommand,
    ChartsCommand,
  ] as unknown as RESTPutAPIApplicationCommandsJSONBody;

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
