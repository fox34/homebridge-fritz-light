import type { FritzBoxConnectionOptions } from 'fritz-redux';
import type { Device, TR64Desc } from 'fritz-tr64';
import { Service, TR64 } from './tr64.js';
import { DeviceInfo } from './deviceinfo.js';
import { SmartHome } from './smarthome.js';
import { XMLClient } from './XMLClient.js';

class FritzBox {
    public deviceInfo = new DeviceInfo(this);
    public smartHome = new SmartHome(this);

    private initialized = false;
    public readonly url: URL;
    private readonly options: FritzBoxConnectionOptions;

    public services = new Map<string, Service>();

    public readonly xmlClient: XMLClient;
    private sid?: string;
    private lastSidGeneration: Date | null = null;

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
        const port = (await this.deviceInfo.getSecurityPort()).NewSecurityPort;
        this.url.protocol = 'https:';
        this.url.port = port;

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

    public async getSid(): Promise<string> {
        if (this.lastSidGeneration && this.sid) {
            const now = new Date();
            const diff = now.getTime() - this.lastSidGeneration.getTime();
            const ONE_HOUR = 1000 * 60 * 60;
            if (diff < ONE_HOUR) {
                return this.sid;
            }
        }
        const response = await this.deviceInfo.getUrlSID();
        const sid: string = response['NewX_AVM-DE_UrlSID']?.split('sid=')?.[1];
        if (!sid) {
            throw new Error('No SID found');
        }
        this.sid = sid;
        //console.debug({ sid }, 'SID generated');
        this.lastSidGeneration = new Date();
        return sid;
    }

    public async getAHA(action: string): Promise<string> {
        const sid = await this.getSid();
        return await this.xmlClient.request(`${this.url.protocol}//${this.url.hostname}/${action}&sid=${sid}`);
    }
}

export { FritzBox, FritzBoxConnectionOptions };
