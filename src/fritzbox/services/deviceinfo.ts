import { Commands } from '../commands.js';
import type { FritzBox } from '../fritzbox.js';

class DeviceInfo extends Commands {
    private readonly serviceId = 'urn:DeviceInfo-com:serviceId:DeviceInfo1';

    /**
   * @link https://avm.de/fileadmin/user_upload/Global/Service/Schnittstellen/deviceinfoSCPD.pdf
   */
    constructor(private fritzbox: FritzBox) {
        super();
    }

    public async getInfo() {
        await this.fritzbox.init();
        return this.exec<Info>(this.serviceId, 'GetInfo', this.fritzbox.services);
    }

    public async getSecurityPort() {
        return this.exec<SecurityPort>(
            this.serviceId,
            'GetSecurityPort',
            this.fritzbox.services,
        );
    }
}

interface SecurityPort {
    NewSecurityPort: string;
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

export { DeviceInfo };
export type { SecurityPort, Info };
