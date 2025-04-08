# Supersonic Plugin Development Plan

## Phase 1: Sonic Network Integration

### 1. Information Gathering Requirements

#### Chain Configuration ✓
- [✓] Sonic Network RPC endpoints
  - Primary: https://rpc.soniclabs.com
  - Alternative RPCs available through Ankr, Alchemy, dRPC
- [✓] Chain ID: 146 (0x92)
- [✓] Block explorer URL: https://sonicscan.org/
- [✓] Native token details: S (native), 18 decimals

#### Token Information ✓
- [✓] List of major tokens on Sonic:
  - Wrapped S (wS): 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38
  - WETH: 0x50c42dEAcD8Fc9773493ED674b675bE577f2634b
  - USDC: 0x29219dd400f2Bf60E5a23d13Be72B486D4038894
  - EURC: 0xe715cba7b5ccb33790cebff1436809d36cb17e57
  - USDT: 0x6047828dc181963ba44974801ff68e538da5eaf9
- [ ] CoinGecko IDs for each token (Need to verify from CoinGecko API)

#### DEX Information
Primary Options:
1. Beethoven X (Beets) ✓
   - [✓] Vault V2: 0xBA12222222228d8Ba445958a75a0704d566BF2C8
   - [✓] Vault V3: 0xbA1333333333a1BA1108E8412f11850A5C319bA9
   - [✓] Documentation: https://docs.beets.fi/

2. Shadow Exchange (Uniswap V3 Fork) ✓
   - [✓] Factory: 0xcD2d0637c94fe77C2896BbCBB174cefFb08DE6d7
   - [✓] Router: 0x1D368773735ee1E678950B7A97bcA2CafB330CDc
   - [✓] Universal Router: 0x92643Dc4F75C374b689774160CDea09A0704a9c2
   - [✓] Quoter V2: 0x219b7ADebc0935a3eC889a148c6924D51A07535A

Recommendation: Implement Shadow Exchange first (due to Uniswap V3 compatibility)

#### Lending Protocol Information
Primary Option: Silo Finance V2 ✓
- [✓] Documentation: https://docs.silo.finance/docs/developers/dev-tutorials/
- [✓] GitHub: https://github.com/silo-finance/silo-contracts-v2
- [✓] Contract Addresses:
  - WETH: 0x50c42dEAcD8Fc9773493ED674b675bE577f2634b
  - wS: 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38
  - USDC.e: 0x29219dd400f2Bf60E5a23d13Be72B486D4038894
  - [ ] Need to verify additional lending pool addresses

### Updated Token Information ✓
- [✓] Major tokens with CoinGecko IDs:
  - Sonic (S)
    - CoinGecko ID: sonic-3
    - Native token (no contract address)
  - Shadow (SHADOW)
    - CoinGecko ID: shadow-2
    - Address: 0x3333b97138d4b086720b5ae8a7844b1345a33333
  - SwapX (SWPX)
    - CoinGecko ID: swapx-2
    - Address: 0xa04bc7140c26fc9bb1f36b1a604c7a5a88fb0e70
  - Beets (BEETS)
    - CoinGecko ID: beets
    - Address: 0x2d0e0814e62d80056181f5cd932274405966e4f0
  - Ethereum (WETH)
    - CoinGecko ID: ethereum
    - Address: 0x50c42dEAcD8Fc9773493ED674b675bE577f2634b

### API Integration Plans

#### 1. CoinGecko API Integration ✓
- [✓] Endpoints implemented:
  - `/simple/price`: Get token prices
  - `/coins/{id}`: Get detailed token info
  - `/coins/{id}/market_chart`: Get historical data
  - `/simple/token_price/{platform}`: Get token prices by contract
- [✓] Token list updated for Sonic ecosystem
- [✓] Basic price display implemented
- [-] Enhanced display features planned:
  - [✓] Color-coded price changes (green for positive, red for negative)
  - [ ] Market cap information

#### 2. DefiLlama API Integration ✓
- [✓] Endpoints to implement:
  - `/tvl/sonic`: Get chain TVL
  - `/protocols`: Get protocol data
  - `/protocol/{protocol}`: Get detailed protocol info
