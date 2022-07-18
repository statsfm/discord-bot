import { ApplicationCommandOptionType } from 'discord-api-types/v9';

export const TopCommand = {
  name: 'top',
  description: 'Look at top statistics',
  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'artists',
      description:
        'See your top artists or the top artists of another user, supports customizable timeframes',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description:
            'The user of which you want to see the top artists, if not yourself',
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'range',
          description: 'The range of which you want to see top artists of',
          choices: [
            {
              name: '4 weeks',
              value: '4-weeks',
            },
            {
              name: '6 months',
              value: '6-months',
            },
            {
              name: 'Lifetime',
              value: 'lifetime',
            },
          ],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'tracks',
      description:
        'See your top tracks or the top tracks of another user, supports customizable timeframes',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description:
            'The user of which you want to see the top tracks, if not yourself',
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'range',
          description: 'The range of which you want to see top tracks of',
          choices: [
            {
              name: '4 weeks',
              value: '4-weeks',
            },
            {
              name: '6 months',
              value: '6-months',
            },
            {
              name: 'Lifetime',
              value: 'lifetime',
            },
          ],
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: 'albums',
      description:
        'See your top albums or the top albums of another user, supports customizable timeframes',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description:
            'The user of which you want to see the top albums, if not yourself',
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'range',
          description: 'The range of which you want to see top albums of',
          choices: [
            {
              name: '4 weeks',
              value: '4-weeks',
            },
            {
              name: '6 months',
              value: '6-months',
            },
            {
              name: 'Lifetime',
              value: 'lifetime',
            },
          ],
        },
      ],
    },
    // {
    //   type: ApplicationCommandOptionType.SubcommandGroup,
    //   name: 'listeners',
    //   description: 'See top listeners of an album, artist or track',
    //   options: [
    //     {
    //       type: ApplicationCommandOptionType.Subcommand,
    //       name: 'album',
    //       description: 'See top listeners of an album',
    //       options: [
    //         {
    //           type: ApplicationCommandOptionType.String,
    //           name: 'search',
    //           description: 'The album to search for',
    //           required: true,
    //         },
    //       ],
    //     },
    //     {
    //       type: ApplicationCommandOptionType.Subcommand,
    //       name: 'artist',
    //       description: 'See top listeners of an artist',
    //       options: [
    //         {
    //           type: ApplicationCommandOptionType.String,
    //           name: 'search',
    //           description: 'The artist to search for',
    //           required: true,
    //         },
    //       ],
    //     },
    //     {
    //       type: ApplicationCommandOptionType.Subcommand,
    //       name: 'track',
    //       description: 'See top listeners of a track',
    //       options: [
    //         {
    //           type: ApplicationCommandOptionType.String,
    //           name: 'search',
    //           description: 'The track to search for',
    //           required: true,
    //         },
    //       ],
    //     },
    //   ],
    // },
  ],
} as const;
