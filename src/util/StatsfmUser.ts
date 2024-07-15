import type { UserPrivacySettings, UserPublic } from '@statsfm/statsfm.js';
import { URLs } from './URLs';

/**
 * Represents a stats.fm User
 */
export class StatsfmUser {
  id: string;

  customId: string;

  displayName: string;

  image: string | undefined;

  isPlus: boolean;

  orderBy: UserPublic['orderBy'];

  privacySettings: UserPrivacySettings;

  profile: UserPublic['profile'];

  appleMusic: UserPublic['appleMusicAuth'];

  spotify: UserPublic['spotifyAuth'];

  constructor(data: UserPublic) {
    this.id = data.id;
    this.customId = data.customId;
    this.displayName = data.displayName;
    this.image = data.image;
    this.isPlus = data.isPlus;
    this.orderBy = data.orderBy;
    this.privacySettings = data.privacySettings!;
    this.profile = data.profile!;
    this.appleMusic = data.appleMusicAuth;
    this.spotify = data.spotifyAuth;
  }

  get profileUrl() {
    return URLs.ProfileUrl(this.customId ?? this.id);
  }

  get profileUrlSpotify() {
    return URLs.SpotifyProfileUrl(this.id);
  }
}
