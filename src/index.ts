import 'reflect-metadata';
import 'dotenv/config';

import { Client, Collection, Intents } from 'discord.js';
import { container } from 'tsyringe';
import { commandInfo } from './util/Command';
import { kCommands, kLogger } from './tokens';
import readdirp from 'readdirp';
import type { Event } from './util/Event';
import type { Command } from './util/Command';
import Logger from './util/Logger';
import path from 'node:path';

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
});

const commands = new Collection<string, Command>();
const logger = new Logger('');

container.register(Client, { useValue: client });
container.register(kCommands, { useValue: commands });
container.register(kLogger, { useValue: logger });

const commandFiles = readdirp(path.join(__dirname, './commands'), {
  fileFilter: '*.js',
  directoryFilter: '!sub',
});

const eventFiles = readdirp(path.join(__dirname, './events'), {
  fileFilter: '*.js',
});

async function bootstrap() {
  for await (const dir of commandFiles) {
    const cmdInfo = commandInfo(dir.path);
    if (!cmdInfo) continue;

    const command = container.resolve<Command>(
      (await import(dir.fullPath)).default
    );
    logger.info(`Registering command: ${command.name ?? cmdInfo.name}`);

    commands.set((command.name ?? cmdInfo.name).toLowerCase(), command);
  }

  for await (const dir of eventFiles) {
    const event_ = container.resolve<Event>(
      (await import(dir.fullPath)).default
    );
    logger.info(`Registering event: ${event_.name}`);

    if (event_.disabled) {
      continue;
    }
    event_.execute();
  }

  await client.login(process.env.DISCORD_BOT_TOKEN);
}

try {
  bootstrap();
} catch (e) {
  const error = e as Error;
  logger.error(error.message, error.stack);
}
