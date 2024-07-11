module.exports = {
  apps: [
    {
      name: 'bot-discord-shard1-2',
      script: 'dist/index.js',
      time: true,
      env: {
        SHARDS: '0,1',
        SHARD_COUNT: '6',
      },
    },
    {
      name: 'bot-discord-shard3-4',
      script: 'dist/index.js',
      time: true,
      env: {
        SHARDS: '2,3',
        SHARD_COUNT: '6',
      },
    },
    {
      name: 'bot-discord-shard5-6',
      script: 'dist/index.js',
      time: true,
      env: {
        SHARDS: '4,5',
        SHARD_COUNT: '6',
      },
    },
  ],
};
