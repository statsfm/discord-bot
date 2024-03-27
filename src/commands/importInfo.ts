import { ItemsResponse, Api } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { ImportInfoCommand } from '../interactions/commands/importInfo';
import { createCommand } from '../util/Command';
import { createEmbed } from '../util/embed';

const statsfmApi = container.resolve(Api);

export default createCommand(ImportInfoCommand)
  .addGuild('763775648819970068')
  .registerChatInput(async ({ interaction, respond }) => {
    await interaction.deferReply();
    const data = await statsfmApi.http.get<
      ItemsResponse<Record<'total', Record<'files' | 'servers', number>>>
    >('/imports/queue');

    await respond(interaction, {
      embeds: [
        createEmbed()
          .setTitle('Import Queue')
          .setDescription(
            `There are ${data.items.total.files} files in the import queue.`
          ),
      ],
    });
  })
  .build();
