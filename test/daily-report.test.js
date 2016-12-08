'use strict';

var config = require('confucious');
config.pushJsonFile('config.json');       

var expect = require('chai').expect;
var moment = require('moment');

var DailyReport = require('../daily-report');

describe('daily report', function () {

    this.timeout(5000)

    var dailyReport = null;

    var logs = [
    ];

    var logStoragePlugin = {
        emit: function (logs) {
            // Not necessary.
        },
        retrieveLogs: function (startTime, endTime) {
            return Promise.resolve(logs);
        },
    };

    beforeEach(function () {
        dailyReport = new DailyReport(logStoragePlugin, config);
    });

    it('can find logs that contain specified text', function () {

        var infoLog = {
            "Level" : "Information",
            "RenderedMessage" : "Running test item 10",
        };

        var errorLog = {
            "Level" : "Error",
            "RenderedMessage" : "NullReferenceException: Object reference not set to an instance of an object\r\nStack:\r\n\"Test6.SetLineEndPosition (UnityEngine.GameObject line, Vector3 end)\nTest6.Update ()\n\"",
        };

        logs = [infoLog, errorLog];

        var spec = ["ErRor"];
        var startDate = new Date(2016, 5, 5); // Note: actual dates aren't being tested.
        var endDate = new Date(2016, 5, 10);
        return dailyReport.findLogs(startDate, endDate, spec)   
            .then(logs => {
                expect(logs).to.eql([errorLog]);
            })
            ;        
    });

    it('can generate and email daily report', function () {

        var infoLog = {
            "Level" : "Information",
            "RenderedMessage" : "Running test item 10",
        };

        var errorLog = {
            "Level" : "Error",
            "RenderedMessage" : "NullReferenceException: Object reference not set to an instance of an object\r\nStack:\r\n\"Test6.SetLineEndPosition (UnityEngine.GameObject line, Vector3 end)\nTest6.Update ()\n\"",
        };

        logs = [infoLog, errorLog];

        var spec = ["error"];
        return dailyReport.emailDailyReport(spec);
    });

});