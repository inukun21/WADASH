import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
    if (res.socket.server.io) {
        console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        // Make io globally accessible for bot instances
        global.io = io;

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Join user-specific room
            socket.on('join', (userId) => {
                if (userId) {
                    socket.join(userId);
                    console.log(`Socket ${socket.id} joined room: ${userId}`);
                    socket.emit('joined', { room: userId });
                }
            });

            // Leave user-specific room
            socket.on('leave', (userId) => {
                if (userId) {
                    socket.leave(userId);
                    console.log(`Socket ${socket.id} left room: ${userId}`);
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
    res.end();
};

export default SocketHandler;
