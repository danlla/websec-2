let button = document.querySelector('#button');
let colorSelect = document.querySelector('#color');
let devError = document.querySelector('#error');
let devLogin = document.querySelector('#devLogin');
let devField = document.querySelector('#field');

let width = 800;
let height = 600;

const widthCar = 30;
const heightCar = 60;

const widthCoin = 25;
const heightCoin = 25;

const widthFire = 50;
const heightFire = 50;

let selectedColor = 'aqua';

colorSelect.addEventListener('change', ()=>{
  colorSelect.style.backgroundColor = colorSelect.value;
  selectedColor = colorSelect.value;
})

button.onclick = () =>{
    let login = document.getElementById('login').value;
    socket.emit('login', {l: login, color: selectedColor});
    console.log('send');
    socket.on('bad login', (mes)=>{
        devError.innerHTML = mes;
        return;
    })
    devError.innerHTML = '';
    socket.on('successful', (size)=>{
        console.log("successful");
        devLogin.remove();
        devField.appendChild(canvasScores);
        devField.appendChild(canvas);
        setInterval(()=>{socket.emit('key', keys)}, 10);
    })
}

let socket = io();

let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
let canvasScores = document.createElement("canvas");
let ctxScores = canvasScores.getContext("2d");


const scoreBackground = new Image(width,height);
scoreBackground.src = 'assets/score_background.jpg';
canvasScores.width = width*0.4
canvasScores.height = height
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

let keys = {};

document.addEventListener('keydown', (event) => {
  var name = event.key;
  var code = event.code;
  console.log(code);
  if(name ==='w' || name==='s' || name==='a' || name === 'd')
  {
    keys[name] = true;
  }
}, false);


document.addEventListener('keyup', (event) => {
  var name = event.key;
  var code = event.code;
  if(name ==='w' || name==='s' || name==='a' || name === 'd')
  {
    keys[name] = false;
  }
}, false);

socket.on('redraw', (data)=>{
  ctx.drawImage(background, 0, 0);
  const players = data[0]
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
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.rotate(-90* Math.PI/180);
    ctx.fillText(player.login, -40, -5, 60);
    ctx.restore();
  });
  const coin = data[1]
  ctx.drawImage(coinImage, coin.x - widthCoin / 2, coin.y-heightCoin / 2, widthCoin, heightCoin);
  const fires = data[2]
  fires.forEach(fire => {
    ctx.drawImage(fireImage, fire.x - widthFire / 2, fire.y - heightFire / 2, widthFire, heightFire);
  });

  ctxScores.drawImage(scoreBackground, 0, 0);
  ctxScores.fillStyle = 'rgb(0,0,0)';
  ctxScores.font = '25px serif';
  ctxScores.fillText('player\t\t\tscore', 20, 30);
  let current = 0;
  players.sort((lhs, rhs)=>{return rhs.score - lhs.score;}).forEach(player => {
    ctxScores.fillText(`${player.login}\t\t\t${player.score}`, 20, 60+current*30);
    current+=1;
  });
})