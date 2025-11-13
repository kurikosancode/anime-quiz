const apiUrl = "https://graphql.anilist.co";
const animeSearchUrl = (query: string, limit: number) => `https://api.jikan.moe/v4/anime?q=${query}&order_by=popularity&limit=${limit}`
const animeDefaultUrl = (limit: number) => `https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=${limit}`;

export default { apiUrl, animeSearchUrl, animeDefaultUrl };