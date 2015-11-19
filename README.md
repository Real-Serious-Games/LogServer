# Log-Server

A tiny server for receiving Serilog logs via HTTP post.

The logs are stored to MongoDB.

## Install

	npm install -g rsg-log-server

## Run

	rsg-log-server [--port <portno>] [--db <database-connection-string>] [--logsCollection <database-collection>] [--errorsCollection <database-collection>]

## Configuration

Edit the file config.json where you can set the database, collections and port for the server.
	
	{
	    "db": "logs",
	    "logsCollection": "logs",
		"errorsCollection": "errors",
	    "port": 3000
	}

The *port*, *db*, *logsCollection* and *errorsCollection* can be overridden by the command line.
