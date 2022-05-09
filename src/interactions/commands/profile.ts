import { ApplicationCommandOptionType } from "discord-api-types/v9";

export const ProfileCommand = {
  name: "profile",
  description: "Show a user profile",
  options: [
    {
      name: "user",
      description: "User",
      type: ApplicationCommandOptionType.User,
    },
  ],
} as const;
