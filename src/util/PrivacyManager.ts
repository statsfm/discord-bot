import type { UserPrivacySettings } from '@statsfm/statsfm.js';
import { singleton } from 'tsyringe';

export enum PrivacySetting {
  REQUIRED = 'yes',
  NOT_USED = 'no',
  MIGHT_BE_USED = 'maybe',
}

type CommandWithPrivacy =
  | 'profile'
  | 'currentlyPlaying'
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
      streamStats: PrivacySetting.MIGHT_BE_USED,
    },
    currentlyPlaying: {
      currentlyPlaying: PrivacySetting.REQUIRED,
      streamStats: PrivacySetting.REQUIRED,
      recentlyPlayed: PrivacySetting.MIGHT_BE_USED,
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
  };

  public getPrivacySettingsForCommand(
    commandName: CommandWithPrivacy
  ): Partial<PrivacySettings> {
    return this.commandPrivacyData[commandName];
  }

  public getPrivacySettingsMessage(command: CommandWithPrivacy) {
    const commandPrivacySettings = this.getPrivacySettingsForCommand(command);
    const privacySettings = Object.keys(commandPrivacySettings) as Array<
      keyof UserPrivacySettings
    >;

    const privacySettingsString = privacySettings
      .filter(
        (setting) => commandPrivacySettings[setting] !== PrivacySetting.NOT_USED
      )
      .map(
        (setting) =>
          `**${setting}** (${
            commandPrivacySettings[setting] === PrivacySetting.REQUIRED
              ? 'required'
              : 'might be used by this command'
          })`
      )
      .join(', ');

    return `To use this command, **{TARGET_USER}** needs have to the following privacy settings set to public: ${privacySettingsString}`;
  }
}
