import 'reflect-metadata';
import 'dotenv/config';

import { Client, Collection, Intents } from 'discord.js';
import { container } from 'tsyringe';
import { commandInfo } from './util/Command';
import { kCommands, kLogger } from './util/tokens';
import readdirp from 'readdirp';
import type { Event } from './util/Event';
import type { Command } from './util/Command';
import Logger from './util/Logger';
import path from 'node:path';
import { copy, pathExists } from 'fs-nextra';

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
  // If config.example.ts exists but config.ts does not, copy config.example.ts to config.ts
  const exampleConfigPath = path.join(__dirname, '../src/config.example.ts');
  const configPath = path.join(__dirname, '../src/config.ts');
  if (
    (await pathExists(exampleConfigPath)) &&
    !(await pathExists(configPath))
  ) {
    await copy(exampleConfigPath, configPath);
    throw 'Please edit config.ts and replace the values with your own.';
  }

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

bootstrap().catch((e) => {
  const error = e instanceof Error ? (e as Error) : new Error(e);
  logger.error(error.message, error.stack);
});
