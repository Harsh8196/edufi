import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    elizaLogger,
} from "@elizaos/core";
import { createPublicClient, http } from "viem";
import { eduChain } from "../config/chains";
import { console } from "inspector";

const EDU_EXPLORER_API = eduChain.blockExplorers.default.url + '/api/';
const EDU_EXPLORER = eduChain.blockExplorers.default.url
console.log(`${EDU_EXPLORER_API}`)

// Cache configuration
const CACHE_DURATION = 30 * 1000; // 30 seconds for blockchain data
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 30;

// Interfaces for API responses
interface AccountInfo {
    address: string;
    balance: string;
    token_transfers_count: number;
    transactions_count: number;
    implementation_name?: string;
    implementation_address?: string;
    token?: {
        name: string;
        symbol: string;
        total_supply: string;
        decimals: number;
    };
}

interface BlockInfo {
    height: number;
    hash: string;
    timestamp: string;
    transactions_count: number;
    miner: {
        hash: string;
    };
    size: number;
    gas_used: string;
    gas_limit: string;
}

interface NetworkStats {
    total_blocks: number;
    total_addresses: number;
    total_transactions: number;
    average_block_time: number;
    market_cap: string;
    total_supply: string;
    circulating_supply: string;
}

interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    total_supply: string;
    decimals: number;
    holders_count: number;
    transfers_count: number;
    type: string;
}

// Cache state
interface CacheData {
    [key: string]: {
        data: any;
        timestamp: number;
    };
}

let cache: CacheData = {};
let requestTimestamps: number[] = [];

function isRateLimited(): boolean {
    const now = Date.now();
    requestTimestamps = requestTimestamps.filter(time => now - time < RATE_LIMIT_DURATION);
    return requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE;
}

function getCachedData(key: string): any {
    const cached = cache[key];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key: string, data: any): void {
    cache[key] = {
        data,
        timestamp: Date.now(),
    };
}

// Add Block interface
interface Block {
    number: number;
    hash: string;
    timestamp: number;
    transaction_count: number;
    size: number;
    gas_used: string;
    gas_limit: string;
}

