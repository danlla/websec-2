let button = document.querySelector('#button');
let colorSelect = document.querySelector('#color');
let devError = document.querySelector('#error');
let devLogin = document.querySelector('#devLogin');
let devField = document.querySelector('#field');
let lobbyButton = document.createElement('button');
let backButton = document.createElement('button');

let width = 800;
let height = 600;
let scoresWidth = width;
let scoresHeight = height;

const widthCar = 30;
const heightCar = 60;

const widthCoin = 25;
const heightCoin = 25;

const widthFire = 50;
const heightFire = 50;

let selectedColor = 'aqua';

let end = false;
let ready = false;
let inLobby = true;

let login;

let socket = io();

lobbyButton.onclick = ()=>{
  ready=!ready;
  socket.emit('ready', ready);
}

backButton.onclick = ()=>{
  inLobby = true;
  devField.removeChild(canvas);
  devField.removeChild(canvasScores);
  socket.emit('back');
  backButton.remove();
}

colorSelect.addEventListener('change', ()=>{
  colorSelect.style.backgroundColor = colorSelect.value;
  selectedColor = colorSelect.value;
})

button.onclick = () =>{
    login = document.getElementById('login').value;
    socket.emit('login', {l: login, color: selectedColor});
    socket.on('error', (mes)=>{
        devError.innerHTML = mes;
        login = '';
        return;
    })
    devError.innerHTML = '';
}

let firstStart = true;

socket.on('start', ()=>{
  end = false;
  inLobby = false;
  lobbyButton.remove();
  devField.removeChild(canvas);
  devField.appendChild(canvasScores);
  devField.appendChild(canvas);
  if(firstStart){
    firstStart = false;
    setInterval(()=>{socket.emit('key', keys)}, 10);
  }
})

function createLobby(){
  lobbyButton.innerHTML = 'Ready';
  lobbyButton.style.width = '600px'
  lobbyButton.style.height = '30px'
  lobbyButton.style.borderRadius = '5px';
  lobbyButton.style.backgroundColor = '#E7BEE7';
  document.body.appendChild(lobbyButton);
  devField.appendChild(canvas);
}

socket.on('lobby', ()=>{
  devLogin.remove();
  createLobby();
});

socket.on('updateLobby', (players)=>{
  if(!inLobby)
    return;
  let i = 0;
  console.log('update lobby');
  ctx.drawImage(lobbyBackground, 0, 0);
  players.forEach((player) => {
    ctx.fillStyle = 'rgb(231, 190, 231)';
    ctx.fillRect(15, i*height/10+10, 300, 50);
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.font = '18px serif';
    ctx.fillText(`${player.login===login?player.login+' (you)':player.login}`, 20, i*height/10+40);
    ctx.fillStyle = player.color;
    ctx.fillRect(200, i*height/10+20, 30, 30);
    if(player.ready)
      ctx.fillStyle = 'green';
    else
      ctx.fillStyle = 'red';
    ctx.fillText(`${player.ready? 'ready': 'not ready'}`, 240, i*height/10+40);
    i+=1;
  })
})

const lobbyBackground = new Image(width,height);
lobbyBackground.src = 'assets/lobby_background.jpg';

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
let canvasScores = document.createElement('canvas');
let ctxScores = canvasScores.getContext('2d');


const scoreBackground = new Image(width,height);
scoreBackground.src = 'assets/score_background.jpg';
canvasScores.width = scoresWidth;
canvasScores.height = scoresHeight;
canvasScores.style.background = 'white';

const background = new Image(width,height);
background.src = 'assets/canvas_background.jpg';
canvas.width = width;
canvas.height = height;
canvas.style.background = 'white';
canvas.style.margin = '0 auto';


const aquaCar = new Image(30,60);
aquaCar.src = 'assets/aqua_car.png';

const greenCar = new Image(30,60);
greenCar.src = 'assets/green_car.png';

const purpleCar = new Image(30,60);
purpleCar.src = 'assets/purple_car.png';

const redCar = new Image(30,60);
redCar.src = 'assets/red_car.png';

const whiteCar = new Image(30,60);
whiteCar.src = 'assets/white_car.png';

