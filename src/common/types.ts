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
  hits?: number;
}

export interface WSResponse {
  type: string;
  data: object;
  id: number;
}

export type ShootData = {
  gameId: number;
  x?: number;
  y?: number;
  indexPlayer: number;
};

export type ShootResponse = {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number;
  status: 'miss' | 'killed' | 'shot';
};
