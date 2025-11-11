import AnimeCache from "../cache/AnimeCache";


export class AnimeFetchingError extends Error {
  constructor(message = "Error fetching data.") {
    super(message);
    this.name = "AnimeFetchingError";
  }
}

export class AnimeImageFetcher {
  public async retrieveImage(animeTitle: string, characterName: string): Promise<Blob> {
    const cached = AnimeCache.get(animeTitle);
    const matches = cached.filter((entry: any) => entry.name.full === characterName);
    const url = matches[0]?.image.large
    const response = await fetch(url);
    if (response.ok) return await response.blob();
    throw new AnimeFetchingError("Failed to fetch image.");
  }
}
