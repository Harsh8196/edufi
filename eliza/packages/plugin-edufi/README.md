# SuperSonic Plugin

A comprehensive plugin for interacting with the Sonic blockchain ecosystem, providing essential DeFi functionality and data integration. This plugin enables seamless interaction with Sonic's DeFi protocols, including Beethoven X (Beets), Silo Finance, and various data providers.

## Features

### Core Actions

1. **Basic Operations**
   - Native S token transfers ✓
   - ERC20 token transfers ✓
   - Portfolio tracking and balance management ✓

2. **Beets DEX Integration**
   - Add/Remove liquidity for Weighted Pools
   - Balancer V2 style pool operations
   - Support for wS-stS pool operations
   - Flash swap functionality

3. **Beets Liquid Staking**
   - Staking operations ✓
   - Reward tracking ✓
   - Unstaking functionality ✓
   - Withdrawal operations ✓

4. **Silo Finance Integration**
   - Deposit functionality ✓
   - Withdrawal operations ✓
   - Borrowing capabilities ✓
   - Repayment operations ✓
   - Health factor monitoring (Coming soon)

### Providers

1. **Wallet Provider** ✓
   - Sonic network configuration (Chain ID: 146)
   - Transaction management
   - Gas estimation
   - Balance tracking
   - Token support

2. **CoinGecko Provider** ✓
   - Real-time cryptocurrency prices
   - Token metadata and information
   - Historical price data
   - Market metrics
   - Color-coded price changes
   - Market cap information

3. **DefiLlama Provider** ✓
   - Protocol TVL tracking
   - DeFi protocol analytics
   - Chain-specific metrics
   - Protocol market share calculations
   - Global DeFi metrics

## Supported Tokens

- Native S (Sonic)
- wS (Wrapped Sonic)
- stS (Staked Sonic)
- WETH
- USDC
- EURC
- USDT

## Contract Addresses

### Core Infrastructure
- Beets Vault V2: `0xBA12222222228d8Ba445958a75a0704d566BF2C8`
- Beets Vault V3: `0xbA1333333333a1BA1108E8412f11850A5C319bA9`

### Tokens
- Wrapped S (wS): `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38`
- WETH: `0x50c42dEAcD8Fc9773493ED674b675bE577f2634b`
- USDC: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`

## Network Information

- Chain ID: 146 (0x92)
- RPC Endpoint: https://rpc.soniclabs.com
- Block Explorer: https://sonicscan.org/

## Development Status

### Completed Features ✓
- Basic token operations
- Wallet integration
- Price data integration
- TVL tracking
- Beets liquid staking
- Basic Silo lending operations

### In Progress
- Advanced lending features
- Health factor monitoring
- Additional market support
- Enhanced analytics

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
