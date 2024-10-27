import { GameData, RoomData, ShipData, UserData } from '../common/types';
import { generateId } from '../common/utils';

class GameStorage {
  private static instance: GameStorage;

  private games: GameData[] = [];

  public static getInstance(): GameStorage {
    if (!GameStorage.instance) {
      GameStorage.instance = new GameStorage();
    }
    return GameStorage.instance;
  }

  public getGames = () => this.games;

  public getGameById = (id: number): GameData | undefined =>
    this.games.find((game) => game.id === id);

  public getGameByUserId = (id: number) =>
    this.games.find((game) =>
      game.players.find((player) => (player.playerId = id)),
    );

  public addGame = (initiator: UserData, room: RoomData) => {
    const game = {
      id: generateId(),
      initiator: initiator,
      players: [],
      room,
      currentPlayer: 0,
    };

    this.games.push(game);

    return game;
  };

  public setShips = (gameId: number, playerId: number, ships: ShipData[]) => {
    const currGame = this.getGameById(gameId);

    if (currGame) currGame.players.push({ playerId, ships, shoots: [] });

    return currGame;
  };

  public deleteGame = (id: number) =>
    this.games.slice(
      this.games.findIndex((game) => game.id === id),
      1,
    );
}

const gameStorage = GameStorage.getInstance();

export default gameStorage;