- Implementation approach:
  ```typescript
  // Example endpoint structure
  const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
  
  async function getChainTVL() {
    return `${DEFILLAMA_BASE_URL}/v2/chains`;
  }
  ```

### Updated Lending Protocol Information

#### Silo Finance V2 Initial Markets ✓
Primary markets to implement first:
1. WETH/USDC Market
   - WETH: 0x50c42dEAcD8Fc9773493ED674b675bE577f2634b
   - USDC: 0x29219dd400f2Bf60E5a23d13Be72B486D4038894
   - Oracle: CHAINLINK_ETH_USD_aggregator (0x824364077993847f71293B24ccA8567c00c2de11)

2. wS/USDC Market
   - wS: 0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38
   - USDC: 0x29219dd400f2Bf60E5a23d13Be72B486D4038894
   - Oracle: CHAINLINK_S_USD_aggregator (0xc76dFb89fF298145b417d221B2c747d84952e01d)

Key Silo Components:
- Each market is two ERC-4626 vaults
- Supports borrowable and non-borrowable deposits
- Uses Chainlink oracles for price feeds
- Implements hooks system for extensibility

### Still Required Information

1. CoinGecko Integration
   - [✓] Verify CoinGecko API endpoints for Sonic network
   - [✓] Get CoinGecko IDs for all supported tokens
   - [✓] Confirm market data availability

2. DefiLlama Integration
   - [✓] Verify DefiLlama API endpoints for Sonic
   - [✓] Get protocol IDs for supported DeFi protocols
   - [✓] Confirm TVL data availability

3. Silo Finance
   - [✓] Get complete list of supported markets
   - [✓] Verify interest rate models
   - [✓] Get oracle addresses for price feeds

4. Additional Protocol Details
   - [✓] Verify gas price calculation method
   - [✓] Get bridge contract interfaces
   - [✓] Verify token decimals for all assets

### Resources for Missing Information

1. For CoinGecko IDs:
   - Check https://www.coingecko.com/en/categories/sonic-ecosystem
   - Use CoinGecko API to query token information

2. For Silo Finance:
   - Contact Silo team for complete market information
   - Check their documentation for additional endpoints
   - Monitor their GitHub for contract updates

3. For DefiLlama:
   - Check https://defillama.com/chain/Sonic
   - Use their API documentation for endpoints
   - Monitor their GitHub for integration details

### 2. Provider Migration Plan

#### 2.1 CoinGecko Provider ✓
- [✓] Update TRACKED_TOKENS list with Sonic ecosystem tokens
- [✓] Verify CoinGecko IDs for Sonic tokens
- [✓] Add Sonic-specific market data endpoints
- [✓] Update price formatting for Sonic token decimals
- [✓] Add color-coded price changes
- [✓] Add market cap information
- [✓] Add last updated time display

#### 2.2 DefiLlama Provider ✓
- [✓] Update chain identifier from to 'Sonic'
- [✓] Add Sonic-specific TVL tracking
- [✓] Update protocol list for Sonic ecosystem
- [✓] Modify TVL calculation logic for Sonic
- [✓] Add global DeFi metrics
- [✓] Improve error handling for protocol data
- [✓] Add protocol market share calculations

#### 2.3 Wallet Provider ✓
- [✓] Update chain configuration for Sonic
  - [✓] Chain ID: 146 (0x92)
  - [✓] RPC URL: https://rpc.soniclabs.com
  - [✓] Explorer: https://explorer.soniclabs.com
  - [✓] Native token: S (18 decimals)
- [✓] Update environment configuration
  - [✓] Keep EVM variables for chain compatibility
  - [✓] Update validation schema
  - [✓] Add Sonic-specific settings
- [✓] Update wallet implementation
  - [✓] Modify provider initialization
  - [✓] Update balance formatting
  - [✓] Add token support
  - [✓] Update gas estimation

### 3. Action Migration Plan

#### 3.1 Basic Actions ✓
- [✓] Update transfer action for Sonic native token
- [✓] Modify ERC20 transfer for Sonic token standards
- [✓] Update portfolio tracking for Sonic tokens
- [✓] Adjust gas estimation for Sonic network

