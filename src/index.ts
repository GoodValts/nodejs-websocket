import { httpServer } from './http_server/index';
import './ws/server';

const HTTP_PORT = 8181;

console.log(
  '\x1b[32m\x1b[1m%s: \x1b[35m\x1b[1m%s\x1b[0m\n\x1b[34m%s\x1b\n\x1b[0m',
  'Static http server is running on port',
  `${HTTP_PORT}`,
  `http://localhost:${HTTP_PORT}`,
),
  httpServer.listen(HTTP_PORT);
