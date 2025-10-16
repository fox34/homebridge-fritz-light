import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import type { FritzRedux } from '../platform.js';
import { Template as FritzTemplate } from '../fritzbox/accessories/template.js';
import { HomebridgeAccessory } from 'homebridge-lib';

export class Template implements HomebridgeAccessory {
    constructor(platform: FritzRedux, accessory: PlatformAccessory, device: FritzTemplate) {

        // Set basic accessory information
        accessory.getService(platform.Service.AccessoryInformation)!
            .setCharacteristic(platform.Characteristic.Manufacturer, device.manufacturer)
            .setCharacteristic(platform.Characteristic.Model, 'Template')
            .setCharacteristic(platform.Characteristic.SerialNumber, device.ain)
            .setCharacteristic(platform.Characteristic.FirmwareRevision, '1.0')
        ;

        // Create switch service
        const service = accessory.getService(platform.Service.Switch) || accessory.addService(platform.Service.Switch);
        service.setCharacteristic(platform.Characteristic.Name, `${platform.config.templatePrefix} ${device.name}`);
        service.getCharacteristic(platform.Characteristic.On)
            .onGet(() => 0)  // Template state cannot be queried
            .onSet(async (value: CharacteristicValue) => {
                if (!value) {
                    return;
                }
                platform.log.info(`Activating template '${device.name}'`);
                await device.activate();
            })
            .updateValue(0)
        ;
    }
}
