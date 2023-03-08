import { singleton } from 'tsyringe';

@singleton()
export class CooldownManager {
  cooldownsPerCommand: Map<
    string,
    Map<
      string,
      {
        cooldown: number;
        createdAt: number;
      }
    >
  > = new Map();

  public set(commandName: string, userId: string, cooldown: number): void {
    const userCooldowns = this.cooldownsPerCommand.get(commandName);
    if (userCooldowns) {
      userCooldowns.set(userId, {
        cooldown,
        createdAt: Date.now(),
      });
    } else {
      this.cooldownsPerCommand.set(
        commandName,
        new Map([
          [
            userId,
            {
              cooldown,
              createdAt: Date.now(),
            },
          ],
        ])
      );
    }

    setTimeout(() => {
      const userCooldowns = this.cooldownsPerCommand.get(commandName);
      if (userCooldowns) {
        userCooldowns.delete(userId);
      }
    }, cooldown);
  }

  public get(commandName: string, userId: string): number | undefined {
    const userCooldowns = this.cooldownsPerCommand.get(commandName);
    if (userCooldowns) {
      const userCooldown = userCooldowns.get(userId);
      if (userCooldown) {
        return userCooldown.cooldown - (Date.now() - userCooldown.createdAt);
      }
    }
    return undefined;
  }
}
