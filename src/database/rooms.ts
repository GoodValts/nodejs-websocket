import { generateId } from '../common/utils';
import { RoomData, UserData } from '../common/types';

class RoomStorage {
  private static instance: RoomStorage;

  private rooms: RoomData[] = [];

  public static getInstance(): RoomStorage {
    if (!RoomStorage.instance) {
      RoomStorage.instance = new RoomStorage();
    }
    return RoomStorage.instance;
  }

  public getRooms = () => this.rooms;

  public getRoomById = (id: number): RoomData | undefined =>
    this.rooms.find((room) => room.id === id);

  public addRoom = (user: UserData) => {
    const room: RoomData = { id: generateId(), users: [user] };
    this.rooms.push();

    return room;
  };

  public deleteRoom = (id: number) =>
    this.rooms.splice(
      this.rooms.findIndex((room) => room.id === id),
      1,
    );

  public findUser = (userInfo: UserData) => {
    return this.rooms.find((room) =>
      room.users.find((user) => user === userInfo),
    );
  };

  public addUser = (roomId: number, user: UserData) => {
    const room = this.getRoomById(roomId);

    if (room) {
      if (this.findUser(user) !== room) room.users.push(user);
    }

    return room;
  };

  public removeUser = (roomId: number, user: UserData) => {
    const room = this.getRoomById(roomId);

    if (room)
      room.users.splice(
        room.users.findIndex((usr) => usr.id === user.id),
        1,
      );
  };
}

const roomStorage = RoomStorage.getInstance();

export default roomStorage;
