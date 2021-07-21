import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { irdevice } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class WaterHeater {
    private readonly platform;
    private accessory;
    device: irdevice;
    service: Service;
    Active: CharacteristicValue;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: irdevice);
    private ActiveSet;
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType	commandType     Command	          command parameter	         Description
     * WaterHeater:        "command"       "turnOff"         "default"	        =        set to OFF state
     * WaterHeater:        "command"       "turnOn"          "default"	        =        set to ON state
     * WaterHeater:        "command"       "volumeAdd"       "default"	        =        volume up
     * WaterHeater:        "command"       "volumeSub"       "default"	        =        volume down
     * WaterHeater:        "command"       "channelAdd"      "default"	        =        next channel
     * WaterHeater:        "command"       "channelSub"      "default"	        =        previous channel
     */
    pushWaterHeaterOnChanges(): Promise<void>;
    pushWaterHeaterOffChanges(): Promise<void>;
    pushChanges(payload: any): Promise<void>;
    private statusCode;
    apiError(e: any): void;
}
//# sourceMappingURL=waterheaters.d.ts.map