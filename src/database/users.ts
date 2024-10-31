import ws from 'ws';
import { UserData } from '../common/types';
import { generateId } from '../common/utils';

class UserStorage {
  private static instance: UserStorage;

  private users: UserData[] = [];

  public static getInstance(): UserStorage {
    if (!UserStorage.instance) {
      UserStorage.instance = new UserStorage();
    }
    return UserStorage.instance;
  }

  public getUsers = () => this.users;

  public getUserBySocket = (socket: ws.WebSocket): UserData | undefined =>
    this.users.find((user) => user.socket === socket);

  public getUserByName = (name: string): UserData | undefined =>
    this.users.find((user) => user.name === name);

  public getUserById = (id: number): UserData | undefined =>
    this.users.find((user) => user.id === id);

  public addUser = (
    userInfo: Pick<UserData, 'name' | 'password'>,
    socket: ws.WebSocket,
  ): UserData => {
    const id = generateId();
    const wins = 0;
    const userData: Omit<
      Required<UserData>,
      'error' | 'errorText' | 'botSocket'
    > = {
      ...userInfo,
      id,
      wins,
      socket,
    };
    this.users.push(userData);

    return userData;
  };

  public deleteUser = (id: number) => {
    this.users.splice(
      this.users.findIndex((user) => user.id === id),
      1,
    );
  };
}

const userStorage = UserStorage.getInstance();

export default userStorage;
