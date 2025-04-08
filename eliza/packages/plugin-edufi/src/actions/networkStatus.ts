import type { Action, Memory, State } from "@elizaos/core";
import { eduChain} from "../config/chains";

const EDU_EXPLORER_API = eduChain.blockExplorers.default.url + '/api/';
const EDU_EXPLORER = eduChain.blockExplorers.default.url


// Module-level response cache
const responseCache = new Map<string, { timestamp: number; processing: boolean }>();

// Clean up old cache entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
        if (now - value.timestamp > 60000) { // Remove entries older than 1 minute
            responseCache.delete(key);
        }
    }
}, 60000);

// Helper function to format S token values from wei
function formatValue(weiValue: string | bigint | number): string {
    if (!weiValue) return '0';

    let value: number;
    if (typeof weiValue === 'string') {
        value = Number(BigInt(weiValue)) / 1e18;
    } else if (typeof weiValue === 'bigint') {
        value = Number(weiValue) / 1e18;
    } else {
        value = weiValue;
    }

    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
}

// Helper function to format currency values
function formatCurrency(value: number): string {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    });
}

export const networkStatus: Action = {
    name: "SHOW_NETWORK_STATUS",
    description: "Show network status on EDU chain",
    examples: [
        [
            {
                user: "user1",
                content: {
                    text: "Show me network status",
                },
            },
            {
                user: "assistant",
                content: {
                    text: "Here is the EDU network status with Market Statistics, Network Status, Links, Data Source and Last Updated time",
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
            // Fetch all required data in parallel
            const [supplyResponse, priceResponse, blockResponse] = await Promise.all([
                fetch(`${EDU_EXPLORER_API}?module=stats&action=ethsupply`),
                fetch(`${EDU_EXPLORER_API}?module=stats&action=ethprice`),
                fetch(`${EDU_EXPLORER_API}eth-rpc`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_blockNumber',
                        params: [],
                        id: 0
                    })
                })
            ]);

            const [supplyData, priceData, blockData] = await Promise.all([
                supplyResponse.json(),
                priceResponse.json(),
                blockResponse.json()
            ]);

            // Validate REST API responses
            if (supplyData.status !== "1" || !supplyData.result) {
                throw new Error("Failed to fetch supply data");
            }
            if (priceData.status !== "1" || !priceData.result) {
                throw new Error("Failed to fetch price data");
            }
            // Validate JSON-RPC response
            if (!blockData.result) {
                throw new Error("Failed to fetch block number");
            }

            const totalSupply = formatValue(supplyData.result);
            const priceUSD = parseFloat(priceData.result.ethusd || 0);
            const latestBlock = parseInt(blockData.result.replace('0x', ''), 16);
            const marketCap = (Number(supplyData.result) / 1e18) * priceUSD;

            const response = [
            `## EDU Network Status`,
            `**Market Statistics**`,
            "---",
            `**Current Price:** $${formatCurrency(priceUSD || 0)}`,
            `**Market Cap:** $${formatCurrency(marketCap || 0)}`,
            `**Total Supply:** ${totalSupply} EDU`,
            "---",
            `**Network Status**`,
            "---",
            `**Latest Block:** ${latestBlock.toLocaleString()}`,
            `**Chain ID:** 41923`,
            "---",
            `**Links**`,
            "---",
            `**Block Explorer:** [EDUScan](${EDU_EXPLORER})`,
            `**Network Status:** [Network Stats](${EDU_EXPLORER}/stats)`,
            "---",
            `_Last Updated: ${new Date().toLocaleString()}_`,
            `_Data Source: EDUScan Explorer_`].join('\n');

            callback({ text: response });

            return true;
        } catch (error) {
            callback({ text: "Unable to fetch network statistics. Please try again later." });
            return true;
        }
    },
    validate: async () => true,
    similes: [
        "like EDU network status",
        "like getting market Statistics",
        "like viewing network statistics",
    ],
};
