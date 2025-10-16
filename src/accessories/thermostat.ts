import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import type { FritzRedux } from '../platform.js';
import { Thermostat as FritzThermostat } from '../fritzbox/accessories/thermostat.js';
import { HomebridgeAccessory } from 'homebridge-lib';

export class Thermostat implements HomebridgeAccessory {
    private thermostatService: Service;
    private batteryService: Service;

    constructor(
        private readonly platform: FritzRedux,
        private readonly accessory: PlatformAccessory,
        private readonly device: FritzThermostat,
    ) {
        //const device: FritzThermostat = <FritzThermostat>accessory.context.device;

        // Set basic accessory information
        accessory.getService(platform.Service.AccessoryInformation)!
            .setCharacteristic(platform.Characteristic.Manufacturer, device.manufacturer)
            .setCharacteristic(platform.Characteristic.Model, device.productName)
            .setCharacteristic(platform.Characteristic.SerialNumber, device.ain)
            .setCharacteristic(platform.Characteristic.FirmwareRevision, device.firmwareVersion)
        ;

        // Create thermostat service
        this.thermostatService = accessory.getService(platform.Service.Thermostat) || accessory.addService(platform.Service.Thermostat);

        // Set the service name, this is what is displayed as the default name on the Home app
        this.thermostatService.setCharacteristic(platform.Characteristic.Name, device.name);

        // Implement required characteristics
        this.thermostatService.getCharacteristic(platform.Characteristic.CurrentHeatingCoolingState)
            .setProps({
                maxValue: 1,
                minValue: 0,
                validValues: [0, 1],
            })
            .onGet(() => device.heatingCoolingState)
            .updateValue(device.heatingCoolingState)
        ;

        this.thermostatService.getCharacteristic(platform.Characteristic.TargetHeatingCoolingState)
            .setProps({
                maxValue: 1,
                minValue: 0,
                validValues: [0, 1], // OFF, HEAT
            })
            .onGet(() => device.heatingCoolingState)
            .onSet(async (value: CharacteristicValue) => {
                this.platform.log.info(`Setting target state for ${device.name} to ${value}`);
                await device.setHeatingCoolingState(<number>value);
            })
            .updateValue(device.heatingCoolingState)
        ;

        this.thermostatService.getCharacteristic(platform.Characteristic.CurrentTemperature)
            .setProps({
                minValue: 0,
                maxValue: 60,
                minStep: 0.5,
            })
            .onGet(() => device.currentTemperature)
            .updateValue(device.currentTemperature)
        ;

        this.thermostatService.getCharacteristic(platform.Characteristic.TargetTemperature)
            .setProps({
                minValue: 8,
                maxValue: 28,
                minStep: 0.5,
            })
            .onGet(() => device.targetTemperature)
            .onSet(async (value: CharacteristicValue) => {
                this.platform.log.info(`Setting target temperature for ${device.name} to ${value} °C`);
                await device.setTargetTemperature(<number>value);
            })
            .updateValue(device.targetTemperature)
        ;

        this.thermostatService.getCharacteristic(platform.Characteristic.TemperatureDisplayUnits)
            .setProps({
                minValue: 0,
                maxValue: 0,
                validValues: [0], // Celsius
            })
            .updateValue(platform.Characteristic.TemperatureDisplayUnits.CELSIUS)
        ;

        // Create battery service
        this.batteryService = accessory.getService(platform.Service.Battery) || accessory.addService(platform.Service.Battery);

        this.batteryService.getCharacteristic(platform.Characteristic.StatusLowBattery)
            .onGet(() => device.batteryStatusLow)
            .updateValue(device.batteryStatusLow)
        ;

        this.batteryService.getCharacteristic(platform.Characteristic.BatteryLevel)
            .onGet(() => device.batteryLevel)
            .updateValue(device.batteryLevel)
        ;
    }
}
