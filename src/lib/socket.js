import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    if (!io) {
        io = new Server(server, {
            path: '/api/socket',
            addTrailingSlash: false,
        });

        io.on('connection', (socket) => {
            console.log('Client connected to socket');

            socket.on('disconnect', () => {
                console.log('Client disconnected from socket');
            });
        });
    }
    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

export const emitLog = (type, message, data = {}) => {
    if (io) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        io.emit('log', {
            type,
            message,
            timestamp,
            data
        });
    }
};