const coinImage = new Image(5,5);
coinImage.src = 'assets/coin.png';

const fireImage = new Image(5,5);
fireImage.src = 'assets/fire.png';

let keys = {'w': false, 's':false, 'a':false, 'd':false};

document.addEventListener('keydown', (event) => {
  var name = event.key;
  if(name ==='w' || name==='s' || name==='a' || name === 'd')
  {
    keys[name] = true;
  }
}, false);


document.addEventListener('keyup', (event) => {
  var name = event.key;
  if(name ==='w' || name==='s' || name==='a' || name === 'd')
  {
    keys[name] = false;
  }
}, false);

socket.on('redraw', (data)=>{
  if(end || !ready)
    return;
  ctx.drawImage(background, 0, 0);
  const players = data.ps;
  let playerImage;
  players.forEach(player => {
    switch (player.color){
      case 'aqua': playerImage = aquaCar;
        break;
      case 'green': playerImage = greenCar;
        break;
      case 'purple': playerImage = purpleCar;
        break;
      case 'red': playerImage = redCar;
        break;
      case 'white': playerImage = whiteCar;
        break;
    }
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotate * Math.PI/180);
    ctx.translate(-widthCar / 2, -heightCar / 2);
    ctx.drawImage(playerImage, 0, 0, widthCar, heightCar);
    ctx.font = '16px serif';
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.rotate(-90* Math.PI/180);
    ctx.fillText(player.login, -40, -5, 60);
    ctx.restore();
  });
  const coin = data.c;
  ctx.drawImage(coinImage, coin.x - widthCoin / 2, coin.y-heightCoin / 2, widthCoin, heightCoin);
  const fires = data.f;
  fires.forEach(fire => {
    ctx.drawImage(fireImage, fire.x - widthFire / 2, fire.y - heightFire / 2, widthFire, heightFire);
  });

  let current = 0;
  ctxScores.drawImage(scoreBackground, 0, 0);
  ctxScores.fillStyle = 'rgb(231, 190, 231)';
  ctxScores.fillRect(15, current*height/11+10, 280, 50);
  ctxScores.fillStyle = 'rgb(0,0,0)';
  ctxScores.font = '18px serif';
  ctxScores.fillText('player', 20, current*height/11+40);
  ctxScores.fillText('score', 250, current*height/11+40);
  current+=1;
  players.sort((lhs, rhs)=>{return rhs.score - lhs.score;}).forEach(player => {
    ctxScores.fillStyle = 'rgb(231, 190, 231)';
    ctxScores.fillRect(15, current*height/11+10, 280, 50);
    ctxScores.fillStyle = 'rgb(0,0,0)';
    ctxScores.font = '18px serif';
    ctxScores.fillText(`${player.login}`, 20, current*height/11+40);
    ctxScores.fillStyle = player.color;
    ctxScores.fillRect(200, current*height/11+20, 30, 30);
    ctxScores.fillStyle = 'rgb(0,0,0)';
    ctxScores.fillText(`${player.score}`, 250, current*height/11+40);
    current+=1;
  });
})

socket.on('end', (data)=>{
  if(!ready)
    return;
  keys['w'] = false;
  keys['s'] = false;
  keys['a'] = false;
  keys['d'] = false;
  end = true;
  ready = false;
  ctx.drawImage(background, 0, 0);
  ctx.fillStyle = 'rgb(231, 190, 231)';
  ctx.fillRect(width/6 - width/7, height/2 + 100 - height/3, 750, 300);
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.font = '75px serif';
  ctx.fillText(`${data.p.login} win`, width/6, height/2);
  data.ps.sort((lhs, rhs) => {return rhs.fireTouched - lhs.fireTouched});
  ctx.font = '50px serif';
  ctx.fillText(`${data.ps[0].login} fireman:`, width/6, height/2 + 100)
  ctx.fillText(`caught fire ${data.ps[0].fireTouched} times`, width/6, height/2 + 170)
  backButton.innerHTML = 'Lobby';
  backButton.style.width = '600px'
  backButton.style.height = '30px'
  backButton.style.borderRadius = '5px';
  backButton.style.backgroundColor = '#E7BEE7';
  document.body.appendChild(backButton);
})