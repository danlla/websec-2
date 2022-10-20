let button = document.querySelector('#button');
let devError = document.querySelector('#error');
let devLogin = document.querySelector('#devLogin');

const widthCar = 30;
const heightCar = 60;

button.onclick = () =>{
    let login = document.getElementById('login').value;
    socket.emit('login', login);
    console.log('send');
    socket.on('login exist', ()=>{
        devError.innerHTML = 'login exist';
        return;
    })
    devError.innerHTML = '';
    socket.on("successful", ()=>{
        console.log("successful");
        devLogin.remove();
        document.body.appendChild(canvas);
        setInterval(()=>{socket.emit('key', keys)}, 10);
    })
}

let socket = io()

const background = new Image(800,600);
background.src = 'assets/canvas_background.jpg';

let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;
canvas.style.display = "block";
canvas.style.background = "white";
canvas.style.margin = "0 auto"

const greenCar = new Image(5,5);
greenCar.src = 'assets/green_car.png';

let keys = {};

document.addEventListener('keydown', (event) => {
  var name = event.key;
  var code = event.code;
  console.log(code);
  if(name ==='w' || name==='s' || name==='a' || name === 'd')
  {
    keys[name] = true;
    //socket.emit('key', keys)
  }
}, false);


document.addEventListener('keyup', (event) => {
  var name = event.key;
  var code = event.code;
  if(name ==='w' || name==='s' || name==='a' || name === 'd')
  {
    keys[name] = false;
    //socket.emit('key', keys)
  }
}, false);

socket.on('redraw', (data)=>{
  console.log('redraw');
  ctx.drawImage(background, 0, 0);
  data.forEach(player => {
    console.log(player.x, player.y);
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotate * Math.PI/180);
    //ctx.translate(widthCar / 2, heightCar / 2);
    //ctx.drawImage(greenCar, player.x, player.y, widthCar, heightCar);
    ctx.drawImage(greenCar, 0,0, widthCar, heightCar);
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.rotate(-90* Math.PI/180);
    ctx.fillText(player.login, -40, -5, 60);
    ctx.restore();
  });
})