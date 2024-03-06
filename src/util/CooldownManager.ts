import { singleton } from 'tsyringe';
import { Config } from './Config';

type CommandName = string & {};
type GuildId = string & {};
type UserId = string & {};

@singleton()
export class CooldownManager {
  cooldownsPerCommand: Map<
    CommandName,
    Map<
      GuildId,
      Map<
        UserId,
        {
          cooldown: number;
          createdAt: number;
        }
      >
    >
  > = new Map();

  constructor(private config: Config) {}

  private getUserCooldownsPerGuild(commandName: CommandName, guildId: GuildId) {
    const commandCooldowns = this.cooldownsPerCommand.get(commandName);
    if (commandCooldowns) {
      const guildCooldowns = commandCooldowns.get(guildId);
      if (guildCooldowns) {
        return guildCooldowns;
      }
      commandCooldowns.set(guildId, new Map());
      return commandCooldowns.get(guildId)!;
    }
    this.cooldownsPerCommand.set(commandName, new Map([[guildId, new Map()]]));
    return this.cooldownsPerCommand.get(commandName)!.get(guildId)!;
  }

  public set(
    commandName: CommandName,
    guildId: GuildId,
    userId: UserId,
    cooldown: number
  ): void {
    if (this.config.excludeFromCommandCooldown.includes(userId)) return;
    const userCooldowns = this.getUserCooldownsPerGuild(commandName, guildId);
    userCooldowns.set(userId, {
      cooldown,
      createdAt: Date.now(),
    });

    setTimeout(() => {
      this.clear(commandName, guildId, userId);
    }, cooldown);
  }

  public get(
    commandName: CommandName,
    guildId: GuildId,
    userId: UserId
  ): number | undefined {
    const userCooldowns = this.getUserCooldownsPerGuild(commandName, guildId);
    if (userCooldowns) {
      const userCooldown = userCooldowns.get(userId);
      if (userCooldown) {
        return userCooldown.cooldown - (Date.now() - userCooldown.createdAt);
      }
    }
    return undefined;
  }

  public clear(
    commandName: CommandName,
    guildId: GuildId,
    userId: UserId
  ): void {
    const userCooldowns = this.getUserCooldownsPerGuild(commandName, guildId);
    if (userCooldowns && userCooldowns.has(userId)) {
      userCooldowns.delete(userId);
    }
  }
}
