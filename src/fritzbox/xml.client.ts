import { AxiosDigestAuth } from '@lukesthl/ts-axios-digest-auth';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Axios, isAxiosError } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import https from 'node:https';

export class XMLClient {
    private axiosInstance = new Axios({});
    private xmlParser = new XMLParser({ ignoreAttributes: false });

    public async request(
        url: string,
        config?: AxiosRequestConfig,
        digestAuth?: boolean,
    ): Promise<string> {
        let response: AxiosResponse<string>;

        // Allow self-signed certificate from FRITZ!Box
        if (url.startsWith('https://')) {
            if (config === undefined) {
                config = {};
            }
            if (config.httpsAgent === undefined) {
                config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
            } else {
                throw new Error('Cannot modify https.Agent properties');
            }
        }

        try {
            response = await this.sendRequest(url, config, digestAuth);
        } catch (error) {
            console.error(
                {
                    status: isAxiosError(error) ? error.response?.status : undefined,
                    statusText: isAxiosError(error)
                        ? error.response?.statusText
                        : undefined,
                },
                'XMLClient request',
            );
            throw error;
        }

        /*
        console.info(
            `${url} ->`,
            {
                status: response.status,
                statusText: response.statusText,
            },
        );
         */

        if (response?.data) {
            return response.data;
        }
        throw new Error('Invalid response');
    }


    public async requestXML<T>(
        url: string,
        config?: AxiosRequestConfig,
        digestAuth?: boolean,
    ): Promise<T> {
        let response: AxiosResponse<T>;

        // Allow self-signed certificate from FRITZ!Box
        if (url.startsWith('https://')) {
            if (config === undefined) {
                config = {};
            }
            if (config.httpsAgent === undefined) {
                config.httpsAgent = new https.Agent({ rejectUnauthorized: false });
            } else {
                throw new Error('Cannot modify https.Agent properties');
            }
        }

        try {
            response = await this.sendRequest(url, config, digestAuth);
        } catch (error) {
            console.error(
                {
                    status: isAxiosError(error) ? error.response?.status : undefined,
                    statusText: isAxiosError(error)
                        ? error.response?.statusText
                        : undefined,
                },
                'XMLClient request',
            );
            throw error;
        }

        /*
        console.info(
            `${url} ->`,
            {
                status: response.status,
                statusText: response.statusText,
            },
        );
         */

        if (response?.data && typeof response.data === 'string') {
            return this.xmlParser.parse(response.data) as T;
        }
        throw new Error('Invalid response');
    }

    private async sendRequest<T>(
        url: string,
        config?: AxiosRequestConfig,
        digestAuth?: boolean,
    ): Promise<AxiosResponse<T>> {
        if (!this.axiosInstance) {
            this.axiosInstance = new Axios({});
        }
        if (digestAuth && config?.auth?.username && config?.auth?.password) {
            return new AxiosDigestAuth({
                username: config?.auth?.username,
                password: config?.auth?.password,
            }).request<T>({ url, ...config });
        }
        return this.axiosInstance.request<T>({ url, ...config });
    }
}
