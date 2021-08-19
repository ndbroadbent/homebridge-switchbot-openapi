"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SwitchBotPlatform = void 0;
const axios_1 = __importDefault(require("axios"));
const settings_1 = require("./settings");
const bots_1 = require("./devices/bots");
const plugs_1 = require("./devices/plugs");
const meters_1 = require("./devices/meters");
const motion_1 = require("./devices/motion");
const contact_1 = require("./devices/contact");
const curtains_1 = require("./devices/curtains");
const humidifiers_1 = require("./devices/humidifiers");
const tvs_1 = require("./irdevices/tvs");
const fans_1 = require("./irdevices/fans");
const lights_1 = require("./irdevices/lights");
const cameras_1 = require("./irdevices/cameras");
const others_1 = require("./irdevices/others");
const waterheaters_1 = require("./irdevices/waterheaters");
const vacuumcleaners_1 = require("./irdevices/vacuumcleaners");
const airconditioners_1 = require("./irdevices/airconditioners");
const airpurifiers_1 = require("./irdevices/airpurifiers");
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
class SwitchBotPlatform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.Service = this.api.hap.Service;
        this.Characteristic = this.api.hap.Characteristic;
        // this is used to track restored cached accessories
        this.accessories = [];
        this.axios = axios_1.default.create({
            responseType: 'json',
        });
        this.version = require('../package.json').version; // eslint-disable-line @typescript-eslint/no-var-requires
        this.log.debug('Finished initializing platform:', this.config.name);
        // only load if configured
        if (!this.config) {
            return;
        }
        // HOOBS notice
        if (__dirname.includes('hoobs')) {
            this.log.warn('This plugin has not been tested under HOOBS, it is highly recommended that ' +
                'you switch to Homebridge: https://git.io/Jtxb0');
        }
        // verify the config
        try {
            this.verifyConfig();
            this.log.debug('Config OK');
        }
        catch (e) {
            this.log.error(JSON.stringify(e.message));
            this.log.debug(JSON.stringify(e));
            return;
        }
        this.debugMode = process.argv.includes('-D') || process.argv.includes('--debug');
        // setup axios interceptor to add headers / api key to each request
        this.axios.interceptors.request.use((request) => {
            var _a;
            request.headers.Authorization = (_a = this.config.credentials) === null || _a === void 0 ? void 0 : _a.openToken;
            request.headers['Content-Type'] = 'application/json; charset=utf8';
            return request;
        });
        // When this event is fired it means Homebridge has restored all cached accessories from disk.
        // Dynamic Platform plugins should only register new accessories after this event was fired,
        // in order to ensure they weren't added to homebridge already. This event can also be used
        // to start discovery of new accessories.
        this.api.on('didFinishLaunching', async () => {
            log.debug('Executed didFinishLaunching callback');
            // run the method to discover / register your devices as accessories
            try {
                this.discoverDevices();
            }
            catch (e) {
                this.log.error('Failed to Discover Devices.', JSON.stringify(e.message));
                this.log.debug(JSON.stringify(e));
            }
        });
    }
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);
        //accessory.context.timeout = this.apiError(accessory);
        // add the restored accessory to the accessories cache so we can track if it has already been registered
        this.accessories.push(accessory);
    }
    apiError(accessory) {
        this.log.debug('API Error:', accessory.displayName);
    }
    /**
     * Verify the config passed to the plugin is valid
     */
    verifyConfig() {
        /**
         * Hidden Device Discovery Option
         * This will disable adding any device and will just output info.
         */
        this.config.devicediscovery;
        this.config.options = this.config.options || {};
        // Hide Devices by DeviceID
        this.config.options.hide_device = this.config.options.hide_device || [];
        // Meter Config Options
        this.config.options.bot = this.config.options.bot || {};
        this.config.options.bot.device_press;
        this.config.options.bot.device_switch;
        // Meter Config Options
        this.config.options.meter = this.config.options.meter || {};
        this.config.options.meter.hide_temperature;
        this.config.options.meter.hide_humidity;
        // Humidifier Config Options
        this.config.options.humidifier = this.config.options.humidifier || {};
        this.config.options.humidifier.set_minStep;
        this.config.options.humidifier.hide_temperature;
        // Curtain Config Options
        this.config.options.curtain = this.config.options.curtain || {};
        this.config.options.curtain.disable_group;
        if (!this.config.options.curtain.refreshRate) {
            this.config.options.curtain.refreshRate = 5;
            if (this.debugMode) {
                this.log.warn('Using Default Curtain Refresh Rate.');
            }
        }
        this.config.options.curtain.set_minStep;
        this.config.options.curtain.set_min;
        this.config.options.curtain.set_max;
        // Fan Config Options
        this.config.options.fan = this.config.options.fan || {};
        this.config.options.fan.swing_mode;
        this.config.options.fan.rotation_speed;
        this.config.options.fan.set_minStep;
        this.config.options.fan.set_min;
        this.config.options.fan.set_max;
        // AirConditioner Config Options
        this.config.options.irair = this.config.options.irair || {};
        this.config.options.irair.hide_automode;
        // Others Config Options
        this.config.options.other = this.config.options.other || {};
        this.config.options.other.deviceType;
        this.config.options.other.commandOn;
        this.config.options.other.commandOff;
        if (this.config.options.refreshRate < 120) {
            throw new Error('Refresh Rate must be above 120 (2 minutes).');
        }
        if (!this.config.options.refreshRate) {
            // default 600 seconds (15 minutes)
            this.config.options.refreshRate = 900;
            this.log.warn('Using Default Refresh Rate.');
        }
        if (!this.config.options.pushRate) {
            // default 100 milliseconds
            this.config.options.pushRate = 0.1;
            this.log.warn('Using Default Push Rate.');
        }
        if (!this.config.credentials) {
            throw new Error('Missing Credentials');
        }
        if (!this.config.credentials.openToken) {
            throw new Error('Missing openToken');
        }
    }
    /**
   * this method discovers the Locations
   */
    async discoverDevices() {
        try {
            const devices = (await this.axios.get(settings_1.DeviceURL)).data;
            if (this.config.devicediscovery) {
                this.deviceListInfo(devices);
            }
            else {
                this.log.debug(JSON.stringify(devices));
            }
            this.log.info('Total SwitchBot Devices Found:', devices.body.deviceList.length);
            this.log.info('Total IR Devices Found:', devices.body.infraredRemoteList.length);
            for (const device of devices.body.deviceList) {
                if (this.config.devicediscovery) {
                    this.deviceInfo(device);
                }
                else {
                    this.log.debug(JSON.stringify(device));
                }
                // For Future Devices
                switch (device.deviceType) {
                    case 'Humidifier':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.deviceType);
                        }
                        this.createHumidifier(device);
                        break;
                    case 'Hub Mini':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered a %s', device.deviceType);
                        }
                        break;
                    case 'Hub Plus':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered a %s', device.deviceType);
                        }
                        break;
                    case 'Bot':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.deviceType);
                        }
                        this.createBot(device);
                        break;
                    case 'Meter':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.deviceType);
                        }
                        this.createMeter(device);
                        break;
                    case 'Motion':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.deviceType);
                        }
                        this.createMotion(device);
                        break;
                    case 'Contact':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.deviceType);
                        }
                        this.createContact(device);
                        break;
                    case 'Curtain':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.deviceType);
                        }
                        this.createCurtain(device);
                        break;
                    case 'Plug':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.deviceType);
                        }
                        this.createPlug(device);
                        break;
                    case 'Remote':
                        if (this.config.devicediscovery) {
                            this.log.debug('Discovered %s, %s is Not Supported.', device.deviceName, device.deviceType);
                        }
                        break;
                    default:
                        this.log.info('Device: %s with Device Type: %s, is currently not supported.', device.deviceName, device.deviceType, 'Submit Feature Requests Here: https://git.io/JL14Z');
                }
            }
            for (const device of devices.body.infraredRemoteList) {
                if (this.config.devicediscovery) {
                    this.deviceInfo(device);
                }
                else {
                    this.log.debug(JSON.stringify(device));
                }
                // For Future Devices
                switch (device.remoteType) {
                    case 'TV':
                    case 'DIY TV':
                    case 'Projector':
                    case 'DIY Projector':
                    case 'Set Top Box':
                    case 'DIY Set Top Box':
                    case 'IPTV':
                    case 'DIY IPTV':
                    case 'DVD':
                    case 'DIY DVD':
                    case 'Speaker':
                    case 'DIY Speaker':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createTV(device);
                        break;
                    case 'Fan':
                    case 'DIY Fan':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createFan(device);
                        break;
                    case 'Air Conditioner':
                    case 'DIY Air Conditioner':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createAirConditioner(device);
                        break;
                    case 'Light':
                    case 'DIY Light':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createLight(device);
                        break;
                    case 'Air Purifier':
                    case 'DIY Air Purifier':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createAirPurifier(device);
                        break;
                    case 'Water Heater':
                    case 'DIY Water Heater':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createWaterHeater(device);
                        break;
                    case 'Vacuum Cleaner':
                    case 'DIY Vacuum Cleaner':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createVacuumCleaner(device);
                        break;
                    case 'Camera':
                    case 'DIY Camera':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createCamera(device);
                        break;
                    case 'Others':
                        if (this.config.devicediscovery) {
                            this.log.info('Discovered %s %s', device.deviceName, device.remoteType);
                        }
                        this.createOthers(device);
                        break;
                    default:
                        this.log.info('Device: %s with Device Type: %s, is currently not supported.', device.deviceName, device.remoteType, 'Submit Feature Requests Here: https://git.io/JL14Z');
                }
            }
        }
        catch (e) {
            this.log.error('Failed to Discover Devices.', JSON.stringify(e.message));
            this.log.debug(JSON.stringify(e));
        }
    }
    async createHumidifier(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.deviceType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId)) && device.enableCloudService) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                //existingAccessory.context.firmwareRevision = firmware;
                existingAccessory.context.model = device.deviceType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new humidifiers_1.Humidifier(this, existingAccessory, device);
                this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId)) && device.enableCloudService) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.deviceType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.deviceType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new humidifiers_1.Humidifier(this, accessory, device);
            this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.deviceType, device.deviceId);
            }
        }
    }
    async createBot(device) {
        var _a, _b, _c, _d, _e, _f;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.deviceType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId)) && device.enableCloudService) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.deviceType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new bots_1.Bot(this, existingAccessory, device);
                this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId)) && device.enableCloudService) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.deviceType, device.deviceId);
            if (!((_d = (_c = this.config.options) === null || _c === void 0 ? void 0 : _c.bot) === null || _d === void 0 ? void 0 : _d.device_press) && !((_f = (_e = this.config.options) === null || _e === void 0 ? void 0 : _e.bot) === null || _f === void 0 ? void 0 : _f.device_switch)) {
                this.log.error('You must set your Bot to Press or Switch Mode');
            }
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.deviceType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new bots_1.Bot(this, accessory, device);
            this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.deviceType, device.deviceId);
            }
        }
    }
    async createMeter(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.deviceType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId)) && device.enableCloudService) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.deviceType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new meters_1.Meter(this, existingAccessory, device);
                this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId)) && device.enableCloudService) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.deviceType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.deviceType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new meters_1.Meter(this, accessory, device);
            this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.deviceType, device.deviceId);
            }
        }
    }
    async createMotion(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.deviceType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId)) && device.enableCloudService) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                //existingAccessory.context.firmwareRevision = firmware;
                //this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new motion_1.Motion(this, existingAccessory, device);
                this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId)) && device.enableCloudService) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.deviceType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            //accessory.context.firmwareRevision = firmware;
            accessory.context.device = device;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new motion_1.Motion(this, accessory, device);
            this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.deviceType, device.deviceId);
            }
        }
    }
    async createContact(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.deviceType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId)) && device.enableCloudService) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                //existingAccessory.context.firmwareRevision = firmware;
                //this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new contact_1.Contact(this, existingAccessory, device);
                this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId)) && device.enableCloudService) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.deviceType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            //accessory.context.firmwareRevision = firmware;
            accessory.context.device = device;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new motion_1.Motion(this, accessory, device);
            this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.deviceType, device.deviceId);
            }
        }
    }
    async createCurtain(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.deviceType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (this.isCurtainGrouped(device)) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.deviceType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new curtains_1.Curtain(this, existingAccessory, device);
                this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (this.isCurtainGrouped(device)) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.deviceType, device.deviceId);
            if (device.group && !((_b = (_a = this.config.options) === null || _a === void 0 ? void 0 : _a.curtain) === null || _b === void 0 ? void 0 : _b.disable_group)) {
                this.log.warn('Your Curtains are grouped, Secondary curtain automatically hidden. Main Curtain: %s, DeviceID: %s', device.deviceName, device.deviceId);
            }
            else {
                if (device.master) {
                    this.log.warn('Main Curtain: %s, DeviceID: %s', device.deviceName, device.deviceId);
                }
                else {
                    this.log.warn('Secondary Curtain: %s, DeviceID: %s', device.deviceName, device.deviceId);
                }
            }
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.deviceType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new curtains_1.Curtain(this, accessory, device);
            this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.deviceType, device.deviceId);
            }
        }
    }
    isCurtainGrouped(device) {
        var _a, _b, _c, _d;
        if (device.group && !((_b = (_a = this.config.options) === null || _a === void 0 ? void 0 : _a.curtain) === null || _b === void 0 ? void 0 : _b.disable_group)) {
            return device.master && !((_c = this.config.options) === null || _c === void 0 ? void 0 : _c.hide_device.includes(device.deviceId)) && device.enableCloudService;
        }
        else {
            return !((_d = this.config.options) === null || _d === void 0 ? void 0 : _d.hide_device.includes(device.deviceId)) && device.enableCloudService;
        }
    }
    async createPlug(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.deviceType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId)) && device.enableCloudService) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.deviceType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new plugs_1.Plug(this, existingAccessory, device);
                this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId)) && device.enableCloudService) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.deviceType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.deviceType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.deviceType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new plugs_1.Plug(this, accessory, device);
            this.log.debug(`${device.deviceType} UDID: ${device.deviceName}-${device.deviceId}-${device.deviceType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.deviceType, device.deviceId);
            }
        }
    }
    async createTV(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}-${device.hubDeviceId}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory && !((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
            this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
            // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
            existingAccessory.context.model = device.remoteType;
            existingAccessory.context.deviceID = device.deviceId;
            existingAccessory.context.firmwareRevision = this.version;
            this.api.updatePlatformAccessories([existingAccessory]);
            // create the accessory handler for the restored accessory
            // this is imported from `platformAccessory.ts`
            new tvs_1.TV(this, existingAccessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}-${device.hubDeviceId}`);
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new tvs_1.TV(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}-${device.hubDeviceId}`);
            /**
           * Publish as external accessory
           * Only one TV can exist per bridge, to bypass this limitation, you should
           * publish your TV as an external accessory.
           */
            this.api.publishExternalAccessories(settings_1.PLUGIN_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createFan(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new fans_1.Fan(this, existingAccessory, device);
                this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new fans_1.Fan(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createLight(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new lights_1.Light(this, existingAccessory, device);
                this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new lights_1.Light(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createAirConditioner(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new airconditioners_1.AirConditioner(this, existingAccessory, device);
                this.log.debug(`Fan UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new airconditioners_1.AirConditioner(this, accessory, device);
            this.log.debug(`Fan UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createAirPurifier(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new airpurifiers_1.AirPurifier(this, existingAccessory, device);
                this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new airpurifiers_1.AirPurifier(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createWaterHeater(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new waterheaters_1.WaterHeater(this, existingAccessory, device);
                this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new waterheaters_1.WaterHeater(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createVacuumCleaner(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new vacuumcleaners_1.VacuumCleaner(this, existingAccessory, device);
                this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new vacuumcleaners_1.VacuumCleaner(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createCamera(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new cameras_1.Camera(this, existingAccessory, device);
                this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new cameras_1.Camera(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    async createOthers(device) {
        var _a, _b;
        const uuid = this.api.hap.uuid.generate(`${device.deviceName}-${device.deviceId}-${device.remoteType}`);
        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
        if (existingAccessory) {
            // the accessory already exists
            if (!((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.hide_device.includes(device.deviceId))) {
                this.log.info('Restoring existing accessory from cache: %s DeviceID: %s', existingAccessory.displayName, device.deviceId);
                // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
                existingAccessory.context.model = device.remoteType;
                existingAccessory.context.deviceID = device.deviceId;
                existingAccessory.context.firmwareRevision = this.version;
                this.api.updatePlatformAccessories([existingAccessory]);
                // create the accessory handler for the restored accessory
                // this is imported from `platformAccessory.ts`
                new others_1.Others(this, existingAccessory, device);
                this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            }
            else {
                this.unregisterPlatformAccessories(existingAccessory);
            }
        }
        else if (!((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.hide_device.includes(device.deviceId))) {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory: %s %s DeviceID: %s', device.deviceName, device.remoteType, device.deviceId);
            // create a new accessory
            const accessory = new this.api.platformAccessory(`${device.deviceName} ${device.remoteType}`, uuid);
            // store a copy of the device object in the `accessory.context`
            // the `context` property can be used to store any data about the accessory you may need
            accessory.context.device = device;
            accessory.context.model = device.remoteType;
            accessory.context.deviceID = device.deviceId;
            accessory.context.firmwareRevision = this.version;
            // accessory.context.firmwareRevision = findaccessories.accessoryAttribute.softwareRevision;
            // create the accessory handler for the newly create accessory
            // this is imported from `platformAccessory.ts`
            new others_1.Others(this, accessory, device);
            this.log.debug(`${device.remoteType} UDID: ${device.deviceName}-${device.deviceId}-${device.remoteType}`);
            // link the accessory to your platform
            this.api.registerPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [accessory]);
            this.accessories.push(accessory);
        }
        else {
            if (this.config.devicediscovery) {
                this.log.error('Unable to Register new device: %s %s - %s', device.deviceName, device.remoteType, device.deviceId);
            }
        }
    }
    unregisterPlatformAccessories(existingAccessory) {
        // remove platform accessories when no longer present
        this.api.unregisterPlatformAccessories(settings_1.PLUGIN_NAME, settings_1.PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
    }
    deviceListInfo(devices) {
        this.log.warn(JSON.stringify(devices));
    }
    async deviceInfo(device) {
        this.log.warn(JSON.stringify(device));
        const deviceStatus = (await this.axios.get(`${settings_1.DeviceURL}/${device.deviceId}/status`)).data;
        if (deviceStatus.message === 'success') {
            this.log.warn('deviceStatus -', device.deviceName, JSON.stringify(deviceStatus));
        }
        else {
            this.log.warn('deviceStatus -', device.deviceName, JSON.stringify(deviceStatus.message));
            this.log.error('Unable to retreive device status.');
        }
    }
}
exports.SwitchBotPlatform = SwitchBotPlatform;
//# sourceMappingURL=platform.js.map