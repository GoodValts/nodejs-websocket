import ws from 'ws';
import roomStorage from '../database/rooms';
import userStorage from '../database/users';
import { RoomData, UserData } from './types';
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

    if (room.users.length > 1) startGame(user, room);
  }
};

export const startGame = (user: UserData, room: RoomData) => {
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
