'use strict';

var E = require('linq');
var assert = require('chai').assert;
var moment = require('moment');
var mailer = require('./mailer');
var dataForge = require('data-forge');

var DailyReport = function (logStoragePlugin, config) {
    assert.isObject(logStoragePlugin);
    assert.isObject(config);

    var self = this;

    //
    // Find all logs between the specified dates that contain
    // the requested text.
    //
    self.findLogs = function (startDate, endDate, spec) {
        assert.instanceOf(startDate, Date);
        assert.instanceOf(endDate, Date);
        assert.isArray(spec);
        spec.forEach(s => assert.isString(s));

        var self = this;
        var lwrSpec = spec.map(s => s.toLowerCase());

        return logStoragePlugin.retrieveLogs(startDate, endDate)
            .then(logs => E.from(logs)
                .where(log => 
                    E.from(lwrSpec)
                        .any(s =>
                            log.Level.toLowerCase().indexOf(s) !== -1 || 
                            log.RenderedMessage.toLowerCase().indexOf(s) !== -1
                        )                    
                )
                .toArray()
            )
            ;
    };

    //
    // Generate and email the daily report for the past 24 hours.
    //
    self.emailDailyReport = function (spec) {
        assert.isArray(spec);
        spec.forEach(s => assert.isString(s));

        var self = this;
        //var startTime = moment().subtract(24, 'hours').toDate();
        var startTime = moment().subtract(100, 'hours').toDate();
        var endTime = moment().toDate();

        return self.findLogs(startTime, endTime, spec)
            .then(logs => {
                return mailer.send({
                    text: "Logs ahoy!",
                    attachments: [
                        {
                            filename: 'Logs.csv',
                            content: new dataForge.DataFrame({ values: logs })
                                .generateSeries({
                                    Date: row => moment(row.Timestamp).format('DD-MM-YYYY'),
                                    Time: row => moment(row.Timestamp).format('HH:mm:ss'), 
                                })
                                .dropSeries([
                                    "Timestamp",
                                    "_id",
                                    "MessageTemplate",
                                    "Properties",
                                ])
                                .toCSV(),
                        },
                    ],
                });
            })
            ;
        
    };
};

if (require.main === module) {
    console.log('Starting from command line.');

    var config = require('confucious');
    config.pushJsonFile('config.json');
    var logStoragePlugin = require('./mongodb-output')(config);      
    var dailyReport = new DailyReport(logStoragePlugin, config);
    dailyReport.emailDailyReport(config.get('mail:dailyReportSpec'))
        .then(() => console.log("Done"))
        .catch(err => console.error(err.stack))
        ;
}
else {
    module.exports = DailyReport;
}