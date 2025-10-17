declare module 'fritz-tr64' {

    /**
     * @link http://fritz.box:49000/tr64desc.xml
     */
    export interface TR64Desc {
        specVersion: SpecVersion;
        systemVersion: SystemVersion;
        device: RootDevice;
        _xmlns: string;
    }

    export interface Device {
        deviceType: string;
        friendlyName: string;
        manufacturer: string;
        manufacturerURL: string;
        modelDescription: string;
        modelName: string;
        modelNumber: string;
        modelURL: string;
        UDN: string;
        serviceList: {
            service: DeviceService[];
        };
        deviceList: {
            device: Device[];
        };
    }

    export interface RootDevice extends Device {
        presentationURL: string;
        iconList: {
            icon: {
                mimetype: string;
                width: string;
                height: string;
                depth: string;
                url: string;
            };
        };
        originUDN: string;
        serialNumber: string;
    }

    export interface SpecVersion {
        major: string;
        minor: string;
    }

    export interface SystemVersion {
        HW: string;
        Major: string;
        Minor: string;
        Patch: string;
        Buildnumber: string;
        Display: string;
    }

    export interface DeviceService {
        serviceType: string;
        serviceId: string;
        controlURL: string;
        eventSubURL: string;
        SCPDURL: string;
    }
}
