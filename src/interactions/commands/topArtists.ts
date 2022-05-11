import { ApplicationCommandOptionType } from "discord-api-types/v9";

export const TopArtistsCommand = {
  name: "top-artists",
  description: "Shows the top artists of a given user in the given timeframe",
  options: [
    {
      name: "user",
      description: "User",
      type: ApplicationCommandOptionType.User,
    },
  ],
} as const;
