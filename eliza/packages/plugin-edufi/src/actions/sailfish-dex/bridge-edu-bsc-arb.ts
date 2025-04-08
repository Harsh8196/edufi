import type { Action, Memory } from "@elizaos/core";
import { ethers } from "ethers";
import {
    TOKENS,
    getTokenBySymbol,
    type TokenSymbol,
} from "../../config/tokens";
import { Bridge } from "../../sailfishdex/bridge";

const BSC_RPC_URL = 'https://bsc-dataseed.binance.org/'

export const bridgeBSCToARB: Action = {
    name: "BRIDE_BSC_ARB",
    description: "Bridge tokens from BSC to Arbitrum chains using layerzero",
    examples: [
        [
            {
                user: "user1",
                content: {
                    text: "Transfer 0.1 EDU from BSC To Arbitrum on SailFish Dex",
                    entities: {
                        Amount: "0.1",
                        Token: "EDU"
                    }
                }
            },
            {
                user: "assistant",
                content: {
                    text: "Preparing to bridge 0.1 EDU form BSC To Arbitrum on SailFish Dex...",
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
                BSC_RPC_URL
            );

            // Initialize signer
            const signer = new ethers.Wallet(privateKey, provider);
            const address = await signer.getAddress();

            // Initialize Bridge
            const bridge = new Bridge(signer);
            
            // Gas on destination (in ETH)
            const gasOnDestination = '0.0005';

            // Parse message content
            const content = message.content?.text?.match(
                /Transfer ([\d.]+) ([A-Za-z]+) from BSC To Arbitrum (?:\s+on\s+SailFish)?/i
            );

            if (!content) {
                callback?.({
                    text: "Could not parse bridge details. Please use format: Transfer <amountIn> <Token> from BSC To Arbitrum [on SailFish]",
                });
                return false;
            }

            const [, amountIn, fromSymbol] = content;
            
            // Get token configs
            const fromToken = getTokenBySymbol(fromSymbol.toUpperCase() as TokenSymbol);

            if (!fromToken) {
                const supportedTokens = Object.entries(TOKENS)
                    .filter(([_, t]) => t.type === 'native')
                    .map(([symbol]) => symbol)
                    .join(", ");
                callback?.({
                    text: `Invalid token symbol. Supported tokens: ${supportedTokens}`,
                });
                return false;
            }

            // Send initial confirmation
            callback?.({
                text: `"Preparing to bridge ${amountIn} ${fromToken.symbol} from BSC to Arbitrum on SailFish...`,
            });

            // Step 1: Get BNB price for reference
            const bnbPrice = await bridge.getBnbPrice();
            console.log(`Current BNB price: $${bnbPrice.toFixed(2)}`);
            
            // Step 2: Estimate the fee for bridging
            const fee = await bridge.estimateBridgeFee(amountIn, address, gasOnDestination);
            console.log(`Estimated fee: ${fee} BNB (approximately $${(Number(fee) * bnbPrice).toFixed(2)})`);
            
            // Step 3: Check if the user has enough BNB for the transaction
            const hasEnoughBnb = await bridge.hasEnoughBnb(address, fee);
            if (!hasEnoughBnb) {

                callback?.({
                    text: `"Not enough BNB for the transaction. Need at least ${fee} BNB.`,
                });
                
                return false;
            }
            console.log('You have enough BNB for the transaction.');
            
            // Step 4: Check if the user has enough EDU tokens
            const hasEnoughEdu = await bridge.hasEnoughEdu(address, amountIn);
            if (!hasEnoughEdu) {

                callback?.({
                    text: `"Not enough EDU tokens. Need at least ${amountIn} EDU.`,
                });
                
                return false;
            }
            console.log('You have enough EDU tokens for the bridge.');
            
            // Step 5: Check if EDU tokens are approved for the bridge
            const isApproved = await bridge.isEduApproved(address, amountIn);
            if (!isApproved) {
            console.log('Approving EDU tokens for the bridge...');
            const approveTx = await bridge.approveEdu(amountIn);
            console.log(`Approval transaction sent: ${approveTx.hash}`);
            await approveTx.wait();
            console.log('Approval confirmed!');
            } else {
            console.log('EDU tokens already approved for the bridge.');
            }
            
            // Step 6: Execute the bridge transaction
            console.log('Executing bridge transaction...');
            const tx = await bridge.bridgeEduFromBscToArb(amountIn, address, gasOnDestination);
            console.log('Transaction sent:', tx.hash);
            
            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction confirmed in block', receipt?.blockNumber);
            console.log('Gas used:', receipt?.gasUsed.toString());

            const response = [
            "Bridge transaction completed successfully!",
            "",
            `- ${amountIn} EDU tokens are being transferred from BSC to Arbitrum`,
            `- You will receive ${gasOnDestination} ETH on Arbitrum for gas`,
            `- The tokens should arrive on Arbitrum in approximately 3-5 minutes`,
            `- You can check your balance on Arbitrum after that time`,
            "",
            `- View transaction on BSC Explorer: https://bscscan.com/tx/${tx.hash}`,
            `- Check your Arbitrum balance: https://arbiscan.io/address/${address}`,
            ].join('\n');

            callback?.({
                text: response,
            });
            return true;

        } catch (error) {
            console.error("Bridging EDU failed:", error);
            callback?.({
                text: `Bridging EDU failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            });
            return false;
        }
    },
    validate: async () => true,
    similes: [
        "like sending tokens across different blockchains",
        "like using layzero to transfer tokens to Arbitrum",
        "like bridging tokens from BSC to Arbitrum",
    ],
};