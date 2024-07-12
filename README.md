# stats.fm Discord bot

## Installation

```bash
yarn install
```

## Usage

```bash
yarn start
```

## Environment variables

In order to run the bot, you need to set the following environment variables:

* `DISCORD_BOT_TOKEN`: The token of the Discord bot
* `DISCORD_CLIENT_ID`: The client ID of the Discord bot
* `DISCORD_GUILD_ID`: The ID of the development Discord server, this is only needed for the deployment of the slash commands
* `NODE_ENV`: The environment in which the bot is running, can be `development` or `production`. When set to `development`, the bot will register the slash commands to the server specified by `DISCORD_GUILD_ID`, otherwise it will register the commands globally. During runtime,  `development` will receive DEBUG logs, while those will not be shown in `production`.
* `SENTRY_DSN`: The DSN of the Sentry project, this is optional.
* `ANALYTICS_TOKEN`: The token of the analytics project, this is optional.
* `ANALYTICS_URL`: The URL of the analytics project, this is optional.
* `STATSFM_HTTP_API_URL`: The URL of the stats.fm HTTP API, defaults to what the `@statsfm/statsfm.js` package provides if not set.
* `STATSFM_HTTP_API_USER_AGENT_APPENDIX`: The appendix to append to the user agent which is send with every HTTP request to the stats.fm API, defaults to what the `@statsfm/statsfm.js` package provides if not set.
* `STATSFM_HTTP_API_RETRIES`: The amount of retries to do when a request to the stats.fm API fails, defaults to what the `@statsfm/statsfm.js` package provides if not set.
* `STATSFM_HTTP_API_VERSION`: The version of the stats.fm API to use, defaults to what the `@statsfm/statsfm.js` package provides if not set.
* `STATSFM_AUTH_ACCESS_TOKEN`: The access token to use for the stats.fm API, defaults to what the `@statsfm/statsfm.js` package provides if not set.
* `SHARDS` : A splitted string of the shards to spawn, defaults to `0` if not set, example: `0,1`
* `SHARD_COUNT`: The amount of shards to spawn, defaults to `1` if not set.
