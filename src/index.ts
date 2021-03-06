import dotenv from 'dotenv';

import { Client, Intents } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { ButtonStyle, ComponentType, GatewayServer, SlashCreator } from 'slash-create';
import axios from 'axios';
import { setTimeout as sleep } from 'timers/promises';
import StringCrypto from 'string-crypto';
import path from 'path';
import { config } from './util/config';
import { SpotistatsAPI, StatusAPI } from './util/API';
import { TotalSize, TotalSizeData } from './util/types';

dotenv.config();

export const statusApi = new StatusAPI(config.status.token, config.status.apiUrl);
export const spotistats = new SpotistatsAPI(config.api.ProdURL, config.api.auth);
export const spotistatsBeta = new SpotistatsAPI(config.api.BetaURL, config.api.auth);
export const prisma = new PrismaClient();
export const client = new Client({
  intents: new Intents(['GUILDS', 'GUILD_MESSAGES', 'GUILD_INVITES', 'GUILD_MEMBERS'])
});

const cryptoGen = new StringCrypto({
  salt: process.env.SECRET_KEY,
  iterations: 10,
  digest: 'sha3-512'
});

const creator = new SlashCreator({
  applicationID: config.discord.clientId,
  publicKey: config.discord.clientPublicKey,
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

const getCount = (current: TotalSizeData, previous: TotalSizeData): number => {
  let { count } = current;
  const timeDiff = new Date(current.date).getTime() - new Date(previous.date).getTime();
  const epochOffset = Date.now() - new Date(current.date).getTime();
  const diffBetweenCurrentAndPreviousSnapshot = current.count - previous.count;
  const diffPerUnit = diffBetweenCurrentAndPreviousSnapshot / timeDiff;
  count += epochOffset * diffPerUnit;
  return count;
};

async function updateCounters(): Promise<void> {
  const res = await axios.get<TotalSize>(`${config.api.ProdURL}/stats/database/size`);
  if (res.status !== 200) return;

  const users = `${Math.round(
    getCount(res.data.item.users.current, res.data.item.users.previous)
  ).toLocaleString('en-US')} users`;
  const plusUsers = `${Math.round(
    getCount(res.data.item.plusUsers.current, res.data.item.plusUsers.previous)
  ).toLocaleString('en-US')} Plus users`;
  const streams = `${Math.round(
    getCount(res.data.item.streams.current, res.data.item.streams.previous)
  ).toLocaleString('en-US')} streams`;
  const tracks = `${Math.round(
    getCount(res.data.item.tracks.current, res.data.item.tracks.previous)
  ).toLocaleString('en-US')} tracks`;
  const artists = `${Math.round(
    getCount(res.data.item.artists.current, res.data.item.artists.previous)
  ).toLocaleString('en-US')} artists`;
  const albums = `${Math.round(
    getCount(res.data.item.albums.current, res.data.item.albums.previous)
  ).toLocaleString('en-US')} albums`;
  const guild = await client.guilds.fetch(config.discord.guildId);
  await guild.channels.resolve(config.discord.usersCountChannel).setName(users);
  await sleep(5000);
  await guild.channels.resolve(config.discord.plusUsersCountChannel).setName(plusUsers);
  await sleep(5000);
  await guild.channels.resolve(config.discord.streamsCountChannel).setName(streams);
  await sleep(5000);
  await guild.channels.resolve(config.discord.tracksCountChannel).setName(tracks);
  await sleep(5000);
  await guild.channels.resolve(config.discord.artistsCountChannel).setName(artists);
  await sleep(5000);
  await guild.channels.resolve(config.discord.albumsCountChannel).setName(albums);
}

function startAndSetInterval(func: () => Promise<void>): void {
  func();
  setInterval(func, 30 * 60 * 1000);
}

client.on('ready', () => {
  // startAndSetInterval(updateCounters);
  console.log('Bot ready!');
});

creator
  .registerCommandsIn(path.join(__dirname, 'commands'))
  // This will sync commands to Discord, it must be called after commands are loaded.
  // This also returns itself for more chaining capabilities.
  .syncCommands()
  .withServer(new GatewayServer((handler) => client.ws.on('INTERACTION_CREATE', handler)));

client.on('threadUpdate', (oldThread, newThread) => {
  if (oldThread.archived === false && newThread.archived === true) {
    if (newThread.parentId === process.env.GENRE_HUB_CHANNEL) {
      newThread.setArchived(false);
      newThread.setLocked(false);
      newThread.setAutoArchiveDuration('MAX');
    }
  }
});

creator.on('componentInteraction', async (interaction) => {
  if (interaction.componentType !== ComponentType.BUTTON) return;
  if (interaction.customID === 'link-account') {
    const account = await prisma.account.findUnique({
      where: { discordUserId: interaction.user.id }
    });
    if (account) {
      await interaction.send({
        ephemeral: true,
        content:
          'You already have an Spotistats account linked, please unlink it first with `/unlink`'
      });
      return;
    }

    const link = `https://api.stats.fm/api/v1/auth/redirect/spotify?scope=user-read-private&redirect_uri=https://discord-bot.stats.fm/callback&state=${cryptoGen.encryptString(
      interaction.user.id,
      process.env.PASSWORD
    )}`;

    await interaction.send({
      ephemeral: true,
      content: 'Please click the buton below to start the authentication process',
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: [
            {
              type: ComponentType.BUTTON,
              label: 'Authorize',
              style: ButtonStyle.LINK,
              url: link
            }
          ]
        }
      ]
    });
  } else if (interaction.customID === 'plus-role') {
    const account = await prisma.account.findUnique({
      where: { discordUserId: interaction.user.id }
    });
    if (!account) {
      await interaction.send({
        ephemeral: true,
        content: 'Please link your Spotistats account first by clicking the "Link" button'
      });
      return;
    }
    const res = await spotistats.getUserDataFromId(account.spotistatsUserId);
    if (!res.status) {
      await interaction.send({
        ephemeral: true,
        content:
          'Something went wrong, please try again later. If the problem persists, please contact ModMail.'
      });
      return;
    }
    if (!res.data.isPlus) {
      await interaction.send({
        ephemeral: true,
        content:
          "It looks like your linked Spotistats account is not a Plus account :(\nps. having Plus in the beta doesn't count ;)"
      });
      return;
    }

    const member = client.guilds.resolve(interaction.guildID).members.resolve(interaction.user.id);
    await member.roles.add(config.discord.roles.plus);

    await interaction.send({
      ephemeral: true,
      content: `Added the <@&${config.discord.roles.plus}> role :)`
    });
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
