import { HomebridgeAccessory } from 'homebridge-lib';
import type { FritzBox } from '../fritzbox.js';
import { Device } from '../services/smarthome.js';
import { Template as HomebridgeTemplate } from '../../accessories/template.js';
import type { PlatformAccessory } from 'homebridge';
import type { FritzRedux } from '../../platform.js';

export class Template implements Device {
    public manufacturer: string = 'AVM';
    public productName: string = 'Template';

    constructor(
        private fritzbox: FritzBox,
        public ain: string,
        public name: string,
    ) {
    }

    createHomebridgeAccessoryHandler(platform: FritzRedux, accessory: PlatformAccessory): HomebridgeAccessory {
        return new HomebridgeTemplate(platform, accessory, this);
    }

    async activate() {
        const url = `webservices/homeautoswitch.lua?switchcmd=applytemplate&ain=${this.ain}`;
        await this.fritzbox.getAHA(url);
    }
}
