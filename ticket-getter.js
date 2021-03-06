/**
 * This script can be used to get Eventbrite event tickets. You must run it from the Eventbrite event page.
 * Change 'ticketPositionInList' variable to indicate the position of your desired ticket type in the list (default = 0 is the first ticket type)
 * Change 'startTime' variable to indicate the time when we should start checking for tickets - typically the time when the tickets are released
 * If you change 'ticketQuantity' variable above the allowed limit (often anything more than 1), the whole process will fail
 *
 * @author Dalimil Hajek
 * @author Bedis ElAcheche
 */
var ticketPositionInList = 0; // There may be several ticket types - set to 0 to select the first one (or change accordingly)
var ticketQuantity = 1; // How many tickets you want to buy? - WARNING: Often limited by the event organizer to 1
var startTime = "2016-04-18T15:59:55"; // When should this script start checking for tickets (e.g. 5 seconds to 4pm)
//var startTime = ""; // uncomment to start immediately 

function checkLocation() {
	if (location.href.indexOf("eventbrite") == -1) {
		console.log("You must go to the Eventbrite event page and run the script from there!");
		throw new Error("You must go to the Eventbrite event page and run the script from there!");
	}
}

function post(path, params) {
	var form = document.createElement("form");
	form.setAttribute("method", "post");
	form.setAttribute("action", path);

	for (var key in params) {
		if (params.hasOwnProperty(key)) {
			var hiddenField = document.createElement("input");
			hiddenField.setAttribute("type", "hidden");
			hiddenField.setAttribute("name", key);
			hiddenField.setAttribute("value", params[key]);
			form.appendChild(hiddenField);
		}
	}
	document.body.appendChild(form);
	form.submit();
}

function findAll(data, s) {
	var rx = new RegExp(s, "g");
	var matches = new Array();
	while ((match = rx.exec(data)) !== null) {
		matches.push(match);
	}
	return matches;
}

function getTicket(data) {
	ticketMatches = findAll(data, "ticket_form_element_name\":\"([^\"]+)\"");
	quantityMatches = findAll(data, "quantity_remaining\":([^,]+),");
	console.log(quantityMatches);
	console.log(ticketMatches);
	if (quantityMatches.length != ticketMatches.length) {
		throw new Error("ERROR: No. of ticket types doesn't match ticket quantities data");
	}

	var ticket = "";
	for (var i = 0; i < quantityMatches.length; i++) {
		var rem = parseInt(quantityMatches[i][1]);
		if (rem <= 0) continue;

		ticket = ticketMatches[i][1];
		if (ticketPositionInList <= 0) {
			break;
		}
		ticketPositionInList -= 1; // valid ticket found so untick position
	}
	return ticket;
}

var repeat = true;

function run() {
	checkLocation();
	$.get(location.href, function(data) {
		// console.log(data);
		ticket = getTicket(data);

		if (ticket == "") {
			console.log("Unsuccessful: " + (new Date()).toLocaleTimeString());
			if (repeat) {
				setTimeout(run, 500);
			}
			return;
		} else {
			var eid = $("form input[name=eid]").attr('value');
			console.log(ticket + " " + eid);
			var payload = {
				'eid': eid,
				'has_javascript': 1
			};
			payload[ticket] = ticketQuantity;
			console.log(payload);
			post("https://www.eventbrite.co.uk/orderstart", payload);
		}
	});
}

function stop() {
	if (repeat == false) {
		return "Already stopped";
	}
	repeat = false;
	return "Stopped";
}

function getTimeRemaining() {
	var diff = Date.parse(startTime) - Date.now();
	return Math.max(0, diff || 0);
}

function msToString(ms) {
	var s = Math.floor(ms / 1000);
	var m = Math.floor(s / 60);
	s = s % 60;
	var h = Math.floor(m / 60);
	m = m % 60;
	return (h + " h " + m + " min " + s + " s");
}

function initScheduler() {
	if (typeof scheduler !== 'undefined') {
		clearTimeout(scheduler); // when rerun
	}
	return null;
}

var scheduler = initScheduler();

$(document).ready(function() {
	checkLocation();

	var timeToStart = getTimeRemaining();
	console.log("Scheduled start in: " + msToString(timeToStart));
	scheduler = setTimeout(function() {
		run();
	}, timeToStart);
});
