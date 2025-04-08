import type { Action, Memory } from "@elizaos/core";
import { ethers } from "ethers";
import {
    TOKENS,
    getTokenBySymbol,
    isERC20Token,
    type TokenSymbol,
} from "../../config/tokens";
import { Quoter } from "../../sailfishdex/quoter";
import { TradeType,ExactInputSingleParams,ExactInputParams } from "../../sailfishdex/types"
import { Router } from "../../sailfishdex/router";
import { eduChain } from "../../config/chains";

const EDU_RPC_URL = eduChain.rpcUrls.public.http[0]
const EDU_EXPLORER = eduChain.blockExplorers.default.url
const minABI = [
    // balanceOf
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256"}],
      type: "function",
    },
  ];

export const swapToken: Action = {
    name: "SWAP_TOKEN",
    description: "Swap tokens on SailFish Dex.",
    examples: [
        [
            {
                user: "user1",
                content: {
                    text: "Swap 0.1 WEDU for USDC on SailFish Dex",
                    entities: {
                        fromAmount: "0.1",
                        fromToken: "WEDU",
                        toToken: "USDC"
                    }
                }
            },
            {
                user: "assistant",
                content: {
                    text: "Initiating swap of 0.1 WEDU for USDC on SailFish Dex...",
                }
            }
        ]
    ],
    handler: async (runtime, message: Memory, _state, _options, callback) => {
        try {

            const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
            if (!privateKey) {
                callback?.({
                    text: "EVM wallet not configured. Please set EVM_PRIVATE_KEY in your environment variables.",
                });
                return false;
            }

            // Initialize provider
            const provider = new ethers.JsonRpcProvider(
                EDU_RPC_URL
            );

            // Initialize signer
            const signer = new ethers.Wallet(privateKey, provider);
            const address = await signer.getAddress();

            const quoter = new Quoter(provider);
            const router = new Router(signer);

            // Parse message content
            const content = message.content?.text?.match(
                /Swap ([\d.]+) ([A-Za-z]+) for ([A-Za-z]+)(?:\s+on\s+SailFish)?/i
            );

            if (!content) {
                callback?.({
                    text: "Could not parse swap details. Please use format: Swap <amount> <fromToken> for <toToken> [on SailFish]",
                });
                return false;
            }

            const [, amountIn, fromSymbol, toSymbol] = content;
            
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
            const amountInWei = ethers.parseUnits(amountIn,fromToken.decimals);

            // Send initial confirmation
            callback?.({
                text: `"Initiating swap of ${amountIn} ${fromToken.symbol} for ${toToken.symbol} on SailFish...`,
            });

            if(fromToken.symbol != 'WEDU') {
                // Get token balance
                const fromTokenContract = new ethers.Contract(
                    fromToken.address,
                    minABI,
                    provider
                );
                const balance  = await fromTokenContract.balanceOf(signer.address)
                console.log("amount:",amountInWei)
                console.log("Balance:", balance)

                if (BigInt(balance.toString()) < amountInWei) {
                    callback?.({
                        text: `Insufficient balance. You need at least ${amountIn} ${fromToken.symbol} to complete this transaction.`,
                    });
                    return false;
                }
            }
            

            // Get the best route
            const routes = await quoter.getBestRoute(fromToken.address, toToken.address);

            if (routes.routes.length > 0) {
                const bestRoute = routes.routes[0];
                console.log("Best route type:", bestRoute.type);
          
                // Get a quote for swapping 1 fromToken to toToken

                const quote = await quoter.getQuote(
                  fromToken.address,
                  toToken.address,
                  amountIn, // amountIn
                  "0", // amountOut (not used for EXACT_INPUT)
                  TradeType.EXACT_INPUT
                );
                var response
                if (bestRoute.type === "direct") {

                    // Check if fromToken is approved for spending
                    const isApproved = await router.isTokenApproved(fromToken.address, amountInWei);

                    if (!isApproved) {
                        console.log('Approving fromToken for spending...');
                        const approveTx = await router.approveToken(fromToken.address, amountInWei);
                        console.log(`Approval transaction sent: ${approveTx.hash}`);
                        await approveTx.wait();
                        console.log('Approval confirmed!');
                      } else {
                        console.log('fromToken already approved for spending.');
                      }

                    // Create swap parameters
                    const swapParams = await router.createSwapTransaction(
                        fromToken.address,
                        toToken.address,
                        Number(quote.feeTier), // Use the fee tier from the quote
                        amountInWei,
                        ethers.parseUnits(quote.amountOut, toToken.decimals), 
                        TradeType.EXACT_INPUT,
                        {
                        slippagePercentage: 0.5, // 0.5% slippage tolerance
                        recipient: address
                        }
                    );

                    console.log('Executing swap...');

                    // Execute the swap
                    const tx = await router.exactInputSingle(swapParams as ExactInputSingleParams);
                    console.log('Transaction sent:', tx.hash);

                    // Wait for transaction to be mined
                    const receipt = await tx.wait();
                    console.log('Transaction confirmed in block', receipt?.blockNumber ?? '');
                    console.log('Gas used:', receipt?.gasUsed.toString() ?? '');

                    console.log('Swap completed successfully!');
                    response = `Swap completed!\nTransaction Hash: ${tx.hash}\nView on Explorer: ${EDU_EXPLORER}/tx/${tx.hash}`

                    console.log(response)

                  } else {
                    // Get routes for each hop
                    const fromTokenToIntermediaryToken = await quoter.getBestRoute(fromToken.address, bestRoute.intermediaryToken?.address ?? '');
                    const intermediaryTokenToToken = await quoter.getBestRoute(bestRoute.intermediaryToken?.address ?? '', toToken.address);

                    if (fromTokenToIntermediaryToken.routes.length === 0 || intermediaryTokenToToken.routes.length === 0) {
                        console.log('Could not find routes for one or both hops.');
                        callback?.({
                            text: `Could not find routes for ${fromToken.symbol} -> ${bestRoute.intermediaryToken?.symbol ?? ''} or ${bestRoute.intermediaryToken?.symbol ?? ''} -> ${toToken.symbol} hops.`
                        });
                        return false;
                      }

                    // Get fee tiers for each hop
                    const feeTier1 = fromTokenToIntermediaryToken.routes[0].path[0].feeTier;
                    const feeTier2 = intermediaryTokenToToken.routes[0].path[0].feeTier;

                      // Get quotes for each hop to estimate the final output
                    const quote1 = await quoter.getQuote(
                        fromToken.address,
                        bestRoute.intermediaryToken?.address ?? '',
                        amountIn,
                        '0',
                        TradeType.EXACT_INPUT
                    );
                    
                    const quote2 = await quoter.getQuote(
                        bestRoute.intermediaryToken?.address ?? '',
                        toToken.address,
                        quote1.amountOut,
                        '0',
                        TradeType.EXACT_INPUT
                    );

                    // Check if fromToken is approved for spending
                    const isApproved = await router.isTokenApproved(fromToken.address, amountInWei);

                    if (!isApproved) {
                        console.log('Approving fromToken for spending...');
                        const approveTx = await router.approveToken(fromToken.address, amountInWei);
                        console.log(`Approval transaction sent: ${approveTx.hash}`);
                        await approveTx.wait();
                        console.log('Approval confirmed!');
                      } else {
                        console.log('fromToken already approved for spending.');
                      }
                      
                      // Create multi-hop swap parameters
                      const swapParams = await router.createMultihopSwapTransaction(
                        fromToken.address,
                        bestRoute.intermediaryToken?.address ?? '',
                        toToken.address,
                        feeTier1,
                        feeTier2,
                        amountInWei,
                        ethers.parseUnits(quote2.amountOut, toToken.decimals),
                        TradeType.EXACT_INPUT,
                        {
                          slippagePercentage: 1.0, // 1% slippage tolerance for multi-hop
                          recipient: address
                        }
                      );
                      
                      console.log('Executing multi-hop swap...');
                      
                      // Execute the swap
                      const tx = await router.exactInput(swapParams as ExactInputParams);
                      console.log('Transaction sent:', tx.hash);
                      
                      // Wait for transaction to be mined
                      const receipt = await tx.wait();
                      console.log('Transaction confirmed in block', receipt?.blockNumber);
                      console.log('Gas used:', receipt?.gasUsed.toString());
                      
                      console.log('Multi-hop swap completed successfully!');
                      response = `Swap completed!\nTransaction Hash: ${tx.hash}\nView on Explorer: ${EDU_EXPLORER}/tx/${tx.hash}`
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
            console.error("Swap failed:", error);
            callback?.({
                text: `Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
            return false;
        }
    },
    validate: async () => true,
    similes: [
        "like exchanging tokens through SailFish on EDU",
        "like trading with Uniswap pools on EDU",
        "like swapping digital assets through SailFish"
    ],
};