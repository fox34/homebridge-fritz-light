import type { IDevice } from './device.js';
import { Service } from './service.js';
import { DeviceConfig } from './services/deviceconfig.js';
import { DeviceInfo } from './services/deviceinfo.js';
import { SmartHome } from './services/smarthome.js';
import type { ITr64Desc } from './tr64desc.js';
import { Tr64Desc } from './tr64desc.js';
import { XMLClient } from './xml.client.js';

interface IOptions {
    host: string;
    port: number;
    username?: string;
    password?: string;
}

class FritzBox {
    public deviceInfo = new DeviceInfo(this);
    public smartHome = new SmartHome(this);
    public deviceConfig = new DeviceConfig(this);

    private initialized = false;
    public readonly url: URL;
    private readonly options: IOptions;

    public services = new Map<string, Service>();

    private readonly xmlClient: XMLClient;
    private sid?: string;
    private lastSidGeneration: Date | null = null;

    constructor(options?: Partial<IOptions>) {
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
        await this.parseDesc('/tr64desc.xml');

        // TLS is required for some (which?) smart home actions
        const port = (await this.deviceInfo.getSecurityPort()).NewSecurityPort;
        this.url.protocol = 'https:';
        this.url.port = port;

        this.initialized = true;
    }

    private async parseDesc(url: string): Promise<void> {
        const requestUrl = new URL(url, this.url.toString()).toString();
        const result = await this.xmlClient.requestXML<{ root: ITr64Desc }>(
            requestUrl,
        );
        if (result) {
            const tr64desc = new Tr64Desc(result.root);
            this.initServicesByDevice(tr64desc.device);
        }
    }

    private initServicesByDevice(device: IDevice): void {
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
        const response = await this.deviceConfig.getUrlSID();
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

export { FritzBox, IOptions };
