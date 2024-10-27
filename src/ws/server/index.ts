import ws from 'ws';
import { getActiveRooms } from '../../common/actions';

const PORT = 3000;

const wsServer = new ws.WebSocketServer({ port: PORT });

console.log(
  '\n\x1b[32m\x1b[1m%s: \x1b[35m\x1b[1m%s\x1b[0m\n',
  'WebSocket server is running on port',
  `${PORT}`,
);

wsServer.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', () => {
    console.log('get msg');
    wsServer.clients.forEach((cli) => cli.send(getActiveRooms()));
  });

  ws.on('close', () => {
    console.log('close');
  });
});
