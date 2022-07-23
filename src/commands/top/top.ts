import { APIInteraction, InteractionResponseType } from 'discord-api-types/v9';
import { TopCommand } from '../../interactions';
import type { ArgumentsOf } from '../../util/ArgumentsOf';
import type { ICommand, RespondFunction } from '../../util/Command';
import { createEmbed } from '../../util/embed';
import { getUserFromInteraction } from '../../util/getUserFromInteraction';
import { topAlbums } from './sub/albums';
import { topArtists } from './sub/artists';
import { topTracks } from './sub/tracks';

export default class implements ICommand {
  commandObject = TopCommand;

  public async execute(
    interaction: APIInteraction,
    args: ArgumentsOf<typeof TopCommand>,
    respond: RespondFunction
  ): Promise<void> {
    await respond(interaction, {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
    });
    const interactionUser = getUserFromInteraction(interaction);
    switch (Object.keys(args)[0]) {
      case 'artists':
        return topArtists(interaction, args.artists, respond);
      case 'albums':
        return topAlbums(interaction, args.albums, respond);
      case 'tracks':
        return topTracks(interaction, args.tracks, respond);
      default:
        return void respond(interaction, {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            embeds: [
              createEmbed(interactionUser)
                .setTitle(`Unknown top command ${Object.keys(args)[0]}`)
                .toJSON(),
            ],
          },
        });
    }
  }
}
