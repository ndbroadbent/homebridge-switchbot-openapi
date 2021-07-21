import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { device, deviceStatusResponse } from '../settings';
export declare class Plug {
    private readonly platform;
    private accessory;
    device: device;
    private service;
    On: CharacteristicValue;
    OutletInUse: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    plugUpdateInProgress: boolean;
    doPlugUpdate: any;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: device);
    parseStatus(): void;
    refreshStatus(): Promise<void>;
    /**
   * Pushes the requested changes to the SwitchBot API
   * deviceType	commandType	  Command	    command parameter	  Description
   * Plug   -    "command"     "turnOff"   "default"	  =        set to OFF state
   * Plug   -    "command"     "turnOn"    "default"	  =        set to ON state
   */
    pushChanges(): Promise<void>;
    updateHomeKitCharacteristics(): void;
    apiError(e: any): void;
    private statusCode;
    /**
     * Handle requests to set the value of the "Target Position" characteristic
     */
    OnSet(value: CharacteristicValue): void;
}
//# sourceMappingURL=plugs.d.ts.map