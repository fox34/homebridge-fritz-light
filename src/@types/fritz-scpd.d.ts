declare module 'fritz-scpd' {

    import { SpecVersion } from 'fritz-tr64';

    /**
     * Various services listed in /tr64desc.xml, see e.g.:
     * @link http://fritz.box:49000/deviceinfoSCPD.xml
     * @link http://fritz.box:49000/deviceconfigSCPD.xml
     * @link http://fritz.box:49000/x_homeautoSCPD.xml
     */
    export interface SCPD {
        specVersion: SpecVersion;
        actionList: {
            action: Action[];
        };
        serviceStateTable: {
            stateVariable: StateVariable[];
        };
        _xmlns: string;
    }

    interface Action {
        name: string;
        argumentList: ArgumentList;
    }

    interface ArgumentList {
        argument: ArgumentElement[] | ArgumentElement;
    }

    interface ArgumentElement {
        name: string;
        direction: 'in' | 'out';
        relatedStateVariable: string;
    }

    interface StateVariable {
        name: string;
        dataType: 'string' | 'ui2' | 'ui4' | 'i2' | 'i4' | 'boolean' | 'dateTime';
        defaultValue?: string;
        allowedValueList?: AllowedValue[];
        _sendEvents: 'yes' | 'no';
    }

    interface AllowedValue {
        allowedValue: string;
    }

    // DeviceInfo
    export interface DeviceInfo {
        NewManufacturerName: string;
        NewManufacturerOUI: string;
        NewModelName: string;
        NewDescription: string;
        NewProductClass: string;
        NewSerialNumber: string;
        NewSoftwareVersion: string;
        NewHardwareVersion: string;
        NewSpecVersion: string;
        NewProvisioningCode: string;
        NewUpTime: number;
        NewDeviceLog: string;
    }

    export interface SecurityPort {
        NewSecurityPort: number;
    }

    export interface UrlSID {
        'NewX_AVM-DE_UrlSID': string;
    }
}
