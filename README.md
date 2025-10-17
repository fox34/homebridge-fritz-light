<p align="center">
  <img src="images/logo.png" height="175" alt="Homebridge FRITZ! Logo">
</p>

# homebridge-fritz-light

[![GitHub last commit](https://img.shields.io/github/last-commit/fox34/homebridge-fritz-light.svg?style=flat-square)](https://github.com/fox34/homebridge-fritz-light)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square&maxAge=2592000)](https://paypal.me/stefanovanmansiere)

---

## Motivation

Development of the popular [`homebridge-fritz-platform`](https://github.com/seydx/homebridge-fritz-platform) has stalled.  
The main goal of this project is to **maintain compatibility** with modern Homebridge and FRITZ!Box firmware versions, allowing users to control key smart home functions from within HomeKit.

This plugin currently focuses on **stability and simplicity** rather than feature completeness. It provides the essential functionality needed for daily use, but it is **currently no full replacement** for the original plugin or a competitor to more comprehensive solutions such as Home Assistant integrations.

---

## Scope

Currently, this plugin supports the following devices and actions within the **FRITZ!** ecosystem:

| Device                                    | Supported actions                                                                               |
|-------------------------------------------|-------------------------------------------------------------------------------------------------|
| **Thermostats**<br>(e.g. FRITZ!DECT 301)  | - Power toggle<br>- Change target temperature<br>- Temperature reporting<br>- Recall templates  |

> Other FRITZ! SmartHome devices (e.g., plugs or lights) are not yet supported.  
> Contributions are welcome if you wish to extend functionality.
> See below for further information.

---

## Configuration

You need access to a FRITZ!Box on your local network.

### 1. Enable Application Access

In your FRITZ!Box settings, enable access for local applications:  
[AVM Help Article → Allow access for applications](https://fritzhelp.avm.de/help/en/FRITZ-Box-4050/avm/024p1/hilfe_netzwerk_freigabe_apps)

- ✅ Allow access for applications
- ✅ Transmit status information via UPnP

![Enable TR-064](images/settings-tr064.png)

### 2. Create a Dedicated User

Create a FRITZ!Box user account with full permissions for home network access:  
[AVM Help Article → Create user account](https://fritzhelp.avm.de/help/en/FRITZ-Box-4050/avm/024p1/hilfe_system_userkonto)

![User permissions](images/settings-permissions.jpg)

### 3. Configure in Homebridge

You can add this plugin either via the Homebridge UI or by editing your `config.json` manually.

Example configuration:

```json
{
  "platforms": [
    {
      "name": "FRITZ! Light",
      "host": "10.9.4.1",
      "username": "homebridge",
      "password": "_example_password_change_me_",
      "exposeTemplates": true,
      "templatePrefix": "Vorlage:",
      "platform": "FritzLight"
    }
  ]
}
```

---

## Technical Background

This plugin communicates directly with the FRITZ!Box using AVM’s official local interfaces:

- **TR-064 protocol**: Currently only used to authenticate with the FRITZ!Box.
- **AHA (AVM Home Automation) interface**: Provides access to smart home device lists and features such as thermostats, power outlets, and sensors.

All communication happens **locally** within your home network; no data is transmitted to external servers.

---

## Limitations and Future Development

This plugin currently supports only thermostats and a template recall functionality.
As I no longer own other FRITZ! SmartHome devices, I am **not planning further feature development**.

However, contributions are very welcome!
If you wish to extend support for additional FRITZ! devices (e.g., plugs, switches, sensors), please fork the repository and open a pull request.

Some examples of possible devices and features are:

| Device                                    | Supported actions                                                                            |
|-------------------------------------------|----------------------------------------------------------------------------------------------|
| **FRITZ!Box**, FRITZ!Repeater             | - Toggle guest WLAN                                                                          |
| **Buttons**<br>(e.g. FRITZ!DECT 400, 440) | - Temperature and humidity reporting<br>- *Note*: Button presses cannot be detected reliably |
| **Lights**<br>(e.g. FRITZ!DECT 500)       | - Power toggle<br>- Change brightness / color<br>- Support for adaptive lighting             |
| **Outlets**<br>(e.g. FRITZ!DECT 200)      | - Power toggle<br>- Temperature reporting                                                    |
| **Sensors**<br>(e.g. FRITZ!DECT 350)      | - Window state reporting                                                                     |

---

## Credits

- Original [`homebridge-fritz-platform`](https://github.com/seydx/homebridge-fritz-platform) by [SeydX](https://github.com/seydx).
- FRITZ!Box communication is based loosely on the [`fritzbox`](https://github.com/lukesthl/fritzbox) TypeScript library by **lukesthl**.

All product and company names are trademarks™ or registered® trademarks of their respective holders.  
Use of them does not imply any affiliation with or endorsement by them.
