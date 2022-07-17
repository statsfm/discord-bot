import type { APIInteraction, APIUser } from 'discord-api-types/v9';

export const getUserFromInteraction = (interaction: APIInteraction) => {
  return interaction.member?.user ?? (interaction.user as APIUser);
};
