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

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);
    });

    socket.on('code-change', ({ roomId, code }) => {
        socket.to(roomId).emit('code-change', { code });
    });

    socket.on('language-change', ({ roomId, language }) => {
        socket.to(roomId).emit('language-change', { language });
    });


    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
