import axios from 'axios';
import { EmbedField, MessageOptions, SlashCommand, SlashCreator } from 'slash-create';
import { config } from '../util/config';

export class QueueCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'importinfo',
      description: 'Check if import is enabled or disabled',
      guildIDs: config.discord.guildId
    });
  }

  async run(): Promise<string | MessageOptions | void> {
    const res = await axios.get<string[]>(`https://sjoerd.dev/html/import-servers?cache=${Date.now()}`);
    return {
      content: res.data.length > 0 ? 'Import is enabled!' : 'Import is disabled!' 
    };
  }
}
