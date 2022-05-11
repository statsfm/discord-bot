import { ApplicationCommandOptionType } from "discord-api-types/v9";

export const TopTracksCommand = {
  name: "top-tracks",
  description: "Shows the top tracks of a given user in the given timeframe",
  options: [
    {
      name: "user",
      description: "User",
      type: ApplicationCommandOptionType.User,
    },
  ],
} as const;
