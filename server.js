const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const formatMessage = require('./utils/formatMessage');

const botName = 'CodeExpertsBot';

app.use(express.static(path.join(__dirname, 'public')));

io.on('connect', socket => {

    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Your welcome!'));

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    socket.on('chatMessage', chatMessage =>  {
        user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, chatMessage));
    });

    socket.on('disconnect', socket => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));