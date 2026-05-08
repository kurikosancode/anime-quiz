import type AnimeResultProps from '../props/AnimeResultProps';

interface JikanAnime {
    mal_id: number;
    title: string;
    images: {
        jpg: {
            image_url: string;
        };
    };
    genres?: Array<{ name: string }>;
}

interface JikanResponse {
    data: JikanAnime[];
}

const getAnime = (data: JikanResponse): AnimeResultProps[] => {
    return data.data.map((anime) => ({
        animeId: anime.mal_id,
        animeName: anime.title,
        imagePath: anime.images.jpg.image_url,
        genres: anime.genres?.map((g) => g.name).join(', ') || '',
        animeUrl: `https://myanimelist.net/anime/${anime.mal_id}`,
    }));
};

const fetchAnime = async (_query: string, apiUrl: string): Promise<AnimeResultProps[]> => {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return [];
        }

        const data = await response.json() as JikanResponse;
        return getAnime(data);
    } catch {
        return [];
    }
};

export default fetchAnime;