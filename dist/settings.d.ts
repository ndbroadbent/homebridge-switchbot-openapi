import { PlatformConfig } from 'homebridge';
/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export declare const PLATFORM_NAME = "SwitchBot";
/**
 * This must match the name of your plugin as defined the package.json
 */
export declare const PLUGIN_NAME = "homebridge-switchbot-openapi";
/**
 * This is the main url used to access SwitchBot API
 */
export declare const AuthURL = "https://api.switch-bot.com";
/**
 * This is the main url used to access SwitchBot API
 */
export declare const DeviceURL = "https://api.switch-bot.com/v1.0/devices";
export interface SwitchBotPlatformConfig extends PlatformConfig {
    credentials?: credentials;
    devicediscovery?: boolean;
    options?: options | Record<string, never>;
}
export declare type credentials = {
    openToken?: any;
};
export declare type options = {
    refreshRate?: number;
    pushRate?: number;
    hide_device: string[];
    bot?: bot;
    meter?: meter;
    humidifier?: humidifier;
    curtain?: curtain;
    fan?: irfan;
    irair?: irair;
    other: other;
};
export declare type meter = {
    unit?: number;
    hide_temperature?: boolean;
    hide_humidity?: boolean;
};
export declare type bot = {
    switch?: boolean;
    device_switch?: string[];
    device_press?: string[];
};
export declare type humidifier = {
    hide_temperature?: boolean;
    set_minStep?: number;
};
export declare type curtain = {
    disable_group?: boolean;
    refreshRate?: number;
    set_max?: number;
    set_min?: number;
    set_minStep?: number;
};
export declare type irfan = {
    swing_mode?: string[];
    rotation_speed?: string[];
    set_minStep?: number;
    set_max?: number;
    set_min?: number;
};
export declare type set_minStep = {
    set_minStep_device?: string[];
    set_minStep?: number;
};
export declare type set_max = {
    set_max_device?: string[];
    set_max?: number;
};
export declare type set_min = {
    set_min_device?: string[];
    set_min?: number;
};
export declare type irair = {
    hide_automode?: boolean;
};
export declare type other = {
    deviceType?: string;
    commandOn?: string;
    commandOff?: string;
};
export interface AxiosRequestConfig {
    params?: Record<string, unknown>;
    headers?: any;
}
export declare type deviceResponses = {
    statusCode: number | string;
    message: string;
    body: deviceList | infraredRemoteList;
};
export declare type deviceList = {
    device: Array<device>;
};
export declare type device = {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    enableCloudService: boolean;
    hubDeviceId: string;
    curtainDevicesIds: Array<string>;
    calibrate: boolean;
    group: boolean;
    master: boolean;
    openDirection: string;
};
export declare type infraredRemoteList = {
    device: Array<irdevice>;
};
export declare type irdevice = {
    deviceId: string;
    deviceName: string;
    remoteType: string;
    hubDeviceId: string;
};
export declare type deviceStatusResponse = {
    statusCode: number;
    message: string;
    body: deviceStatus;
};
export declare type deviceStatus = {
    deviceId: string;
    deviceType: string;
    hubDeviceId?: string;
    power?: string;
    humidity?: number;
    temperature?: number;
    nebulizationEfficiency?: number;
    auto?: boolean;
    childLock?: boolean;
    sound?: boolean;
    calibrate?: boolean;
    group?: boolean;
    moving?: boolean;
    slidePosition?: number;
    mode?: number;
    speed?: number;
    shaking?: boolean;
    shakeCenter?: string;
    shakeRange?: string;
};
//# sourceMappingURL=settings.d.ts.map