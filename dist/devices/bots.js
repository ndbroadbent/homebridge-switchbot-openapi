"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const settings_1 = require("../settings");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class Bot {
    constructor(platform, accessory, device) {
        var _a, _b, _c, _d;
        this.platform = platform;
        this.accessory = accessory;
        this.device = device;
        // default placeholders
        this.On = false;
        if (!((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.bot) === null || _b === void 0 ? void 0 : _b.switch)) {
            this.OutletInUse = true;
        }
        // this is subject we use to track when we need to POST changes to the SwitchBot API
        this.doBotUpdate = new rxjs_1.Subject();
        this.botUpdateInProgress = false;
        // Retrieve initial values and updateHomekit
        this.parseStatus();
        // set accessory information
        accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SwitchBot')
            .setCharacteristic(this.platform.Characteristic.Model, 'SWITCHBOT-BOT-S1')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);
        // get the LightBulb service if it exists, otherwise create a new LightBulb service
        // you can create multiple services for each accessory
        if ((_d = (_c = this.platform.config.options) === null || _c === void 0 ? void 0 : _c.bot) === null || _d === void 0 ? void 0 : _d.switch) {
            (this.service =
                accessory.getService(this.platform.Service.Switch) ||
                    accessory.addService(this.platform.Service.Switch)), '%s %s', device.deviceName, device.deviceType;
        }
        else {
            (this.service =
                accessory.getService(this.platform.Service.Outlet) ||
                    accessory.addService(this.platform.Service.Outlet)), '%s %s', device.deviceName, device.deviceType;
        }
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // accessory.getService('NAME') ?? accessory.addService(this.platform.Service.Outlet, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Outlet
        this.service.getCharacteristic(this.platform.Characteristic.On).onSet(this.handleOnSet.bind(this));
        // Retrieve initial values and updateHomekit
        this.updateHomeKitCharacteristics();
        // Start an update interval
        rxjs_1.interval(this.platform.config.options.refreshRate * 1000)
            .pipe(operators_1.skipWhile(() => this.botUpdateInProgress))
            .subscribe(() => {
            this.refreshStatus();
        });
        // Watch for Bot change events
        // We put in a debounce of 100ms so we don't make duplicate calls
        this.doBotUpdate
            .pipe(operators_1.tap(() => {
            this.botUpdateInProgress = true;
        }), operators_1.debounceTime(100))
            .subscribe(async () => {
            try {
                await this.pushChanges();
            }
            catch (e) {
                this.platform.log.error(JSON.stringify(e.message));
                this.platform.log.debug('Bot %s -', accessory.displayName, JSON.stringify(e));
                this.apiError(e);
            }
            this.botUpdateInProgress = false;
        });
    }
    /**
     * Parse the device status from the SwitchBot api
     */
    parseStatus() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.bot) === null || _b === void 0 ? void 0 : _b.switch)) {
            this.OutletInUse = true;
            if ((_e = (_d = (_c = this.platform.config.options) === null || _c === void 0 ? void 0 : _c.bot) === null || _d === void 0 ? void 0 : _d.device_press) === null || _e === void 0 ? void 0 : _e.includes(this.device.deviceId)) {
                this.On = false;
            }
            this.platform.log.debug('Bot %s OutletInUse: %s On: %s', this.accessory.displayName, this.OutletInUse, this.On);
        }
        else {
            if ((_h = (_g = (_f = this.platform.config.options) === null || _f === void 0 ? void 0 : _f.bot) === null || _g === void 0 ? void 0 : _g.device_press) === null || _h === void 0 ? void 0 : _h.includes(this.device.deviceId)) {
                this.On = false;
            }
            this.platform.log.debug('Bot %s On: %s', this.accessory.displayName, this.On);
        }
    }
    /**
     * Asks the SwitchBot API for the latest device information
     */
    async refreshStatus() {
        try {
            // this.platform.log.error('Bot - Reading', `${DeviceURL}/${this.device.deviceID}/devices`);
            const deviceStatus = {
                statusCode: 100,
                body: {
                    deviceId: this.device.deviceId,
                    deviceType: this.device.deviceType,
                    hubDeviceId: this.device.hubDeviceId,
                    power: 'on',
                },
                message: 'success',
            };
            this.deviceStatus = deviceStatus;
            this.parseStatus();
            this.updateHomeKitCharacteristics();
        }
        catch (e) {
            this.platform.log.error(`Bot - Failed to update status of ${this.device.deviceName}`, JSON.stringify(e.message), this.platform.log.debug('Bot %s -', this.accessory.displayName, JSON.stringify(e)));
            this.apiError(e);
        }
    }
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType	commandType	  Command	    command parameter	  Description
     * Bot   -    "command"     "turnOff"   "default"	  =        set to OFF state
     * Bot   -    "command"     "turnOn"    "default"	  =        set to ON state
     * Bot   -    "command"     "press"     "default"	  =        trigger press
     */
    async pushChanges() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const payload = {
            commandType: 'command',
            parameter: 'default',
        };
        if (((_c = (_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.bot) === null || _b === void 0 ? void 0 : _b.device_switch) === null || _c === void 0 ? void 0 : _c.includes(this.device.deviceId)) && this.On) {
            payload.command = 'turnOn';
            this.On = true;
            this.platform.log.debug('Switch Mode, Turning %s', this.On);
        }
        else if (((_f = (_e = (_d = this.platform.config.options) === null || _d === void 0 ? void 0 : _d.bot) === null || _e === void 0 ? void 0 : _e.device_switch) === null || _f === void 0 ? void 0 : _f.includes(this.device.deviceId)) && !this.On) {
            payload.command = 'turnOff';
            this.On = false;
            this.platform.log.debug('Switch Mode, Turning %s', this.On);
        }
        else if ((_j = (_h = (_g = this.platform.config.options) === null || _g === void 0 ? void 0 : _g.bot) === null || _h === void 0 ? void 0 : _h.device_press) === null || _j === void 0 ? void 0 : _j.includes(this.device.deviceId)) {
            payload.command = 'press';
            this.platform.log.debug('Press Mode');
            this.On = false;
        }
        else {
            throw new Error('Bot Device Paramters not set for this Bot.');
        }
        this.platform.log.info('Sending request for', this.accessory.displayName, 'to SwitchBot API. command:', payload.command, 'parameter:', payload.parameter, 'commandType:', payload.commandType);
        this.platform.log.debug('Bot %s pushChanges -', this.accessory.displayName, JSON.stringify(payload));
        // Make the API request
        const push = await this.platform.axios.post(`${settings_1.DeviceURL}/${this.device.deviceId}/commands`, payload);
        this.platform.log.debug('Bot %s Changes pushed -', this.accessory.displayName, push.data);
        this.statusCode(push);
        this.refreshStatus();
    }
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics() {
        var _a, _b;
        if (this.On !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.On, this.On);
        }
        if (!((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.bot) === null || _b === void 0 ? void 0 : _b.switch) && this.OutletInUse !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.OutletInUse, this.OutletInUse);
        }
    }
    apiError(e) {
        var _a, _b;
        this.service.updateCharacteristic(this.platform.Characteristic.On, e);
        if (!((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.bot) === null || _b === void 0 ? void 0 : _b.switch)) {
            this.service.updateCharacteristic(this.platform.Characteristic.OutletInUse, e);
        }
        new this.platform.api.hap.HapStatusError(-70408 /* OPERATION_TIMED_OUT */);
    }
    statusCode(push) {
        switch (push.data.statusCode) {
            case 151:
                this.platform.log.error('Command not supported by this device type.');
                break;
            case 152:
                this.platform.log.error('Device not found.');
                break;
            case 160:
                this.platform.log.error('Command is not supported.');
                break;
            case 161:
                this.platform.log.error('Device is offline.');
                break;
            case 171:
                this.platform.log.error('Hub Device is offline.');
                break;
            case 190:
                this.platform.log.error('Device internal error due to device states not synchronized with server. Or command fomrat is invalid.');
                break;
            case 100:
                this.platform.log.debug('Command successfully sent.');
                break;
            default:
                this.platform.log.debug('Unknown statusCode.');
        }
    }
    /**
     * Handle requests to set the "On" characteristic
     */
    handleOnSet(value) {
        this.platform.log.debug('Bot %s -', this.accessory.displayName, `Set On: ${value}`);
        this.On = value;
        this.doBotUpdate.next();
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bots.js.map