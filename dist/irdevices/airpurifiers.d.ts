import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { irdevice } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class AirPurifier {
    private readonly platform;
    private accessory;
    device: irdevice;
    service: Service;
    Active: CharacteristicValue;
    RotationSpeed: CharacteristicValue;
    CurrentAirPurifierState: CharacteristicValue;
    CurrentTemperature: CharacteristicValue;
    CurrentAPTemp: CharacteristicValue;
    CurrentAPMode: CharacteristicValue;
    CurrentAPFanSpeed: CharacteristicValue;
    APActive: CharacteristicValue;
    LastTemperature: number;
    CurrentMode: number;
    CurrentFanSpeed: number;
    Busy: any;
    Timeout: any;
    static PURIFYING_AIR: number;
    static IDLE: number;
    static INACTIVE: number;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: irdevice);
    private ActiveSet;
    private TargetAirPurifierStateSet;
    private CurrentAirPurifierStateGet;
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType				commandType     Command	          command parameter	         Description
     * AirPurifier:        "command"       "turnOn"         "default"	        =        every home appliance can be turned on by default
     * AirPurifier:        "command"       "turnOff"        "default"	        =        every home appliance can be turned off by default
     * AirPurifier:        "command"       "swing"          "default"	        =        swing
     * AirPurifier:        "command"       "timer"          "default"	        =        timer
     * AirPurifier:        "command"       "lowSpeed"       "default"	        =        fan speed to low
     * AirPurifier:        "command"       "middleSpeed"    "default"	        =        fan speed to medium
     * AirPurifier:        "command"       "highSpeed"      "default"	        =        fan speed to high
     */
    pushAirConditionerOnChanges(): Promise<void>;
    pushAirConditionerOffChanges(): Promise<void>;
    pushAirConditionerStatusChanges(): Promise<void>;
    pushAirConditionerDetailsChanges(): Promise<void>;
    pushChanges(payload: any): Promise<void>;
    private statusCode;
    apiError(e: any): void;
}
//# sourceMappingURL=airpurifiers.d.ts.map