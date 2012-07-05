var onebit = {};

// SEND /////////////////////////////////////////////////////////////////
onebit.color = 0;
// onebit.inColor;
onebit.outColor = 0;
onebit.seconds = Infinity;
onebit.outSeconds = Infinity;
onebit.socket = null;
onebit.updateFn = null;

onebit.connect = function(address, updateFn) {
	if (onebit.socket != null) {
		//TODO disconnect socket.io
	}
	onebit.updateFn = updateFn;
	// Create new socket.io object
	onebit.socket = io.connect(address);
	onebit.socket.on('connect', function () {
		// TODO: get id from cookie if exists
		onebit.socket.emit('attach', 'V4BwM_t2STRBif9Tgbvqakl-hQg', function (reply) {
			console.log(reply); // data will be 'woot'
		});
	});
	// When recieved a notification
	onebit.socket.on('love', function (from) {
		onebit.seconds = 0;
		onebit.color = from.sync;
		//onebit.color += Math.round(Math.random() * 10) + 55;
		//onebit.color %= 360;
		onebit.updateFn();
		console.log("love from " + from.loveId + ", onebit.color = " + from.sync);
	});

	setInterval(onebit.updateTime, 1000);
}

onebit.getColor = function() {
	return onebit.color;
}

onebit.getLevel = function() {
	return onebit._getLevel(onebit.seconds);
}

onebit.getOutColor = function() {
	return onebit.outColor;
}

onebit.getOutLevel = function() {
	return onebit._getLevel(onebit.outSeconds);
}


onebit.updateTime = function() {
	onebit.seconds++;
	onebit.outSeconds++;
	onebit.updateFn();
}


onebit._getLevel = function(secs) {
	var level;

	if (secs > 80) {
		level = 80;
	}
	else {
		level = secs;
	}

	return 100 - level;
}


onebit.sendOneBit = function() {
	var start = new Date();
	// Send a random color that is away ~65 degrees in the color wheel
	onebit.outColor += Math.floor(Math.random() * 10) + 60;
	onebit.outColor %= 360;
	onebit.outSeconds = 0;
	
	onebit.updateFn();

	// send to '123' loveNode that has id 'V4BwM_t2STRBif9Tgbvqakl-hQg'
	onebit.socket.emit(
			'oneBit',
			{ to: ['V4BwM_t2STRBif9Tgbvqakl-hQg'], sync: onebit.outColor},
			function(reply) {
				console.log(
						"oneBit reply = " + reply.code +
						", speed = " + (new Date().getTime() - start.getTime()));
			});
	//document.getElementById("incoming").innerHTML = "SEND";
};
// REGISTER /////////////////////////////////////////////////////////////
onebit.register = function () {
	var nametextfield = document.getElementById("register_text_field");
	var name = nametextfield.value;
	name = name.trim();
	onebit.socket.emit('newLove', name, function (reply) {
		if ((typeof (reply) !== "undefined") && (reply !== null) && (reply !== "") && (reply !== " ")) {
			nametextfield.value = "";
			//console.log(reply);
			document.getElementById("register_message").innerHTML = "Registration Succeed! Your \"Love ID\" is: " + reply.loveId;
		} else {
			nametextfield.value = "";
			document.getElementById("register_message").innerHTML = "Registration Failed!";
		}
	});
	return false;
};