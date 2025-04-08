import type { Action, Memory } from "@elizaos/core";
import { ethers } from "ethers";
import {
    TOKENS,
    getTokenBySymbol,
    isERC20Token,
    type TokenSymbol,
} from "../../config/tokens";
import { Quoter } from "../../sailfishdex/quoter";
import { TradeType } from "../../sailfishdex/types"
import { eduChain } from "../../config/chains";

const EDU_RPC_URL = eduChain.rpcUrls.public.http[0]

export const swapQuote: Action = {
    name: "GET_SWAP_QUOTE",
    description: "Get a single quote for SailFish Dex.",
    examples: [
        [
            {
                user: "user1",
                content: {
                    text: "Get a quote for swapping 1 WEDU to USDC on SailFish dex",
                    entities: {
                        fromAmount: "1",
                        fromToken: "WEDU",
                        toToken: "USDC"
                    }
                }
            },
            {
                user: "assistant",
                content: {
                    text: "Getting best route for WEDU to USDC...",
                }
            }
        ]
    ],
    handler: async (runtime, message: Memory, _state, _options, callback) => {
        try {

            // Initialize provider
            const provider = new ethers.JsonRpcProvider(
                EDU_RPC_URL
            );

            const quoter = new Quoter(provider);

            // Parse message content
            const content = message.content?.text?.match(
                /^(?:Get a )?quote for (?:single )?swapping ([\d.]+) ([A-Za-z]+) to ([A-Za-z]+)(?:\s+on\s+SailFish(?:\s+dex)?)?$/i
            );

            if (!content) {
                callback?.({
                    text: "Could not parse Quote details. Please use format: Quote for swapping <amount> <fromToken> to <toToken> [on SailFish]",
                });
                return false;
            }

            const [, amount, fromSymbol, toSymbol] = content;

            // Get token configs
            const fromToken = getTokenBySymbol(fromSymbol.toUpperCase() as TokenSymbol);
            const toToken = getTokenBySymbol(toSymbol.toUpperCase() as TokenSymbol);

            if (!fromToken || !isERC20Token(fromToken) || !toToken || !isERC20Token(toToken)) {
                const supportedTokens = Object.entries(TOKENS)
                    .filter(([_, t]) => t.type === 'erc20')
                    .map(([symbol]) => symbol)
                    .join(", ");
                callback?.({
                    text: `Invalid token symbol. Supported tokens: ${supportedTokens}`,
                });
                return false;
            }

            // Send initial confirmation
            callback?.({
                text: `"Getting best quote for swapping ${fromToken.symbol} to ${toToken.symbol} on SailFish...`,
            });

            // Get the best route
            const routes = await quoter.getBestRoute(fromToken.address, toToken.address);

            if (routes.routes.length > 0) {
                const bestRoute = routes.routes[0];
                console.log("Best route type:", bestRoute.type);
          
                // Get a quote for swapping 1 WEDU to USDC
                // console.log("Getting quote for 1 WEDU -> USDC...");
                const quote = await quoter.getQuote(
                  fromToken.address,
                  toToken.address,
                  amount, // amountIn
                  "0", // amountOut (not used for EXACT_INPUT)
                  TradeType.EXACT_INPUT
                );
                var response
                if (bestRoute.type === "direct") {
                    response = [
                        `Best direct route found:`,
                        "",
                        `- Pool: ${bestRoute.path[0].id}`,
                        `- Fee tier: ${bestRoute.path[0].feeTier}`,
                        "",
                        'Quote result on SailFish Dex:',
                        '',
                        `- Amount in: ${quote.amountIn} ${fromToken.symbol}`,
                        `- Amount out: ${quote.amountOut} ${toToken.symbol}`,
                        `- Execution price: 1 ${fromToken.symbol} = ${quote.executionPrice} ${toToken.symbol}`,
                        `- Price impact: ${quote.priceImpact}%`,
                        `- Gas estimate: ${quote.gasEstimate}`,
                        ""
                    ].join('\n');

                    console.log(response)

                  } else {
                    response = [
                        `Best multi-hop route found:`,
                        "",
                        `- First hop pool: ${bestRoute.path[0].id}`,
                        `- Second hop pool: ${bestRoute.path[1].id}`,
                        `- Intermediary token address: ${bestRoute.intermediaryToken?.address ?? ''}`,
                        `- Intermediary token: ${bestRoute.intermediaryToken?.symbol ?? ''}`,
                        `- Total fee: ${bestRoute.totalFee} EDU`,
                        "",
                        'Quote result on SailFish Dex:',
                        '',
                        `- Amount in: ${quote.amountIn} ${fromToken.symbol}`,
                        `- Amount out: ${quote.amountOut} ${toToken.symbol}`,
                        `- Execution price: 1 ${fromToken.symbol} = ${quote.executionPrice} ${toToken.symbol}`,
                        `- Price impact: ${quote.priceImpact}%`,
                        ""
                    ].join('\n');
                  }
                callback?.({
                    text: response,
                });
              } else {
                callback?.({
                    text: `"No routes found for swapping ${fromToken.symbol} to ${toToken.symbol} on SailFish...`,
                });
              }

            return true;
        } catch (error) {
            console.error("Quote for Swapping failed:", error);
            callback?.({
                text: `Quote for Swapping failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
            return false;
        }
    },
    validate: async () => true,
    similes: [
        "like getting quotes on SailFish"
    ],
};