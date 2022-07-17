import type { APIInteraction } from 'discord-api-types/v9';

export const getUserFromInteraction = (interaction: APIInteraction) => {
  return interaction.member?.user ?? interaction.user!;
};
