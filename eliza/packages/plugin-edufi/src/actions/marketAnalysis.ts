import { Action, Memory, State, elizaLogger } from "@elizaos/core";

const GECKO_TERMINAL_API = "https://api.geckoterminal.com/api/v2";

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 30;

interface PoolAnalysis {
    name: string;
    address: string;
    tvl: string;
    volume24h: string;
    price_change_24h?: string;
    base_token_price_usd?: string;
    quote_token_price_usd?: string;
    base_token_name?: string;
    quote_token_name?: string;
    transactions_24h?: string;
    market_cap_usd?: string;
}

// Cache and rate limit state
let cache = {
    data: null as string | null,
    timestamp: 0,
    requests: [] as number[],
};

function isRateLimited(): boolean {
    const now = Date.now();
    // Remove requests older than 1 minute
    cache.requests = cache.requests.filter(time => now - time < RATE_LIMIT_DURATION);
    return cache.requests.length >= MAX_REQUESTS_PER_MINUTE;
}

function isCacheValid(): boolean {
    return Date.now() - cache.timestamp < CACHE_DURATION;
}

function formatPoolAnalysis(pool: PoolAnalysis): string {
    const priceChange = pool.price_change_24h 
        ? `${parseFloat(pool.price_change_24h) >= 0 ? '🟢' : '🔴'}${parseFloat(pool.price_change_24h).toFixed(2)}%`
        : 'N/A';

    const marketCap = pool.market_cap_usd 
        ? `$${parseFloat(pool.market_cap_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'N/A';

    return `## ${pool.name}
--- 
**TVL:** $${parseFloat(pool.tvl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
**24h Volume:** $${parseFloat(pool.volume24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
**24h Price Change:** ${priceChange}
**Market Cap:** ${marketCap}
**24h Transactions:** ${pool.transactions_24h || 'N/A'}
**Token Information:**
  * ${pool.base_token_name}: $${parseFloat(pool.base_token_price_usd || '0').toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
  * ${pool.quote_token_name}: $${parseFloat(pool.quote_token_price_usd || '0').toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
  ---
  `;
}

export const marketAnalysis: Action = {
    name: "SHOW_MARKET_ANALYSIS",
    description: "Show network status on EDU chain",
    examples: [
        [
            {
                user: "user1",
                content: {
                    text: "Show me market analysis on EDU",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Here is the EDU network market analysis",
                },
            },
        ],
    ],
    suppressInitialMessage: true, // This prevents double responses in Telegram
    handler: async (runtime, message: Memory, state: State | undefined, options, callback) => {
        if (!callback) return false;
        if (!state) return false;

        // Check if this is a memory-based response
        if (state.isMemoryResponse) {
            return false;
        }

        // Mark this as not a memory response
        state.isMemoryResponse = true;

        try {

            const response = await fetch(
                `${GECKO_TERMINAL_API}/networks/educhain/pools`,
                {
                    headers: {
                        'Accept': 'application/json;version=20230302'
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.data?.length) {
                throw new Error("No pools found for market analysis");
            }

            const pools = data.data.map((pool: any) => ({
                name: pool.attributes.name,
                address: pool.attributes.address,
                tvl: pool.attributes.reserve_in_usd,
                volume24h: pool.attributes.volume_usd?.h24 || "0",
                price_change_24h: pool.attributes.price_change_percentage?.h24?.toString(),
                base_token_price_usd: pool.attributes.base_token_price_usd,
                quote_token_price_usd: pool.attributes.quote_token_price_usd,
                base_token_name: pool.attributes.base_token_name,
                quote_token_name: pool.attributes.quote_token_name,
                transactions_24h: pool.attributes.transactions_24h,
                market_cap_usd: pool.attributes.market_cap_usd
            }));

            const totalTVL = pools.reduce((sum: number, pool: PoolAnalysis) => 
                sum + parseFloat(pool.tvl), 0);
            const totalVolume = pools.reduce((sum: number, pool: PoolAnalysis) => 
                sum + parseFloat(pool.volume24h), 0);

            // Sort pools by TVL for top pools
            const topPoolsByTVL = [...pools]
                .sort((a, b) => parseFloat(b.tvl) - parseFloat(a.tvl))
                .slice(0, 5);

            // Sort pools by 24h price change for gainers/losers
            const sortedByPriceChange = [...pools]
                .filter(p => p.price_change_24h)
                .sort((a, b) => parseFloat(b.price_change_24h!) - parseFloat(a.price_change_24h!));

            const topGainers = sortedByPriceChange.slice(0, 3);
            const topLosers = sortedByPriceChange.reverse().slice(0, 3);

            const result = `# EDU Network Market Analysis

**Network Overview**
---
**Total Value Locked (TVL):** $${totalTVL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
**24h Trading Volume:** $${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
**Total Active Pools:** ${pools.length}
---

**Top Pools by TVL**
${topPoolsByTVL.map(formatPoolAnalysis).join('\n\n')}

## Market Movers

### Top Gainers (24h)
---
${topGainers.map(pool => `**${pool.name}:** 🟢 ${parseFloat(pool.price_change_24h!).toFixed(2)}%`).join('\n')}
---
### Top Losers (24h)
${topLosers.map(pool => `**${pool.name}:** 🔴 ${parseFloat(pool.price_change_24h!).toFixed(2)}%`).join('\n')}

_Last Updated: ${new Date().toLocaleString()}_
_Data Source: GeckoTerminal_`;

            callback({ text: result });
            return true;
        } catch (error) {
            elizaLogger.error("Market Analysis provider error:", error);
            
            if (error instanceof Error) {
                if (error.message.includes("Rate limit")) {
                    callback({ text: "Unable to fetch market analysis due to rate limiting. Please try again in a minute." });
                    return false;
                }
                if (error.message.includes("No pools found")) {
                    callback({ text: "No pool data is currently available for market analysis." });
                    return false;
                }
                if (error.message.includes("API request failed")) {
                    callback({ text: "The market data API is currently unavailable. Please try again later." });
                    return false;
                }
                if (error.message.includes("Failed to process")) {
                    callback({ text: "Unable to process market data. Please try again later." });
                    return false;
                }
            }

            if (cache.data) {
                callback({ text: `${cache.data}\n\nNote: This data might be outdated due to a temporary error.` });
                return false;
            }
                callback({ text: "Failed to fetch market analysis data. Please try again later." });
                return false;
        }
    },
    validate: async () => true,
    similes: [
        "like loser or gainer on EDU",
        "like market analysis on EDU network",
        "like Top Pools by TVL",
        "like market mover on EDU"
    ],
};
