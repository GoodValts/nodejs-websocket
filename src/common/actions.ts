import ws from 'ws';
import roomStorage from '../database/rooms';
import userStorage from '../database/users';
import {
  GameData,
  RoomData,
  ShipData,
  ShootResponse,
  ShootData,
  UserData,
} from './types';
import { createResponse } from './utils';
import gameStorage from '../database/games';

export const getActiveRooms = () => {
  const readyRooms = roomStorage
    .getRooms()
    .filter((room) => room.users.length === 1);

  const data = readyRooms.map((room) => ({
    roomId: room.id,
    roomUsers: [
      {
        name: room.users[0].name,
        index: room.users[0].id,
      },
    ],
  }));

  return createResponse({ type: 'update_room', data, id: 0 });
};

export const registerUser = (socket: ws.WebSocket, userData: UserData) => {
  const response = {
    id: 0,
    type: 'reg',
    data: {
      name: '',
      index: 0,
      error: true,
      errorText: '',
    },
  };

  const account = userStorage.getUserByName(userData.name);

  if (account) {
    if (account.password === userData.password) {
      if (userData.socket && userData.socket.readyState === 1) {
        response.data = {
          ...response.data,
          error: true,
          errorText: 'Another connection is detected!',
        };
      } else {
        response.data = {
          ...response.data,
          name: account.name,
          index: account.id as number,
          error: false,
        };
        account.socket = socket;
      }
    } else {
      response.data = {
        ...response.data,
        error: true,
        errorText: `User ${userData.name} is already exists.`,
      };
    }
  } else {
    const newUser = userStorage.addUser(userData, socket);
    response.data = {
      ...response.data,
      name: newUser.name,
      index: newUser.id as number,
      error: false,
    };
  }

  socket.send(createResponse(response));
};

export const getWinners = () => {
  const data = userStorage
    .getUsers()
    .sort((user) => user.wins)
    .map((user) => ({ name: user.name, wins: user.wins }));

  return createResponse({ type: 'update_winners', data, id: 0 });
};

export const createRoom = (socket: ws.WebSocket) => {
  const user = userStorage.getUserBySocket(socket);

  if (user) return roomStorage.findUser(user) || roomStorage.addRoom(user);
};

export const addToRoom = (
  socket: ws.WebSocket,
  data: { indexRoom: number },
) => {
  const user = userStorage.getUserBySocket(socket);
  if (user) {
    const room = roomStorage.addUser(data.indexRoom, user) as RoomData;

    if (room.users.length > 1) createGame(user, room);
  }
};

export const createGame = (user: UserData, room: RoomData) => {
  const response = {
    id: 0,
    type: 'create_game',
    data: {
      idGame: gameStorage.addGame(user, room).id,
      idPlayer: 0,
    },
  };

  room.users.forEach((player) => {
    response.data.idPlayer = player.id as number;
    player.socket?.send(createResponse(response));
  });

  roomStorage.getRooms().forEach((roomEl) => {
    if (room.id !== roomEl.id)
      if (roomEl.users.find((player) => player === user))
        roomStorage.removeUser(roomEl.id, user);
  });
};

export const addShips = (data: {
  gameId: number;
  ships: ShipData[];
  indexPlayer: number;
}) => {
  const game = gameStorage.setShips(data.gameId, data.indexPlayer, data.ships);
  if (game && game.players.length > 1) startGame(game, data.indexPlayer);
};

export const startGame = (game: GameData, firstPlayer: number) => {
  game.room.users.forEach((user) => {
    const player = game.players.find((plr) => plr.playerId === user.id);

    if (player) {
      user.socket?.send(
        createResponse({
          id: 0,
          type: 'start_game',
          data: {
            ships: player.ships,
            currentPlayerIndex: player.playerId,
          },
        }),
      );
    }
  });

  game.currentPlayer = firstPlayer;

  sendTurn(game.room, firstPlayer);
};

const sendTurn = (room: RoomData, turn: number) =>
  room.users.forEach((usr) =>
    usr.socket?.send(
      createResponse({
        type: 'turn',
        data: {
          currentPlayer: turn,
        },
        id: 0,
      }),
    ),
  );

