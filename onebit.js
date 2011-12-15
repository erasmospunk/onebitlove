var app = require('express').createServer()
  , io = require('socket.io').listen(app);

app.listen(1111);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.get('/css/main.css', function (req, res) {
  res.sendfile(__dirname + '/css/main.css');
});

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

var feed = io.of('/feed')
  .on('connection', function (socket) {
    socket.emit('a message', {
        that: 'only'
      , '/chat': 'will get'
    });
    chat.emit('a message', {
        everyone: 'in'
      , '/chat': 'will get'
    });
  });

var news = io
  .of('/news')
  .on('connection', function (socket) {
    socket.emit('item', { news: 'item' });
  });