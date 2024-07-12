import Api, { Album, Artist, Track } from '@statsfm/statsfm.js';
import { AutocompleteInteraction } from 'discord.js';
import { container } from 'tsyringe';

const api = container.resolve(Api);

interface AlbumsSearchResult {
  items: {
    albums: Album[];
  };
}

interface ArtistsSearchResult {
  items: {
    artists: Artist[];
  };
}

interface TracksSearchResult {
  items: {
    tracks: Track[];
  };
}

function toFullUrl(url: string) {
  if (url.startsWith('http')) return url;
  return `https://${url}`;
}

export async function searchArtist(query: string, interaction: AutocompleteInteraction) {
  if (query.length === 0) return interaction.respond([]);

  if (/(https?:\/\/)?stats\.fm\/artist\/\d+/.test(query)) {
    const url = new URL(toFullUrl(query));
    const artistId = Number(url.pathname.split('/').pop());

    if (!artistId) return interaction.respond([]);

    try {
      const artist = await api.artists.get(artistId);
      return interaction.respond([
        {
          name: `${artist.name} - ${artist.followers.toLocaleString()} followers`,
          value: `${artist.id}`
        }
      ]);
    } catch (e) {
      return interaction.respond([]);
    }
  } else if (/(https?:\/\/)?open\.spotify\.com\/artist\/[0-9a-zA-Z]+/.test(query)) {
    const url = new URL(toFullUrl(query));
    const spotifyArtistId = url.pathname.split('/').pop();

    if (!spotifyArtistId) return interaction.respond([]);

    try {
      const artist = await api.artists.getSpotify(spotifyArtistId);
      return interaction.respond([
        {
          name: `${artist.name} - ${artist.followers.toLocaleString()} followers`,
          value: `${artist.id}`
        }
      ]);
    } catch (e) {
      return interaction.respond([]);
    }
  } else {
    const artistsRequest = await api.http.get<ArtistsSearchResult>('/search/elastic', {
      query: {
        query: query,
        limit: 20,
        type: 'artist'
      }
    });

    if (!artistsRequest.items.artists) return interaction.respond([]);

    return interaction.respond(
      artistsRequest.items.artists.splice(0, 25).map((artist) => ({
        name: `${artist.name} - ${artist.followers.toLocaleString()} followers`,
        value: `${artist.id}`
      }))
    );
  }
}

export async function searchAlbum(query: string, interaction: AutocompleteInteraction) {
  if (query.length === 0) return interaction.respond([]);

  if (/(https?:\/\/)?stats\.fm\/album\/\d+/.test(query)) {
    const url = new URL(toFullUrl(query));
    const albumId = Number(url.pathname.split('/').pop());

    if (!albumId) return interaction.respond([]);

    try {
      const album = await api.albums.get(albumId);
      return interaction.respond([
        {
          name: `${album.name} by ${album.artists
            .splice(0, 2)
            .map((artist) => artist.name)
            .join(', ')}`,
          value: `${album.id}`
        }
      ]);
    } catch (e) {
      return interaction.respond([]);
    }
  } else if (/(https?:\/\/)?open\.spotify\.com\/album\/[0-9a-zA-Z]+/.test(query)) {
    const url = new URL(toFullUrl(query));
    const spotifyAlbumId = url.pathname.split('/').pop();

    if (!spotifyAlbumId) return interaction.respond([]);

    try {
      const album = await api.albums.getSpotify(spotifyAlbumId);
      return interaction.respond([
        {
          name: `${album.name} by ${album.artists
            .splice(0, 2)
            .map((artist) => artist.name)
            .join(', ')}`,
          value: `${album.id}`
        }
      ]);
    } catch (e) {
      return interaction.respond([]);
    }
  } else {
    const albumsRequest = await api.http.get<AlbumsSearchResult>('/search/elastic', {
      query: {
        query: query,
        limit: 20,
        type: 'album'
      }
    });

    if (!albumsRequest.items.albums) return interaction.respond([]);

    return interaction.respond(
      albumsRequest.items.albums.splice(0, 25).map((album) => ({
        name: `${album.name} by ${album.artists
          .splice(0, 2)
          .map((artist) => artist.name)
          .join(', ')}`,
        value: `${album.id}`
      }))
    );
  }
}

export async function searchTrack(query: string, interaction: AutocompleteInteraction) {
  if (query.length === 0) return interaction.respond([]);

  if (/(https?:\/\/)?stats\.fm\/track\/\d+/.test(query)) {
    const url = new URL(toFullUrl(query));
    const trackId = Number(url.pathname.split('/').pop());

    if (!trackId) return interaction.respond([]);

    try {
      const track = await api.tracks.get(trackId);
      return interaction.respond([
        {
          name: `${track.name} by ${track.artists
            .splice(0, 2)
            .map((artist) => artist.name)
            .join(', ')}`,
          value: `${track.id}`
        }
      ]);
    } catch (e) {
      return interaction.respond([]);
    }
  } else if (/(https?:\/\/)?open\.spotify\.com\/track\/[0-9a-zA-Z]+/.test(query)) {
    const url = new URL(toFullUrl(query));
    const spotifyTrackId = url.pathname.split('/').pop();

    if (!spotifyTrackId) return interaction.respond([]);

    try {
      const track = await api.tracks.getSpotify(spotifyTrackId);
      return interaction.respond([
        {
          name: `${track.name} by ${track.artists
            .splice(0, 2)
            .map((artist) => artist.name)
            .join(', ')}`,
          value: `${track.id}`
        }
      ]);
    } catch (e) {
      return interaction.respond([]);
    }
  } else {
    const tracksRequest = await api.http.get<TracksSearchResult>('/search/elastic', {
      query: {
        query: query,
        limit: 20,
        type: 'track'
      }
    });

    if (!tracksRequest.items.tracks) return interaction.respond([]);

    return interaction.respond(
      tracksRequest.items.tracks.splice(0, 25).map((track) => ({
        name: `${track.name} by ${track.artists
          .splice(0, 2)
          .map((artist) => artist.name)
          .join(', ')}`,
        value: `${track.id}`
      }))
    );
  }
}
