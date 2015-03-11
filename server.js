
var E = require('linq');
var moment = require('moment');

var express = require('express');
var app = express();

var pmongo = require('promised-mongo');
var db = pmongo('jenkins/logs');
var logsCollection = db.collection('unity.build.logs');
var errorsCollection = db.collection('unity.build.errors');

var bodyParser = require('body-parser')
app.use(bodyParser.json()); 

app.post('/log', function (req, res) {
	var log = req.body;

	var logEntry = {
		Timestamp: moment(log.Timestamp),
		Level: log.Level,
		MessageTemplate: log.MessageTemplate,
		RenderedTemplate: log.RenderedTemplate,
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
});

app.listen(5555, "0.0.0.0", function () {
	console.log("Listening on port 5555");
});