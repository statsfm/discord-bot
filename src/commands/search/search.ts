import { SearchCommand } from '../../interactions/commands/search';
import { createCommand } from '../../util/Command';
import { createEmbed } from '../../util/embed';
import { searchAlbumsSubCommand } from './sub/albums';
import { searchArtistsSubCommand } from './sub/artists';
import { searchTracksSubCommand } from './sub/tracks';
import { searchAlbum, searchArtist, searchTrack } from '../../util/search';

export default createCommand(SearchCommand)
  .registerSubCommand('albums', searchAlbumsSubCommand)
  .registerSubCommand('artists', searchArtistsSubCommand)
  .registerSubCommand('tracks', searchTracksSubCommand)
  .registerAutocomplete(async ({ interaction, args }) => {
    if (args.artists) {
      await searchArtist(args.artists.query, interaction);
    }
    if (args.albums) {
      await searchAlbum(args.albums.query, interaction);
    }
    if (args.tracks) {
      await searchTrack(args.tracks.query, interaction);
    }
  })
  .registerChatInput(
    async ({ interaction, args, statsfmUser, respond, subCommands }) => {
      switch (Object.keys(args)[0]) {
        case 'artists':
          return subCommands.artists({
            interaction,
            args: args.artists,
            statsfmUser,
            respond,
          });
        case 'tracks':
          return subCommands.tracks({
            interaction,
            args: args.tracks,
            statsfmUser,
            respond,
          });
        case 'albums':
          return subCommands.albums({
            interaction,
            args: args.albums,
            statsfmUser,
            respond,
          });
        default:
          return respond(interaction, {
            embeds: [
              createEmbed()
                .setTitle(`Unknown top command ${Object.keys(args)[0]}`)
                .toJSON(),
            ],
          });
      }
    }
  )
  .build();
