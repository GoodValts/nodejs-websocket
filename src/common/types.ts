import ws from 'ws';

export interface UserData {
  id?: number;
  name: string;
  password: string;
  wins: number;
  socket?: ws.WebSocket;
  error?: boolean;
  errorText?: string;
}

export interface RoomData {
  id: number;
  users: UserData[];
}

export interface GameData {
  id: number;
  initiator: UserData;
  players: {
    playerId: number;
    ships: ShipData[];
    shoots: { x: number; y: number }[];
  }[];
  room: RoomData;
  currentPlayer: number;
}

export interface ShipData {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}
