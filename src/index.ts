import dotenv from 'dotenv';

import { Client } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { GatewayServer, SlashCreator } from 'slash-create';
import path from 'path';
import { config } from './util/config';
import { SpotistatsAPI, StatusAPI } from './util/API';

dotenv.config();

export const statusApi = new StatusAPI(config.status.token, config.status.apiUrl);
export const spotistats = new SpotistatsAPI(config.api.ProdURL, config.api.auth);
export const spotistatsBeta = new SpotistatsAPI(config.api.BetaURL, config.api.auth);
export const prisma = new PrismaClient();
export const client = new Client();

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

client.on('ready', () => {
  console.log('Bot ready!');
});

creator
  .registerCommandsIn(path.join(__dirname, 'commands'))
  // This will sync commands to Discord, it must be called after commands are loaded.
  // This also returns itself for more chaining capabilities.
  .syncCommands()
  .withServer(
    new GatewayServer(
      // @ts-expect-error type fails
      (handler) => client.ws.on('INTERACTION_CREATE', handler)
    )
  );

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
