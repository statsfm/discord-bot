import 'reflect-metadata';
import 'dotenv/config';

declare global {
  type Awaitable<T> = T | PromiseLike<T>;
}

import { container } from 'tsyringe';
import { BuildedCommand, commandInfo } from './util/Command';
import { kCommands, kClient, kLogger, kRest } from './util/tokens';
import readdirp from 'readdirp';
import path from 'node:path';
import { Logger } from './util/Logger';
import Api from '@statsfm/statsfm.js';
import { Config } from './util/Config';
import { Client, GatewayIntentBits, Options } from 'discord.js';
import { Rest } from '@cordis/rest';
import type { BuildedEvent } from './util/Event';

const logger = new Logger('');
container.register(kLogger, { useValue: logger });
const config = container.resolve(Config);

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  makeCache: Options.cacheWithLimits({
    GuildBanManager: 0,
    GuildEmojiManager: 0,
    PresenceManager: 0,
    VoiceStateManager: 0,
    ThreadManager: 100,
    ThreadMemberManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    StageInstanceManager: 0,
    BaseGuildEmojiManager: 0,
    GuildScheduledEventManager: 0,
    GuildStickerManager: 0,
    GuildInviteManager: 0,
    MessageManager: 0,
  }),
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
    const event = (await import(dir.fullPath)).default as BuildedEvent<any>;
    // split eventname by uppercase letter and only set the first letter of the first word to uppercase
    const eventName = (event.name as string)
      .split(/(?=[A-Z])/)
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
    logger.info(`Registering event: ${eventName}`);

    if (event.enabled) {
      client.on(event.name, event.execute);
    }
  }

  await client.login(config.discordBotToken);
}

bootstrap().catch((e) => {
  const error = e instanceof Error ? e : new Error(e);
  logger.error(error.message, error.stack);
});
