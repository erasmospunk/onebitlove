var app = require('express').createServer()
  , io = require('socket.io').listen(app)
  , crypto = require('crypto');

app.listen(1111);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// io.sockets.on('connection', function (socket) {
//   // socket.emit('news', { hello: 'world' });
//   socket.on('one-bit', function (data) {
//     console.log(data);
//   });
// });

var lovers = {};

io.sockets.on('connection', function (socket) {
  // socket.on('user message', function (msg) {
  //   socket.broadcast.emit('user message', socket.nickname, msg);
  // });

  socket.on('newLove', function (email, fn) {
  	var loveId = getLoveId(email);
  	//if not exists
    if (!lovers[loveId]) {
      lovers[loveId] = socket;
      socket.loveId = loveId;
  	}

    fn(loveId);
    // fn({"loveId": lovers[loveId]});

      //socket.broadcast.emit('announcement', nick + ' connected');
      //io.sockets.emit('nicknames', nicknames);
  });



  socket.on('oneBit', function (toLove) {
  	lovers[toLove].socket.emit("feed", {"from": socket.loveId});

      //socket.broadcast.emit('announcement', nick + ' connected');
      //io.sockets.emit('nicknames', nicknames);
  });


  socket.on('disconnect', function () {
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});


function getLoveId (email) {
	  var shasum = crypto.createHash('sha1');
      shasum.update(email);
      //replace illegal chars for URL
      return shasum.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}