var app = require('express').createServer()
	, io = require('socket.io').listen(app)
	, crypto = require('crypto');

var hmac_key =
	"9iezi&s-Iavi4ri_s8o&-r=emLaylethie2r8eT@a43as!laW$oedri*CiAfo?G&"
	, port = 1111;

/* Database */
var loveNodes = {}

/* Start application */
// Start web server
app.listen(port)
// Index.html
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
// Respond to connections
io.sockets.on('connection', function (socket) {
	socket.on('newLove', function (email, fn) {
		console.log("Registering " + email)
		// Register loveNode's email
		var loveNode = registerLoveNode(email)
		// Create a logical connection
		attach(socket, loveNode)
		// Reply OK and send loveNode's loveId
		fn({
			code:	201, // Success, Created
			loveId:	loveNode.loveId
		});
	});

	socket.on('myloveId', function (loveId, fn) {
		console.log("LoveNode connected with loveId " + loveId)
		// Get loveNode and create a logical connection
		attach(socket, getLoveNode(loveId))
		// Reply OK
		fn({ code: 200 });
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
		var from = socket.loveNode
		// Multiple receptions
		oneBit.to.forEach(function(toLove) {

			console.log("OneBit from " + from.loveId + " to " + toLove)
			// Message 'from' to 'to' loveNodes 
			var to = getLoveNode(toLove)
			// Send event love to all connected sockets
			socket.broadcast.to(to.loveId)
				.emit("love", {loveId: from.loveId});
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

function attach(socket, loveNode) {
	/* Attaches the socket to the loveNode */

	// If socket was attached to another loveNode
	if (socket.loveNode) {
		// Disconnect
		socket.leave(socket.loveNode.loveId);
	}
	// Save to loveNode to socket to detect from where we get a notification
	socket.loveNode = loveNode
	// Save socket in loveNode to send notification to all the active sockets
	socket.join(loveNode.loveId);
}

function registerLoveNode(email) {
	/* Register a loveNode. Similar to getLoveNode() but saves email if needed */
	var loveId = getLoveId(email)
	var loveNode = getLoveNode(loveId)
	if (!loveNode.email) {
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
			loveId:		loveId,
			sockets:	[],
			mailBox:	{}
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
