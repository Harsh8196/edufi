import type { Plugin } from "@elizaos/core";
import { coinGeckoProvider } from "./providers/coingecko";
import { walletProvider } from "./providers/wallet";
import { transfer } from "./actions/transfer";
import { erc20Transfer } from "./actions/erc20Transfer";
import { portfolio } from "./actions/portfolio";
import { swapQuote } from "./actions/sailfish-dex/get-swap-quote";
import { swapToken } from "./actions/sailfish-dex/swap";
import { geckoTerminalProvider } from "./providers/geckoterminal";
import { tokensProvider } from "./providers/tokens";
import { marketAnalysisProvider } from "./providers/marketAnalysis";
import { explorerProvider } from "./providers/explorer";
import { bridgeBSCToARB } from "./actions/sailfish-dex/bridge-edu-bsc-arb";
import { bridgeARBToEDU } from "./actions/sailfish-dex/bridge-edu-arb-bsc";
import { networkStatus } from "./actions/networkStatus";
import { marketAnalysis } from "./actions/marketanalysis";


export const edufiPlugin: Plugin = {
    name: "edufi",
    description: "Edufi Plugin for Eliza - Edu DeFi Agent",
    actions: [
        transfer,
        erc20Transfer,
        portfolio,
        swapQuote,
        swapToken,
        bridgeBSCToARB,
        bridgeARBToEDU,
        networkStatus,
        marketAnalysis
    ],
    evaluators: [],
    providers: [
        coinGeckoProvider,
        // defiLlamaProvider,
        walletProvider,
        geckoTerminalProvider,
        tokensProvider,
        // marketAnalysisProvider,
        explorerProvider
    ]
};

export default edufiPlugin;

export const actions = {
} as const;

