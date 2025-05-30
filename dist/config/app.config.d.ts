declare const _default: (() => {
    port: number;
    nodeEnv: string;
    solana: {
        rpcUrl: string;
        commitment: string;
    };
    faucet: {
        url: string | undefined;
        maxRequestsPer10Seconds: number;
        requestIntervalMs: number;
    };
    wallet: {
        storagePath: string;
        count: number;
    };
    log: {
        level: string;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    port: number;
    nodeEnv: string;
    solana: {
        rpcUrl: string;
        commitment: string;
    };
    faucet: {
        url: string | undefined;
        maxRequestsPer10Seconds: number;
        requestIntervalMs: number;
    };
    wallet: {
        storagePath: string;
        count: number;
    };
    log: {
        level: string;
    };
}>;
export default _default;
