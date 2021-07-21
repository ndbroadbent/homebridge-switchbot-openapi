"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fan = void 0;
const settings_1 = require("../settings");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class Fan {
    constructor(platform, accessory, device) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
        this.platform = platform;
        this.accessory = accessory;
        this.device = device;
        // set accessory information
        accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SwitchBot')
            .setCharacteristic(this.platform.Characteristic.Model, device.remoteType)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);
        // get the Television service if it exists, otherwise create a new Television service
        // you can create multiple services for each accessory
        (this.service =
            accessory.getService(this.platform.Service.Fanv2) ||
                accessory.addService(this.platform.Service.Fanv2)), '%s %s', device.deviceName, device.remoteType;
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // accessory.getService('NAME') ?? accessory.addService(this.platform.Service.Outlet, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // handle on / off events using the Active characteristic
        this.service.getCharacteristic(this.platform.Characteristic.Active).onSet(this.ActiveSet.bind(this));
        if ((_c = (_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.fan) === null || _b === void 0 ? void 0 : _b.rotation_speed) === null || _c === void 0 ? void 0 : _c.includes(device.deviceId)) {
            if ((_e = (_d = this.platform.config.options) === null || _d === void 0 ? void 0 : _d.fan) === null || _e === void 0 ? void 0 : _e.set_minStep) {
                this.minStep = (_g = (_f = this.platform.config.options) === null || _f === void 0 ? void 0 : _f.fan) === null || _g === void 0 ? void 0 : _g.set_minStep;
            }
            else {
                this.minStep = 1;
            }
            if ((_j = (_h = this.platform.config.options) === null || _h === void 0 ? void 0 : _h.fan) === null || _j === void 0 ? void 0 : _j.set_min) {
                this.minValue = (_l = (_k = this.platform.config.options) === null || _k === void 0 ? void 0 : _k.fan) === null || _l === void 0 ? void 0 : _l.set_min;
            }
            else {
                this.minValue = 1;
            }
            if ((_o = (_m = this.platform.config.options) === null || _m === void 0 ? void 0 : _m.fan) === null || _o === void 0 ? void 0 : _o.set_max) {
                this.maxValue = (_q = (_p = this.platform.config.options) === null || _p === void 0 ? void 0 : _p.fan) === null || _q === void 0 ? void 0 : _q.set_max;
            }
            else {
                this.maxValue = 100;
            }
            // handle Roation Speed events using the RotationSpeed characteristic
            this.service
                .getCharacteristic(this.platform.Characteristic.RotationSpeed)
                .setProps({
                minStep: this.minStep,
                minValue: this.minValue,
                maxValue: this.maxValue,
            })
                .onSet(this.RotationSpeedSet.bind(this));
        }
        else if (this.service.testCharacteristic(this.platform.Characteristic.RotationSpeed) &&
            !((_t = (_s = (_r = this.platform.config.options) === null || _r === void 0 ? void 0 : _r.fan) === null || _s === void 0 ? void 0 : _s.swing_mode) === null || _t === void 0 ? void 0 : _t.includes(device.deviceId))) {
            const characteristic = this.service.getCharacteristic(this.platform.Characteristic.RotationSpeed);
            this.service.removeCharacteristic(characteristic);
            this.platform.log.warn('Rotation Speed Characteristic was removed.');
        }
        else {
            this.platform.log.debug('Rotation Speed Characteristic was not removed or not added. To Remove Chracteristic, Clear Cache on this Accessory.');
        }
        if ((_w = (_v = (_u = this.platform.config.options) === null || _u === void 0 ? void 0 : _u.fan) === null || _v === void 0 ? void 0 : _v.swing_mode) === null || _w === void 0 ? void 0 : _w.includes(device.deviceId)) {
            // handle Osolcation events using the SwingMode characteristic
            this.service.getCharacteristic(this.platform.Characteristic.SwingMode).onSet(this.SwingModeSet.bind(this));
        }
        else if (this.service.testCharacteristic(this.platform.Characteristic.SwingMode) &&
            !((_z = (_y = (_x = this.platform.config.options) === null || _x === void 0 ? void 0 : _x.fan) === null || _y === void 0 ? void 0 : _y.swing_mode) === null || _z === void 0 ? void 0 : _z.includes(device.deviceId))) {
            const characteristic = this.service.getCharacteristic(this.platform.Characteristic.SwingMode);
            this.service.removeCharacteristic(characteristic);
            this.platform.log.warn('Swing Mode Characteristic was removed.');
        }
        else {
            this.platform.log.debug('Swing Mode Characteristic was not removed or not added. To Remove Chracteristic, Clear Cache on this Accessory.');
        }
    }
    SwingModeSet(value) {
        this.platform.log.debug('Fan %s Set SwingMode: %s', this.accessory.displayName, value);
        if (value > this.SwingMode) {
            this.SwingMode = 1;
            this.pushFanOnChanges();
            this.pushFanSwingChanges();
        }
        else {
            this.SwingMode = 0;
            this.pushFanOnChanges();
            this.pushFanSwingChanges();
        }
        this.SwingMode = value;
        if (this.SwingMode !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, this.SwingMode);
        }
    }
    RotationSpeedSet(value) {
        this.platform.log.debug('Fan %s Set Active: %s', this.accessory.displayName, value);
        if (value > this.RotationSpeed) {
            this.RotationSpeed = 1;
            this.pushFanSpeedUpChanges();
            this.pushFanOnChanges();
        }
        else {
            this.RotationSpeed = 0;
            this.pushFanSpeedDownChanges();
        }
        this.RotationSpeed = value;
        if (this.RotationSpeed !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, this.RotationSpeed);
        }
    }
    ActiveSet(value) {
        this.platform.log.debug('Fan %s Set Active: %s', this.accessory.displayName, value);
        if (value === this.platform.Characteristic.Active.INACTIVE) {
            this.pushFanOffChanges();
        }
        else {
            this.pushFanOnChanges();
        }
        this.Active = value;
        if (this.Active !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.Active, this.Active);
        }
    }
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType	commandType     Command	          command parameter	         Description
     * Fan:        "command"       "swing"          "default"	        =        swing
     * Fan:        "command"       "timer"          "default"	        =        timer
     * Fan:        "command"       "lowSpeed"       "default"	        =        fan speed to low
     * Fan:        "command"       "middleSpeed"    "default"	        =        fan speed to medium
     * Fan:        "command"       "highSpeed"      "default"	        =        fan speed to high
     */
    async pushFanOnChanges() {
        if (this.Active !== 1) {
            const payload = {
                commandType: 'command',
                parameter: 'default',
                command: 'turnOn',
            };
            await this.pushTVChanges(payload);
        }
    }
    async pushFanOffChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'turnOff',
        };
        await this.pushTVChanges(payload);
    }
    async pushFanSpeedUpChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'highSpeed',
        };
        await this.pushTVChanges(payload);
    }
    async pushFanSpeedDownChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'lowSpeed',
        };
        await this.pushTVChanges(payload);
    }
    async pushFanSwingChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'swing',
        };
        await this.pushTVChanges(payload);
    }
    async pushTVChanges(payload) {
        try {
            this.platform.log.info('Sending request for', this.accessory.displayName, 'to SwitchBot API. command:', payload.command, 'parameter:', payload.parameter, 'commandType:', payload.commandType);
            this.platform.log.debug('TV %s pushChanges -', this.accessory.displayName, JSON.stringify(payload));
            // Make the API request
            const push = await this.platform.axios.post(`${settings_1.DeviceURL}/${this.device.deviceId}/commands`, payload);
            this.platform.log.debug('TV %s Changes pushed -', this.accessory.displayName, push.data);
            this.statusCode(push);
        }
        catch (e) {
            this.apiError(e);
        }
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
    apiError(e) {
        this.service.updateCharacteristic(this.platform.Characteristic.Active, e);
        this.service.updateCharacteristic(this.platform.Characteristic.RotationSpeed, e);
        this.service.updateCharacteristic(this.platform.Characteristic.SwingMode, e);
        new this.platform.api.hap.HapStatusError(-70408 /* OPERATION_TIMED_OUT */);
    }
}
exports.Fan = Fan;
//# sourceMappingURL=fans.js.map