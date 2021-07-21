import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { irdevice, deviceStatusResponse } from '../settings';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export declare class TV {
    private readonly platform;
    private accessory;
    device: irdevice;
    service: Service;
    speakerService: Service;
    Active: CharacteristicValue;
    ActiveIdentifier: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: irdevice);
    private VolumeSelectorSet;
    private RemoteKeySet;
    private ActiveIdentifierSet;
    private ActiveSet;
    /**
     * Pushes the requested changes to the SwitchBot API
     * deviceType	commandType     Command	          command parameter	         Description
     * TV:        "command"       "turnOff"         "default"	        =        set to OFF state
     * TV:        "command"       "turnOn"          "default"	        =        set to ON state
     * TV:        "command"       "volumeAdd"       "default"	        =        volume up
     * TV:        "command"       "volumeSub"       "default"	        =        volume down
     * TV:        "command"       "channelAdd"      "default"	        =        next channel
     * TV:        "command"       "channelSub"      "default"	        =        previous channel
     */
    pushTvOnChanges(): Promise<void>;
    pushTvOffChanges(): Promise<void>;
    pushOkChanges(): Promise<void>;
    pushBackChanges(): Promise<void>;
    pushMenuChanges(): Promise<void>;
    pushUpChanges(): Promise<void>;
    pushDownChanges(): Promise<void>;
    pushRightChanges(): Promise<void>;
    pushLeftChanges(): Promise<void>;
    pushVolumeUpChanges(): Promise<void>;
    pushVolumeDownChanges(): Promise<void>;
    pushTVChanges(payload: any): Promise<void>;
    private statusCode;
    apiError(e: any): void;
}
//# sourceMappingURL=tvs.d.ts.map