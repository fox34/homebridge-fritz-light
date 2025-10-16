import { Commands } from '../commands.js';
import type { FritzBox } from '../fritzbox.js';

class DeviceConfig extends Commands {
    private readonly serviceId = 'urn:DeviceConfig-com:serviceId:DeviceConfig1';

    /**
   * @link https://avm.de/fileadmin/user_upload/Global/Service/Schnittstellen/deviceinfoSCPD.pdf
   */
    constructor(private fritzbox: FritzBox) {
        super();
    }

    public async getUrlSID() {
        await this.fritzbox.init();
        return await this.exec<UrlSIDResponse>(
            this.serviceId,
            'X_AVM-DE_CreateUrlSID',
            this.fritzbox.services,
        );
    }
}

interface UrlSIDResponse {
  'NewX_AVM-DE_UrlSID': string;
}

export { DeviceConfig };
export type { UrlSIDResponse };
