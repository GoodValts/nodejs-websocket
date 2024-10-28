import ws from 'ws';
import {
  addShips,
  addToRoom,
  createRoom,
  getActiveRooms,
  getWinners,
  makeShoot,
  registerUser,
} from '../common/actions';

const PORT = 3000;

const wsServer = new ws.WebSocketServer({ port: PORT });

console.log(
  '\n\x1b[32m\x1b[1m%s: \x1b[35m\x1b[1m%s\x1b[0m\n',
  'WebSocket server is running on port',
  `${PORT}`,
);

wsServer.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', input.bind(ws));

  ws.on('close', () => sendAll(getActiveRooms()));
});

function sendAll(msg: string) {
  wsServer.clients.forEach((client) => client.send(msg));
}

function input(this: ws.WebSocket, ctx: string) {
  const { type, data } = JSON.parse(ctx);
  console.log(`'${type}' : ${data}`);

  switch (type) {
    case 'reg':
      registerUser(this, JSON.parse(data));
      sendAll(getActiveRooms());
      sendAll(getWinners());
      break;
    case 'create_room':
      createRoom(this);
      sendAll(getActiveRooms());
      break;
    case 'single_play':
      createRoom(this); // temp
      sendAll(getActiveRooms());
      break;
    case 'add_user_to_room':
      addToRoom(this, JSON.parse(data));
      sendAll(getActiveRooms());
      break;
    case 'add_ships':
      addShips(JSON.parse(data));
      break;
    case 'attack':
      makeShoot(this, JSON.parse(data));
      break;
    case 'randomAttack':
      makeShoot(this, JSON.parse(data));
      break;
    default:
      break;
  }
}
