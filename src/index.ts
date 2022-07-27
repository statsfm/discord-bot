import 'reflect-metadata';
import 'dotenv/config';

declare global {
  type Awaitable<T> = T | PromiseLike<T>;
}

import { container } from 'tsyringe';
import { commandInfo } from './util/Command';
import { kCommands, kGateway, kLogger, kRest } from './util/tokens';
import readdirp from 'readdirp';
import type { IEvent } from './util/Event';
import type { Command } from './util/Command';
import path from 'node:path';
import { Logger } from './util/Logger';
import Api from '@statsfm/statsfm.js';
import { Config } from './util/Config';
import { Cluster } from '@cordis/gateway';
import { Rest } from '@cordis/rest';

const logger = new Logger('');
container.register(kLogger, { useValue: logger });
const config = container.resolve(Config);

const gateway = new Cluster(config.discordBotToken, {
  intents: ['guilds'],
});

const commands = new Map<string, Command>();

container.register(kGateway, { useValue: gateway });

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

    const command = container.resolve<Command>(
      (await import(dir.fullPath)).default
    );
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

  await gateway.connect();
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
