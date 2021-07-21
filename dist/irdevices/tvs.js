"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TV = void 0;
const settings_1 = require("../settings");
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
class TV {
    constructor(platform, accessory, device) {
        this.platform = platform;
        this.accessory = accessory;
        this.device = device;
        // set accessory information
        accessory
            .getService(this.platform.Service.AccessoryInformation)
            .setCharacteristic(this.platform.Characteristic.Name, `${device.deviceName} ${device.remoteType}`)
            .setCharacteristic(this.platform.Characteristic.Manufacturer, 'SwitchBot')
            .setCharacteristic(this.platform.Characteristic.Model, device.remoteType)
            .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);
        // set the accessory category
        switch (device.remoteType) {
            case 'Speaker':
            case 'DIY Speaker':
                accessory.category = 26 /* SPEAKER */;
                break;
            case 'IPTV':
            case 'DIY IPTV':
                accessory.category = 36 /* TV_STREAMING_STICK */;
                break;
            case 'DVD':
            case 'DIY DVD':
            case 'Set Top Box':
            case 'DIY Set Top Box':
                accessory.category = 35 /* TV_SET_TOP_BOX */;
                break;
            default:
                accessory.category = 31 /* TELEVISION */;
        }
        // get the Television service if it exists, otherwise create a new Television service
        // you can create multiple services for each accessory
        (this.service =
            accessory.getService(this.platform.Service.Television) ||
                accessory.addService(this.platform.Service.Television)), '%s %s', device.deviceName, device.remoteType;
        // To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
        // when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
        // accessory.getService('NAME') ?? accessory.addService(this.platform.Service.Outlet, 'NAME', 'USER_DEFINED_SUBTYPE');
        // set the service name, this is what is displayed as the default name on the Home app
        // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
        this.service.getCharacteristic(this.platform.Characteristic.ConfiguredName);
        //this.service.setCharacteristic(this.platform.Characteristic.Name, `${device.deviceName} ${device.remoteType}`);
        // set sleep discovery characteristic
        this.service.setCharacteristic(this.platform.Characteristic.SleepDiscoveryMode, this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);
        // handle on / off events using the Active characteristic
        this.service.getCharacteristic(this.platform.Characteristic.Active).onSet(this.ActiveSet.bind(this));
        this.service.setCharacteristic(this.platform.Characteristic.ActiveIdentifier, 1);
        // handle input source changes
        this.service.getCharacteristic(this.platform.Characteristic.ActiveIdentifier).onSet(this.ActiveIdentifierSet.bind(this));
        // handle remote control input
        this.service.getCharacteristic(this.platform.Characteristic.RemoteKey).onSet(this.RemoteKeySet.bind(this));
        /**
         * Create a speaker service to allow volume control
         */
        // create a new Television Speaker service
        (this.speakerService =
            accessory.getService(this.platform.Service.TelevisionSpeaker) ||
                accessory.addService(this.platform.Service.TelevisionSpeaker)), '%s %s Speaker', device.deviceName, device.remoteType;
        this.speakerService
            .setCharacteristic(this.platform.Characteristic.Active, this.platform.Characteristic.Active.ACTIVE)
            .setCharacteristic(this.platform.Characteristic.VolumeControlType, this.platform.Characteristic.VolumeControlType.ABSOLUTE);
        // handle volume control
        this.speakerService
            .getCharacteristic(this.platform.Characteristic.VolumeSelector)
            .onSet(this.VolumeSelectorSet.bind(this));
    }
    VolumeSelectorSet(value) {
        this.platform.log.debug('TV %s Set VolumeSelector: %s', this.accessory.displayName, value);
        if (value === this.platform.Characteristic.VolumeSelector.INCREMENT) {
            this.pushVolumeUpChanges();
        }
        else {
            this.pushVolumeDownChanges();
        }
    }
    RemoteKeySet(value) {
        switch (value) {
            case this.platform.Characteristic.RemoteKey.REWIND: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: REWIND', this.accessory.displayName);
                break;
            }
            case this.platform.Characteristic.RemoteKey.FAST_FORWARD: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: FAST_FORWARD', this.accessory.displayName);
                break;
            }
            case this.platform.Characteristic.RemoteKey.NEXT_TRACK: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: NEXT_TRACK', this.accessory.displayName);
                break;
            }
            case this.platform.Characteristic.RemoteKey.PREVIOUS_TRACK: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: PREVIOUS_TRACK', this.accessory.displayName);
                break;
            }
            case this.platform.Characteristic.RemoteKey.ARROW_UP: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: ARROW_UP', this.accessory.displayName);
                //this.pushUpChanges();
                break;
            }
            case this.platform.Characteristic.RemoteKey.ARROW_DOWN: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: ARROW_DOWN', this.accessory.displayName);
                //this.pushDownChanges();
                break;
            }
            case this.platform.Characteristic.RemoteKey.ARROW_LEFT: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: ARROW_LEFT', this.accessory.displayName);
                //this.pushLeftChanges();
                break;
            }
            case this.platform.Characteristic.RemoteKey.ARROW_RIGHT: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: ARROW_RIGHT', this.accessory.displayName);
                //this.pushRightChanges();
                break;
            }
            case this.platform.Characteristic.RemoteKey.SELECT: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: SELECT', this.accessory.displayName);
                //this.pushOkChanges();
                break;
            }
            case this.platform.Characteristic.RemoteKey.BACK: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: BACK', this.accessory.displayName);
                //this.pushBackChanges();
                break;
            }
            case this.platform.Characteristic.RemoteKey.EXIT: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: EXIT', this.accessory.displayName);
                break;
            }
            case this.platform.Characteristic.RemoteKey.PLAY_PAUSE: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: PLAY_PAUSE', this.accessory.displayName);
                break;
            }
            case this.platform.Characteristic.RemoteKey.INFORMATION: {
                this.platform.log.debug('TV %s Set Remote Key Pressed: INFORMATION', this.accessory.displayName);
                //this.pushMenuChanges();
                break;
            }
        }
    }
    ActiveIdentifierSet(value) {
        this.platform.log.debug('TV %s Set Active Identifier: %s', this.accessory.displayName, value);
    }
    ActiveSet(value) {
        this.platform.log.debug('TV %s Set Active: %s', this.accessory.displayName, value);
        if (value === this.platform.Characteristic.Active.INACTIVE) {
            this.pushTvOffChanges();
        }
        else {
            this.pushTvOnChanges();
        }
        this.ActiveIdentifier = value;
        if (this.ActiveIdentifier !== undefined) {
            this.service.updateCharacteristic(this.platform.Characteristic.Active, this.ActiveIdentifier);
        }
    }
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType	commandType     Command	          command parameter	         Description
     * TV:        "command"       "turnOff"         "default"	        =        set to OFF state
     * TV:        "command"       "turnOn"          "default"	        =        set to ON state
     * TV:        "command"       "volumeAdd"       "default"	        =        volume up
     * TV:        "command"       "volumeSub"       "default"	        =        volume down
     * TV:        "command"       "channelAdd"      "default"	        =        next channel
     * TV:        "command"       "channelSub"      "default"	        =        previous channel
     */
    async pushTvOnChanges() {
        if (this.Active !== 1) {
            const payload = {
                commandType: 'command',
                parameter: 'default',
                command: 'turnOn',
            };
            await this.pushTVChanges(payload);
        }
    }
    async pushTvOffChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'turnOff',
        };
        await this.pushTVChanges(payload);
    }
    async pushOkChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'Ok',
        };
        await this.pushTVChanges(payload);
    }
    async pushBackChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'Back',
        };
        await this.pushTVChanges(payload);
    }
    async pushMenuChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'Menu',
        };
        await this.pushTVChanges(payload);
    }
    async pushUpChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'Up',
        };
        await this.pushTVChanges(payload);
    }
    async pushDownChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'Down',
        };
        await this.pushTVChanges(payload);
    }
    async pushRightChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'Right',
        };
        await this.pushTVChanges(payload);
    }
    async pushLeftChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'Left',
        };
        await this.pushTVChanges(payload);
    }
    async pushVolumeUpChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'volumeAdd',
        };
        await this.pushTVChanges(payload);
    }
    async pushVolumeDownChanges() {
        const payload = {
            commandType: 'command',
            parameter: 'default',
            command: 'volumeSub',
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
        this.speakerService.updateCharacteristic(this.platform.Characteristic.Active, e);
        new this.platform.api.hap.HapStatusError(-70408 /* OPERATION_TIMED_OUT */);
    }
}
exports.TV = TV;
//# sourceMappingURL=tvs.js.map