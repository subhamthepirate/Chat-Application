var socket = io();
var form = document.getElementById('form');
var form1 = document.getElementById('form1');
var input = document.getElementById('input');
var username = prompt('What is your desired username?')
$('#head').append("<h1>"+username+"</h1>")
var feedback = document.getElementById('feedback');
form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  }
});
form1.addEventListener('submit', function (e) {
  e.preventDefault();
  socket.emit('msg', {
    to: $('#pp').val(),
    from: username,
    msg: $('#message').val()
  })
  $('#privchat').append("<b>You"+"->"+$('#pp').val()+":</b><em>"+$('#message').val() + "</em><br/>")
});

socket.on('priv', function (data) {
  console.log('private data', data);
  $('#privchat').append("<b>"+data.from+":</b><em>"+data.msg + "</em><br/>");
  
})

socket.emit('newuser', username);

socket.on('chat message', function (data) {
  console.log(data)
  $('#chat').append("<b>" + data.nick + ":" + "</b>" + data.msg + "<br/>");
});
socket.on('connect', function (data) {
  console.log('Connected')
});

socket.on('disconnect', function (msg) {
  $('#chat').append("<b>"+msg + "</b><em> has left the chat</em>"+"<br/>");

});
socket.on('usernames', function (data) {
  var html = ''
  for (i = 0; i < data.length; i++) {
    html += data[i] + '<br/>'
  }
  $('#users').html(html);
  $('#pp').html('');
  for (const val of data){
    var option = document.createElement("option");
    option.value = val;
    option.text = val.charAt(0).toUpperCase() + val.slice(1) ;
    console.log(username,option)
    if(username != option.value)
      if($('#pp option[value="' + option.value + '"]').length==0)
        $('#pp').append(option);
  }
})
socket.on('log', function (data) {
  console.log(data.names)
  $('#chat').append("<b>"+data.msg +"</b><em> has joined</em>" +"<br/>");
});

socket.on('display', (data) => {
  if (data.typing == true)
    $('#chat').append(data.user + `is typing...`)
  else
    $('#chat').append("")
})

input.onkeyup = e => {
  socket.emit('user typing');

  if (e.target.value === '') {
    socket.emit('user stopped typing');
  }
};
socket.on('user typing', ({ user, typers }) => {
  feedback.innerHTML = typers > 1 ? 'Several people are typing' : `<i>${user}</i> <em>is typing</em>`;

});

socket.on('user stopped typing', typers => {
  if (!typers) {
    feedback.innerHTML = '';
  }
});