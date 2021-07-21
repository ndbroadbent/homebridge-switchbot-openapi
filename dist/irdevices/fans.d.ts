import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { irdevice, deviceStatusResponse } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class Fan {
    private readonly platform;
    private accessory;
    device: irdevice;
    service: Service;
    Active: CharacteristicValue;
    ActiveIdentifier: CharacteristicValue;
    RotationSpeed: CharacteristicValue;
    SwingMode: CharacteristicValue;
    RotationDirection: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    minStep: number | undefined;
    minValue: number | undefined;
    maxValue: number | undefined;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: irdevice);
    private SwingModeSet;
    private RotationSpeedSet;
    private ActiveSet;
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType	commandType     Command	          command parameter	         Description
     * Fan:        "command"       "swing"          "default"	        =        swing
     * Fan:        "command"       "timer"          "default"	        =        timer
     * Fan:        "command"       "lowSpeed"       "default"	        =        fan speed to low
     * Fan:        "command"       "middleSpeed"    "default"	        =        fan speed to medium
     * Fan:        "command"       "highSpeed"      "default"	        =        fan speed to high
     */
    pushFanOnChanges(): Promise<void>;
    pushFanOffChanges(): Promise<void>;
    pushFanSpeedUpChanges(): Promise<void>;
    pushFanSpeedDownChanges(): Promise<void>;
    pushFanSwingChanges(): Promise<void>;
    pushTVChanges(payload: any): Promise<void>;
    private statusCode;
    apiError(e: any): void;
}
//# sourceMappingURL=fans.d.ts.map