import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { FritzBox } from './fritzbox/fritzbox.js';

export class FritzRedux implements DynamicPlatformPlugin {
    public readonly Service: typeof Service;
    public readonly Characteristic: typeof Characteristic;

    // track restored cached accessories
    public readonly accessories: Map<string, PlatformAccessory> = new Map();
    public readonly discoveredCacheUUIDs: string[] = [];

    private readonly fritzbox: FritzBox;

    constructor(
        public readonly log: Logging,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;

        this.fritzbox = new FritzBox({
            host: config.host,
            username: config.username,
            password: config.password,
        });

        this.log.debug('Finished initializing:', this.config.name);
        this.api.on('didFinishLaunching', async () => await this.discoverDevices());
    }

    /**
     * This function is invoked when homebridge restores cached accessories from disk at startup.
     * It should be used to set up event handlers for characteristics and update respective values.
     */
    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);

        // add the restored accessory to the accessories cache, so we can track if it has already been registered
        this.accessories.set(accessory.UUID, accessory);
    }

    /**
     * Register discovered accessories.
     */
    async discoverDevices() {
        this.log.info('Discovering FRITZ! devices…');
        const devices = await this.fritzbox.smartHome.getDevices(this.config);

        // loop over the discovered devices and register each one if it has not already been registered
        for (const device of devices) {
            // This device should be ignored
            if (Array.isArray(this.config.ignoredAccessories) && device.ain in this.config.ignoredAccessories) {
                continue;
            }

            const uuid = this.api.hap.uuid.generate(device.ain);

            // see if an accessory with the same uuid has already been registered and restored from
            // the cached devices we stored in the `configureAccessory` method above
            const existingAccessory = this.accessories.get(uuid);

            if (existingAccessory) {
                this.log.info('Restoring accessory from cache:', existingAccessory.displayName);

                //existingAccessory.context.device = device;
                this.api.updatePlatformAccessories([existingAccessory]);

                // equals: new Thermostat(this, existingAccessory);
                device.createHomebridgeAccessoryHandler(this, existingAccessory);

            } else {
                this.log.info('Adding new accessory:', device.name);

                const accessory = new this.api.platformAccessory(device.name, uuid);
                //accessory.context.device = device;

                // equals: new Thermostat(this, existingAccessory);
                device.createHomebridgeAccessoryHandler(this, accessory);

                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }

            // push into discoveredCacheUUIDs
            this.discoveredCacheUUIDs.push(uuid);
        }

        // you can also deal with accessories from the cache which are no longer present by removing them from Homebridge
        // for example, if your plugin logs into a cloud account to retrieve a device list, and a user has previously removed a device
        // from this cloud account, then this device will no longer be present in the device list but will still be in the Homebridge cache
        for (const [uuid, accessory] of this.accessories) {
            if (!this.discoveredCacheUUIDs.includes(uuid)) {
                this.log.info('Removing accessory from cache:', accessory.displayName);
                this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
        }

        // Periodically update device info: every minute
        setInterval(async () => {
            await this.fritzbox.smartHome.getDevices(this.config);
        }, 60 * 1000);
    }
}
