"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Motion = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const settings_1 = require("../settings");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class Motion {
    constructor(platform, accessory, device) {
        this.platform = platform;
        this.accessory = accessory;
        this.device = device;
        // default placeholders
        this.MotionDetected = false;
        // this is subject we use to track when we need to POST changes to the SwitchBot API
        this.doMotionUpdate = new rxjs_1.Subject();
        this.motionUbpdateInProgress = false;
        // Retrieve initial values and updateHomekit
        this.refreshStatus();
        // set accessory information
        accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SwitchBot')
            .setCharacteristic(this.platform.Characteristic.Model, 'SWITCHBOT-MOTION-')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);
        // get the Battery service if it exists, otherwise create a new Motion service
        // you can create multiple services for each accessory
        (this.service =
            accessory.getService(this.platform.Service.MotionSensor) ||
                accessory.addService(this.platform.Service.MotionSensor)), '%s %s', device.deviceName, device.deviceType;
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // accessory.getService('NAME') ?? accessory.addService(this.platform.Service.Motion, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/MotionSensor
        // create handlers for required characteristics
        //this.service.setCharacteristic(this.platform.Characteristic.ChargingState, 2);
        // Retrieve initial values and updateHomekit
        this.updateHomeKitCharacteristics();
        // Start an update interval
        rxjs_1.interval(this.platform.config.options.refreshRate * 1000)
            .pipe(operators_1.skipWhile(() => this.motionUbpdateInProgress))
            .subscribe(() => {
            this.refreshStatus();
        });
    }
    /**
     * Parse the device status from the SwitchBot api
     */
    parseStatus() {
        // Set Room Sensor State
        if (this.deviceStatus.body) {
            this.MotionDetected = false;
        }
        else {
            this.MotionDetected = true;
        }
    }
    /**
     * Asks the SwitchBot API for the latest device information
     */
    async refreshStatus() {
        try {
            const deviceStatus = (await this.platform.axios.get(`${settings_1.DeviceURL}/${this.device.deviceId}/status`)).data;
            if (deviceStatus.message === 'success') {
                this.deviceStatus = deviceStatus;
                this.platform.log.debug('Motion %s refreshStatus -', this.accessory.displayName, JSON.stringify(this.deviceStatus));
                this.parseStatus();
                this.updateHomeKitCharacteristics();
            }
        }
        catch (e) {
            this.platform.log.error('Motion - Failed to update status of', this.device.deviceName, JSON.stringify(e.message), this.platform.log.debug('Motion %s -', this.accessory.displayName, JSON.stringify(e)));
            this.apiError(e);
        }
    }
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics() {
        if (this.MotionDetected !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.MotionDetected, this.MotionDetected);
        }
    }
    apiError(e) {
        this.service.updateCharacteristic(this.platform.Characteristic.MotionDetected, e);
        new this.platform.api.hap.HapStatusError(-70408 /* OPERATION_TIMED_OUT */);
    }
}
exports.Motion = Motion;
//# sourceMappingURL=motion.js.map