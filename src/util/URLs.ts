export const URLs = {
  TrackUrl: (track: number) => `https://stats.fm/track/${track}`,
  TrackUrlSpotify: (track: string) => `https://open.spotify.com/track/${track}`,
  TrackUrlSongLink: (track: string) => `https://song.link/s/${track}`,
  AlbumUrl: (album: number) => `https://stats.fm/album/${album}`,
  ArtistUrl: (artist: number) => `https://stats.fm/artist/${artist}`,
  ProfileUrl: (slug: string) => `https://stats.fm/${encodeURIComponent(slug)}`,
  SpotifyProfileUrl: (slug: string) =>
    `https://open.spotify.com/user/${encodeURIComponent(slug)}`,
};
