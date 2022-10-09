
let button = document.querySelector('#button');
let devError = document.querySelector('#error');

button.onclick = () =>{
    let login = document.getElementById('login').value;
    socket.emit('login', login);
    console.log('send');
    socket.on('login exist', ()=>{
        devError.innerHTML = 'login exist';
        return;
    })
    devError.innerHTML = '';
}

let socket = io()

      socket.on('message', (message) =>
        console.log('Message from server: ', message)
      )
      socket.on('private message', (message) =>
        console.log(
          'Private message from server: ',
          message
        )
      )
