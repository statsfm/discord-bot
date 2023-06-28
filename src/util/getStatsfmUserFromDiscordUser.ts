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
    .get<GetUserByDiscordIdResponse>(`/private/get-user-by-discord-id`, {
      query: {
        id: discordUser.id,
      },
    })
    .catch(() => null);
  if (initialResponse) {
    const user = await statsfmApi.users
      .get(initialResponse.userId)
      .catch(() => null);
    if (user) return new StatsfmUser(user);
  }
  return null;
};
