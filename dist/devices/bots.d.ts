import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { device, deviceStatusResponse } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class Bot {
    private readonly platform;
    private accessory;
    device: device;
    private service;
    On: CharacteristicValue;
    OutletInUse: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    botUpdateInProgress: boolean;
    doBotUpdate: any;
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
     * deviceType	commandType	  Command	    command parameter	  Description
     * Bot   -    "command"     "turnOff"   "default"	  =        set to OFF state
     * Bot   -    "command"     "turnOn"    "default"	  =        set to ON state
     * Bot   -    "command"     "press"     "default"	  =        trigger press
     */
    pushChanges(): Promise<void>;
    /**
     * Updates the status for each of the HomeKit Characteristics
     */
    updateHomeKitCharacteristics(): void;
    apiError(e: any): void;
    private statusCode;
    /**
     * Handle requests to set the "On" characteristic
     */
    private handleOnSet;
}
//# sourceMappingURL=bots.d.ts.map