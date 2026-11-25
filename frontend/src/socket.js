import { io } from 'socket.io-client';

export const socket = io(window.location.origin, {
  autoConnect: false,
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 800
});
