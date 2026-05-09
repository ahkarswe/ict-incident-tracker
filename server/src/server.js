import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { getCorsOrigins } from './config/cors.js';
import { createApp } from './app.js';

dotenv.config();

const start = async () => {
  await connectDB(process.env.MONGO_URI);

  const app = createApp();
  const server = http.createServer(app);
  const allowedOrigins = getCorsOrigins();

  if (String(process.env.ENABLE_SOCKET || 'true') === 'true') {
    const io = new Server(server, {
      cors: { origin: allowedOrigins, credentials: true }
    });
    io.on('connection', (socket) => {
      socket.emit('connected', { message: 'Realtime incident updates enabled' });
    });
    app.set('io', io);
  }

  const port = Number(process.env.PORT || 5000);
  server.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
