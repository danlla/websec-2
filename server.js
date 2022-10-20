const express = require('express'),
  app = express(),
  http = require('http').createServer(app),
  io = require('socket.io')(http)

const host = 'localhost'
const port = 7000

let players = []

let tmp = 0;

io.on('connection', (socket) => {
  console.log(`Client with id ${socket.id} connected`)

  socket.on('login', (login) => {
    let loginExist = false;
      players.forEach(player => {
        if(player.login === login){
            socket.emit('login exist');
            loginExist = true;
            return;
        }
      });
      if(!loginExist){
        players.push({
          id: socket.id,
          login: login,
          x: 150+tmp,
          y: 150,
          velocity: 0,
          rotate: 0
        });
        tmp+=100;
        socket.emit("successful");
      }
  })

  socket.on('key', (keys)=>{
    if(keys===undefined)
      return;
    let player = players.find((player) => player.id === socket.id);
    if(player===undefined)
      return;
    if(keys['a'] == true)
    {
      if(player.velocity > 0)
        player.rotate -= 1.5;
      if(player.velocity < 0)
        player.rotate += 1.5;
    }
    if(keys['d'] == true)
    {
      if(player.velocity > 0)
        player.rotate += 1.5;
      if(player.velocity < 0)
        player.rotate -= 1.5;
    }
    if(player.rotate > 360)
      player.rotate = player.rotate-360;
    if(player.rotate < -360)
      player.rotate = player.rotate +360;

    if(keys['w'] == true)
      if(player.velocity<4)
        player.velocity+=0.2;
    if(keys['s'] == true){
      if(player.velocity > 0)
        player.velocity-=0.5;
      if(player.velocity<=0)
        if(player.velocity>-4)
          player.velocity-=0.2;
    }
    if(keys['w']==false && keys['s']==false){
        if(player.velocity >0.1)
          player.velocity-=0.05;
        else if(player.velocity <-0.1)
          player.velocity +=0.05;
        else 
          player.velocity=0;
    }
    player.x+=player.velocity * Math.sin(player.rotate * Math.PI / 180);
    player.y-=player.velocity * Math.cos(player.rotate * Math.PI / 180);
    io.emit('redraw', players);
  })

  socket.on('disconnect', () => {
    players.splice(players.find((player) => player.id === socket.id), 1)
    console.log(`Client with id ${socket.id} disconnected`)
  })
})

app.use(express.static(__dirname+'/client'))

app.get('/', (req, res) =>{
  res.sendFile(__dirname+'/client/index.html')
 })

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