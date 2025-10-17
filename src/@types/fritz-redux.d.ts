declare module 'fritz-redux' {

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface HomebridgeAccessory {}

    export interface FritzBoxConnectionOptions {
        host: string;
        port: number;
        username?: string;
        password?: string;
    }
}
