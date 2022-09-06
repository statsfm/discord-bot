import type {
  OrderBySetting,
  UserPrivacySettings,
  UserProfile,
  UserPublic,
} from '@statsfm/statsfm.js';
import { URLs } from './URLs';

/**
 * Represents a Stats.fm User
 */
export class StatsfmUser {
  /**
   * The user's id
   */
  id: string;

  /**
   * The user's custom id
   */
  customId: string;

  displayName: string;

  image: string;

  isPlus: boolean;

  hasImported: boolean;

  syncEnabled: boolean;

  orderBy: OrderBySetting;

  privacySettings: UserPrivacySettings;

  profile: UserProfile;

  constructor(data: UserPublic) {
    this.id = data.id;
    this.customId = data.customId;
    this.displayName = data.displayName;
    this.image = data.image;
    this.isPlus = data.isPlus;
    this.hasImported = data.hasImported;
    this.syncEnabled = data.syncEnabled;
    this.orderBy = data.orderBy;
    this.privacySettings = data.privacySettings!;
    this.profile = data.profile!;
  }

  get profileUrl() {
    return URLs.ProfileUrl(this.customId ?? this.id);
  }

  get profileUrlSpotify() {
    return URLs.SpotifyProfileUrl(this.id);
  }
}
