import type { HomebridgeAccessory } from 'fritz-light';
import type { FritzBox } from '../fritzbox.js';
import { Template as HomebridgeTemplate } from '../../accessories/template.js';
import type { PlatformAccessory } from 'homebridge';
import type { FritzLight } from '../../platform.js';
import { FritzAccessory } from '../smarthome.js';

export class Template implements FritzAccessory {
    public manufacturer: string = 'AVM';
    public productName: string = 'Template';

    constructor(
        private fritzbox: FritzBox,
        public ain: string,
        public name: string,
    ) {
    }

    createHomebridgeAccessoryHandler(platform: FritzLight, accessory: PlatformAccessory): HomebridgeAccessory {
        return new HomebridgeTemplate(platform, accessory, this);
    }

    async activate() {
        const url = `webservices/homeautoswitch.lua?switchcmd=applytemplate&ain=${this.ain}`;
        await this.fritzbox.getAHA(url);
    }
}
