const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { ExpressPeerServer } = require('peer');

const app = express();
app.use(cors());

const server = http.createServer(app);

const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: '/peerjs',
});

app.use('/peerjs', peerServer);

const io = new Server(server, {
    cors: {
        origin: '*', // Or use your frontend URL
        methods: ['GET', 'POST'],
    },
});

const usersInRoom = {}; // Track users by room

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);

        if (!usersInRoom[roomId]) {
            usersInRoom[roomId] = [];
        }
        usersInRoom[roomId].push(socket.id);

        // Send to the newly joined user all existing users in this room
        const otherUsers = usersInRoom[roomId].filter(id => id !== socket.id);
        socket.emit('all-users', otherUsers);

        // Notify existing users that a new user has joined
        socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('code-change', ({ roomId, code }) => {
        socket.to(roomId).emit('code-change', { code });
    });

    socket.on('language-change', ({ roomId, language }) => {
        socket.to(roomId).emit('language-change', { language });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Remove user from all rooms they were part of
        for (const roomId in usersInRoom) {
            usersInRoom[roomId] = usersInRoom[roomId].filter(id => id !== socket.id);
            socket.to(roomId).emit('user-left', socket.id);
            if (usersInRoom[roomId].length === 0) {
                delete usersInRoom[roomId]; // Cleanup empty rooms
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
