'use strict';

var chai = require("chai");
chai.use(require("chai-as-promised"));
var expect = chai.expect;
var assert = chai.assert;
var request = require('request-promise');

var startServer = require('../server');
var Confucious = require('confucious/confucious');

describe('logserver', function () {

    var logsOutput = [];

    var outputPlugin = {
        emit: function (logs) {
            logsOutput.push(logs);
        },
    };

    var server = null;

    var port = 5234;

    var host = 'http://127.0.0.1:' + port;

    //
    // Request HTTP get.
    //
    var httpGet = function (url) {
        return request({
                uri: host + url,
                json: true,
            });
    };

    before(function () {
        var config = new Confucious();
        config.push({
            port: port
        })
        return startServer(config, outputPlugin)
            .then(s => server = s)
            ;
    });

    after(function () {
        var s = server;
        server = null;
        return s.close();
    });

    beforeEach(function () {
        logsOutput = [];
    });

    it('server is alive', function () {
        return httpGet('/alive')
            .then(response => {
                expect(response).to.eql({ ok: 1 });
            })
            ;        
    });

});