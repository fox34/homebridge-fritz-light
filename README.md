<p align="center">
    <img src="images/logo.png" height="175" alt="Homebridge FRITZ! Logo">
</p>

# homebridge-fritz-redux

[![GitHub last commit](https://img.shields.io/github/last-commit/fox34/homebridge-fritz-redux.svg?style=flat-square)](https://github.com/fox34/homebridge-fritz-redux)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square&maxAge=2592000)](https://paypal.me/stefanovanmansiere)


## Introduction

This is built upon the popular plugin initially developed by [SeydX](https://github.com/seydx/homebridge-fritz-platform).
The main goal of this project is to **maintain compatibility** with modern Homebridge / FRITZ versions for controlling the most important features like controlling smart home devices.
It is by no means a full-fledged replacement for the old plugin or a competitor to more comprehensive integrations like HomeAssistant plugins.


## Scope

This plugin allows control of various devices in the **FRITZ!** ecosystem:

| Device                                    | Supported actions                                                                                         |
|-------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| **FRITZ!Box**, FRITZ!Repeater             | - Toggle guest WLAN                                                                                       |
| **Buttons**<br>(e.g. FRITZ!DECT 400, 440) | - Temperature and humidity reporting<br>- **No** support for button presses (cannot be detected reliably) |
| **Lights**<br>(e.g. FRITZ!DECT 500)       | - Toggle on/off<br>- Change brightness / color<br>- Support for adaptive lighting                         |
| **Outlets**<br>(e.g. FRITZ!DECT 200)      | - Toggle on/off<br>- Temperature reporting                                                                |
| **Sensors**<br>(e.g. FRITZ!DECT 350)      | - Window state reporting                                                                                  |
| **Thermostats**<br>(e.g. FRITZ!DECT 301)  | - Toggle on/off<br>- Change target temperature<br>- Temperature reporting                                 |


## Configuration

You need access to a FRITZ!Box in your network.
To use this plugin, you must [allow access to the home network for apps and applications](https://fritzhelp.avm.de/help/en/FRITZ-Box-4050/avm/024p1/hilfe_netzwerk_freigabe_apps):

- Allow access for applications
- Transmit status information via UPnP

![Enable TR-064](images/settings-tr064.png)

After that, [create a dedicated user with full permissions to make the plugin work properly](https://fritzhelp.avm.de/help/en/FRITZ-Box-4050/avm/024p1/hilfe_system_userkonto):

![User permissions](images/settings-permissions.jpg)

Then configure the plugin using the Homebridge UI or using the example config.json.


## Device and firmware compatibility

Because of the plethora of possible devices, device combinations and firmware versions, not everything can and will be tested.
Only unsupported devices will be listed here.
As of now, no information about unsupported devices is available.
If you encounter any problems, feel free to open an issue.


## Credits

`homebridge-fritz-platform` was initially developed by [SeydX](https://github.com/seydx/homebridge-fritz-platform).

All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
