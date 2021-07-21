"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const settings_1 = require("../settings");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class Contact {
    constructor(platform, accessory, device) {
        this.platform = platform;
        this.accessory = accessory;
        this.device = device;
        // default placeholders
        this.ContactSensorState = this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
        // this is subject we use to track when we need to POST changes to the SwitchBot API
        this.doContactUpdate = new rxjs_1.Subject();
        this.contactUbpdateInProgress = false;
        // Retrieve initial values and updateHomekit
        this.refreshStatus();
        // set accessory information
        accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SwitchBot')
            .setCharacteristic(this.platform.Characteristic.Model, 'SWITCHBOT-CONTACT-')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);
        // get the Battery service if it exists, otherwise create a new Contact service
        // you can create multiple services for each accessory
        (this.service =
            accessory.getService(this.platform.Service.ContactSensor) ||
                accessory.addService(this.platform.Service.ContactSensor)), '%s %s', device.deviceName, device.deviceType;
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // accessory.getService('NAME') ?? accessory.addService(this.platform.Service.Contact, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/ContactSensor
        // create handlers for required characteristics
        //this.service.setCharacteristic(this.platform.Characteristic.ChargingState, 2);
        // Retrieve initial values and updateHomekit
        this.updateHomeKitCharacteristics();
        // Start an update interval
        rxjs_1.interval(this.platform.config.options.refreshRate * 1000)
            .pipe(operators_1.skipWhile(() => this.contactUbpdateInProgress))
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
            this.ContactSensorState = this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED;
        }
        else {
            this.ContactSensorState = this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
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
                this.platform.log.debug('Contact %s refreshStatus -', this.accessory.displayName, JSON.stringify(this.deviceStatus));
                this.parseStatus();
                this.updateHomeKitCharacteristics();
            }
        }
        catch (e) {
            this.platform.log.error('Contact - Failed to update status of', this.device.deviceName, JSON.stringify(e.message), this.platform.log.debug('Contact %s -', this.accessory.displayName, JSON.stringify(e)));
            this.apiError(e);
        }
    }
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics() {
        if (this.ContactSensorState !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.ContactSensorState, this.ContactSensorState);
        }
    }
    apiError(e) {
        this.service.updateCharacteristic(this.platform.Characteristic.ContactSensorState, e);
        new this.platform.api.hap.HapStatusError(-70408 /* OPERATION_TIMED_OUT */);
    }
}
exports.Contact = Contact;
//# sourceMappingURL=contact.js.map