import type { Action, Memory } from "@elizaos/core";
import { ethers } from "ethers";
import {
    TOKENS,
    getTokenBySymbol,
    type TokenSymbol,
} from "../../config/tokens";
import { Bridge } from "../../sailfishdex/bridge";

const ARB_RPC_URL = 'https://arb1.arbitrum.io/rpc'

export const bridgeARBToEDU: Action = {
    name: "BRIDE_ARB_EDU",
    description: "Bridge tokens from Arbitrum to EDUCHAIN chains using layerzero",
    examples: [
        [
            {
                user: "user1",
                content: {
                    text: "Transfer 0.1 EDU from Arbitrum To EDUCHAIN on SailFish Dex",
                    entities: {
                        Amount: "0.1",
                        Token: "EDU"
                    }
                }
            },
            {
                user: "assistant",
                content: {
                    text: "Preparing to bridge 0.1 EDU form Arbitrum To EDUCHAIN on SailFish Dex...",
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
                ARB_RPC_URL
            );

            // Initialize signer
            const signer = new ethers.Wallet(privateKey, provider);
            const address = await signer.getAddress();

            // Initialize Bridge
            const bridge = new Bridge(signer);

            // Parse message content
            const content = message.content?.text?.match(
                /Transfer ([\d.]+) ([A-Za-z]+) from Arbitrum To EDUCHAIN (?:\s+on\s+SailFish)?/i
            );

            if (!content) {
                callback?.({
                    text: "Could not parse bridge details. Please use format: Transfer <amountIn> <Token> from Arbitrum To EDUCHAIN [on SailFish]",
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
                text: `"Preparing to bridge ${amountIn} ${fromToken.symbol} from Arbitrum To EDUCHAIN on SailFish...`,
            });

            // Step 1: Check if the user has enough EDU tokens on Arbitrum
            const hasEnoughEdu = await bridge.hasEnoughEduOnArb(address, amountIn);
            if (!hasEnoughEdu) {
                callback?.({
                    text: `"Not enough EDU tokens on Arbitrum. Need at least ${amountIn} EDU.`,
                });
                
                return false;
            }
            console.log('You have enough EDU tokens for the bridge.');
            
            // Step 2: Check if EDU tokens are approved for the bridge
            const isApproved = await bridge.isEduApprovedOnArb(address, amountIn);
            if (!isApproved) {
            console.log('Approving EDU tokens for the bridge...');
            const approveTx = await bridge.approveEduOnArb(amountIn);
            console.log(`Approval transaction sent: ${approveTx.hash}`);
            await approveTx.wait();
            console.log('Approval confirmed!');
            } else {
            console.log('EDU tokens already approved for the bridge.');
            }
            
            // Step 3: Execute the bridge transaction
            console.log('Executing bridge transaction...');
            const tx = await bridge.bridgeEduFromArbToEdu(amountIn);
            console.log('Transaction sent:', tx.hash);
            
            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log('Transaction confirmed in block', receipt?.blockNumber);
            console.log('Gas used:', receipt?.gasUsed.toString());

            const response = [
            "Bridge transaction completed successfully!",
            "",
            `- ${amountIn} EDU tokens are being transferred from Arbitrum to EDUCHAIN`,
            `- The tokens should arrive on EDUCHAIN in approximately 15-20 minutes`,
            `- You can check your balance on EDUCHAIN after that time`,
            "",
            `- View transaction on Arbiscan: https://arbiscan.io/tx/${tx.hash}`,
            `- Check your EDUCHAIN balance: https://educhain.blockscout.com/address/${address}`,
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
        "like using layzero to transfer tokens to EDUCHAIN",
        "like bridging tokens from Arbitrum to EDUCHAIN",
    ],
};