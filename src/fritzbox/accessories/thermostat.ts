import type { HomebridgeAccessory } from 'fritz-light';
import type { FritzBox } from '../fritzbox.js';
import { Thermostat as HomebridgeThermostat } from '../../accessories/thermostat.js';
import type { PlatformAccessory } from 'homebridge';
import type { FritzLight } from '../../platform.js';
import { objectsEqualShallow } from '../../utils/utils.js';
import { FritzAccessory } from '../smarthome.js';

type ThermostatState = {
    name: string;
    firmwareVersion: string;
    currentTemperature: number;
    targetTemperature: number;
    batteryLevel: number;
}

export class Thermostat implements FritzAccessory {
    private previousTemperature: number = 19;

    constructor(
        private fritzbox: FritzBox,
        public ain: string,
        public manufacturer: string,
        public productName: string,
        private _state: ThermostatState,
    ) {
        if (_state.targetTemperature < 253) {
            this.previousTemperature = _state.targetTemperature;
        }
    }

    createHomebridgeAccessoryHandler(platform: FritzLight, accessory: PlatformAccessory): HomebridgeAccessory {
        return new HomebridgeThermostat(platform, accessory, this);
    }

    set state(state: ThermostatState) {
        // Nothing changed
        if (objectsEqualShallow(state, this._state)) {
            return;
        }

        this._state = state;
        if (state.targetTemperature < 253) {
            this.previousTemperature = state.targetTemperature;
        }
    }

    get name() {
        return this._state.name;
    }

    get firmwareVersion() {
        return this._state.firmwareVersion;
    }

    get currentTemperature() {
        return this._state.currentTemperature;
    }

    get targetTemperature(): number {
        return (this._state.targetTemperature < 253)
            ? this._state.targetTemperature
            : this.previousTemperature
        ;
    }

    async setTargetTemperature(targetTemperature: number) {
        const param = (targetTemperature === 253 || targetTemperature === 254)
            ? targetTemperature // OFF or Boost
            : Math.min(Math.max(targetTemperature * 2, 16), 56) // Valid range is from 16 (8°C) to 56 (28°C)
        ;
        const url = `webservices/homeautoswitch.lua?switchcmd=sethkrtsoll&ain=${this.ain}&param=${param}`;
        await this.fritzbox.getAHA(url);
        if (targetTemperature < 253) {
            this._state.targetTemperature = targetTemperature;
        }
    }

    get heatingCoolingState() {
        return this._state.targetTemperature === 253
            ? 0 // Characteristic.CurrentHeatingCoolingState.OFF
            : 1 // Characteristic.CurrentHeatingCoolingState.HEAT
        ;
    }

    async setHeatingCoolingState(state: number) {
        if (state === 0) {
            // Characteristic.CurrentHeatingCoolingState.OFF
            this.previousTemperature = this._state.targetTemperature;

            // 253 = OFF
            // 254 = ON (Boost)
            await this.setTargetTemperature(253);

        } else {
            // Characteristic.CurrentHeatingCoolingState.HEAT or any of the other (invalid) values
            await this.setTargetTemperature(this.previousTemperature);
        }
    }

    get batteryLevel() {
        return this._state.batteryLevel;
    }

    get batteryStatusLow() {
        return this._state.batteryLevel < 5
            ? 1 // Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : 0 // Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
        ;
    }
}
