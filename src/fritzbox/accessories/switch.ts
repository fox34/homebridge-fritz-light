import type { HomebridgeAccessory } from 'fritz-light';
import type { FritzBox } from '../fritzbox.js';
import { Switch as HomebridgeSwitch } from '../../accessories/switch.js';
import type { PlatformAccessory } from 'homebridge';
import type { FritzLight } from '../../platform.js';
import { objectsEqualShallow } from '../../utils/utils.js';
import { FritzAccessory } from '../smarthome.js';

type SwitchState = {
    name: string;
    firmwareVersion: string;
    on: boolean;
    currentTemperature: number | undefined;
}

export class Switch implements FritzAccessory {
    constructor(
        private fritzbox: FritzBox,
        public ain: string,
        public manufacturer: string,
        public productName: string,
        private _state: SwitchState,
    ) {
    }

    createHomebridgeAccessoryHandler(platform: FritzLight, accessory: PlatformAccessory): HomebridgeAccessory {
        return new HomebridgeSwitch(platform, accessory, this);
    }

    set state(state: SwitchState) {
        // Nothing changed
        if (objectsEqualShallow(state, this._state)) {
            return;
        }

        this._state = state;
    }

    get name() {
        return this._state.name;
    }

    get firmwareVersion() {
        return this._state.firmwareVersion;
    }

    get on() {
        return this._state.on;
    }

    async setState(on: boolean) {
        const url = `webservices/homeautoswitch.lua?switchcmd=setswitch${on ? 'on' : 'off'}&ain=${this.ain}`;
        await this.fritzbox.getAHA(url);
    }

    get currentTemperature(): number | undefined {
        return this._state.currentTemperature;
    }
}
