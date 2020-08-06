const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, { debug: true });

const { v4: uuidV4 } = require('uuid'); // rename as uuidV4

const PORT = process.env.PORT || 5000;

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  // res.render('index');
  res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room, port: PORT });
});

io.on('connection', (socket) => {
  // + create  a new event
  // on : create an event
  // emit : fire the event
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId); // braodcast , if the others connected to my room

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });

    // + chat
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message);
    });
  });
});

server.listen(PORT, () => console.log(`Server running on Port on ${PORT}`));
