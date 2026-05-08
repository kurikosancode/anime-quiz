export const getCharacterCacheKey = (animeTitle: string): string =>
    `characters_${animeTitle.trim().toLowerCase()}`;
