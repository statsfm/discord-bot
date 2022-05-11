import { ApplicationCommandOptionType } from "discord-api-types/v9";

export const TopAlbumsCommand = {
  name: "top-albums",
  description: "Shows the top albums of a given user in the given timeframe",
  options: [
    {
      name: "user",
      description: "User",
      type: ApplicationCommandOptionType.User,
    },
  ],
} as const;
