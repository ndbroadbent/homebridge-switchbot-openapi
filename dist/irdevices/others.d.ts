import { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { irdevice } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class Others {
    private readonly platform;
    private accessory;
    device: irdevice;
    private service?;
    Active: CharacteristicValue;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: irdevice);
    private ActiveSet;
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType	commandType     Command	          command parameter	         Description
     * Light:        "command"       "turnOff"         "default"	        =        set to OFF state
     * Light:        "command"       "turnOn"          "default"	        =        set to ON state
     * Light:        "command"       "volumeAdd"       "default"	        =        volume up
     * Light:        "command"       "volumeSub"       "default"	        =        volume down
     * Light:        "command"       "channelAdd"      "default"	        =        next channel
     * Light:        "command"       "channelSub"      "default"	        =        previous channel
     */
    pushOnChanges(): Promise<void>;
    pushOffChanges(): Promise<void>;
    pushChanges(payload: any): Promise<void>;
    private statusCode;
    apiError(e: any): void;
}
//# sourceMappingURL=others.d.ts.map