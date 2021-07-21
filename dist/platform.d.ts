import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';
import { AxiosInstance } from 'axios';
import { irdevice, device, SwitchBotPlatformConfig, deviceResponses } from './settings';
/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export declare class SwitchBotPlatform implements DynamicPlatformPlugin {
    readonly log: Logger;
    readonly config: SwitchBotPlatformConfig;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    axios: AxiosInstance;
    debugMode: boolean;
    constructor(log: Logger, config: SwitchBotPlatformConfig, api: API);
    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to setup event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory): void;
    apiError(accessory: PlatformAccessory): void;
    /**
     * Verify the config passed to the plugin is valid
     */
    verifyConfig(): void;
    /**
   * this method discovers the Locations
   */
    discoverDevices(): Promise<void>;
    private createHumidifier;
    private createBot;
    private createMeter;
    private createMotion;
    private createContact;
    private createCurtain;
    private isCurtainGrouped;
    private createPlug;
    private createTV;
    private createFan;
    private createLight;
    private createAirConditioner;
    private createAirPurifier;
    private createWaterHeater;
    private createVacuumCleaner;
    private createCamera;
    private createOthers;
    unregisterPlatformAccessories(existingAccessory: PlatformAccessory): void;
    deviceListInfo(devices: deviceResponses): void;
    deviceInfo(device: irdevice | device): Promise<void>;
}
//# sourceMappingURL=platform.d.ts.map