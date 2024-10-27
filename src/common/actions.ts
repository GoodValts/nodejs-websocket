import roomStorage from '../database/rooms';
import { createResponse } from './utils';

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
