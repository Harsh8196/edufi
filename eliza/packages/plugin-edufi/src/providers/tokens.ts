import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@elizaos/core";

// Example queries that should trigger this provider
const EXAMPLE_QUERIES = [
    "Show me all EDU tokens",
    "What tokens are available on EDU?",
    "Show me token prices",
    "Get information about WEDU and USDC tokens",
    "What is the price of EDU token?",
    "Show me USDC price",
    "List all supported tokens"
];

// API base URL
const GECKO_TERMINAL_API = "https://api.geckoterminal.com/api/v2";

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

interface TokenInfo {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    price_usd?: string;
    price_change_24h?: string;
    volume_24h?: string;
    market_cap?: string;
    total_supply?: string;
}

// Predefined list of important EDU tokens
const TRACKED_TOKENS: TokenInfo[] = [
    {
        symbol: "EDU",
        name: "EDU",
        address: "native",
        decimals: 18
    },
    {
        symbol: "WEDU",
        name: "Wrapped EDU",
        address: "0xd02e8c38a8e3db71f8b2ae30b8186d7874934e12",
        decimals: 18
    },
    {
        symbol: "ESD",
        name: "EDU StableDollar",
        address: "0xd282de0c2bd41556c887f319a5c19ff441dcdf90",
        decimals: 18
    },
    {
        symbol: "USDT",
        name: "Tether USD",
        address: "0x7277cc818e3f3ffbb169c6da9cc77fc2d2a34895",
        decimals: 6
    },
    {
        symbol: "USDC",
        name: "USD Coin",
        address: "0x836d275563bab5e93fd6ca62a95db7065da94342",
        decimals: 6
    }
];

// Cache state
let lastFetchTime = 0;
let cachedData: string | null = null;

function formatTokenInfo(token: TokenInfo): string {
    const priceChange = token.price_change_24h 
        ? `${parseFloat(token.price_change_24h) >= 0 ? '🟢' : '🔴'}${parseFloat(token.price_change_24h).toFixed(2)}%`
        : 'N/A';

    const volume = token.volume_24h 
        ? `$${parseFloat(token.volume_24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'N/A';

    const marketCap = token.market_cap 
        ? `$${parseFloat(token.market_cap).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'N/A';

    return `## ${token.name} (${token.symbol})
- Address: \`${token.address}\`
- Price: ${token.price_usd ? `$${parseFloat(token.price_usd).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}` : 'N/A'}
- 24h Change: ${priceChange}
- 24h Volume: ${volume}
- Market Cap: ${marketCap}
- Decimals: ${token.decimals}
${token.total_supply ? `- Total Supply: ${parseFloat(token.total_supply).toLocaleString()}` : ''}`;
}

export const tokensProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, _state?: State): Promise<string | null> => {
        elizaLogger.debug("tokensProvider::get");
        
        const messageText = message.content?.text?.toLowerCase() || '';
        if (!messageText.includes('token') && !messageText.includes('price')) {
            return null;
        }

        try {
            // Check cache
            const now = Date.now();
            if (cachedData && (now - lastFetchTime) < CACHE_DURATION) {
                return cachedData;
            }

            // Create comma-separated list of token addresses
            const addresses = TRACKED_TOKENS
                .map(t => t.address)
                .filter(addr => addr !== "native")
                .join(",");

            // Fetch token prices and data
            const response = await fetch(
                `${GECKO_TERMINAL_API}/simple/networks/educhain/token_price/${addresses}`,
                {
                    headers: {
                        'Accept': 'application/json;version=20230302'
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch token data");
            }

            const data = await response.json();
            
            const tokens = TRACKED_TOKENS.map(token => {
                if (token.address === "native") {
                    const wsData = data.data?.["0xd02E8c38a8E3db71f8b2ae30B8186d7874934e12"];
                    return {
                        ...token,
                        price_usd: wsData?.price_usd?.toString(),
                        price_change_24h: wsData?.price_change_percentage_24h?.toString(),
                        volume_24h: wsData?.volume_24h?.toString(),
                        market_cap: wsData?.market_cap?.toString(),
                        total_supply: wsData?.total_supply?.toString()
                    };
                }

                const tokenData = data.data?.[token.address.toLowerCase()];
                return {
                    ...token,
                    price_usd: tokenData?.price_usd?.toString(),
                    price_change_24h: tokenData?.price_change_percentage_24h?.toString(),
                    volume_24h: tokenData?.volume_24h?.toString(),
                    market_cap: tokenData?.market_cap?.toString(),
                    total_supply: tokenData?.total_supply?.toString()
                };
            });

            // Calculate total market cap
            const totalMarketCap = tokens.reduce((sum, token) => 
                sum + (token.market_cap ? parseFloat(token.market_cap) : 0), 0);

            // Calculate total 24h volume
            const total24hVolume = tokens.reduce((sum, token) => 
                sum + (token.volume_24h ? parseFloat(token.volume_24h) : 0), 0);

            const formattedTokens = tokens
                .sort((a, b) => {
                    const marketCapA = a.market_cap ? parseFloat(a.market_cap) : 0;
                    const marketCapB = b.market_cap ? parseFloat(b.market_cap) : 0;
                    return marketCapB - marketCapA;
                })
                .map(formatTokenInfo)
                .join("\n\n");

            const result = `# EDU Network Token Overview

## Market Statistics
- Total Market Cap: $${totalMarketCap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Total 24h Volume: $${total24hVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Number of Tracked Tokens: ${tokens.length}

## Token Details
${formattedTokens}

_Last Updated: ${new Date().toLocaleString()}_
_Data Source: GeckoTerminal_`;

            // Update cache
            cachedData = result;
            lastFetchTime = now;

            return result;
        } catch (error) {
            elizaLogger.error("Tokens provider error:", error);
            return "Failed to fetch token data. Please try again later.";
        }
    }
};
