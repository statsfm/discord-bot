import type { UserPrivacySettings } from '@statsfm/statsfm.js';
import { singleton } from 'tsyringe';

export enum PrivacySetting {
  REQUIRED,
  NOT_USED,
  MIGHT_BE_USED_AND_REQUIRED_IF_USED,
  CAN_BE_USED_BUT_NOT_REQUIRED,
}

type CommandWithPrivacy =
  | 'profile'
  | 'currentlyPlaying'
  | 'currentlyPlayingMinimal'
  | 'recentlyPlayed'
  | 'topArtists'
  | 'topTracks'
  | 'topAlbums'
  | 'stats';

export type PrivacySettings = {
  [key in keyof UserPrivacySettings]: PrivacySetting;
};

@singleton()
export class PrivacyManager {
  private commandPrivacyData: Record<
    CommandWithPrivacy,
    Partial<PrivacySettings>
  > = {
    profile: {
      profile: PrivacySetting.REQUIRED,
      streamStats: PrivacySetting.CAN_BE_USED_BUT_NOT_REQUIRED,
      connections: PrivacySetting.CAN_BE_USED_BUT_NOT_REQUIRED,
    },
    currentlyPlaying: {
      currentlyPlaying: PrivacySetting.REQUIRED,
      streamStats: PrivacySetting.MIGHT_BE_USED_AND_REQUIRED_IF_USED,
    },
    recentlyPlayed: {
      recentlyPlayed: PrivacySetting.REQUIRED,
    },
    topArtists: {
      topArtists: PrivacySetting.REQUIRED,
    },
    topTracks: {
      topTracks: PrivacySetting.REQUIRED,
    },
    topAlbums: {
      topAlbums: PrivacySetting.REQUIRED,
    },
    stats: {
      streamStats: PrivacySetting.REQUIRED,
    },
    currentlyPlayingMinimal: {
      currentlyPlaying: PrivacySetting.REQUIRED,
      streamStats: PrivacySetting.REQUIRED,
    },
  };

  public getPrivacySettingsForCommand(
    commandName: CommandWithPrivacy
  ): Partial<PrivacySettings> {
    return this.commandPrivacyData[commandName];
  }

  public doesHaveMatchingPrivacySettings(
    command: CommandWithPrivacy,
    privacySettings: UserPrivacySettings,
    includeMaybeUsed = false
  ) {
    const commandPrivacySettings = this.getPrivacySettingsForCommand(command);

    const privacySettingsKeys = Object.keys(commandPrivacySettings) as Array<
      keyof UserPrivacySettings
    >;

    return privacySettingsKeys.every((setting) => {
      const commandSetting = commandPrivacySettings[setting];
      const userSetting = privacySettings[setting];

      if (commandSetting === PrivacySetting.REQUIRED) {
        return userSetting;
      }

      if (
        commandSetting === PrivacySetting.MIGHT_BE_USED_AND_REQUIRED_IF_USED
      ) {
        return includeMaybeUsed ? userSetting : true;
      }

      return true;
    });
  }

  public getPrivacySettingsMessage(
    command: CommandWithPrivacy,
    failedAt?: (keyof UserPrivacySettings)[] | keyof UserPrivacySettings
  ) {
    const commandPrivacySettings = this.getPrivacySettingsForCommand(command);
    const privacySettings = Object.keys(commandPrivacySettings) as Array<
      keyof UserPrivacySettings
    >;
    if (typeof failedAt === 'string') {
      failedAt = [failedAt];
    }

    const privacySettingMessageMap = (setting: keyof UserPrivacySettings) => {
      const commandSetting = commandPrivacySettings[setting];
      if (commandSetting === PrivacySetting.REQUIRED) {
        return `- **${setting}** is required.`;
      }

      if (
        commandSetting === PrivacySetting.MIGHT_BE_USED_AND_REQUIRED_IF_USED
      ) {
        return `- **${setting}** is required if used.`;
      }

      return `- **${setting}** is not required but can be used.`;
    };

    const privacySettingsString = privacySettings
      .filter(
        (setting) => commandPrivacySettings[setting] !== PrivacySetting.NOT_USED
      )
      .map(privacySettingMessageMap)
      .join('\n');

    const failedAtText = failedAt
      ? `Failed at the following privacy setting${
          failedAt.length > 1 ? 's' : ''
        }: ${failedAt.map((setting) => `**${setting}**`).join(', ')}.\n`
      : '';

    return `To use this command, **{TARGET_USER}** needs have to the following privacy settings set to public:\n${privacySettingsString}.\n${failedAtText}You can change these settings at <https://stats.fm/settings/privacy>.`;
  }
}
