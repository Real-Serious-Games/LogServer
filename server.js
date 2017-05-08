'use strict';

var argv = require('yargs').argv;
var E = require('linq');
var moment = require('moment');
var express = require('express');
var bodyParser = require('body-parser')
var DailyReport = require('./daily-report');
var assert = require('chai').assert;
var cron = require('cron');

process.on('uncaughtException', function (err) {
    console.error('Uncaught Exception: ' + err.message + '\r\n' + err.stack);
});

//
// Start the log server.
//
var startServer = function (conf, outputPlugin) {

	if (!outputPlugin) {
		throw new Error("'outputPlugin' argument not specified.");
	}

	assert.isObject(outputPlugin);
	assert.isFunction(outputPlugin.emit);
	assert.isFunction(outputPlugin.retrieveLogs);

	var app = express();
	app.use(bodyParser.json()); 

	//
	// Check that the server is alive (used by the server monitor)
	// 
    app.get("/alive", function (req, res) {
        res.json({ ok: 1 });
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

		if (!req.body.Logs) {
			throw new Error("Expected 'Logs' property on body");
		}

		var logs = E.from(req.body.Logs)
			.select(transformLog)
			.toArray();

		outputPlugin.emit(logs);

		res.status(200).end();
	});

    return new Promise(function (resolve, reject) {
        var server = app.listen(conf.get("port"), "0.0.0.0", function (err) {
            if (err) {
                reject(err);
                return;
            }
		var host = server.address().address;
		var port = server.address().port;
		console.log("Receiving logs at " + host + ":" + port + "/log");
            resolve(server);
        });
    });
};

//
// http://stackoverflow.com/a/6398335/25868
// 
if (require.main === module) { 
    
    console.log('Starting from command line.');

    //
    // Run from command line.
    //
    var conf = require('confucious');
    var fs = require('fs');
    if (fs.existsSync('config.json')) {
        conf.pushJsonFile('config.json');       
    }
    conf.pushArgv();
    if (!conf.get('db')) {
        throw new Error("'db' not specified in config.json or as command line option.");
    }

    if (!conf.get('logsCollection')) {
        throw new Error("'logsCollection' not specified in config.json or as command line option.");
    }

    if (!conf.get('errorsCollection')) {
        throw new Error("'errorsCollection' not specified in config.json or as command line option.");
    }

    if (!conf.get('port')) {
        throw new Error("'port' not specified in config.json or as command line option.");
    }

	require('./mongodb-output')(conf)
		.then(logStoragePlugin => {
			return startServer(conf, logStoragePlugin)
				.then(() => {
					var emailDailyReport = function () {
						console.log("Generating daily logging report email...");

						var dailyReport = new DailyReport(logStoragePlugin, conf);
						dailyReport.emailDailyReport(conf.get('mail:dailyReportSpec'))
							.then(() => {
								console.log("...generated daily logging report email.");
							})
							.catch(err => {
								console.error("Failed to generate daily report\r\n" + err.stack);
							})
							;
					};

					if (argv.dailyReport) {
						emailDailyReport();
						return;
					}	

					console.log("Starting daily report cron...");

					var dailyReportSchedule = conf.get('dailyReportSchedule');
					assert.isString(dailyReportSchedule);
					
					var CronJob = cron.CronJob;
					var cronJob = new CronJob({
						cronTime: dailyReportSchedule,
						onTick: emailDailyReport,
						start: false,
					});

					cronJob.start();			
				});
		})
        .catch(err => {
            console.error("Failed to start server.\r\n" + err.stack);
        })
        ;
}
else {
    // 
    // Required from another module.
    //
    module.exports = startServer;
}