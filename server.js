const express = require('express'),
  app = express(),
  http = require('http').createServer(app),
  io = require('socket.io')(http)

const host = 'localhost';
const port = 7000;

let players = [];

let coin = {x: 20+760*Math.random(),
        y: 20+560*Math.random()};

let fires = [{x: 150, y: 150}, {x: 523, y:120}, {x: 300, y: 402}];

setInterval(()=>{players.forEach(player => {
  player.can_send = true;
});}, 10);

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
          can_send: true,
          score: 0,
          x: 20+760*Math.random(),
          y: 20+560*Math.random(),
          velocity: 0,
          rotate: 0
        });
        socket.emit("successful");
      }
  })

  socket.on('key', (keys)=>{
    if(keys===undefined)
      return;
    let player = players.find((player) => player.id === socket.id);
    if(player===undefined)
      return;

    if(player.can_send===false)
      return;
    player.can_send = false;

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

    if(player.x>=799)
      player.x = 798;
    if(player.x<=1)
      player.x = 2;
    if(player.y>=599)
      player.y=598;
    if(player.y<=1)
      player.y = 2;

    players.forEach(p => {
      if(p!==player)
        if(Math.sqrt((p.x - player.x)^2 + (p.y - player.y)^2) < 1.2){
          p.velocity = 0;
          player.velocity = 0;
        }
    });

    if(Math.sqrt((coin.x - player.x)^2 + (coin.y - player.y)^2) < 2){
      player.score++;
      coin.x = 20+760*Math.random();
      coin.y = 20+560*Math.random();
      console.log(player.score);
    }

    fires.forEach(fire => {
      if(Math.sqrt((fire.x - player.x)^2 + (fire.y - player.y)^2) < 2){
        player.velocity = 0;
      }
    });

    io.emit('redraw', [players, coin, fires]);
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