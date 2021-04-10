import dotenv from 'dotenv';

dotenv.config();

//----------------------------------------------------------------//
import { Client } from 'discord.js';
import { PrismaClient } from '@prisma/client';
import { GatewayServer, SlashCreator } from 'slash-create';
import path from 'path';

export const prisma = new PrismaClient();
export const client = new Client();

const creator = new SlashCreator({
  applicationID: process.env.DISCORD_CLIENT_ID,
  publicKey: process.env.DISCORD_CLIENT_PUBLIC_KEY,
  token: process.env.DISCORD_CLIENT_TOKEN,
});

creator
  .registerCommandsIn(path.join(__dirname, 'commands'))
  // This will sync commands to Discord, it must be called after commands are loaded.
  // This also returns itself for more chaining capabilities.
  .syncCommands()
  .withServer(
    new GatewayServer(
      // @ts-ignore
      (handler) => client.ws.on('INTERACTION_CREATE', handler)
    )
  );

client.login(process.env.DISCORD_CLIENT_TOKEN);

client.on('ready', () => {
  console.log('Bot ready!');
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
