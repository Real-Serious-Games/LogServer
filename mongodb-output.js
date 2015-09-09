'use strict';

//
// Output plugin that stores logs in MongoDB database.
//

module.exports = function (config) {

	var pmongo = require('promised-mongo');
	var db = pmongo('logs');
	var logsCollection = db.collection('logs');
	var errorsCollection = db.collection('errors');

	return {

		//
		// Emit an array of logs to the database.
		//
		emit: function (logs) {
			logs.forEach(function (log) {

				if (log.Level === 'Fatal' || log.Level === 'Error') {
					errorsCollection.save(logEntry);
				}

				logsCollection.save(log);
			
				console.log(log.Properties.UserName + " | " + log.RenderedMessage);
			});			
		},

	};
};