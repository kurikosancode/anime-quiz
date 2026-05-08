export interface AnimeCharacterNode {
    name?: {
        full?: string | null;
    };
    image?: {
        large?: string | null;
    };
    favourites?: number | null;
}

interface AniListMedia {
    characters?: {
        nodes?: AnimeCharacterNode[];
    };
}

export interface AniListCharactersResponse {
    data?: {
        Page?: {
            media?: AniListMedia[];
        };
    };
}
