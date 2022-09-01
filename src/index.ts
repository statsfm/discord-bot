import 'reflect-metadata';
import 'dotenv/config';

declare global {
  type Awaitable<T> = T | PromiseLike<T>;
}

import { container } from 'tsyringe';
import { BuildedCommand, commandInfo } from './util/Command';
import { kCommands, kClient, kLogger, kRest } from './util/tokens';
import readdirp from 'readdirp';
import type { IEvent } from './util/Event';
import path from 'node:path';
import { Logger } from './util/Logger';
import Api from '@statsfm/statsfm.js';
import { Config } from './util/Config';
import { Client, GatewayIntentBits } from 'discord.js';
import { Rest } from '@cordis/rest';

const logger = new Logger('');
container.register(kLogger, { useValue: logger });
const config = container.resolve(Config);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const commands = new Map<string, BuildedCommand<any>>();

container.register(kClient, { useValue: client });

container.register(kRest, {
  useValue: new Rest(config.discordBotToken),
});

container.register(kCommands, { useValue: commands });

container.register(Api, {
  useValue: new Api({
    accessToken: config.statsfmConfig.accessToken,
    baseUrl: config.statsfmConfig.baseUrl,
  }),
});

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

    const command = (await import(dir.fullPath)).default as BuildedCommand<any>;
    // if command is class ignore it
    if (typeof command !== 'object') continue;
    logger.info(`Registering command: ${command.name}`);

    commands.set(command.name.toLowerCase(), command);
  }

  for await (const dir of eventFiles) {
    const event = container.resolve<IEvent>(
      (await import(dir.fullPath)).default
    );
    logger.info(`Registering event: ${event.name}`);

    if (event.disabled) {
      continue;
    }
    event.execute();
  }

  await client.login(config.discordBotToken);
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
