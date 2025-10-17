import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Axios, isAxiosError } from 'axios';
import { AxiosDigestAuth } from '@lukesthl/ts-axios-digest-auth';
import { XMLParser } from 'fast-xml-parser';
import https from 'node:https';

export class XMLClient {
    private axiosInstance: Axios = new Axios();
    private xmlParser: XMLParser = new XMLParser({ ignoreAttributes: false });

    public async request(
        url: string,
        config?: AxiosRequestConfig,
        digestAuth?: boolean,
    ): Promise<string> {
        try {
            const response: AxiosResponse<string> = await this.sendRequest(url, config, digestAuth);
            if (response?.data) {
                return response.data;
            }

            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Invalid response (no data)');
        } catch (error) {
            console.error(
                'XMLClient request failed:',
                {
                    status: isAxiosError(error) ? error.response?.status : undefined,
                    statusText: isAxiosError(error)
                        ? error.response?.statusText
                        : error,
                },
            );
            throw error;
        }
    }

    public async requestXML<T>(
        url: string,
        config?: AxiosRequestConfig,
        digestAuth?: boolean,
    ): Promise<T> {
        const httpResponse = await this.request(url, config, digestAuth);
        return this.xmlParser.parse(httpResponse) as T;
    }

    private async sendRequest<T>(
        url: string,
        config?: AxiosRequestConfig,
        digestAuth?: boolean,
    ): Promise<AxiosResponse<T>> {

        // Allow self-signed certificate from FRITZ!Box
        // Note that providing default options to the axios instance above does not work,
        // since AxiosDigestAuth does not respect this setting.
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

        if (digestAuth && config?.auth?.username && config.auth.password) {
            return new AxiosDigestAuth({
                username: config.auth.username,
                password: config.auth.password,
            }).request<T>({ url, ...config });
        }
        return this.axiosInstance.request<T>({ url, ...config });
    }
}
