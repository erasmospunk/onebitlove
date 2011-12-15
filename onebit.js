var hmac_key =
    "9iezi&s-Iavi4ri_s8o&-r=emLaylethie2r8eT@a43as!laW$oedri*CiAfo?G&"
var port = 1111;


var app = require('express').createServer()
  , io = require('socket.io').listen(app)
  , crypto = require('crypto');

app.listen(port);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// io.sockets.on('connection', function (socket) {
//   // socket.emit('news', { hello: 'world' });
//   socket.on('one-bit', function (data) {
//     console.log(data);
//   });
// });

var loveNodes = {};

io.sockets.on('connection', function (socket) {
  // socket.on('user message', function (msg) {
  //   socket.broadcast.emit('user message', socket.nickname, msg);
  // });

  socket.on('newLove', function (email, fn) {
    var loveNode = registerLoveNode(email)
    attach(socket, loveNode)

    //send to loveNode it's loveId
    fn({loveId: loveNode.loveId});

      //socket.broadcast.emit('announcement', nick + ' connected');
      //io.sockets.emit('nicknames', nicknames);
  });

  socket.on('oneBit', function (toLove) {
    var fromLoveId = socket.loveNode.loveId
    var toLoveNode = getLoveNode(toLove)
  	if (toLoveNode.sockets.length > 0) {
      toLoveNode.sockets.forEach(function(toSocket){
        toSocket.emit("feed", {"from": fromLoveId});
      });
    }
    toLoveNode.mailBox[fromLoveId] = new Date()
  });


  socket.on('disconnect', function () {
    if (!socket.loveId) return;

    delete loveNodes[socket.loveId];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});

function attach(socket, loveNode) {
  /* Attches the socket to the loveNode */
  // Save to loveNode to socket to detect from where we get a notification
  socket.loveNode = loveNode
  // Save socket in loveNode to send notification to all the active sockets
  loveNode.sockets.push(socket)
}

function registerLoveNode(email) {
  /* Register a loveNode. Similar to getLoveNode() but saves email if needed */
  var loveId = getLoveId(email)
  var loveNode = getLoveNode(loveId)
  if (!loveNode.email) {
    // TODO: encrypt with crypto.createCipher
    loveNode.email = email
  }
  // Return new or old loveNode
  return loveNode
}

function getLoveNode(loveId) {
  /* Creates a loveNode or gets existing */
  var loveNode = loveNodes[loveId]
  //if not exists
  if (!loveNode) {
    loveNode = { 
      loveId  :  loveId,
      sockets :  [],
      mailBox :  {}
    };
    //put it in the database
    loveNodes[loveId] = loveNode
  }
  // Return new or old loveNode
  return loveNode
}

function getLoveId (email) {
  // Hash-based Message Authentication Code using SHA1
  var hmac = crypto.createHmac('sha1', hmac_key)
  // Put the data for calculation
  hmac.update(email)
  // Encode hmac to base64
  var hmacBase64 = hmac.digest('base64')
  //replace illegal chars for URL
  var loveId =
      hmacBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return loveId
}