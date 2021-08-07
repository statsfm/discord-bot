export const config = {
  api: {
    ProdURL: 'https://api.spotistats.app/api/v1',
    BetaURL: 'https://beta-api.spotistats.app/api/v1',
    StatsURL: 'http://116.203.149.26:8081',
    auth: process.env.AUTH_TOKEN
  },
  discord: {
    client_id: process.env.DISCORD_CLIENT_ID,
    client_public_key: process.env.DISCORD_CLIENT_PUBLIC_KEY,
    token: process.env.DISCORD_CLIENT_TOKEN,
    roles: {
      beta: process.env.BETA_ROLE,
      plus: process.env.PLUS_ROLE
    },
    guildId: process.env.GUILD_ID,
    userCountChannel: process.env.USER_COUNT_CHANNEL,
    streamCountChannel: process.env.STREAM_COUNT_CHANNEL
  },
  status: {
    apiUrl: 'https://betteruptime.com/api/v2',
    token: process.env.STATUS_API_TOKEN
  }
};
