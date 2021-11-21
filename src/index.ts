import dotenv from 'dotenv';

import { Client, Intents } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { GatewayServer, SlashCreator } from 'slash-create';
import path from 'path';
import axios from 'axios';
import { config } from './util/config';
import { SpotistatsAPI, StatusAPI } from './util/API';
import { ElasticCountResponse, ElasticTotalUsersResponse } from './util/types';

dotenv.config();

export const statusApi = new StatusAPI(config.status.token, config.status.apiUrl);
export const spotistats = new SpotistatsAPI(config.api.ProdURL, config.api.auth);
export const spotistatsBeta = new SpotistatsAPI(config.api.BetaURL, config.api.auth);
export const prisma = new PrismaClient();
export const client = new Client({
  intents: new Intents(['GUILDS', 'GUILD_MESSAGES', 'GUILD_INVITES', 'GUILD_MEMBERS'])
});

const creator = new SlashCreator({
  applicationID: config.discord.client_id,
  publicKey: config.discord.client_public_key,
  token: config.discord.token
});

creator.on('debug', (message) => console.log(message));
creator.on('warn', (message) => console.warn(message));
creator.on('error', (error) => console.error(error));
creator.on('synced', () => console.info('Commands synced!'));
creator.on('commandRun', (command, _, ctx) =>
  console.info(
    `${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`
  )
);
creator.on('commandRegister', (command) =>
  console.info(`Registered command ${command.commandName}`)
);
creator.on('commandError', (command, error) =>
  console.error(`Command ${command.commandName}:`, error)
);

client.login(config.discord.token);

async function updateUserCounter(): Promise<void> {
  const res = await axios.get<ElasticTotalUsersResponse>(
    `${config.api.StatsURL}/analytics/totalUsers`
  );

  if (res.status !== 200) return;

  const totalUsers = res.data.rows[0].metricValues[0].value;
  // eslint-disable-next-line no-bitwise
  const totalUsersNumber = ~~totalUsers;
  if (!(totalUsersNumber > 1000000)) return;
  const totalUsersFormatted = totalUsers.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  (await client.guilds.fetch(config.discord.guildId)).channels
    .resolve(config.discord.userCountChannel)
    .setName(`${totalUsersFormatted} users`);
}

function setupUpdateCounterFunction(name: string, discordChannelId: string): () => Promise<void> {
  return async function () {
    const res = await axios.get<ElasticCountResponse>(
      `${config.api.StatsURL}/elastic/${name}/count`
    );

    if (res.status !== 200) return;

    const { count } = res.data;
    const countString = `${count}`;
    if (!(count > 1000000)) return;
    const countFormatted = countString.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    (await client.guilds.fetch(config.discord.guildId)).channels
      .resolve(discordChannelId)
      .setName(`${countFormatted} ${name}`);
  };
}

function startAndSetInterval(func: () => Promise<void>) {
  func();
  setInterval(func, 10 * 60 * 1000);
}

client.on('ready', () => {
  startAndSetInterval(updateUserCounter);
  startAndSetInterval(setupUpdateCounterFunction('streams', config.discord.streamCountChannel));
  startAndSetInterval(setupUpdateCounterFunction('tracks', config.discord.tracksCountChannel));
  startAndSetInterval(setupUpdateCounterFunction('artists', config.discord.artistsCountChannel));
  startAndSetInterval(setupUpdateCounterFunction('albums', config.discord.albumsCountChannel));
  console.log('Bot ready!');
});

creator
  .registerCommandsIn(path.join(__dirname, 'commands'))
  // This will sync commands to Discord, it must be called after commands are loaded.
  // This also returns itself for more chaining capabilities.
  .syncCommands()
  .withServer(new GatewayServer((handler) => client.ws.on('INTERACTION_CREATE', handler)));

client.on('threadUpdate', async (oldThread, newThread) => {
  if (oldThread.archived == false && newThread.archived == true) {
    if (newThread.parentId === process.env.GENRE_HUB_CHANNEL) {
      newThread.setArchived(false);
      newThread.setLocked(false);
      newThread.setAutoArchiveDuration('MAX');
    }
  }
});

// client.on('guildMemberAdd', async (member) => {
//   const discordList = await member.guild.fetchInvites();
//   const dbList = await prisma.link.findMany();
//   dbList.forEach(async (link) => {
//     const newLink = discordList.get(link.invite);
//     if (newLink.uses != link.uses) {
//       const role = member.guild.roles.cache.get(link.role);
//       if (!role)
//         return console.log(
//           `The role specified for ${link.invite} doesnt seem to exist in the guild.`
//         );
//       member.roles.add(role);
//       console.log(
//         `Role "${role.name}" successfully provided to ${member.user.tag}.`
//       );
//       await prisma.link.update({
//         where: { id: link.id },
//         data: { uses: newLink.uses, invite: newLink.code, role: link.role },
//       });
//     }
//   });
// });