#### 3.2 Swap Actions
- [✓] Add support for Beets
  - [✓] Integrate Balancer V2 style pools
  - [✓] Add weighted pool support
  - [✓] Implement swaps


#### 3.3 Lending Actions
- [ ] Update Silo Finance integration
  - [✓] Deposit
  - [✓] Withdraw
  - [✓] Borrow
  - [✓] Repay
  - [ ] Implement health factor monitoring
  - [ ] Add more tokens supported (WETH, stS)


### 4. Configuration Updates

#### 4.1 Chain Configuration
- [✓] Update chain ID and network name
- [✓] Modify RPC endpoints
- [✓] Update explorer URLs
- [✓] Adjust native token configuration

#### 4.2 Token Configuration
- [✓] Update token list with Sonic ecosystem tokens
- [✓] Add token addresses and decimals
- [✓] Update token metadata
- [✓] Modify token validation logic

## Phase 2: New Feature Implementation

### 1. Provider Improvements

#### 1.1 DefiLlama Provider Enhancement
- [✓] Add protocol-specific analytics
- [✓] Implement yield tracking
- [✓] Add historical TVL data
- [✓] Include volume analytics

### 2. New Provider Implementation

#### 2.1 GeckoTerminal Provider
- [✓] Implement real-time price feeds
- [✓] Add trading pair analytics
- [✓] Include liquidity tracking
- [✓] Add trading volume analysis

#### 2.2 Blockchain Explorer Provider
- [✓] Show stats for latest blocks
- [✓] Show account info
- [✓] Show network stats

#### 2.3 Token Provider
- [✓] Implement token provider
- [✓] Add token price tracking
- [✓] Include token market cap
- [✓] Add token volume analysis

#### 2.4 Market Analysis Provider
- [✓] Implement market analysis provider
- [✓] Add top gainers and losers
- [✓] Include volume analytics
- [✓] Add price change analysis





### 3. Other Protocol Integrations

#### 3.3 Liquid Staking Integration (Beets)
- [✓] Implement staking actions
- [✓] Add reward tracking
- [✓] Implement unstaking functionality
- [✓] Implement withdraw functionality

#### 3.4 Add/remove Liquidity actions (Beets)
- [ ] Implement add liquidity actions
- [ ] Implement remove liquidity actions

## Required Documentation & Resources

1. Sonic Network
   - Network documentation
   - RPC endpoints
   - Chain specifications
   - Token standards

2. DEX Integration
   - Router contract ABI
   - Factory contract ABI
   - Liquidity pool specifications
   - Price oracle documentation

3. Lending Protocol
   - Protocol documentation
   - Contract addresses
   - Interest rate models
   - Risk parameters

4. SDK Documentation
   - Uniswap V3 SDK
   - Aave V3 SDK
   - Web3 libraries
   - Testing frameworks

## Implementation Priority

1. Basic Integration (Phase 1)
   - Chain configuration ✓
   - Token configuration ✓
   - CoinGecko provider ✓
   - DefiLlama provider ✓

2. Core DeFi Features (Phase 2)
   - Beets Exchange integration (Balancer Fork) ✓
   - Basic Silo Finance integration (WETH/USDC market) ✓
   - Token transfers and approvals ✓

3. Advanced Features (Phase 3)
   - Additional Silo markets
   - Advanced lending features
   - Liquid staking integration ✓
   - Analytics and monitoring

## Testing Strategy

1. Unit Testing
   - Provider functionality
   - Action validation
   - Token handling
   - Error scenarios

2. Integration Testing
   - Cross-provider operations
   - Multi-action workflows
   - Network interaction
   - Error handling

3. End-to-End Testing
   - Complete user workflows
   - Performance testing
   - Security validation
   - Edge cases

## Documentation Requirements

1. Technical Documentation
   - Architecture overview
   - Integration guides
   - API references
   - Configuration guides

2. User Documentation
   - Feature guides
   - Troubleshooting
   - Best practices
   - Examples
