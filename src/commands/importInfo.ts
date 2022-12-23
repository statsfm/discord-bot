import Api from '@statsfm/statsfm.js';
import { container } from 'tsyringe';
import { ImportInfoCommand } from '../interactions/commands/importInfo';
import { createCommand } from '../util/Command';
import { createEmbed } from '../util/embed';

const statsfmApi = container.resolve(Api);

export default createCommand(ImportInfoCommand)
  .registerChatInput(async (interaction, _args, _statsfmUserSelf, respond) => {
    await interaction.deferReply();
    const data = (await (
      await statsfmApi.http.get('/private/import-queue')
    ).data) as unknown as { items: Record<string, number> };

    const allCounts = Object.values(data.items).reduce((a, b) => a + b, 0);

    await respond(interaction, {
      embeds: [
        createEmbed()
          .setTitle('Import Queue')
          .setDescription(`There are ${allCounts} items in the import queue.`),
      ],
    });
  })
  .build();
