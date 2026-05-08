import AnimeCache from "../cache/AnimeCache";
import { getCharacterCacheKey } from "./cacheKeys";
import type { AnimeCharacterNode } from "../types/animeApi";


export class AnimeFetchingError extends Error {
  constructor(message = "Error fetching data.") {
    super(message);
    this.name = "AnimeFetchingError";
  }
}

export class AnimeImageFetcher {
  public async retrieveImage(animeTitle: string, characterName: string): Promise<Blob> {
    const cached = AnimeCache.get(getCharacterCacheKey(animeTitle)) as AnimeCharacterNode[] | null;
    if (!cached) {
      throw new AnimeFetchingError("No cached characters found for image retrieval.");
    }

    const match = cached.find((entry) => entry.name?.full === characterName);
    const url = match?.image?.large;
    if (!url) {
      throw new AnimeFetchingError("No image URL found for the selected character.");
    }

    const response = await fetch(url);
    if (response.ok) return await response.blob();
    throw new AnimeFetchingError("Failed to fetch image.");
  }
}
