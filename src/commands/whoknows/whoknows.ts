import { WhoKnowsCommand } from '../../interactions';
import { createCommand } from '../../util/Command';
import { searchAlbum, searchArtist, searchTrack } from '../../util/search';
import { whoKnowsAlbumSubCommand } from './sub/album';
import { whoKnowsArtistSubCommand } from './sub/artist';
import { whoKnowsTrackSubCommand } from './sub/track';

export const WhoKnowsConsts = {
  guildMemberBatchSize: 1000,
};

export default createCommand(WhoKnowsCommand)
  .enablePrivateApiRequirement()
  .registerAutocomplete(async ({ interaction, args }) => {
    if (args.artist?.query) {
      await searchArtist(args.artist.query, interaction);
    }
    if (args.album?.query) {
      await searchAlbum(args.album.query, interaction);
    }
    if (args.track?.query) {
      await searchTrack(args.track.query, interaction);
    }
  })
  .registerSubCommand('artist', whoKnowsArtistSubCommand)
  .registerSubCommand('track', whoKnowsTrackSubCommand)
  .registerSubCommand('album', whoKnowsAlbumSubCommand)
  .registerChatInput(
    async ({ interaction, args, statsfmUser, respond, subCommands }) => {
      await interaction.deferReply();
      switch (Object.keys(args)[0]) {
        case 'artist':
          return subCommands.artist({
            interaction,
            args: args.artist,
            statsfmUser,
            respond,
          });
        case 'track':
          return subCommands.track({
            interaction,
            args: args.track,
            statsfmUser,
            respond,
          });
        case 'album':
          return subCommands.album({
            interaction,
            args: args.album,
            statsfmUser,
            respond,
          });
        default:
          return respond(interaction, {
            content: `Unknown who knows command ${Object.keys(args)[0]}`,
          });
      }
    }
  )
  .build();
