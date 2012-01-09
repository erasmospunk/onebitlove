var app = require('express').createServer()
	, io = require('socket.io').listen(app)
	, crypto = require('crypto');

var hmac_key =
	"9iezi&s-Iavi4ri_s8o&-r=emLaylethie2r8eT@a43as!laW$oedri*CiAfo?G&"
	, port = process.env.PORT || 1111;

/* Database */
var loveNodes = {};

/* Start application */
// Start web server
app.listen(port);
// Index.html
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
// Serve files like css and js in files folder
// /files/* is accessed via req.params[0]
// but here we name it :file
app.get('/js/:file(*)', function(req, res, next){
  res.sendfile(__dirname + '/js/' + req.params.file);
});
app.get('/css/:file(*)', function(req, res, next){
  res.sendfile(__dirname + '/css/' + req.params.file);
});

// Configure Socket.io 
io.configure(function () { 
  // Display info, warn & errors (debug is default = 3)
//  io.set("log level", 2); 
  // Heroku doesn't support websocket at the moment, use long polling
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10);
});

// Respond to connections
io.sockets.on('connection', function (socket) {
	socket.on('newLove', function (name, fn) {
		console.log("Registering " + name);
		// Register loveNode's name
		var loveNode = registerLoveNode(name);
		// Create a logical connection
		attach(socket, loveNode);
		// Reply OK and send loveNode's loveId
		fn({
			code:	201, // Success, Created
			loveId:	loveNode.loveId
		});
	});

	socket.on('attach', function (loveId, fn) {
		// Get loveNode
		loveNode = getLoveNode(loveId)
		//if not exists
		if (!loveNode) {
			fn({
				code: 404,
				msg: "LoveNode not found. Create it with 'newLove' event"
			});
			return
		}
		// Create a logical connection
		attach(socket, loveNode)
		console.log(socket.id + " attached to a LoveNode with id " + loveId)
		// Reply OK
		fn({ code: 200 })
	});

	socket.on('whois', function (loveId, fn) {
		// Get loveNode
		loveNode = getLoveNode(loveId)
		//if not exists
		if (!loveNode) {
			fn({
				code: 404,
				msg: "LoveNode not found."
			});
			return
		}
		// Reply OK
		fn({
			code: 200,
			name:	loveNode.name 
		});
	});

	socket.on('oneBit', function (oneBit, fn) {
		// Check if socket is attached to a loveNode
		if (!socket.loveNode) {
			fn({
				code:	401, // Client Error, Unauthorized
				msg:	"You didn't tell me who you are."
						+ "Tell me with 'newLove' or 'love' events."
			});
			return
		}
		// Origin of the event
		var from = socket.loveNode;
		var currentSync = oneBit.sync;
		// Multiple receptions
		oneBit.to.forEach(function(toLove) {

			console.log("OneBit from " + from.loveId + " to " + toLove)
			// Message 'from' to 'to' loveNodes 
			var to = getLoveNode(toLove)
			// Send event love to all connected sockets
			socket.broadcast.to(to.loveId)
				.emit("love", { loveId: from.loveId, sync: currentSync });
			// Save the time of the latest OneBit for the destination loveNode
			to.mailBox[from.loveId] = new Date()
		});
		// Success, Accepted 
		fn({ code: 202 })
	});


	socket.on('disconnect', function () {
		if (!socket.loveNode) return;
		console.log("delete socket.id = " + socket.id)

		socket.leave(socket.loveNode.loveId)
	});
});

function getMailbox(loveNode) {
	// Create a timestamp and add a diff method
	var now = new Date();
	now.diff = timeDiff;

}

function timeDiff(date) {
	return Math.abs(Math.round(date.getTime() / 1000) - Math.round(this.getTime() / 1000));
}


function attach(socket, loveNode) {
	/* Attaches the socket to the loveNode */

	// If socket was attached to another loveNode
	if (socket.loveNode) {
		// Disconnect
		socket.leave(socket.loveNode.loveId);
	}
	// Save in socket the loveNode to detect from where we get a notification
	socket.loveNode = loveNode
	// Join a room, all the connections with this loveId will get a notification
	socket.join(loveNode.loveId);
}

function registerLoveNode(name) {
	/* Register a loveNode. Similar to getLoveNode() but saves name if needed */
	var loveId = getLoveId(name)
	var loveNode = getLoveNode(loveId)
	//if not exists
	if (!loveNode) {
		loveNode = { 
			loveId:		loveId,
			name:			name,
			mailBox:	{}
		};
		//put it in the database
		loveNodes[loveId] = loveNode
	}
	// Return new or old loveNode
	return loveNode
}

function getLoveNode(loveId) {
	/* Creates a loveNode or gets existing */
	var loveNode = loveNodes[loveId]
	//TEMPORARY create new if not exists
	if (!loveNode) {
		loveNode = { 
			loveId:		loveId,
			mailBox:	{}
		};
		//put it in the database
		loveNodes[loveId] = loveNode
	}
	// Return new or old loveNode
	return loveNode
}

function getLoveId (name) {
	// Hash-based Message Authentication Code using SHA1
	var hmac = crypto.createHmac('sha1', hmac_key)
	// Put the data for calculation
	hmac.update(name)
	// Encode hmac to base64
	var hmacBase64 = hmac.digest('base64')
	//replace illegal chars for URL
	var loveId =
			hmacBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	return loveId
}
