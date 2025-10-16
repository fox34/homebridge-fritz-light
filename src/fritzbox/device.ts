import type { IService } from './service.js';

export interface IDevice {
  deviceType: string;
  friendlyName: string;
  manufacturer: string;
  manufacturerURL: string;
  modelDescription: string;
  modelName: string;
  modelNumber: string;
  modelURL: string;
  UDN: string;
  serviceList: ServiceList;
  deviceList: PurpleDeviceList;
}

interface ServiceList {
  service: IService[];
}

interface PurpleDeviceList {
  device: IDevice[];
}
