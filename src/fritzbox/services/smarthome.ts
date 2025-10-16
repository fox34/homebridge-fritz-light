import type { FritzBox } from '../fritzbox.js';
import { XMLClient } from '../xml.client.js';
import { Template } from '../accessories/template.js';
import { Thermostat } from '../accessories/thermostat.js';
import { HomebridgeAccessory } from 'homebridge-lib';
import type { PlatformAccessory } from 'homebridge';
import type { FritzRedux } from '../../platform.js';
import { PlatformConfig } from 'homebridge';

class SmartHome {
    private devices: Map<string, Device & (Template | Thermostat)> = new Map();

    /**
     * @link https://avm.de/fileadmin/user_upload/Global/Service/Schnittstellen/deviceinfoSCPD.pdf
     */
    constructor(private fritzbox: FritzBox) {}

    public async getDevices(config: PlatformConfig): Promise<(Device & (Template | Thermostat))[]> {
        await this.fritzbox.init();
        const sid = await this.fritzbox.getSid();

        // Devices
        let url = `${this.fritzbox.url.protocol}//${this.fritzbox.url.hostname}/webservices/homeautoswitch.lua?switchcmd=getdevicelistinfos&sid=${sid}`;
        const deviceResponse = await new XMLClient().requestXML<DeviceResponse>(url);

        // Just a single device
        if (!Array.isArray(deviceResponse.devicelist.device)) {
            deviceResponse.devicelist.device = [deviceResponse.devicelist.device];
        }

        let templateResponse: TemplateResponse;
        if (config.exposeTemplates) {

            // Templates
            url = `${this.fritzbox.url.protocol}//${this.fritzbox.url.hostname}/webservices/homeautoswitch.lua?switchcmd=gettemplatelistinfos&sid=${sid}`;
            templateResponse = await new XMLClient().requestXML<TemplateResponse>(url);

            // Just a single template
            if (!Array.isArray(templateResponse.templatelist.template)) {
                templateResponse.templatelist.template = [templateResponse.templatelist.template];
            }
        } else {
            templateResponse = { 'templatelist': { 'template': [], '@_version': '0' } };
        }

        return [
            ...deviceResponse.devicelist.device
                .filter(device => this.getDeviceType(device) !== undefined)
                .map(device => this.getDeviceFromApi(device)),

            ...templateResponse.templatelist.template
                .map(template => this.getTemplate(template)),
        ];
    }

    private getDeviceFromApi(device: ApiDevice): Device & Thermostat {
        // Nothing else implemented yet
        //switch (this.getDeviceType(device)) { ... }
        return this.getThermostat(device);
    }

    private getTemplate(apiTemplate: ApiTemplate): Template {
        let template: Template;
        if (this.devices.has(apiTemplate['@_identifier'])) {
            template = <Template>this.devices.get(apiTemplate['@_identifier']);
        } else {
            template = new Template(
                this.fritzbox,
                apiTemplate['@_identifier'],
                apiTemplate.name,
            );
            this.devices.set(template.ain, template);
        }
        return template;
    }

    private getThermostat(device: ApiDevice): Thermostat {
        if (!device.hkr) {
            throw new Error(`Missing property 'hkr' for thermostat with identifier ${device['@_identifier']}`);
        }

        const state = {
            name: device.name,
            firmwareVersion: device['@_fwversion'],
            currentTemperature: device.hkr.tist / 2,
            targetTemperature: device.hkr.tsoll >= 253
                ? device.hkr.tsoll
                : device.hkr.tsoll / 2,
            batteryLevel: device.battery || 100,
        };

        let thermostat: Thermostat;
        if (this.devices.has(device['@_identifier'])) {
            // Update device state
            thermostat = <Thermostat>this.devices.get(device['@_identifier']);
            thermostat.state = state;

        } else {
            thermostat = new Thermostat(
                this.fritzbox,
                device['@_identifier'],
                device['@_manufacturer'],
                device['@_productname'],
                state,
            );
            this.devices.set(thermostat.ain, thermostat);
        }
        return thermostat;
    }

    private getDeviceType(device: ApiDevice): DeviceType | undefined {
        if ((device['@_functionbitmask'] & FunctionBitmask.Hkr) > 0 && device.hkr) {
            return DeviceType.Thermostat;
        }

        // Not implemented
        return undefined;
    }
}

