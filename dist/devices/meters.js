"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meter = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const settings_1 = require("../settings");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class Meter {
    constructor(platform, accessory, device) {
        var _a, _b, _c, _d;
        this.platform = platform;
        this.accessory = accessory;
        this.device = device;
        // default placeholders
        this.BatteryLevel = 0;
        this.ChargingState = 2;
        this.StatusLowBattery = this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
        this.CurrentRelativeHumidity = 0;
        this.CurrentTemperature = 0;
        // this is subject we use to track when we need to POST changes to the SwitchBot API
        this.doMeterUpdate = new rxjs_1.Subject();
        this.meterUpdateInProgress = false;
        // Retrieve initial values and updateHomekit
        this.refreshStatus();
        // set accessory information
        accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SwitchBot')
            .setCharacteristic(this.platform.Characteristic.Model, 'SWITCHBOT-METERTH-S1')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);
        // get the Battery service if it exists, otherwise create a new Battery service
        // you can create multiple services for each accessory
        (this.service =
            accessory.getService(this.platform.Service.Battery) ||
                accessory.addService(this.platform.Service.Battery)), '%s %s', device.deviceName, device.deviceType;
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // accessory.getService('NAME') ?? accessory.addService(this.platform.Service.Battery, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Battery
        // create handlers for required characteristics
        this.service.setCharacteristic(this.platform.Characteristic.ChargingState, 2);
        // Temperature Sensor Service
        if ((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.meter) === null || _b === void 0 ? void 0 : _b.hide_temperature) {
            if (this.platform.debugMode) {
                this.platform.log.error('Removing service');
            }
            this.temperatureservice = this.accessory.getService(this.platform.Service.TemperatureSensor);
            accessory.removeService(this.temperatureservice);
        }
        else if (!this.temperatureservice) {
            if (this.platform.debugMode) {
                this.platform.log.warn('Adding service');
            }
            (this.temperatureservice =
                this.accessory.getService(this.platform.Service.TemperatureSensor) ||
                    this.accessory.addService(this.platform.Service.TemperatureSensor)), '%s %s TemperatureSensor', device.deviceName, device.deviceType;
            this.temperatureservice
                .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
                .setProps({
                unit: "celsius" /* 'CELSIUS' */,
                validValueRanges: [-273.15, 100],
                minValue: -273.15,
                maxValue: 100,
                minStep: 0.1,
            })
                .onGet(() => {
                return this.CurrentTemperature;
            });
        }
        else {
            if (this.platform.debugMode) {
                this.platform.log.warn('TemperatureSensor not added.');
            }
        }
        // Humidity Sensor Service
        if ((_d = (_c = this.platform.config.options) === null || _c === void 0 ? void 0 : _c.meter) === null || _d === void 0 ? void 0 : _d.hide_humidity) {
            if (this.platform.debugMode) {
                this.platform.log.error('Removing service');
            }
            this.humidityservice = this.accessory.getService(this.platform.Service.HumiditySensor);
            accessory.removeService(this.humidityservice);
        }
        else if (!this.humidityservice) {
            (this.humidityservice =
                this.accessory.getService(this.platform.Service.HumiditySensor) ||
                    this.accessory.addService(this.platform.Service.HumiditySensor)), '%s %s HumiditySensor', device.deviceName, device.deviceType;
            this.humidityservice
                .getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
                .setProps({
                minStep: 0.1,
            })
                .onGet(() => {
                return this.CurrentRelativeHumidity;
            });
        }
        else {
            if (this.platform.debugMode) {
                this.platform.log.warn('HumiditySensor not added.');
            }
        }
        // Retrieve initial values and updateHomekit
        this.updateHomeKitCharacteristics();
        // Start an update interval
        rxjs_1.interval(this.platform.config.options.refreshRate * 1000)
            .pipe(operators_1.skipWhile(() => this.meterUpdateInProgress))
            .subscribe(() => {
            this.refreshStatus();
        });
    }
    /**
     * Parse the device status from the SwitchBot api
     */
    parseStatus() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // Set Room Sensor State
        if (this.deviceStatus.body) {
            this.BatteryLevel = 100;
        }
        else {
            this.BatteryLevel = 10;
        }
        if (this.BatteryLevel < 15) {
            this.StatusLowBattery = 1;
        }
        else {
            this.StatusLowBattery = 0;
        }
        // Current Relative Humidity
        if (!((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.meter) === null || _b === void 0 ? void 0 : _b.hide_humidity)) {
            this.CurrentRelativeHumidity = this.deviceStatus.body.humidity;
            this.platform.log.debug('Meter %s - Humidity: %s%', this.accessory.displayName, this.CurrentRelativeHumidity);
        }
        // Current Temperature
        if (!((_d = (_c = this.platform.config.options) === null || _c === void 0 ? void 0 : _c.meter) === null || _d === void 0 ? void 0 : _d.hide_temperature)) {
            if (((_f = (_e = this.platform.config.options) === null || _e === void 0 ? void 0 : _e.meter) === null || _f === void 0 ? void 0 : _f.unit) === 1) {
                this.CurrentTemperature = this.toFahrenheit(this.deviceStatus.body.temperature);
            }
            else if (((_h = (_g = this.platform.config.options) === null || _g === void 0 ? void 0 : _g.meter) === null || _h === void 0 ? void 0 : _h.unit) === 0) {
                this.CurrentTemperature = this.toCelsius(this.deviceStatus.body.temperature);
            }
            else {
                this.CurrentTemperature = this.deviceStatus.body.temperature;
            }
            this.platform.log.debug('Meter %s - Temperature: %s°c', this.accessory.displayName, this.CurrentTemperature);
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
                this.platform.log.debug('Meter %s refreshStatus -', this.accessory.displayName, JSON.stringify(this.deviceStatus));
                this.parseStatus();
                this.updateHomeKitCharacteristics();
            }
        }
        catch (e) {
            this.platform.log.error('Meter - Failed to update status of', this.device.deviceName, JSON.stringify(e.message), this.platform.log.debug('Meter %s -', this.accessory.displayName, JSON.stringify(e)));
            this.apiError(e);
        }
    }
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics() {
        var _a, _b, _c, _d, _e, _f;
        if (this.StatusLowBattery !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.StatusLowBattery, this.StatusLowBattery);
        }
        if (this.BatteryLevel !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.BatteryLevel, this.BatteryLevel);
        }
        if (!((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.meter) === null || _b === void 0 ? void 0 : _b.hide_humidity) && this.CurrentRelativeHumidity !== undefined) {
            (_c = this.humidityservice) === null || _c === void 0 ? void 0 : _c.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, this.CurrentRelativeHumidity);
        }
        if (!((_e = (_d = this.platform.config.options) === null || _d === void 0 ? void 0 : _d.meter) === null || _e === void 0 ? void 0 : _e.hide_temperature) && this.CurrentTemperature !== undefined) {
            (_f = this.temperatureservice) === null || _f === void 0 ? void 0 : _f.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, this.CurrentTemperature);
        }
    }
    apiError(e) {
        var _a, _b, _c, _d, _e, _f;
        this.service.updateCharacteristic(this.platform.Characteristic.StatusLowBattery, e);
        this.service.updateCharacteristic(this.platform.Characteristic.BatteryLevel, e);
        if (!((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.meter) === null || _b === void 0 ? void 0 : _b.hide_humidity)) {
            (_c = this.humidityservice) === null || _c === void 0 ? void 0 : _c.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, e);
        }
        if (!((_e = (_d = this.platform.config.options) === null || _d === void 0 ? void 0 : _d.meter) === null || _e === void 0 ? void 0 : _e.hide_temperature)) {
            (_f = this.temperatureservice) === null || _f === void 0 ? void 0 : _f.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, e);
        }
        new this.platform.api.hap.HapStatusError(-70408 /* OPERATION_TIMED_OUT */);
    }
    /**
     * Converts the value to celsius if the temperature units are in Fahrenheit
     */
    toCelsius(value) {
        // celsius should be to the nearest 0.5 degree
        return Math.round((5 / 9) * (value - 32) * 2) / 2;
    }
    /**
     * Converts the value to fahrenheit if the temperature units are in Fahrenheit
     */
    toFahrenheit(value) {
        return Math.round((value * 9) / 5 + 32);
    }
}
exports.Meter = Meter;
//# sourceMappingURL=meters.js.map