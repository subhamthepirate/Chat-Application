var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var socket = require('socket.io')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var io = socket();
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var nicknames = {}
var typers = {}
io.on('connection', (socket) => {
  socket.on('newuser', function (data) {
    socket.nickname = data;
    //console.log(socket.id)
    
    nicknames[socket.nickname] = socket.id;
    socket.broadcast.emit('log', {msg:socket.nickname,names:Object.keys(nicknames)} );
    //console.log(Object.keys(nicknames))
    io.sockets.emit('usernames', Object.keys(nicknames))
    //console.log(Object.values(nicknames))
  })

  socket.on('disconnect', () => {
    if (!socket.nickname) return;
    delete nicknames[socket.nickname];

    io.emit('disconnect', socket.nickname);
    io.sockets.emit('usernames', Object.keys(nicknames))
    // {data:Object.keys(nicknames), name:socket.nickname}
  });
  socket.on('chat message', (data) => {
    var message = data.trim();
    io.emit('chat message', { msg: message, nick: socket.nickname });
  });
  socket.on('user typing', () => {
    typers[socket.nickname] = 1;

    socket.broadcast.emit('user typing', {
      user: socket.nickname,
      typers: Object.keys(typers).length
    });
  });
  socket.on('user stopped typing', () => {
    delete typers[socket.nickname];

    socket.broadcast.emit('user stopped typing', Object.keys(typers).length);
  });
  socket.on('msg', function (data) {
    io.to(nicknames[data.to]).emit('priv', {
      from: data.from,
      msg: data.msg
    });
  })
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
