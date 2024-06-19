import Api from '@statsfm/statsfm.js';
import { Collection, type User } from 'discord.js';
import { container } from 'tsyringe';
import { StatsfmUser } from './StatsfmUser';
import { kUserCache } from './tokens';

interface GetUserByDiscordIdResponse {
  id: number;
  verified: boolean;
  userId: string;
}

const statsfmApi = container.resolve(Api);
const userCache =
  container.resolve<Collection<string, StatsfmUser>>(kUserCache);

export const getStatsfmUserFromDiscordUser = async (discordUser: User) => {
  if (userCache.has(discordUser.id)) return userCache.get(discordUser.id)!;
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
    if (user) {
      const statsfmUser = new StatsfmUser(user);
      userCache.set(discordUser.id, statsfmUser);
      // schedule timeout to remove user from cache after 5 minutes
      setTimeout(
        () => {
          userCache.delete(discordUser.id);
        },
        5 * 60 * 1000
      );
      return statsfmUser;
    }
  }
  return null;
};
