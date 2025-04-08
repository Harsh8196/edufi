import type { Chain } from "viem";

// Define EDU chain configuration
export const eduChain = {
    id: 41923,
    name: 'EDU Chain',
    nativeCurrency: {
        decimals: 18,
        name: 'Edu Chain',
        symbol: 'EDU',
    },
    rpcUrls: {
        default: { http: ['https://rpc.edu-chain.raas.gelato.cloud'] },
        public: { http: ['https://rpc.edu-chain.raas.gelato.cloud'] },
    },
    blockExplorers: {
        default: { name: 'Explorer', url: 'https://educhain.blockscout.com' },
    },
} as const satisfies Chain;
