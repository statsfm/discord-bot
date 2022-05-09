import 'reflect-metadata';
import 'dotenv/config';

import { container } from 'tsyringe';
import { commandInfo } from './util/Command';
import { kCommands, kGateway, kLogger, kRest } from './util/tokens';
import readdirp from 'readdirp';
import type { IEvent } from './util/Event';
import type { ICommand } from './util/Command';
import path from 'node:path';
import Bree from 'bree';
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

const commands = new Map<string, ICommand>();
const bree = new Bree({
  root: false,
  logger: logger as Record<string, any>,
});

container.register(kGateway, { useValue: gateway });

container.register(kRest, {
  useValue: new Rest(config.discordBotToken),
});

container.register(kCommands, { useValue: commands });

container.register(Bree, { useValue: bree });

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

    const command = container.resolve<ICommand>(
      (await import(dir.fullPath)).default
    );
    logger.info(`Registering command: ${command.commandObject.name}`);

    commands.set(command.commandObject.name.toLowerCase(), command);
  }

  for await (const dir of eventFiles) {
    console.log(dir.fullPath);
    const event_ = container.resolve<IEvent>(
      (await import(dir.fullPath)).default
    );
    logger.info(`Registering event: ${event_.name}`);

    if (event_.disabled) {
      continue;
    }
    event_.execute();
  }

  await gateway.connect();
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
