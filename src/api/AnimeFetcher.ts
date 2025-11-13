import api from '../constants/api';

const getAnime = (data: any) => {
    return data.data.map((anime: any) => ({
        animeId: anime.mal_id,
        animeName: anime.title,
        imagePath: anime.images.jpg.image_url,
        genres: anime.genres?.map((g: any) => g.name).join(', ') || '',
        animeUrl: `https://myanimelist.net/anime/${anime.mal_id}`,
    }));
}

const fetchAnime = (query: string, apiUrl: string) => {
    console.log('Fetching anime for query:', query);
    return fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            let fetchedAnime = getAnime(data);
            return fetchedAnime;
        })
        .catch(err => {
            console.error('Error fetching top anime:', err);
            return [];
        });
}

export default fetchAnime;