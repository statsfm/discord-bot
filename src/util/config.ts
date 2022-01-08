export const config = {
  api: {
    ProdURL: 'https://staging.backtrack.dev/api/v1',
    BetaURL: 'https://ieniemienie.backtrack.dev/api/v1',
    auth: process.env.AUTH_TOKEN
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientPublicKey: process.env.DISCORD_CLIENT_PUBLIC_KEY,
    token: process.env.DISCORD_CLIENT_TOKEN,
    roles: {
      beta: process.env.BETA_ROLE,
      plus: process.env.PLUS_ROLE
    },
    guildId: process.env.GUILD_ID,
    usersCountChannel: process.env.USER_COUNT_CHANNEL,
    plusUsersCountChannel: process.env.PLUS_USER_COUNT_CHANNEL,
    streamsCountChannel: process.env.STREAM_COUNT_CHANNEL,
    tracksCountChannel: process.env.TRACK_COUNT_CHANNEL,
    artistsCountChannel: process.env.ARTIST_COUNT_CHANNEL,
    albumsCountChannel: process.env.ALBUM_COUNT_CHANNEL,
    genreHubChannel: process.env.GENRE_HUB_CHANNEL
  },
  status: {
    apiUrl: 'https://betteruptime.com/api/v2',
    token: process.env.STATUS_API_TOKEN
  }
};
