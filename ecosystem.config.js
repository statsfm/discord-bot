module.exports = {
  apps: [
    {
      name: 'bot-discord-shard1-2',
      script: 'dist/index.js',
      time: true,
      env: {
        SHARDS: '1,2',
        SHARD_COUNT: '6',
      },
    },
    {
      name: 'bot-discord-shard3-4',
      script: 'dist/index.js',
      time: true,
      env: {
        SHARDS: '3,4',
        SHARD_COUNT: '6',
      },
    },
  ],
};
