'use strict';

var argv = require('yargs').argv;
var fs = require('fs');
var path = require('path');
var config = require('confucious');
var enableMailer = true;

if (enableMailer) {
	console.log('Emailing enabled.');

	var nodemailer = require("nodemailer");

	module.exports = {
		send: function (msg) {
			return new Promise(function (resolve, reject) {
                var transport = nodemailer.createTransport({
                    service: config.get('mail:service'),
					host: config.get('mail:host'),
					secure: config.get('mail:secure'),
                    auth: {
                        user: config.get('mail:username'), 
                        pass: config.get('mail:password'),
                    },
                });

				transport.sendMail(
					{
						to: config.get('mail:to'),
						from: config.get('mail:from'),
						replyTo: config.get('mail:replyTo'),
						subject: config.get('mail:subject'),
						text: msg.text,
						attachments: msg.attachments || [],
					}, 
					function (err, response) {

						if (err) {
							console.error('Error occured sending email', err);

							reject(err);
						}
						else {
							console.log("Message sent: ");
							console.log(response);

							resolve(response);
						}
					}
				);				
			})
		},
	}
}
else {
	console.log('Emailing disabled.');

	module.exports = {
		send: function (msg) {
			console.log('Email: ' + msg.text);

			return Promise.resolve();
		},
	}
}