import Api from '@statsfm/statsfm.js';
import type { User } from 'discord.js';
import { container } from 'tsyringe';
import { StatsfmUser } from './StatsfmUser';

interface GetUserByDiscordIdResponse {
  id: number;
  verified: boolean;
  userId: string;
}

const statsfmApi = container.resolve(Api);

export const getStatsfmUserFromDiscordUser = async (discordUser: User) => {
  const initialResponse = await statsfmApi.http
    .get(`/private/get-user-by-discord-id`, {
      query: {
        id: discordUser.id,
      },
    })
    .catch(() => null);
  if (initialResponse) {
    const { userId } =
      initialResponse.data as unknown as GetUserByDiscordIdResponse;
    const user = await statsfmApi.users.get(userId).catch(() => null);
    if (user) return new StatsfmUser(user);
  }
  return null;
};
