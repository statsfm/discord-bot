import { ChartsCommand } from '../../interactions';
import { createCommand } from '../../util/Command';
import { createEmbed } from '../../util/embed';
import { topAlbumsSubCommand } from './sub/albums';
import { topArtistsSubCommand } from './sub/artists';
import { topTracksSubCommand } from './sub/tracks';

export default createCommand(ChartsCommand)
  .registerSubCommand('artists', ChartsCommand.options[0], topArtistsSubCommand)
  .registerSubCommand('tracks', ChartsCommand.options[1], topTracksSubCommand)
  .registerSubCommand('albums', ChartsCommand.options[2], topAlbumsSubCommand)
  .registerChatInput(async (interaction, args, respond, subCommands) => {
    await interaction.deferReply();
    switch (Object.keys(args)[0]) {
      case 'artists':
        return subCommands.artists(interaction, args.artists, respond);
      case 'tracks':
        return subCommands.tracks(interaction, args.tracks, respond);
      case 'albums':
        return subCommands.albums(interaction, args.albums, respond);
      default:
        return respond(interaction, {
          embeds: [
            createEmbed()
              .setTitle(`Unknown top command ${Object.keys(args)[0]}`)
              .toJSON(),
          ],
        });
    }
  })
  .build();