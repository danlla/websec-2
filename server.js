const express = require('express'),
  app = express(),
  http = require('http').createServer(app),
  io = require('socket.io')(http)

const host = 'localhost';
const port = 7000;
const height = 600;
const width = 800;
const countCoinToWin = 10;
const countFires = 5;
const maxPlayer = 10;
let startGame = false;
let players = [];

let coin = {x: 20+(width-20*2)*Math.random(),
        y: 10+(height-10*2)*Math.random()};

let fires = [];
for(let i = 0; i < countFires; i++)
  fires.push({x: 60+(width-60*2)*Math.random(), y: 40+(height-40*2)*Math.random(), changing: false})

setInterval(()=>{players.forEach(player => {
  player.canSend = true;
});}, 10);

io.on('connection', (socket) => {
  console.log(`Client with id ${socket.id} connected`)

  socket.on('login', (loginData) => {
    if(!/^[a-zA-Z0-9-_\.]{3,10}$/i.test(loginData.l)){
      socket.emit('error', 'login must be in range (3,10) and consist of letters, numbers and the _ symbol')
      return;
    }

    if(players.length === maxPlayer){
      socket.emit('error', `max ${maxPlayer} player`);
      return;
    }

    if(startGame){
      socket.emit('error', 'game already started');
      return;
    }
    let loginExist = false;
      players.forEach(player => {
        if(player.login === loginData.l){
            socket.emit('error', 'login exist');
            loginExist = true;
            return;
        }
      });
      if(!loginExist){
        players.push({
          id: socket.id,
          login: loginData.l,
          ready: false,
          canSend: true,
          inLobby: true,
          color: loginData.color,
          score: 0,
          fireTouched: 0,
          x: 20+(width-20*2)*Math.random(),
          y: 10+(height-10*2)*Math.random(),
          velocity: 0,
          rotate: 0
        });
        socket.emit('lobby');
        io.emit('updateLobby', players);
      }
  })

  socket.on('ready', (ready)=>{
    if(ready===undefined)
      return;
    let player = players.find((player) => player.id === socket.id);
    if(player===undefined)
    {
      console.log(`${socket.id} undefined`);
      console.log(players);
    }
    player.ready = ready;
    players.forEach(p => {
      if(p.inLobby)
        socket.to(p.id).emit('updateLobby', players);
    });
    socket.emit('updateLobby', players);
    let someNotReady = false;
    players.forEach((player)=>{
      if(!player.ready)
        someNotReady = true;
    })
    if(!someNotReady){
      startGame = true;
      io.emit('start');
    }
  })

  socket.on('back', ()=>{
    let player = players.find((player) => player.id === socket.id);
    player.inLobby = true;
    socket.emit('lobby');
    socket.emit('updateLobby', players);
  })

  socket.on('key', (keys)=>{
    if(keys===undefined)
      return;
    let player = players.find((player) => player.id === socket.id);
    if(player===undefined)
      return;

    if(player.ready===false)
      return;

    if(player.canSend===false)
      return;

    player.canSend = false;

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
        if(Math.pow((p.x - player.x),2) + Math.pow((p.y - player.y),2) < Math.pow(55,2)){
          p.velocity = 0;
          player.velocity = -player.velocity*1.1;
        }
    });

    if(Math.pow((coin.x - player.x),2) + Math.pow((coin.y - player.y),2) < Math.pow(45,2)){
      player.score++;
      coin.x = 20+760*Math.random();
      coin.y = 20+560*Math.random();
    }

    if(player.score === countCoinToWin){
      io.emit('end', {ps:players, p:player});
      players.forEach((player)=>{player.ready = false; player.score=0; player.fireTouched=0; player.inLobby=false;});
      startGame = false;
      return;
    }

    fires.forEach(fire => {
      if(Math.pow((fire.x - player.x), 2) + Math.pow((fire.y - player.y),2) < Math.pow(40,2)){
        player.velocity = player.velocity > 0? 0.5: -0.5;
        if(!fire.changing){
          fire.changing = true;
          setTimeout(()=>{
          fire.x = 60+(width-60*2)*Math.random();
          fire.y = 40+(height-40*2)*Math.random();
          player.fireTouched += 1;
          fire.changing = false;
        }, 1000);
        }
      }
    });

    io.emit('redraw', {ps:players, c:coin, f:fires});
  })

  socket.on('disconnect', () => {
    players.splice(players.findIndex((player) => player.id === socket.id), 1);
    console.log(`Client with id ${socket.id}} disconnected`);
    if(players.length === 0)
      startGame = false;
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

http.listen(port, host, () =>
  console.log(`Server listens http://${host}:${port}`)
)