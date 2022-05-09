import { ApplicationCommandOptionType } from "discord-api-types/v9";

export const CurrentlyStreamingCommand = {
  name: "currently-playing",
  description: "Shows the track a user is currently playing",
  options: [
    {
      name: "user",
      description: "User",
      type: ApplicationCommandOptionType.User,
    },
  ],
} as const;
