import fetch from "node-fetch";

const getUserByDiscordId = async (id: string) => {
  return await fetch(
    `https://beta-api.stats.fm/api/v1/private/get-user-by-discord-id?id=${id}`
  ).then((response) => response.json());
};

export default getUserByDiscordId;
