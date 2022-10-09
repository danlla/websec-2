const express = require('express'),
  app = express(),
  http = require('http').createServer(app),
  io = require('socket.io')(http)

const host = 'localhost'
const port = 7000

let players = []

io.on('connection', (socket) => {
  console.log(`Client with id ${socket.id} connected`)

  socket.on('login', (login) => {
    console.log('Login: ', login)
      players.forEach(player => {
        if(player.login === login)
            socket.emit('login exist');
            return;
      });
      players.push({
        id: socket.id,
        login: login
      });
  })

  socket.on('disconnect', () => {
    players.splice(players.find((player) => player.id === socket.id), 1)
    console.log(`Client with id ${socket.id} disconnected`)
  })
})

app.use(express.static(__dirname))

app.get('/', (req, res) => res.render('index'))

app.get('/players-count', (req, res) => {
  res.json({
    count: players.length,
  })
})

app.get('/players', (req, res) => {
    res.json({
      players: players,
    })
  })

app.post('/player/:id', (req, res) => {
  if (players.indexOf(req.params.id) !== -1) {
    io.sockets.connected[req.params.id].emit(
      'private message',
      `Message to player with id ${req.params.id}`
    )
    return res
      .status(200)
      .json({
        message: `Message was sent to client with id ${req.params.id}`,
      })
  } else
    return res
      .status(404)
      .json({ message: 'Client not found' })
})

http.listen(port, host, () =>
  console.log(`Server listens http://${host}:${port}`)
)