import type { FritzBoxConnectionOptions } from 'fritz-redux';
import type { ArgumentElement, ArgumentList, Action, SCPD } from 'fritz-scpd';
import type { DeviceService, SystemVersion, SpecVersion, TR64Desc, RootDevice } from 'fritz-tr64';
import xmlBuilder from 'xmlbuilder';
import { XMLClient } from './XMLClient.js';

export class TR64 implements TR64Desc {
    specVersion: SpecVersion;
    systemVersion: SystemVersion;
    device: RootDevice;
    _xmlns: string;

    constructor(tr64desc: TR64Desc) {
        this._xmlns = tr64desc._xmlns;
        this.device = tr64desc.device;
        this.specVersion = tr64desc.specVersion;
        this.systemVersion = tr64desc.systemVersion;
    }
}

export class Service implements DeviceService {
    public serviceType: string;
    public serviceId: string;
    public controlURL: string;
    public eventSubURL: string;
    public SCPDURL: string;

    private initialized: boolean = false;
    private url: URL;
    private fritzboxOptions: FritzBoxConnectionOptions;
    private xmlClient: XMLClient;

    constructor(service: DeviceService, url: URL, options: FritzBoxConnectionOptions) {
        this.serviceType = service.serviceType;
        this.serviceId = service.serviceId;
        this.controlURL = service.controlURL;
        this.eventSubURL = service.eventSubURL;
        this.SCPDURL = service.SCPDURL;
        this.url = url;
        this.fritzboxOptions = options;
        this.xmlClient = new XMLClient();
    }

    private customActions = new Map<
        string,
        {
            name: string;
            parameter: string[];
            return: string[];
        }
    >();

    async init() {
        if (this.initialized) {
            return;
        }
        const url = this.url.origin + this.SCPDURL;

        const result = await this.xmlClient.requestXML<{ scpd: SCPD }>(url);
        if (result?.scpd) {
            this.initActions(result.scpd.actionList.action);
        }
        this.initialized = true;
    }

    initActions(actions: Action[]) {
        actions.forEach(action => {
            const customAction = {
                name: action.name,
                parameter: this.getInArguments(action.argumentList),
                return: this.getOutArguments(action.argumentList),
            };
            this.customActions.set(action.name, customAction);
        });
    }

    public async exec<T>(actionName: string, options: unknown): Promise<T> {
        await this.init();
        const action = this.customActions.get(actionName);

        if (!action) {
            throw new Error(
                `Action "${actionName}" of "${this.serviceType}" not known!`,
            );
        }
        const body = this.buildSoapMessage(
            actionName,
            this.serviceType,
            typeof options === 'object' ? options || {} : {},
        );
        const outArguments = this.customActions.get(actionName)?.return;
        const url = this.url.origin + this.controlURL;

        const headers = {
            SoapAction: this.serviceType + '#' + actionName,
            'Content-Type': 'text/xml; charset="utf-8"',
        };
        const auth =
            this.fritzboxOptions.username && this.fritzboxOptions.password
                ? {
                    username: this.fritzboxOptions.username,
                    password: this.fritzboxOptions.password,
                }
                : undefined;
        const response = await this.xmlClient.requestXML<{
            ['s:Envelope']: {
                ['s:Body']: {
                    [key: string]: {
                        [key: string]: string;
                    };
                };
            };
            HTML?: {
                HEAD: { TITLE: string };
            };
        }>(
            url,
            {
                method: 'POST',
                headers,
                data: body,
                auth,
            },
            true,
        );
        const res: T = {} as T;
        if (response && response['s:Envelope']) {
            const env = response['s:Envelope'];

            const resultBody = env['s:Body'];
            if (resultBody['u:' + actionName + 'Response']) {
                const responseVars = resultBody['u:' + actionName + 'Response'];
                if (outArguments) {
                    outArguments.forEach(
                        arg =>
                            ((res as Record<string, string | undefined>)[arg] =
                                responseVars?.[arg]),
                    );
                }
            } else {
                if (resultBody['s:Fault']) {
                    throw new Error(

                        `Device responded with fault ${resultBody['s:Fault']}`,
                    );
                }
            }
        } else {
            if (response.HTML?.HEAD?.TITLE) {
                throw new Error(response.HTML.HEAD.TITLE);
            } else {
                throw new Error(response.toString());
            }
        }
        return res;
    }

    private getInArguments = (argumentList: ArgumentList) => {
        if (argumentList && Array.isArray(argumentList.argument)) {
            return argumentList.argument
                .filter(this.isInDirection)
                .map(argument => argument.name);
        } else if (
            argumentList &&
            argumentList.argument &&
            this.isInDirection(argumentList.argument)
        ) {
            return [(argumentList.argument as ArgumentElement).name];
        } else {
            return [];
        }
    };

    private getOutArguments = (argumentList: ArgumentList) => {
        if (argumentList && Array.isArray(argumentList.argument)) {
            return argumentList.argument
                .filter(this.isOutDirection)
                .map(argument => argument.name);
        } else if (
            argumentList &&
            argumentList.argument &&
            this.isOutDirection(argumentList.argument)
        ) {
            return [(argumentList.argument as ArgumentElement).name];
        } else {
            return [];
        }
    };

    private isInDirection = (argument: ArgumentElement | ArgumentElement[]) =>
        Array.isArray(argument)
            ? argument[0]?.direction === 'in'
            : argument.direction === 'in';

    private isOutDirection = (argument: ArgumentElement | ArgumentElement[]) =>
        Array.isArray(argument)
            ? argument[0]?.direction === 'out'
            : argument.direction === 'out';

    private buildSoapMessage(
        action: string,
        serviceType: string,
        options: object,
    ): string {
        const fqaction = 'u:' + action;

        const root = {
            's:Envelope': {
                '@s:encodingStyle': 'http://schemas.xmlsoap.org/soap/encoding/',
                '@xmlns:s': 'http://schemas.xmlsoap.org/soap/envelope/',
                's:Body': {
                    [fqaction]: {
                        '@xmlns:u': serviceType,
                        ...options,
                    },
                },
            },
        };

        const xml = xmlBuilder.create(root);

        return xml.end();
    }
}
