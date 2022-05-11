import { ApplicationCommandOptionType } from "discord-api-types/v9";

export const StatsCommand = {
  name: "stats",
  description: "Shows some stats from a given user in the given timeframe",
  options: [
    {
      name: "user",
      description: "User",
      type: ApplicationCommandOptionType.User,
    },
  ],
} as const;
