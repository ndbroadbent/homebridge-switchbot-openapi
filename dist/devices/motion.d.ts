import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { device, deviceStatusResponse } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class Motion {
    private readonly platform;
    private accessory;
    device: device;
    private service;
    temperatureservice?: Service;
    humidityservice?: Service;
    MotionDetected: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    motionUbpdateInProgress: boolean;
    doMotionUpdate: any;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: device);
    /**
     * Parse the device status from the SwitchBot api
     */
    parseStatus(): void;
    /**
     * Asks the SwitchBot API for the latest device information
     */
    refreshStatus(): Promise<void>;
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics(): void;
    apiError(e: any): void;
}
//# sourceMappingURL=motion.d.ts.map