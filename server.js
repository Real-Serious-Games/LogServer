
var E = require('linq');
var moment = require('moment');

var express = require('express');
var app = express();

var pmongo = require('promised-mongo');
var db = pmongo('logs');
var logsCollection = db.collection('logs');
var errorsCollection = db.collection('errors');

var bodyParser = require('body-parser')
app.use(bodyParser.json()); 

app.get("/", function (req, res) {
	res.send("Hello");
};

app.post('/log', function (req, res) {
	var received = req.body;
	var logs = received.Logs;

	logs.forEach(function (log) {
		var logEntry = {
			Timestamp: moment(log.Timestamp),
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

		if (log.Level === 'Fatal' || log.Level === 'Error') {
			errorsCollection.save(logEntry);
		}

		logsCollection.save(logEntry);
	
		console.log(logEntry.Properties.UserName + " | " + logEntry.RenderedMessage);
	});
});

app.listen(3000, "0.0.0.0", function () {
	console.log("Listening on port 3000");
});