import axios from "axios";
import api from "../constants/api";
import AnimeCache from "../cache/AnimeCache";
import random from "../utils/random";
import { getCharacterCacheKey } from "./cacheKeys";
import type { AniListCharactersResponse, AnimeCharacterNode } from "../types/animeApi";

type Difficulty = "easy" | "medium" | "hard";

class AnimeFetchingError extends Error {
    constructor(message = "Error fetching data.") {
        super(message);
        this.name = "AnimeFetchingError";
    }
}

export class AnimeCharacterFetcher {
    private readonly MAX_CHARACTER_RETRIEVED = 4;
    private usedCharacters = new Set<string>();


    public async getListOfRandomCharacters(animeTitle: string): Promise<string[]> {
        const listOfAnimeCharacters = await this.getListOfCharacters(animeTitle);

        return listOfAnimeCharacters
            .slice(0, this.MAX_CHARACTER_RETRIEVED)
            .map((character) => this.getCharacterName(character));
    }

    private async getListOfCharacters(animeTitle: string): Promise<AnimeCharacterNode[]> {
        return this.retrieveAnimeCharactersJson(animeTitle);
    }

    public async getRandomCharacterForQuiz(animeTitle: string, difficulty: Difficulty = "medium"): Promise<[string, string[]]> {
        const originalCharacterList = await this.getListOfCharacters(animeTitle);

        const poolForCorrect = this.getPoolByDifficulty(originalCharacterList, difficulty);
        const chosenCharacter = this.chooseCorrectCharacter(poolForCorrect.length ? poolForCorrect : originalCharacterList);

        const chosenCharacterList: string[] = [chosenCharacter];
        while (chosenCharacterList.length < this.MAX_CHARACTER_RETRIEVED) {
            const candidate = this.chooseRandomCharacter(originalCharacterList);
            const characterName = this.getCharacterName(candidate);
            if (chosenCharacterList.includes(characterName)) continue;
            chosenCharacterList.push(characterName);
        }

        for (let index = chosenCharacterList.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [chosenCharacterList[index], chosenCharacterList[swapIndex]] = [chosenCharacterList[swapIndex], chosenCharacterList[index]];
        }

        return [chosenCharacter, chosenCharacterList];
    }

    private chooseCorrectCharacter(characterList: AnimeCharacterNode[]): string {
        if (characterList.length === 0) {
            throw new AnimeFetchingError("No characters were found for the selected anime.");
        }
        if (this.usedCharacters.size >= characterList.length) {
            this.usedCharacters.clear();
        }

        let character: AnimeCharacterNode;
        let characterName;
        do {
            character = this.chooseRandomCharacter(characterList);
            characterName = this.getCharacterName(character);
        } while (this.usedCharacters.has(characterName));

        this.usedCharacters.add(characterName);
        return characterName;
    }

    private getPoolByDifficulty(characterList: AnimeCharacterNode[], difficulty: Difficulty): AnimeCharacterNode[] {
        if (!characterList || characterList.length === 0) return [];

        const sorted = [...characterList].sort((a, b) => (b.favourites || 0) - (a.favourites || 0));
        const n = sorted.length;

        if (difficulty === "easy") {
            const cutoff = Math.max(1, Math.ceil(n * 0.3));
            return sorted.slice(0, cutoff);
        }

        if (difficulty === "medium") {
            const cutoff = Math.max(1, Math.ceil(n * 0.65));
            return sorted.slice(0, cutoff);
        }
        // hard: return full list (more obscure characters allowed)
        return characterList;
    }

    private chooseRandomCharacter(characterList: AnimeCharacterNode[]): AnimeCharacterNode {
        return random.getRandom(characterList);
    }

    private getCharacterName(character: AnimeCharacterNode): string {
        return character?.name?.full || "Unknown";
    }

    private async retrieveAnimeCharactersJson(animeTitle: string, maxPages: number = 2): Promise<AnimeCharacterNode[]> {
        const cacheKey = getCharacterCacheKey(animeTitle);
        const cached = AnimeCache.get(cacheKey) as AnimeCharacterNode[] | null;
        if (cached) return cached;

        const maxPerPage = 25;
        const allCharacters: AnimeCharacterNode[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= maxPages) {
            const pageData = await this.getJsonPage(animeTitle, page, maxPerPage);
            if (!pageData) break;

            const nodes = pageData.data?.Page?.media?.[0]?.characters?.nodes || [];
            allCharacters.push(...nodes);
            if (nodes.length < maxPerPage) {
                hasMore = false;
            } else {
                page++;
            }
        }
        if (allCharacters.length === 0) {
            throw new AnimeFetchingError("No characters were found for the selected anime.");
        }

        AnimeCache.set(cacheKey, allCharacters);

        return allCharacters;
    }

    private async getJsonPage(
        animeTitle: string,
        page: number,
        perPage: number = 50
    ): Promise<AniListCharactersResponse | null> {
        const query = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page {
          media(search: $search, type: ANIME) {
            characters(page: $page, perPage: $perPage) {
              nodes {
                name {
                  full
                }
                favourites
                image {
                  large
                }
              }
            }
          }
        }
      }
    `;

        const variables = { search: animeTitle, page, perPage };

        try {
            const response = await axios.post<AniListCharactersResponse>(api.apiUrl, { query, variables });
            return response.data;
        } catch {
            return null;
        }
    }

}
