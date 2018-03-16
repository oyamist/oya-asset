(function(exports) {
    const winston = require('winston');
    const EventEmitter = require("events");
    const srcPkg = require("../package.json");
    const fs = require('fs');
    const path = require("path");
    const {
        RestBundle,
        RbHash,
        RbSingleton,
    } = require("rest-bundle");
    //const DiffUpsert = require('diff-upsert').DiffUpsert;
    const exec = require('child_process').exec;
    /*
    const memwatch = require('memwatch-next');
    memwatch.on('leak', (info) => {
        winston.warn('memwatch() => leak', JSON.stringify(info));
    });
    const SENSOR_EVENTS = {
        tempInternal: OyaMist.SENSE_TEMP_INTERNAL,
        humidityInternal: OyaMist.SENSE_HUMIDITY_INTERNAL,
        ecInternal: OyaMist.SENSE_EC_INTERNAL,
    };
    */

    class RbAsset extends RestBundle {
        constructor(name = "test", opts = {}) {
            super(name, Object.assign({
                srcPkg,
            }, opts));

            winston.info(`RbAsset.ctor(${name})`);
            Object.defineProperty(this, "handlers", {
                value: super.handlers.concat([
                    /*
                    this.resourceMethod("get", "mcu/hats", this.getMcuHats),
                    this.resourceMethod("get", "net/hosts", this.getNetHosts),
                    this.resourceMethod("get", "net/hosts/:service", this.getNetHosts),
                    this.resourceMethod("get", "oya-conf", this.getOyaConf),
                    this.resourceMethod("get", "sensor/data-by-hour/:field", this.getSensorDataByHour),
                    this.resourceMethod("get", "sensor/data-by-hour/:field/:days/:endDate", this.getSensorDataByHour),
                    this.resourceMethod("get", "sensor/locations", this.getSensorLocations),
                    this.resourceMethod("get", "sensor/types", this.getSensorTypes),
                    this.resourceMethod("post", "actuator", this.postActuator),
                    this.resourceMethod("post", "app/restart", this.postAppRestart),
                    this.resourceMethod("post", "app/update", this.postAppUpdate),
                    this.resourceMethod("post", "reactor", this.postReactor),
                    this.resourceMethod("post", "sensor", this.postSensor),
                    this.resourceMethod("post", "sensor/calibrate", this.postSensorCalibrate),
                    this.resourceMethod("put", "oya-conf", this.putOyaConf),
                    */
                ]),
            });
        }

        initialize() {
            var promise = super.initialize();
            return new Promise((resolve,reject) => {
                var async = function*() {
                    try {
                        yield promise.then(r=>async.next(r)).catch(e=>{
                            winston.error(e.stack);
                            reject(e);
                        });
                        winston.info(`RbAsset.initialize()`);
                        resolve();
                    } catch (e) {
                        winston.error(e.stack);
                        reject(e);
                    }
                }();
                async.next();
            });
        }


    } //// class RbAsset

    module.exports = exports.RbAsset = RbAsset;
})(typeof exports === "object" ? exports : (exports = {}));
