"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Curtain = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const settings_1 = require("../settings");
class Curtain {
    constructor(platform, accessory, device) {
        var _a, _b, _c, _d;
        this.platform = platform;
        this.accessory = accessory;
        this.device = device;
        // default placeholders
        this.setMinMax();
        this.CurrentPosition = 0;
        this.TargetPosition = 0;
        this.PositionState = this.platform.Characteristic.PositionState.STOPPED;
        // this is subject we use to track when we need to POST changes to the SwitchBot API
        this.doCurtainUpdate = new rxjs_1.Subject();
        this.curtainUpdateInProgress = false;
        this.setNewTarget = false;
        // Retrieve initial values and updateHomekit
        this.refreshStatus();
        // set accessory information
        accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SwitchBot')
            .setCharacteristic(this.platform.Characteristic.Model, 'SWITCHBOT-CURTAIN-W0701600')
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);
        // get the WindowCovering service if it exists, otherwise create a new WindowCovering service
        // you can create multiple services for each accessory
        (this.service =
            accessory.getService(this.platform.Service.WindowCovering) ||
                accessory.addService(this.platform.Service.WindowCovering)), '%s %s', device.deviceName, device.deviceType;
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // accessory.getService('NAME') ?? accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);
        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/WindowCovering
        // create handlers for required characteristics
        this.service.setCharacteristic(this.platform.Characteristic.PositionState, this.PositionState);
        this.service
            .getCharacteristic(this.platform.Characteristic.CurrentPosition)
            .setProps({
            minStep: ((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.curtain) === null || _b === void 0 ? void 0 : _b.set_minStep) || 1,
            minValue: 0,
            maxValue: 100,
            validValueRanges: [0, 100],
        })
            .onGet(() => {
            return this.CurrentPosition;
        });
        this.service
            .getCharacteristic(this.platform.Characteristic.TargetPosition)
            .setProps({
            minStep: ((_d = (_c = this.platform.config.options) === null || _c === void 0 ? void 0 : _c.curtain) === null || _d === void 0 ? void 0 : _d.set_minStep) || 1,
            validValueRanges: [0, 100],
        })
            .onSet(this.TargetPositionSet.bind(this));
        // Update Homekit
        this.updateHomeKitCharacteristics();
        // Start an update interval
        rxjs_1.interval(this.platform.config.options.refreshRate * 1000)
            .pipe(operators_1.skipWhile(() => this.curtainUpdateInProgress))
            .subscribe(() => {
            this.refreshStatus();
        });
        // update slide progress
        rxjs_1.interval(this.platform.config.options.curtain.refreshRate * 1000)
            .pipe(operators_1.skipWhile(() => this.curtainUpdateInProgress))
            .subscribe(() => {
            if (this.PositionState === this.platform.Characteristic.PositionState.STOPPED) {
                return;
            }
            this.platform.log.debug('Refresh status when moving', this.PositionState);
            this.refreshStatus();
        });
        // Watch for Curtain change events
        // We put in a debounce of 100ms so we don't make duplicate calls
        this.doCurtainUpdate
            .pipe(operators_1.tap(() => {
            this.curtainUpdateInProgress = true;
        }), operators_1.debounceTime(this.platform.config.options.pushRate * 1000))
            .subscribe(async () => {
            try {
                await this.pushChanges();
            }
            catch (e) {
                this.platform.log.error(JSON.stringify(e.message));
                this.platform.log.debug('Curtain %s -', accessory.displayName, JSON.stringify(e));
                this.apiError(e);
            }
            this.curtainUpdateInProgress = false;
        });
    }
    parseStatus() {
        // CurrentPosition
        this.setMinMax();
        this.CurrentPosition = 100 - this.deviceStatus.body.slidePosition;
        this.setMinMax();
        this.platform.log.debug('Curtain %s CurrentPosition -', this.accessory.displayName, 'Device is Currently: ', this.CurrentPosition);
        if (this.setNewTarget) {
            this.platform.log.info('Checking %s Status ...', this.accessory.displayName);
        }
        if (this.deviceStatus.body.moving) {
            if (this.TargetPosition > this.CurrentPosition) {
                this.platform.log.debug('Curtain %s -', this.accessory.displayName, 'Current position:', this.CurrentPosition, 'closing');
                this.PositionState = this.platform.Characteristic.PositionState.INCREASING;
            }
            else if (this.TargetPosition < this.CurrentPosition) {
                this.platform.log.debug('Curtain %s -', this.accessory.displayName, 'Current position:', this.CurrentPosition, 'opening');
                this.PositionState = this.platform.Characteristic.PositionState.DECREASING;
            }
            else {
                this.platform.log.debug('Curtain %s -', this.CurrentPosition, 'standby');
                this.PositionState = this.platform.Characteristic.PositionState.STOPPED;
            }
        }
        else {
            this.platform.log.debug('Curtain %s -', this.accessory.displayName, 'Current position:', this.CurrentPosition, 'standby');
            if (!this.setNewTarget) {
                /*If Curtain calibration distance is short, there will be an error between the current percentage and the target percentage.*/
                this.TargetPosition = this.CurrentPosition;
                this.PositionState = this.platform.Characteristic.PositionState.STOPPED;
            }
        }
        this.platform.log.debug('Curtain %s CurrentPosition: %s, TargetPosition: %s, PositionState: %s', this.accessory.displayName, this.CurrentPosition, this.TargetPosition, this.PositionState);
    }
    async refreshStatus() {
        try {
            this.platform.log.debug('Curtain - Reading', `${settings_1.DeviceURL}/${this.device.deviceId}/status`);
            const deviceStatus = (await this.platform.axios.get(`${settings_1.DeviceURL}/${this.device.deviceId}/status`)).data;
            if (deviceStatus.message === 'success') {
                this.deviceStatus = deviceStatus;
                this.platform.log.debug('Curtain %s refreshStatus -', this.accessory.displayName, JSON.stringify(this.deviceStatus));
                this.setMinMax();
                this.parseStatus();
                this.updateHomeKitCharacteristics();
            }
        }
        catch (e) {
            this.platform.log.error(`Curtain - Failed to refresh status of ${this.device.deviceName}`, JSON.stringify(e.message), this.platform.log.debug('Curtain %s -', this.accessory.displayName, JSON.stringify(e)));
            this.apiError(e);
        }
    }
    async pushChanges() {
        if (this.TargetPosition !== this.CurrentPosition) {
            this.platform.log.debug(`Pushing ${this.TargetPosition}`);
            const adjustedTargetPosition = 100 - Number(this.TargetPosition);
            const payload = {
                commandType: 'command',
                command: 'setPosition',
                parameter: `0,ff,${adjustedTargetPosition}`,
            };
            this.platform.log.info('Sending request for', this.accessory.displayName, 'to SwitchBot API. command:', payload.command, 'parameter:', payload.parameter, 'commandType:', payload.commandType);
            this.platform.log.debug('Curtain %s pushChanges -', this.accessory.displayName, JSON.stringify(payload));
            // Make the API request
            const push = await this.platform.axios.post(`${settings_1.DeviceURL}/${this.device.deviceId}/commands`, payload);
            this.platform.log.debug('Curtain %s Changes pushed -', this.accessory.displayName, push.data);
            this.statusCode(push);
        }
    }
    updateHomeKitCharacteristics() {
        this.platform.log.debug('Curtain %s updateHomeKitCharacteristics -', this.accessory.displayName, JSON.stringify({
            CurrentPosition: this.CurrentPosition,
            PositionState: this.PositionState,
            TargetPosition: this.TargetPosition,
        }));
        this.setMinMax();
        if (this.CurrentPosition !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, this.CurrentPosition);
        }
        if (this.PositionState !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.PositionState, this.PositionState);
        }
        if (this.TargetPosition !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, this.TargetPosition);
        }
    }
    apiError(e) {
        this.service.updateCharacteristic(this.platform.Characteristic.CurrentPosition, e);
        this.service.updateCharacteristic(this.platform.Characteristic.PositionState, e);
        this.service.updateCharacteristic(this.platform.Characteristic.TargetPosition, e);
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
     * Handle requests to set the value of the "Target Position" characteristic
     */
    TargetPositionSet(value) {
        this.platform.log.debug('Curtain %s - Set TargetPosition: %s', this.accessory.displayName, value);
        this.TargetPosition = value;
        if (value > this.CurrentPosition) {
            this.PositionState = this.platform.Characteristic.PositionState.INCREASING;
            this.setNewTarget = true;
            this.setMinMax();
        }
        else if (value < this.CurrentPosition) {
            this.PositionState = this.platform.Characteristic.PositionState.DECREASING;
            this.setNewTarget = true;
            this.setMinMax();
        }
        else {
            this.PositionState = this.platform.Characteristic.PositionState.STOPPED;
            this.setNewTarget = false;
            this.setMinMax();
        }
        this.service.setCharacteristic(this.platform.Characteristic.PositionState, this.PositionState);
        /**
         * If Curtain movement time is short, the moving flag from backend is always false.
         * The minimum time depends on the network control latency.
         */
        clearTimeout(this.setNewTargetTimer);
        if (this.setNewTarget) {
            this.setNewTargetTimer = setTimeout(() => {
                this.platform.log.debug('Curtain %s -', this.accessory.displayName, 'setNewTarget', this.setNewTarget, 'timeout');
                this.setNewTarget = false;
            }, 10000);
        }
        this.doCurtainUpdate.next();
    }
    setMinMax() {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if ((_b = (_a = this.platform.config.options) === null || _a === void 0 ? void 0 : _a.curtain) === null || _b === void 0 ? void 0 : _b.set_min) {
            if (this.CurrentPosition <= ((_d = (_c = this.platform.config.options) === null || _c === void 0 ? void 0 : _c.curtain) === null || _d === void 0 ? void 0 : _d.set_min)) {
                this.CurrentPosition = 0;
            }
        }
        if ((_f = (_e = this.platform.config.options) === null || _e === void 0 ? void 0 : _e.curtain) === null || _f === void 0 ? void 0 : _f.set_max) {
            if (this.CurrentPosition >= ((_h = (_g = this.platform.config.options) === null || _g === void 0 ? void 0 : _g.curtain) === null || _h === void 0 ? void 0 : _h.set_max)) {
                this.CurrentPosition = 100;
            }
        }
    }
}
exports.Curtain = Curtain;
//# sourceMappingURL=curtains.js.map