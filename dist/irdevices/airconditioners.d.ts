import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { irdevice } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class AirConditioner {
    private readonly platform;
    private accessory;
    device: irdevice;
    service: Service;
    Active: CharacteristicValue;
    RotationSpeed: CharacteristicValue;
    CurrentHeaterCoolerState: CharacteristicValue;
    CurrentTemperature: CharacteristicValue;
    CurrentARTemp: CharacteristicValue;
    CurrentARMode: CharacteristicValue;
    CurrentARFanSpeed: CharacteristicValue;
    ARActive: CharacteristicValue;
    LastTemperature: number;
    CurrentMode: number;
    CurrentFanSpeed: number;
    Busy: any;
    Timeout: any;
    static MODE_AUTO: number;
    static MODE_COOL: number;
    static MODE_HEAT: number;
    ValidValues: number[];
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: irdevice);
    private RotationSpeedSet;
    private RotationSpeedGet;
    private ActiveSet;
    private CurrentTemperatureGet;
    private TargetHeaterCoolerStateSet;
    private CurrentHeaterCoolerStateGet;
    private HeatingThresholdTemperatureGet;
    private HeatingThresholdTemperatureSet;
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType				commandType     Command	          command parameter	         Description
     * AirConditioner:        "command"       "swing"          "default"	        =        swing
     * AirConditioner:        "command"       "timer"          "default"	        =        timer
     * AirConditioner:        "command"       "lowSpeed"       "default"	        =        fan speed to low
     * AirConditioner:        "command"       "middleSpeed"    "default"	        =        fan speed to medium
     * AirConditioner:        "command"       "highSpeed"      "default"	        =        fan speed to high
     */
    pushAirConditionerOnChanges(): Promise<void>;
    pushAirConditionerOffChanges(): Promise<void>;
    pushAirConditionerStatusChanges(): Promise<void>;
    pushAirConditionerDetailsChanges(): Promise<void>;
    pushChanges(payload: any): Promise<void>;
    private statusCode;
    apiError(e: any): void;
}
//# sourceMappingURL=airconditioners.d.ts.map