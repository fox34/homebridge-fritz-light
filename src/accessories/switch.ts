import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import type { FritzLight } from '../platform.js';
import { Switch as FritzSwitch } from '../fritzbox/accessories/switch.js';
import { HomebridgeAccessory } from 'fritz-light';

export class Switch implements HomebridgeAccessory {
    constructor(platform: FritzLight, accessory: PlatformAccessory, device: FritzSwitch) {

        // Set basic accessory information
        accessory.getService(platform.Service.AccessoryInformation)!
            .setCharacteristic(platform.Characteristic.Manufacturer, device.manufacturer)
            .setCharacteristic(platform.Characteristic.Model, device.productName)
            .setCharacteristic(platform.Characteristic.SerialNumber, device.ain)
            .setCharacteristic(platform.Characteristic.FirmwareRevision, device.firmwareVersion)
        ;

        // Create switch service
        const switchService = accessory.getService(platform.Service.Switch) || accessory.addService(platform.Service.Switch);

        // Set the service name, this is what is displayed as the default name on the Home app
        switchService.setCharacteristic(platform.Characteristic.Name, device.name);

        // Implement required characteristics
        switchService.getCharacteristic(platform.Characteristic.On)
            .onGet(() => device.on)
            .onSet(async (value: CharacteristicValue) => {
                platform.log.info(`Setting target state for ${device.name} to ${value}`);
                await device.setState(<boolean>value);
            })
            .updateValue(device.on)
        ;

        // Optional: temperature sensor
        if (device.currentTemperature !== undefined) {
            const temperatureSensorService = accessory.getService(platform.Service.TemperatureSensor) ||
                accessory.addService(platform.Service.TemperatureSensor);

            temperatureSensorService.setCharacteristic(platform.Characteristic.Name, `${device.name} Temperature`);
            temperatureSensorService.getCharacteristic(platform.Characteristic.CurrentTemperature)
                .onGet(() => <number>device.currentTemperature)
                .updateValue(<number>device.currentTemperature)
            ;
        }
    }
}