// Update fetchFromAPI to handle query parameters
async function fetchFromAPI(params: Record<string, string>, runtime: IAgentRuntime): Promise<any> {
    console.log('DEBUG: Starting API request with params:', JSON.stringify(params));

    if (isRateLimited()) {
        console.log('WARN: Rate limit reached');
        throw new Error("Rate limit reached");
    }

    requestTimestamps.push(Date.now());

    try {
        const queryParams = new URLSearchParams({
            ...params
        });

        const url = `${EDU_EXPLORER_API}?${queryParams.toString()}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('DEBUG: API Response received:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type')
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        console.log('DEBUG: Raw response text:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.log('ERROR: Failed to parse JSON response:', e);
            throw new Error(`Invalid JSON response from API: ${responseText}`);
        }

        // Handle different response formats
        if (data.jsonrpc === "2.0") {
            // Handle JSON-RPC responses
            if (data.error) {
                throw new Error(`JSON-RPC error: ${data.error.message || JSON.stringify(data.error)}`);
            }
            return data;
        } else {
            // Handle REST API responses
            if (data.status === '0' || data.message === 'NOTOK' || data.error) {
                throw new Error(`API Error: ${data.result || data.message || data.error}`);
            }
            return data;
        }
    } catch (error) {
        console.log('ERROR: API request failed:', {
            params: params,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : error
        });
        throw error;
    }
}

// Helper function to convert hex to decimal
function hexToDecimal(hex: string): number {
    if (!hex) return 0;
    return parseInt(hex.replace('0x', ''), 16);
}

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

export const explorerProvider: Provider = {
    async get(runtime: IAgentRuntime, message: Memory, _state?: State): Promise<string | null> {
        elizaLogger.info("explorerProvider::get");

        const messageText = message.content?.text?.toLowerCase() || '';

        // Only respond to relevant queries
        if (!messageText.includes('network') &&
            !messageText.includes('stats') &&
            !messageText.includes('wallet') &&
            !messageText.includes('address') &&
            !messageText.includes('blocks')) {
            return null;
        }

        try {

            // Check for address lookup
            console.log('In provider')
            const addressMatch = messageText.match(/(?:address|account|wallet)\s+(0x[a-fA-F0-9]{40})/i);
            if (addressMatch) {
                const address = addressMatch[1];
                try {
                    console.log(`${EDU_EXPLORER_API}?module=account&action=balance&address=${address}&tag=latest`)
                    // Get basic account info
                    const balanceResponse = await fetch(
                        `${EDU_EXPLORER_API}?module=account&action=balance&address=${address}&tag=latest`
                    );
                    const balanceData = await balanceResponse.json();

                    // Get transaction count
                    const txCountResponse = await fetch(`${EDU_EXPLORER_API}eth-rpc`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getTransactionCount',
                            params: [address, 'latest'],
                            id: 0
                        })
                    }
                    );
                    const txCountData = await txCountResponse.json();
                    elizaLogger.info("txCountData", txCountData)

                    // Check for REST API response format
                    if (balanceData.status !== "1" || !balanceData.result) {
                        throw new Error("Failed to fetch balance data");
                    }

                    // Check for JSON-RPC response format
                    if (!txCountData.result) {
                        throw new Error("Failed to fetch transaction count");
                    }

                    const balance = formatValue(balanceData.result);
                    const txCount = parseInt(txCountData.result.replace('0x', ''), 16);

                    return `# Account Information for \`${address}\`

                    ## Balance
                    - Current Balance: ${balance} EDU

                    ## Activity
                    - Total Transactions: ${txCount.toLocaleString()}

                    ## Links
                    - View on Explorer: [EDUScan](${EDU_EXPLORER}/address/${address})
                    - View Transactions: [Transaction History](${EDU_EXPLORER}/address/${address}/transactions)

                    _Last Updated: ${new Date().toLocaleString()}_`;
                } catch (error) {
                    elizaLogger.error("Error fetching account info:", error);
                    return `Unable to fetch information for address ${address}. Please try again later.`;
                }
            }

            // Check for network stats
            // if (messageText.includes('network stats') || messageText.includes('chain stats')) {
            //     elizaLogger.info(`${EDU_EXPLORER_API}?module=stats&action=ethsupply`)
            //     try {
            //         // Fetch all required data in parallel
            //         const [supplyResponse, priceResponse, blockResponse] = await Promise.all([
            //             fetch(`${EDU_EXPLORER_API}?module=stats&action=ethsupply`),
            //             fetch(`${EDU_EXPLORER_API}?module=stats&action=ethprice`),
            //             fetch(`${EDU_EXPLORER_API}eth-rpc`, {
            //                 method: 'POST',
            //                 headers: { 'Content-Type': 'application/json' },
            //                 body: JSON.stringify({
            //                     jsonrpc: '2.0',
            //                     method: 'eth_blockNumber',
            //                     params: [],
            //                     id: 0
            //                 })
            //             })
            //         ]);

            //         const [supplyData, priceData, blockData] = await Promise.all([
            //             supplyResponse.json(),
            //             priceResponse.json(),
            //             blockResponse.json()
            //         ]);

            //         // Validate REST API responses
            //         if (supplyData.status !== "1" || !supplyData.result) {
            //             throw new Error("Failed to fetch supply data");
            //         }
            //         if (priceData.status !== "1" || !priceData.result) {
            //             throw new Error("Failed to fetch price data");
            //         }
            //         // Validate JSON-RPC response
            //         if (!blockData.result) {
            //             throw new Error("Failed to fetch block number");
            //         }

            //         const totalSupply = formatValue(supplyData.result);
            //         const priceUSD = parseFloat(priceData.result.ethusd || 0);
            //         const latestBlock = parseInt(blockData.result.replace('0x', ''), 16);
            //         const marketCap = (Number(supplyData.result) / 1e18) * priceUSD;

            //         return [
            //         `# EDU network stats`,
            //         "",
            //         `## Market Statistics`,
            //         `- Current Price: $${formatCurrency(priceUSD || 0)}`,
            //         `- Market Cap: $${formatCurrency(marketCap || 0)}`,
            //         `- Total Supply: ${totalSupply} EDU`,
            //         "",
            //         `## Network Status`,
            //         `- Latest Block: ${latestBlock.toLocaleString()}`,
            //         `- Chain ID: 656476`,
            //             "",
            //         `## Links`,
            //         `- Block Explorer: [EDUScan](${EDU_EXPLORER})`,
            //         `- Network Status: [Network Stats](${EDU_EXPLORER}/stats)`,
            //             "",
            //         `_Last Updated: ${new Date().toLocaleString()}_`,
            //         `_Data Source: EDUScan Explorer_`].join('\n');
            //     } catch (error) {
            //         elizaLogger.error("Error fetching network stats:", error);
            //         return "Unable to fetch network statistics. Please try again later.";
            //     }
            // }

            // Check for latest blocks
            if (messageText.includes('latest blocks') || messageText.includes('recent blocks')) {
                try {
                    // Get latest block number
                    const blockNumberResponse = await fetch(`${EDU_EXPLORER_API}eth-rpc`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_blockNumber',
                            params: [],
                            id: 0
                        })
                    })
                    const blockNumberData = await blockNumberResponse.json();

                    // Validate JSON-RPC response
                    if (!blockNumberData.result) {
                        throw new Error("Failed to fetch block number");
                    }

                    const latestBlockNumber = parseInt(blockNumberData.result.replace('0x', ''), 16);

                    // Get block details
                    const blockResponse = await fetch(`${EDU_EXPLORER_API}eth-rpc`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method: 'eth_getBlockByNumber',
                            params: [`0x${latestBlockNumber.toString(16)}`, true],
                            id: 0
                        })
                    })
                    const blockData = await blockResponse.json();

                    // Validate JSON-RPC response
                    if (!blockData.result) {
                        throw new Error("Failed to fetch block details");
                    }

                    const block = blockData.result;
                    const timestamp = new Date(parseInt(block.timestamp.replace('0x', ''), 16) * 1000);
                    const gasUsed = parseInt(block.gasUsed.replace('0x', ''), 16);
                    const gasLimit = parseInt(block.gasLimit.replace('0x', ''), 16);
                    const txCount = block.transactions?.length || 0;

                    return `# Latest Block Information

                    ## Block #${latestBlockNumber.toLocaleString()}
                    - Timestamp: ${timestamp.toLocaleString()}
                    - Transactions: ${txCount.toLocaleString()}
                    - Gas Used: ${formatValue(gasUsed)} (${((gasUsed / gasLimit) * 100).toFixed(2)}%)
                    - Gas Limit: ${formatValue(gasLimit)}
                    - Miner: \`${block.miner}\`

                    ## Links
                    - View Block: [Block Details](${EDU_EXPLORER}/block/${latestBlockNumber})
                    - View Transactions: [Block Transactions](${EDU_EXPLORER}/block/${latestBlockNumber}/transactions)

                    _Last Updated: ${new Date().toLocaleString()}_`;
                } catch (error) {
                    elizaLogger.error("Error fetching latest blocks:", error);
                    return "Unable to fetch latest blocks. Please try again later.";
                }
            }

            return "I can help you with EDU network information. Try asking about network stats, wallet information, latest blocks, or top tokens.";
        } catch (error) {
            elizaLogger.error("Explorer provider error:", error);

            if (error instanceof Error) {
                if (error.message.includes("Rate limit")) {
                    return "I'm currently receiving too many requests. Please try again in a minute.";
                }
                if (error.message.includes("EDU_EXPLORER_API_KEY")) {
                    return "I need an API key to access the EDU Explorer. Please set up the EDU_EXPLORER_API_KEY in the environment variables.";
                }
                return `I encountered an error while fetching the information: ${error.message}. Please try again or ask for a different type of information.`;
            }

            return "I'm having trouble accessing the blockchain data right now. Please try again in a moment.";
        }
    }
};