// https://github.com/foxthefox/ioBroker.fritzdect/blob/master/docs/de/functionbitmask.md
enum FunctionBitmask {
    // HanFun     = 1 << 0,     // "Hanfun device"?
    // _unused_   = 1 << 1,
    Lamp        = 1 << 2,   // e.g. FRITZ!DECT 500
    Button      = 1 << 3,   // Only third-party buttons
    Alert       = 1 << 4,   // e.g. Window Contact, DECT 350, Rollotron
    AVMButton   = 1 << 5,   // e.g. FRITZ!DECT 400 / 440
    Hkr         = 1 << 6,   // "Heizkörperregler", e.g. FRITZ!DECT 300 / 301 / 302
    Energy      = 1 << 7,   // e.g. FRITZ!DECT 200 / 250 / Powerline 546E
    Temperature = 1 << 8,   // e.g. FRITZ!DECT 100 / 200 / 300
    Outlet      = 1 << 9,   // e.g. FRITZ!DECT 200
    // Repeater    = 1 << 10,  // e.g. FRITZ!DECT 100, Repeater
    // Microphone  = 1 << 11,
    Group       = 1 << 12,
    // HanFunUnit = 1 << 13,
    // _unused_   = 1 << 14,
    OnOff       = 1 << 15,
    Level       = 1 << 16,
    Color       = 1 << 17,
    Blind       = 1 << 18,
}

enum DeviceType {
    Thermostat = 'thermostat',
}

// XML/AHA-API: Devices
interface DeviceResponse {
    devicelist: DeviceList;
}
interface DeviceList {
    device: ApiDevice[];
    '@_version': string;
    '@_fwversion': string;
}
interface ApiDevice {
    '@_identifier': string;
    '@_id': string;
    '@_functionbitmask': number;
    '@_fwversion': string;
    '@_manufacturer': string;
    '@_productname': string;
    present: number;
    txbusy: number;
    name: string;
    battery?: number;
    batterylow?: number;
    temperature?: {
        celsius: number;
        offset: number;
    };
    // "Heizkörperregler"
    hkr?: {
        tist: number;       // Isttemperatur in 0,5 °C, Wertebereich: 0x0 – 0x64
        tsoll: number;      // Solltemperatur in 0,5 °C, Wertebereich: 0x10 – 0x38
        komfort: number;    // Komforttemperatur in 0,5 °C, Wertebereich: 0x10 – 0x38
        absenk: number;     // Absenktemperatur in 0,5 °C, Wertebereich: 0x10 – 0x38
        lock: number;
        devicelock: number;
        errorcode: number;
        windowopenactiv: number;
        windowopenactiveendtime: number;
        boostactive: number;
        boostactiveendtime: number;
        batterylow: number;
        battery: number;
        nextchange: {
            endperiod: number,
            tchange: number,
        };
        summeractive: number;
        holidayactive: number;
        adaptiveHeatingActive: number;
        adaptiveHeatingRunning: number;
    };
    switch?: {
        state: number;
        mode: 'auto' | 'manuell';
        lock: number;
        devicelock: number;
    };
    simpleonoff?: {
        state: number;
    }
    powermeter?: {
        voltage: number;
        power: number;
        energy: number;
    };
    etsiunitinfo?: {
        etsideviceid: number;
        unittype: number;
        interfaces: number;
    };
    alert?: {
        state: number;
        lastalertchgtimestamp: number;
    };
    humidity?: {
        rel_humidity: number
    };
    //button: unknown | unknown[]; // ?
    levelcontrol?: {
        level: number;
        levelpercentage: number;
    };
}

// XML/AHA-API: Templates
interface TemplateResponse {
    templatelist: Templatelist;
}
interface Templatelist {
    template: ApiTemplate[];
    '@_version': string;
}
interface ApiTemplate {
    '@_identifier': string;
    '@_id': string;
    '@_functionbitmask': number;
    '@_autocreate': string;
    '@_applymask': string;
    name: string;
    metadata: string;
    devices: {
        device: ApiTemplateDevice[];
    };
    triggers: string;
    sub_templates: string;
    applymask: {
        hkr_summer: boolean;
        hkr_holidays: boolean;
        hkr_time_table: boolean;
    }
}
interface ApiTemplateDevice {
    '@_identifier': string;
}

// Homebridge device structure
interface Device {
    ain: string;
    manufacturer: string;
    productName: string;

    createHomebridgeAccessoryHandler(platform: FritzRedux, accessory: PlatformAccessory): HomebridgeAccessory;
}

export { SmartHome, DeviceType };
export type { Device };
