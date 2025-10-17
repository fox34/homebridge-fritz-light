import type { FritzBoxConnectionOptions } from 'fritz-redux';
import type { DeviceInfo as SCPDDeviceInfo, SecurityPort, UrlSID } from 'fritz-scpd';
import type { Device, TR64Desc } from 'fritz-tr64';
import { Service, TR64 } from './tr64.js';
import { SmartHome } from './smarthome.js';
import { XMLClient } from './XMLClient.js';

class FritzBox {
    /**
     * @link https://fritz.support/resources/TR-064_Device_Info.pdf
     * @link https://fritz.support/resources/TR-064_Device_Config.pdf
     */
    private readonly serviceIdDeviceInfo = 'urn:DeviceInfo-com:serviceId:DeviceInfo1';
    private readonly serviceIdDeviceConfig = 'urn:DeviceConfig-com:serviceId:DeviceConfig1';

    private initialized: boolean = false;
    public readonly url: URL;
    private readonly options: FritzBoxConnectionOptions;
    private sid?: string;
    private lastSidGeneration: Date | null = null;

    public services: Map<string, Service> = new Map<string, Service>();
    public smartHome: SmartHome = new SmartHome(this);
    public readonly xmlClient: XMLClient;

    constructor(options?: Partial<FritzBoxConnectionOptions>) {
        this.options = {
            host: 'fritz.box',
            port: 49000,
            ...options,
        };
        this.url = new URL(`http://${this.options.host}:${this.options.port}`);
        this.xmlClient = new XMLClient();
    }

    public async init(): Promise<void> {
        if (this.initialized) {
            return;
        }

        // Parse TR64 description file
        const requestUrl = new URL('/tr64desc.xml', this.url.toString()).toString();
        const result = await this.xmlClient.requestXML<{ root: TR64Desc }>(
            requestUrl,
        );
        const tr64desc = new TR64(result.root);
        this.initServicesByDevice(tr64desc.device);

        /**
         * TLS is required for some (which?) actions:
         *
         * 4.2.1 Remark
         * In the [TR064] specification, SSL encryption is recommended only for some SOAP
         * actions. The support for access over an encrypted HTTPS link is not specified in details.
         * Therefore AVM decided to use the explained action GetSecurityPort
         * @link https://fritz.support/resources/TR-064_First_Steps.pdf
         */
        this.url.port = (await this.getSecurityPort()).toString();
        this.url.protocol = 'https:';

        this.initialized = true;
    }

    private initServicesByDevice(device: Device): void {
        if (device.serviceList && !Array.isArray(device.serviceList.service)) {
            device.serviceList.service = [device.serviceList.service];
        }
        device.serviceList?.service.forEach(service => {
            this.services.set(
                service.serviceId,
                new Service(service, this.url, this.options),
            );
        });
        if (device.deviceList?.device && device.deviceList.device.length > 0) {
            device.deviceList.device.forEach(device => {
                if (device.serviceList) {
                    this.initServicesByDevice(device);
                }
            });
        }
    }

    /**
     * Query TR-064 service interface
     */
    private async exec<T>(serviceId: string, actionName: string, options?: unknown): Promise<T> {
        if (!this.services.has(serviceId)) {
            throw new Error(`service with id ${serviceId} not known`);
        }
        return await (<Service>this.services.get(serviceId)).exec(actionName, options);
    }

    private async getSecurityPort(): Promise<number> {
        await this.init();
        const securityPort: SecurityPort = await this.exec<SecurityPort>(this.serviceIdDeviceInfo, 'GetSecurityPort');
        return securityPort.NewSecurityPort;
    }

    public async getDeviceInfo(): Promise<SCPDDeviceInfo> {
        await this.init();
        return this.exec<SCPDDeviceInfo>(this.serviceIdDeviceInfo, 'GetInfo');
    }

    /**
     * Refresh and get access token (SID)
     */
    public async getSid(): Promise<string> {
        await this.init();

        if (this.lastSidGeneration && this.sid) {
            const now = new Date();
            const diff = now.getTime() - this.lastSidGeneration.getTime();
            const ONE_HOUR = 1000 * 60 * 60;
            if (diff < ONE_HOUR) {
                return this.sid;
            }
        }

        const response: UrlSID = await this.exec<UrlSID>(this.serviceIdDeviceConfig, 'X_AVM-DE_CreateUrlSID');
        const sid: string = response['NewX_AVM-DE_UrlSID']?.split('sid=')?.[1];

        if (!sid) {
            throw new Error('No SID found');
        }

        this.sid = sid;
        this.lastSidGeneration = new Date();
        return sid;
    }

    public async getAHA(action: string): Promise<string> {
        const sid = await this.getSid();
        return await this.xmlClient.request(`${this.url.protocol}//${this.url.hostname}/${action}&sid=${sid}`);
    }
}

export { FritzBox, FritzBoxConnectionOptions };
