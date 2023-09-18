/**
 * This is responsible for syncing of Telemetry
 * @class TelemetrySyncManager
 * @author Manjunath Davanam <manjunathd@ilimi.in>
 * @author Krushanu Mohapatra <Krushanu.Mohapatra@tarento.com>
 */
import { default as axios } from 'axios';

var TelemetrySyncManager = {

    /**
     * This is the telemetry data for the perticular stage.
     * @member {object} _teleData
     * @memberof TelemetryPlugin
     */
    _teleData: [],
    _failedBatch: [],
    _failedBatchSize: 20,
    _syncRetryInterval: 2000,
    init: function() {
        var instance = this;
        var Telemetry = EkTelemetry || Telemetry;
        Telemetry.config.syncRetryInterval && (instance._syncRetryInterval = Telemetry.config.syncRetryInterval);
        Telemetry.config.failedBatchSize && (instance._failedBatchSize = Telemetry.config.failedBatchSize);
        Telemetry.addEventListener('TelemetryEvent', this.sendTelemetry);
    },
    sendTelemetry: function(event) {
        var telemetryEvent = event.detail;
        Telemetry.config.telemetryDebugEnabled && console.log("Telemetry Events ", JSON.stringify(telemetryEvent));
        var instance = TelemetrySyncManager;
        instance._teleData.push(Object.assign({}, telemetryEvent));
        if ((telemetryEvent.eid.toUpperCase() === "END") || (instance._teleData.length >= Telemetry.config.batchsize)) {
            TelemetrySyncManager.syncEvents();
        }
    },
    syncEvents: function(telemetryObj) {
        var Telemetry = EkTelemetry || Telemetry;
        var instance = TelemetrySyncManager;
        if(!telemetryObj){
            var telemetryEvents = instance._teleData.splice(0, Telemetry.config.batchsize);
            if(!telemetryEvents.length){
                return;
            }
            telemetryObj = {
                "data": {
                    "id": "api.mosip.telemetry",
                    "params": {
                        "msgid": CryptoJS.MD5(JSON.stringify(telemetryEvents)).toString(),
                    },
                    "ets": getUTCTime(),
                    "events": telemetryEvents
                }
            };
        }
        var headersParam = {};
        /* if ('undefined' != typeof Telemetry.config.authtoken)
            headersParam["Authorization"] = 'Bearer ' + Telemetry.config.authtoken; */
        var fullPath = Telemetry.config.host + Telemetry.config.apislug + Telemetry.config.endpoint;
        headersParam['dataType'] = 'json';
        headersParam["Content-Type"] = "application/json";

        axios.post(
            fullPath,
            JSON.stringify(telemetryObj),
            {headers: headersParam}
        )
        .then((result) => {
            Telemetry.config.telemetryDebugEnabled && console.log("Telemetry API success", result);
        })
        .catch((error) => {
            if(instance._failedBatchSize > instance._failedBatch.length){
                instance._failedBatch.push(telemetryObj);
            }
            if (error.status == 403) {
                console.error("Authentication error: ", JSON.stringify(error));
            } else {
                console.log("Error while Telemetry sync to server: ", JSON.stringify(error));
            }
        });
    },
    syncFailedBatch: function(){
        var instance = TelemetrySyncManager;
        if(!instance._failedBatch.length){
            return;
        }
        Telemetry.config.telemetryDebugEnabled && console.log('syncing failed telemetry batch');
        var telemetryObj = instance._failedBatch.shift();
        instance.syncEvents(telemetryObj);
    }
}

TelemetrySyncManager.init();
setInterval(function(){
    TelemetrySyncManager.syncFailedBatch();
}, TelemetrySyncManager._syncRetryInterval)
