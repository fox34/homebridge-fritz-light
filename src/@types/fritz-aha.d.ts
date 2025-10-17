declare module 'fritz-aha' {

    /**
     * AVM Home Automation (AHA) HTTP Interface
     * @link https://fritz.support/resources/AHA-HTTP-Interface.pdf
     */
    export interface DeviceResponse {
        devicelist: {
            device: Device[] | Device;
            '@_version': string;
            '@_fwversion': string;
        };
    }

    export interface Device {
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

    export interface TemplateResponse {
        templatelist: {
            template: Template[] | Template;
            '@_version': string;
        };
    }

    export interface Template {
        '@_identifier': string;
        '@_id': string;
        '@_functionbitmask': number;
        '@_autocreate': string;
        '@_applymask': string;
        name: string;
        metadata: string;
        devices: {
            device: TemplateDevice[];
        };
        triggers: string;
        sub_templates: string;
        applymask: {
            hkr_summer: boolean;
            hkr_holidays: boolean;
            hkr_time_table: boolean;
        }
    }

    interface TemplateDevice {
        '@_identifier': string;
    }
}
