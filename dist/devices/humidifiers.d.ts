import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { device, deviceStatusResponse } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class Humidifier {
    private readonly platform;
    private accessory;
    device: device;
    private service;
    temperatureservice?: Service;
    CurrentRelativeHumidity: CharacteristicValue;
    CurrentTemperature: CharacteristicValue;
    TargetHumidifierDehumidifierState: CharacteristicValue;
    CurrentHumidifierDehumidifierState: CharacteristicValue;
    RelativeHumidityHumidifierThreshold: CharacteristicValue;
    Active: CharacteristicValue;
    WaterLevel: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    humidifierUpdateInProgress: boolean;
    doHumidifierUpdate: any;
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
     * Pushes the requested changes to the SwitchBot API
     */
    pushChanges(): Promise<void>;
    /**
     * Pushes the requested changes to the SwitchBot API
     */
    pushAutoChanges(): Promise<void>;
    /**
     * Pushes the requested changes to the SwitchBot API
     */
    pushActiveChanges(): Promise<void>;
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics(): void;
    apiError(e: any): void;
    private statusCode;
    private statusCodeAuto;
    private statusCodeActive;
    /**
     * Handle requests to set the "Target Humidifier Dehumidifier State" characteristic
     */
    private handleTargetHumidifierDehumidifierStateSet;
    /**
     * Handle requests to set the "Active" characteristic
     */
    private handleActiveSet;
    /**
     * Handle requests to set the "Relative Humidity Humidifier Threshold" characteristic
     */
    private handleRelativeHumidityHumidifierThresholdSet;
}
//# sourceMappingURL=humidifiers.d.ts.map