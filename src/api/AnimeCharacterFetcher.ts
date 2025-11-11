import axios, { all } from "axios";
import api from "../constants/api";
import AnimeCache from "../cache/AnimeCache";
import random from "../utils/random";

class AnimeFetchingError extends Error {
    constructor(message = "Error fetching data.") {
        super(message);
        this.name = "AnimeFetchingError";
    }
}

export class AnimeCharacterFetcher {
    private readonly MAX_CHARACTER_RETRIEVED = 4;
    private readonly ERROR_MESSAGE = "Error fetching data.";
    private characterChosen: string[] = [];

    public async getListOfRandomCharacters(animeTitle: string): Promise<string[]> {
        const listOfAnimeCharacters = await this.getListOfCharacters(animeTitle);
        if (!listOfAnimeCharacters) throw new AnimeFetchingError();

        return listOfAnimeCharacters
            .slice(0, this.MAX_CHARACTER_RETRIEVED)
            .map((character) => this.getCharacterName(character));
    }

    private async getListOfCharacters(animeTitle: string, shuffleList = true): Promise<any[] | false> {
        const listOfAnimeCharacters = await this.retrieveAnimeCharactersJson(animeTitle);
        if (listOfAnimeCharacters === this.ERROR_MESSAGE) return false;

        return listOfAnimeCharacters;
    }

    public async getRandomCharacterForQuiz(animeTitle: string): Promise<[string, string[]]> {
        const originalCharacterList = await this.getListOfCharacters(animeTitle, false);
        if (!originalCharacterList) throw new AnimeFetchingError();

        const chosenCharacterList: string[] = [];
        while (chosenCharacterList.length < this.MAX_CHARACTER_RETRIEVED) {
            const chosenCharacter = this.chooseRandomCharacter(originalCharacterList);
            const characterName = this.getCharacterName(chosenCharacter);
            if (chosenCharacterList.includes(characterName)) continue;
            chosenCharacterList.push(characterName);
        }

        const chosenCharacter = this.chooseRandomCharacter(chosenCharacterList);
        return [chosenCharacter, chosenCharacterList];
    }

    private chooseRandomCharacter(characterList: string[]): string {
        const chosenCharacter = random.getRandom(characterList);
        this.characterChosen.push(chosenCharacter);
        return chosenCharacter;
    }

    private getCharacterName(character: any): string {
        return character?.name?.full || "Unknown";
    }

    private extractAnimeCharacters(animeCharactersJson: any): any[] | string {
        if (!animeCharactersJson || animeCharactersJson === this.ERROR_MESSAGE) {
            return this.ERROR_MESSAGE;
        }

        try {
            const listOfAnimeCharacters = animeCharactersJson.data.Page.media[0].characters.nodes;
            if (!listOfAnimeCharacters) return this.ERROR_MESSAGE;
            return listOfAnimeCharacters;
        } catch {
            return this.ERROR_MESSAGE;
        }
    }

    private async retrieveAnimeCharactersJson(animeTitle: string, maxPages: number = 2): Promise<any> {
        const cached = AnimeCache.get(`characters_${animeTitle}`);
        if (cached) return cached;

        const maxPerPage = 25;
        let allCharacters: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= maxPages) {
            const pageData = await this.getJsonPage(animeTitle, page, maxPerPage);
            if (!pageData || pageData === this.ERROR_MESSAGE) break;

            const nodes = pageData.data?.Page?.media[0]?.characters?.nodes || [];
            allCharacters.push(...nodes);
            if (nodes.length < maxPerPage) {
                hasMore = false;
            } else {
                page++;
            }
        }
        AnimeCache.set(animeTitle, allCharacters);

        return allCharacters;
    }

    private async getJsonPage(animeTitle: string, page: number, perPage: number = 50): Promise<any> {
        const query = `
      query ($search: String, $page: Int, $perPage: Int) {
        Page {
          media(search: $search, type: ANIME) {
            characters(page: $page, perPage: $perPage) {
              nodes {
                name {
                  full
                }
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
            const response = await axios.post(api.apiUrl, { query, variables });
            return response.data;
        } catch {
            return this.ERROR_MESSAGE;
        }
    }

}
