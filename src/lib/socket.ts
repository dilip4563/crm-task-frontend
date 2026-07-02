import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    socket = io(url, { withCredentials: true, autoConnect: false });
  }
  return socket;
}

export function connectSocket(userId: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('register', userId);
  }
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
