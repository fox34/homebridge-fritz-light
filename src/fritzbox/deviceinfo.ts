import type { Service } from './tr64.js';
import type { FritzBox } from './fritzbox.js';

export class DeviceInfo {
    /**
     * @link https://fritz.support/resources/TR-064_Device_Info.pdf
     */
    private readonly serviceIdDeviceInfo = 'urn:DeviceInfo-com:serviceId:DeviceInfo1';

    /**
     * @link https://fritz.support/resources/TR-064_Device_Config.pdf
     */
    private readonly serviceIdDeviceConfig = 'urn:DeviceConfig-com:serviceId:DeviceConfig1';

    constructor(private fritzbox: FritzBox) {}

    public async exec<T>(
        serviceId: string,
        actionName: string,
        services: Map<string, Service>,
        options?: unknown,
    ): Promise<T> {
        let service = services.get(serviceId);

        if (!service && serviceId.split('serviceId:')[1] === 'WLANConfiguration3') {
            serviceId = 'urn:WLANConfiguration-com:serviceId:WLANConfiguration2';
            service = services.get(serviceId);
        }

        if (!service) {
            throw new Error(`service with id ${serviceId} not known`);
        }
        return await service.exec(actionName, options);
    }

    public async getInfo() {
        await this.fritzbox.init();
        return this.exec<Info>(this.serviceIdDeviceInfo, 'GetInfo', this.fritzbox.services);
    }

    public async getSecurityPort() {
        return this.exec<SecurityPort>(
            this.serviceIdDeviceInfo,
            'GetSecurityPort',
            this.fritzbox.services,
        );
    }

    public async getUrlSID() {
        await this.fritzbox.init();
        return await this.exec<UrlSID>(
            this.serviceIdDeviceConfig,
            'X_AVM-DE_CreateUrlSID',
            this.fritzbox.services,
        );
    }
}

interface Info {
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

interface SecurityPort {
    NewSecurityPort: string;
}

interface UrlSID {
    'NewX_AVM-DE_UrlSID': string;
}