export const makeShoot = (socket: ws.WebSocket, data: ShootData) => {
  if (data.x === undefined) data.x = Math.floor(Math.random() * 10);
  if (data.y === undefined) data.y = Math.floor(Math.random() * 10);

  const user = userStorage.getUserBySocket(socket);
  const game = gameStorage.getGameById(data.gameId);

  if (!game) return false;

  const opponent = game.players.find(
    (player) => player.playerId !== data.indexPlayer,
  );

  if (user?.id !== game.currentPlayer || !opponent) return false;

  const response: ShootResponse = {
    position: {
      x: data.x,
      y: data.y,
    },
    currentPlayer: data.indexPlayer,
    status: 'miss',
  };

  const damaged = opponent.ships.find((ship) =>
    inspectShoot(ship, data.x!, data.y!),
  );

  if (damaged) {
    const repeat = opponent.shoots.find(
      (shoot) => shoot.x === data.x && shoot.y === data.y,
    );

    if (!repeat) {
      opponent.shoots.push({ x: data.x, y: data.y });
      damaged.hits = (damaged.hits || 0) + 1;
    }

    if (damaged.hits === damaged.length) {
      getCellsAround(damaged).forEach((cell) => {
        response.position.x = cell.x;
        response.position.y = cell.y;
        sendResult(game, response);
      });

      response.status = 'killed';

      killShip(damaged).forEach((cell) => {
        response.position.x = cell.x;
        response.position.y = cell.y;
        sendResult(game, response);
      });

      checkFinished();
    } else {
      response.status = 'shot';
      sendResult(game, response);
    }
    sendTurn(game.room, data.indexPlayer);
  } else {
    sendResult(game, response);
    game.currentPlayer = opponent.playerId;
    sendTurn(game.room, opponent.playerId);
  }
};

const inspectShoot = (ship: ShipData, x: number, y: number) => {
  if (ship.direction) {
    for (let i = ship.position.y; i < ship.position.y + ship.length; i += 1) {
      if (x === ship.position.x && y === i) return true;
    }
  } else {
    for (let i = ship.position.x; i < ship.position.x + ship.length; i++) {
      if (x === i && y === ship.position.y) return true;
    }
  }

  return false;
};

const getCellsAround = (ship: ShipData) => {
  const range = [
    { x: ship.position.x, y: ship.position.y },
    {
      x: ship.direction ? ship.position.x : ship.position.x + ship.length - 1,
      y: ship.direction ? ship.position.y + ship.length - 1 : ship.position.y,
    },
  ];

  const cells: ShipData['position'][] = [];

  range.forEach((pos) => {
    for (let i = pos.x - 1; i <= pos.x + 1; i += 1) {
      for (let j = pos.y - 1; j <= pos.y + 1; j += 1) {
        if (
          i >= 0 &&
          j >= 0 &&
          i <= 10 &&
          j <= 10 &&
          !cells.find((cell) => cell.x === i && cell.y === j)
        ) {
          cells.push({ x: i, y: j });
        }
      }
    }
  });

  return cells;
};

const sendResult = (game: GameData, data: ShootResponse) => {
  const response = {
    type: 'attack',
    data,
    id: 0,
  };
  game.room.users.forEach((player) => {
    player.socket?.send(createResponse(response));
  });
};

const killShip = (ship: ShipData) => {
  const cells: ShipData['position'][] = [];
  if (ship.direction) {
    for (let i = ship.position.y; i < ship.position.y + ship.length; i += 1) {
      cells.push({ x: ship.position.x, y: i });
    }
  } else {
    for (let i = ship.position.x; i < ship.position.x + ship.length; i += 1) {
      cells.push({ x: i, y: ship.position.y });
    }
  }
  return cells;
};

export const checkFinished = () => {
  const response = {
    type: 'finish',
    data: { winPlayer: 0 },
    id: 0,
  };

  gameStorage.getGames().forEach((game) => {
    const roomUsers = game.room.users;

    if (game && roomUsers.length === 1)
      if (roomUsers[0].id) response.data.winPlayer = roomUsers[0].id;

    game.players.forEach((player) => {
      if (player.ships.every((ship) => ship.hits === ship.length)) {
        const opponent = game.players.find(
          (opponent) => opponent.playerId !== player.playerId,
        );

        if (opponent) response.data.winPlayer = opponent.playerId;
      }
    });

    if (response.data.winPlayer) {
      game.room.users.forEach((user) =>
        user.socket?.send(createResponse(response)),
      );

      const user = userStorage.getUserById(response.data.winPlayer);

      if (user) user.wins += 1;

      userStorage
        .getUsers()
        .forEach((usr) => usr.socket?.send(getFinishResponse()));

      roomStorage.deleteRoom(game.room.id);
      gameStorage.deleteGame(game.id);
    }
  });
};

export const getFinishResponse = () => {
  const data = userStorage
    .getUsers()
    .sort((user) => user.wins)
    .map((user) => {
      return {
        name: user.name,
        wins: user.wins,
      };
    });

  return createResponse({ type: 'update_winners', data, id: 0 });
};
