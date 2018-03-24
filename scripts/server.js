#!/usr/bin/env node

const fs = require('fs');
const path = require("path");
const winston = require("winston");
const compression = require("compression");
const express = require('express');
const app = module.exports = express();
const rb = require("rest-bundle");
//const memwatch = require('memwatch-next');
const EventEmitter = require('events');
const oyaEmitter = new EventEmitter();
const {
    RbAsset,
} = require('../index');

global.__appdir = path.dirname(__dirname);

app.use(compression());

// ensure argv is actually for script instead of mocha
var argv = process.argv[1].match(__filename) && process.argv || [];
argv.filter(a => a==='--log-debug').length && (winston.level = 'debug');

// set up application
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Access-Control-Allow-Headers");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS, PUT, POST");
    next();
});
app.use("/", express.static(path.join(__dirname, "../src/ui")));
app.use("/dist", express.static(path.join(__dirname, "../dist")));

app.locals.asyncOnReady = []; // list of async blocks waiting on app setup completion
let async = function*() { 
    try {
        // define RestBundles
        var restBundles = app.locals.restBundles = [];
        winston.info('argv:', argv);
        var serviceName = argv.reduce((acc, arg, i) =>  {
            return acc==null && i>1 && arg[0]!=='-' ? arg : acc;
        }, null) || 'test';
        var inventoryPath;
        if (serviceName === 'test') {
            var json = fs.readFileSync(path.join(__dirname, '..', 'test', 'sample-inventory.json'));
            inventoryPath = '/tmp/inventory.json';
            fs.writeFileSync(inventoryPath, json);
        } else {
            inventoryPath = path.join(__dirname, '..', 'local', 'inventory.json');
        }

        winston.info(`server.js RbAsset(${serviceName}) ${inventoryPath}`);
        var rbasset = new RbAsset(serviceName, {
            emitter: oyaEmitter,
            inventoryPath,
        });
        yield rbasset.initialize().then(r=>async.next(r)).catch(e=>async.throw(e));
        restBundles.push(rbasset);

        // declare ports
        var isTesting = module.parent != null && false;
        var testports = new Array(100).fill(null).map((a,i) => 3000 + i); // lots of ports for mocha -w
        var ports = isTesting ? testports : [80,8080];

        // create http and socket servers
        var rbServer = app.locals.rbServer = new rb.RbServer();
        rbServer.listen(app, restBundles, ports);
        yield rbServer.initialize().then(r=>async.next(r)).catch(e=>async.throw(e));

        winston.debug("firing asyncOnReady event");
        app.locals.asyncOnReady.forEach(async => async.next(app)); // notify waiting async blocks
        winston.info('memoryUsage()', process.memoryUsage());
    } catch (err) {
        winston.error("server.js:", err.stack);
        async.throw(err);
    }
}();
async.next();
