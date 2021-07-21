import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { Subject } from 'rxjs';
import { device, deviceStatusResponse } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class Meter {
    private readonly platform;
    private accessory;
    device: device;
    private service;
    temperatureservice?: Service;
    humidityservice?: Service;
    CurrentRelativeHumidity: CharacteristicValue;
    CurrentTemperature: CharacteristicValue;
    BatteryLevel: CharacteristicValue;
    ChargingState: CharacteristicValue;
    StatusLowBattery: CharacteristicValue;
    Active: CharacteristicValue;
    WaterLevel: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    meterUpdateInProgress: boolean;
    doMeterUpdate: Subject<unknown>;
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
    /**
     * Converts the value to celsius if the temperature units are in Fahrenheit
     */
    toCelsius(value: number): number;
    /**
     * Converts the value to fahrenheit if the temperature units are in Fahrenheit
     */
    toFahrenheit(value: number): number;
}
//# sourceMappingURL=meters.d.ts.map