export const URLs = {
  TrackUrl: (track: number) => `https://stats.fm/track/${track}`,
  AlbumUrl: (album: number) => `https://stats.fm/album/${album}`,
  ArtistUrl: (artist: number) => `https://stats.fm/artist/${artist}`,
  ProfileUrl: (slug: string) => `https://stats.fm/${encodeURIComponent(slug)}`,
};
