
var argv = require('yargs').argv;
var E = require('linq');
var moment = require('moment');

var express = require('express');
var app = express();

var outputPlugin = require('./mongodb-output')({});

var bodyParser = require('body-parser')
app.use(bodyParser.json()); 

app.get("/", function (req, res) {
	res.send("Hello");
});

//
// Preprocess log to our expected structure.
//
var transformLog = function (log) {
	return {
		Timestamp: moment(log.Timestamp).toDate(),
		Level: log.Level,
		MessageTemplate: log.MessageTemplate,
		RenderedMessage: log.RenderedMessage,
		Properties: E.from(Object.keys(log.Properties))
			.toObject(
				function (propertyName) {
					return propertyName;
				},
				function (propertyName) {
					return log.Properties[propertyName].Value;
				}
			),
	};	
}

app.post('/log', function (req, res) {
	if (!req.body) {
		throw new Error("Expected 'body'");
	}
	var received = req.body;
	var logs = E.from(received.Logs)
		.select(transformLog)
		.toArray();

	outputPlugin.emit(logs);

	res.status(200).end();
});

var server = app.listen(argv.port || 3000, "0.0.0.0", function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log("Receiving logs at " + host + ":" + port + "/log");
});
