'use strict';

//
// Output plugin that stores logs in MongoDB database.
//

module.exports = function (conf) {

        console.log('Loading to database: ' + conf.get('db'));
        console.log('Logs to: ' + conf.get('logsCollection'));
        console.log('Errors to: ' + conf.get('errorsCollection'));

	var pmongo = require('promised-mongo');
	var db = pmongo(conf.get('db'));
	var logsCollection = db.collection(conf.get('logsCollection'));
	var errorsCollection = db.collection(conf.get('errorsCollection'));

	return {

		//
		// Emit an array of logs to the database.
		//
		emit: function (logs) {
                        logsCollection.insert(logs)
                            .then(function () {
                                console.log("Added logs to database.");
                            })
	                    .catch(function (err) {
                                console.error("!! " + (err && error.stack || err));
                            });

                        var errorLogs = logs.filter(function (log) {
                                return log.Level === 'Fatal' || log.Level === 'Error';
                            });
                        if (errorLogs.length > 0) {
                            errorsCollection.insert(errorLogs)
                                .then(function () {
                                    console.log("Added errors to database");
                                })
                                .catch(function (err) {
                                    console.error("!! " + (err && err.stack || err));
                                });
                        }

			logs.forEach(function (log) {
				console.log(log.Properties.UserName + " | " + log.RenderedMessage);
			});			
		},

	};
};
