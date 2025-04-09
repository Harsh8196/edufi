# EDUFi: EDU Chain DeFi Agent Swarm

<div align="center">
  <h3>Revolutionizing EDU chain DeFi with AI-Powered Agent Swarms</h3>
  <p>Simplify your EDU chain DeFi experience with the power of Multi-Agent Systems (MAS)</p>
  💥 EDU Chain Hackathon: Semester 3 💥
</div>


---

## 📚 Table of Contents

- [🌟 Overview](#-overview)
  - [Why Multi-Agent Systems (MAS)?](#why-multi-agent-systems-mas)
- [✨ Features](#-features)
  - [Core Features](#core-features)
  - [EDU Chain Features](#EDU-features)
- [🧰 Tech Stack](#-tech-stack)
- [🏠 Self-Hosting (Recommended)](#-self-hosting-recommended)
  - [Requirements for Self-Hosting](#requirements-for-self-hosting)
  - [Support](#support)
- [💎 Service Packages](#-service-packages)
- [🚀 Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Agent](#running-the-agent)
  - [Running the Web Client](#running-the-web-client)
- [🧪 How to use?](#-how-to-use)
- [🔍 Important Notes](#-important-notes)
- [🛠️ Development](#️-development)
  - [Project Structure](#project-structure)

## 🌟 Overview

EDUFi is an innovative open-source project revolutionizing the EDU chain DeFi landscape through AI-powered agent swarms. By employing a sophisticated multi-agent system, EDUFi streamlines and automates DeFi operations, offering users a seamless and efficient experience on EDU Chain. Its modular design ensures scalability and adaptability, empowering users to navigate the complexities of DeFi with ease and confidence.

### Why Multi-Agent Systems (MAS)?

Our platform leverages a Multi-Agent System architecture where each agent specializes in specific tasks—from fetching metrics to executing trades—enabling modular, scalable, and efficient operations. This approach ensures:

- **🎯 Specialization**: Optimized performance through task-specific agents
- **📈 Scalability**: Easy addition of new agents and features
- **🛡️ Robustness**: Continued operation even if individual agents fail
- **⚡ Efficiency**: Parallel task execution for improved performance
- **🔄 Adaptability**: Seamless integration with new protocols and APIs

## ✨ Features

### Core Features

- 💬 Natural language processing
- 🔍 RAG (Retrieval-Augmented Generation) Knowledge Base
- 🤖 Multi-Agent System (MAS): AI Agents - *(Coming Soon)*
- 🔅 Integrated Website & Web App - *(Coming Soon)*
- 🛠️ Full-featured Discord, Twitter and Telegram connectors - *(Coming Soon)*
- 🔗 Support for every model (OpenAI, etc.)
- 💰 Real-time prices using CoinGecko API
- 📊 Real-time Pools data using GeckoTerminal
- 📝 Text generation and analysis
- 🚀 Highly extensible - create your own actions and clients

### EDU chain Features

- 💰 Wallet management
- 💸 Token transfers (EDU, USDT, and custom tokens)
- 💱 Token swapping on SailFish DEX
- 🔍 Transaction tracking
- 🌐 Bridge tokens using SailFish(LayerZero)

## 🧰 Tech Stack

- ElizaOS
- Vite
- Typescript
- NodeJS


## 🏠 Self-Hosting (Recommended)

### Requirements for Self-Hosting
- Server or cloud instance (e.g., AWS, DigitalOcean, or your local machine)
- API keys for required services.
- Basic knowledge of TypeScript/Node.js for customization

### Support
While self-hosting is a DIY approach, we provide:
- Detailed documentation
- Community support via Discord
- GitHub issues for bug reports
- Basic setup guidance

## 🚀 Quick Start

### Prerequisites

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Git](https://git-scm.com/downloads)
- [pnpm](https://pnpm.io/installation)

> **Note for Windows Users:** [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual) and [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) are required.

### Installation

```bash
# Clone the repository
git clone https://github.com/Harsh8196/edufi
cd edufi/eliza

# Install dependencies
pnpm install --no-frozen-lockfile

# Copy environment file
cp .env.example .env
```

### Configuration

Edit `.env` file and add your credentials:

```env
# Required for EDU operations
EVM_PRIVATE_KEY=your_private_key

# Choose an API provider and add the API_KEY on the env file
OPENAI_API_KEY=                # OpenAI API key, starting with sk-
ANTHROPIC_API_KEY=             # For Claude (optional)

### Running the Agent

```bash
# Build the project
pnpm build

# Start a single agent (Recommended for testing)
pnpm start

### Running the Web Client

In a new terminal, run the following command:

```bash
pnpm start:client
```

## 🧪 How to use?

Interact with the agents with these example prompts:

### TVL Metrics
```
Show me market analysis on EDU
```

### Price Metrics (CoinGecko)
```
Get prices for eth, btc, blend, usdt, usdc, eds and wedu
```

### Pools Data (GeckoTerminal)
```
Show me TVL and Volume of the top pools on EDU network
```

### Wallet Operations
```
Show me my EDU wallet address and EDU balance
```
```
Show my portfolio
```

### Explorer Provider
```
Get info for wallet 0x34E3A191058F0c9aE81B8eC208A06F22845C143F
```
```
Show me network status
```
```
Show me the recent blocks
```

### Token Transfers
```
Send 0.1 EDU to 0x59aC5FC4e742e30E7870C0c1C7d7fC850D0CF51C
```
```
Send 0.1 WISER to 0x59aC5FC4e742e30E7870C0c1C7d7fC850D0CF51C
```
### SailFish Quote 
```
Get a quote for swapping 1 WEDU to USDC on SailFish dex
```
```
Get a quote for swapping 1 WISER to USDC on SailFish dex
```

### Token Swaps (SailFish DEX)
```
Swap 0.1 WEDU for USDC
```
```
Swap 0.01 USDC for WEDU
```
```
Swap 1 WISER for USDC
```

### Bridge Tokens (SailFish) - (WIP - Only EDU Token available for bridge)
```
Transfer 0.1 EDU from BSC To Arbitrum on SailFish Dex
```
```
Transfer 0.1 EDU from Arbitrum To EDUCHAIN on SailFish Dex
```


## 🔍 Important Notes

- Ensure you have sufficient funds for transaction fees.
- Always double-check addresses and amounts before executing transactions.


### Project Structure

```
README.md                                       # This file
eliza/                                          # Eliza project
  ├── packages/
  │   ├── core/                                 # Eliza core functionality
  │   ├── plugin-edufi/                         # EDU integration
  │   │   ├── src/
  │   │   │   ├── actions/      
  │   │   │   │   ├── sailfish-dex/             # Dex Actions (SailFish)
  │   │   │   │   │   ├── bridge-edu-arb-bsc.ts
  │   │   │   │   │   ├── bridge-edu-bsc-arb.ts
  │   │   │   │   │   ├── get-swap-quote.ts
  │   │   │   │   │   └── swap.ts
  │   │   │   │   ├── erc20Transfer.ts      # ERC20 Transfer Action
  │   │   │   │   ├── transfer.ts           # EDU Transfer Action
  │   │   │   │   └── portfolio.ts          # Portfolio Action
  │   │   │   ├── providers/    
  │   │   │   │   ├── coingecko.ts          # CoinGecko Provider
  │   │   │   │   ├── explorer.ts           # Explorer Provider
  │   │   │   │   └── wallet.ts             # EDU Wallet Provider
  │   │   │   └── ...