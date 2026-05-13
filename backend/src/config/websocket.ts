import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

let io: SocketServer;

export function setupWebSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Autenticação via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Token não fornecido'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    logger.info(`🔌 Usuário conectado: ${user.email} [${socket.id}]`);

    // Entrar na sala da empresa
    if (user.companyId) {
      socket.join(`company:${user.companyId}`);
    }

    socket.on('disconnect', () => {
      logger.info(`❌ Usuário desconectado: ${user.email}`);
    });
  });

  logger.info('✅ WebSocket configurado');
  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('WebSocket não inicializado');
  return io;
}

// Emitir evento para uma empresa
export function emitToCompany(companyId: string, event: string, data: any) {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
}
