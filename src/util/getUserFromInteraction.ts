import type { APIInteraction } from 'discord.js';

export const getUserFromInteraction = (interaction: APIInteraction) => {
  return interaction.member?.user ?? interaction.user!;
};
