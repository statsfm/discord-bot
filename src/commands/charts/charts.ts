import { ChartsCommand } from '../../interactions';
import { createCommand } from '../../util/Command';
import { createEmbed } from '../../util/embed';
import { topAlbumsSubCommand } from './sub/albums';
import { topArtistsSubCommand } from './sub/artists';
import { topTracksSubCommand } from './sub/tracks';

export default createCommand(ChartsCommand)
  .disableStatsfmUserRequirement()
  .registerSubCommand('artists', topArtistsSubCommand)
  .registerSubCommand('tracks', topTracksSubCommand)
  .registerSubCommand('albums', topAlbumsSubCommand)
  .registerChatInput(async ({ interaction, args, statsfmUser, respond, subCommands }) => {
    await interaction.deferReply();
    switch (Object.keys(args)[0]) {
      case 'artists':
        return subCommands.artists({
          interaction,
          args: args.artists,
          statsfmUser,
          respond
        });
      case 'tracks':
        return subCommands.tracks({
          interaction,
          args: args.tracks,
          statsfmUser,
          respond
        });
      case 'albums':
        return subCommands.albums({
          interaction,
          args: args.albums,
          statsfmUser,
          respond
        });
      default:
        return respond(interaction, {
          embeds: [
            createEmbed()
              .setTitle(`Unknown top command ${Object.keys(args)[0]}`)
              .toJSON()
          ]
        });
    }
  })
  .build();
