import { Api } from '@statsfm/statsfm.js';
import { container } from 'tsyringe';

interface GetUserByDiscordIdResponse {
  id: number;
  verified: boolean;
  userId: string;
}

const statsfmApi = container.resolve(Api);

export const getUserByDiscordId = async (id: string) => {
  const response = await statsfmApi.http
    .get(`/private/get-user-by-discord-id`, {
      query: {
        id,
      },
    })
    .catch(() => null);
  if (response) return response.data as unknown as GetUserByDiscordIdResponse;
  return response;
};
