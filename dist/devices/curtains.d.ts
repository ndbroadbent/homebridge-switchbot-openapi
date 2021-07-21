/// <reference types="node" />
import { PlatformAccessory, CharacteristicValue } from 'homebridge';
import { SwitchBotPlatform } from '../platform';
import { device, deviceStatusResponse } from '../settings';
export declare class Curtain {
    private readonly platform;
    private accessory;
    device: device;
    private service;
    CurrentPosition: CharacteristicValue;
    PositionState: CharacteristicValue;
    TargetPosition: CharacteristicValue;
    deviceStatus: deviceStatusResponse;
    setNewTarget: boolean;
    setNewTargetTimer: NodeJS.Timeout;
    curtainUpdateInProgress: boolean;
    doCurtainUpdate: any;
    constructor(platform: SwitchBotPlatform, accessory: PlatformAccessory, device: device);
    parseStatus(): void;
    refreshStatus(): Promise<void>;
    pushChanges(): Promise<void>;
    updateHomeKitCharacteristics(): void;
    apiError(e: any): void;
    private statusCode;
    /**
     * Handle requests to set the value of the "Target Position" characteristic
     */
    TargetPositionSet(value: CharacteristicValue): void;
    setMinMax(): void;
}
//# sourceMappingURL=curtains.d.ts.map