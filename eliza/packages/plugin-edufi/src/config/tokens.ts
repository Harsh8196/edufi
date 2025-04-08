import type { Address } from "viem";

interface BaseTokenConfig {
    symbol: string;
    name: string;
    decimals: number;
    coingeckoId: string;
}

interface NativeTokenConfig extends BaseTokenConfig {
    type: 'native';
}

interface ERC20TokenConfig extends BaseTokenConfig {
    type: 'erc20';
    address: Address;
}

type TokenConfig = NativeTokenConfig | ERC20TokenConfig;
export type { TokenConfig, ERC20TokenConfig };

type TokensConfig = {
    [K in string]: TokenConfig;
};

export const TOKENS: TokensConfig = {
    EDU: {
        type: 'native',
        symbol: "EDU",
        name: "EDU",
        decimals: 18,
        coingeckoId: "edu-coin",
    },
    USDC: {
        type: 'erc20',
        symbol: "USDC",
        name: "USD Coin",
        address: "0x836d275563bAb5E93Fd6Ca62a95dB7065Da94342" as Address,
        decimals: 6,
        coingeckoId: "edu-chain-bridged-usdc-edu-chain",
    },
    USDT: {
        type: 'erc20',
        symbol: "USDT",
        name: "Tether USD",
        address: "0x7277cc818e3f3ffbb169c6da9cc77fc2d2a34895" as Address,
        decimals: 6,
        coingeckoId: "edu-chain-bridged-usdt-edu-chain",
    },
    WEDU: {
        type: 'erc20',
        symbol: "WEDU",
        name: "Wrapped EDU",
        address: "0xd02E8c38a8E3db71f8b2ae30B8186d7874934e12" as Address,
        decimals: 18,
        coingeckoId: "edu-coin", // Using EDU price for Wrapped EDU
    },
    ESD: {
        type: 'erc20',
        symbol: "ESD",
        name: "EDU StableDollar",
        address: "0xd282dE0c2bd41556c887f319A5C19fF441dCdf90" as Address,
        decimals: 18,
        coingeckoId: "edu-stabledollar", // Using EDU price for Wrapped EDU
    },
    WISER: {
        type: 'erc20',
        symbol: "WISER",
        name: "Daily WISER",
        address: "0xF9E03759752BE9fAA70a5556f103dbD385a2471C" as Address,
        decimals: 18,
        coingeckoId: "",
    },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

// Helper functions to get token data
export function getTokenBySymbol(symbol: TokenSymbol): TokenConfig {
    return TOKENS[symbol];
}

export function getTokenByAddress(address: string): ERC20TokenConfig | undefined {
    const normalizedAddress = address.toLowerCase();
    const token = Object.values(TOKENS).find(
        token => token.type === 'erc20' && token.address.toLowerCase() === normalizedAddress
    );
    return token?.type === 'erc20' ? token : undefined;
}

// Helper to check if a token is ERC20
export function isERC20Token(token: TokenConfig): token is ERC20TokenConfig {
    return token.type === 'erc20';
}

// Get all ERC20 tokens
export function getERC20Tokens(): ERC20TokenConfig[] {
    return Object.values(TOKENS).filter(isERC20Token);
}

// Derived maps for specific use cases
export const TOKEN_ADDRESSES: Record<string, Address> = {};
export const TOKEN_DECIMALS: Record<string, number> = {};
export const COINGECKO_IDS: Record<string, string> = {};

// Initialize the derived maps
for (const [symbol, token] of Object.entries(TOKENS)) {
    if (token.type === 'erc20') {
        TOKEN_ADDRESSES[symbol] = token.address;
    }
    TOKEN_DECIMALS[symbol] = token.decimals;
    COINGECKO_IDS[symbol] = token.coingeckoId;
}
