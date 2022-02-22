import 'reflect-metadata';
import 'dotenv/config';

import { REST } from '@discordjs/rest';
import { Routes, Snowflake } from 'discord-api-types/v9';
import { PingCommand } from './interactions';
import Logger from './util/Logger';

const rest = new REST({ version: '9' }).setToken(
  process.env.DISCORD_BOT_TOKEN!
);

const environment = process.env.NODE_ENV;

const logger = new Logger('Deploy');

async function bootstrap() {
  logger.info('Start refreshing interaction commands...');

  if (environment && environment == 'development') {
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID as Snowflake,
        process.env.DISCORD_GUILD_ID as Snowflake
      ),
      {
        body: [PingCommand],
      }
    );
  } else {
    // TODO: prod commands!
  }

  logger.info('Successfully reloaded interaction commands.');
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
