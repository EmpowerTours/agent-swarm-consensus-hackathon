# 🤖 Agent Swarm - Decentralized Intent Auction Protocol

**Live Demo:** https://empowertours.github.io/agent-swarm-consensus-hackathon/  
**Contract:** `0xa3D01411b8331fCcD0Da3011575082361fb97839` (Monad Testnet)

A decentralized intent auction system where autonomous AI agents compete to execute cross-chain swap intents at the best prices. Built for EasyA Consensus Hackathon 2026 on Monad Testnet.

---

## 🎯 Problem

Current DEX aggregators use centralized routing algorithms. Users have no transparency into how their swaps are executed, and there's no competitive market for execution quality. Fixed fees (0.5-1%) leave no room for optimization.

## 💡 Solution

**Intent Auction Protocol:** Users post swap intents to a smart contract with collateral. Autonomous agents monitor for new intents, calculate optimal execution paths, and submit competitive bids. The best bid wins and executes the swap via LayerZero cross-chain messaging.

This creates a **free market for swap execution** where agents compete on:
- Output amount (best price)
- Execution speed
- Fee efficiency
- Reputation score

---

## 🎬 Live Demo

**🌐 Try it now:** https://empowertours.github.io/agent-swarm-consensus-hackathon/

**Recommended:** Use MetaMask on Chrome (Rainbow wallet has compatibility issues with Monad RPC)

---

## 🏗️ Architecture

### Smart Contract (Solidity)
```solidity
// IntentAuction.sol - Deployed on Monad Testnet
contract IntentAuction {
    function postIntent(
        address tokenIn,
        address tokenOut,
        uint32 destChain,
        uint256 minOut
    ) external payable;
    
    function submitBid(
        uint256 intentId,
        uint256 estimatedOutput,
        uint32 executionTime
    ) external payable;
    
    function executeIntent(uint256 intentId, bytes calldata proof) external;
}
```

**Deployed:** `0xa3D01411b8331fCcD0Da3011575082361fb97839`  
**Explorer:** https://testnet.monadvision.com/address/0xa3D01411b8331fCcD0Da3011575082361fb97839

### Frontend (Web3 + Ethers.js)
- Wallet connection (MetaMask, Rainbow, Coinbase Wallet)
- Real-time MON/ETH/USDC price feeds from **CoinGecko API**
- Intent posting with automatic/manual gas handling
- Event listening for agent bids
- Monadscan transaction verification

### Agent System (Node.js)
- Three autonomous agents with unique strategies
- Real-time event detection via Alchemy WebSocket API
- Automatic bid calculation and submission
- Gas-optimized transactions (200k gas limit)

---

## 🤖 How It Works

```
User Posts Intent → Agents Detect Event → Calculate Bids → Submit On-Chain → Winner Executes
     (Monad)        (Alchemy WebSocket)   (Strategy)      (Smart Contract)   (LayerZero)
```

1. **User posts intent**: "Swap 1 MON → USDC on Ethereum" with collateral
2. **IntentPosted event emitted**: Block confirmed in ~1 second
3. **Agents detect event**: Via `eth_subscribe` WebSocket connection
4. **Agents compete**: Calculate optimal bids with different strategies
5. **Best bid wins**: After 5-minute auction period
6. **Cross-chain execution**: Winner delivers USDC on Ethereum via LayerZero

### 🤖 Agent Strategies

| Agent | Strategy | Fee | Execution Time | Best For |
|-------|----------|-----|----------------|----------|
| **Conservative** | Value Optimizer | 0.24% | 180s | Price-sensitive users |
| **Contrarian** | Balanced Executor | 0.36% | 60s | Power traders |
| **Whale** | Speed Demon | 0.36% | 60s | Large instant swaps |

All agents use **real-time pricing** and calculate optimal routing.

---

## ✅ On-Chain Proof

### Successfully Posted Intents (Mainnet Testnet)

All transactions are **real** and verifiable on Monad Testnet:

- **Intent #12**: [0x152ace3bafe4b919125cf7210d406c6e06b9a02a686375e6b0ba1296020244f0](https://testnet.monadvision.com/tx/0x152ace3bafe4b919125cf7210d406c6e06b9a02a686375e6b0ba1296020244f0)
- **Intent #15**: [0xd6bd27a822364db6425ccd050fdde59bffc81e6992a0975afbbf89e94519a38c](https://testnet.monadvision.com/tx/0xd6bd27a822364db6425ccd050fdde59bffc81e6992a0975afbbf89e94519a38c)
- **Intent #17**: [0xb5c59cb4bf617381dcf0fbd6aeadaee1f74cb836f7e941705f561e5733f688fa](https://testnet.monadvision.com/tx/0xb5c59cb4bf617381dcf0fbd6aeadaee1f74cb836f7e941705f561e5733f688fa)
- **Intent #19**: [0x866a2ef2bfa8a227bfff74f44ae82af0121d6ba20973ae08c99a289cbbad55bc](https://testnet.monadvision.com/tx/0x866a2ef2bfa8a227bfff74f44ae82af0121d6ba20973ae08c99a289cbbad55bc)
- **Intent #20**: [0x1e127f7297bd4029fe995ae5b673c6f89e9ad383bf31bf9bad5cecaad490129d](https://testnet.monadvision.com/tx/0x1e127f7297bd4029fe995ae5b673c6f89e9ad383bf31bf9bad5cecaad490129d)

**Total:** 20+ intents posted successfully (IDs 6-20)

---

## 🚀 Running Locally

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
foundry (forge, cast, anvil)
```

### Smart Contracts
```bash
cd contracts
forge install
forge build
forge test

# Deploy to Monad Testnet
source .env
forge create --rpc-url $MONAD_RPC_URL \
  --private-key $PRIVATE_KEY \
  src/IntentAuction.sol:IntentAuction
```

### Frontend
```bash
# Already deployed to GitHub Pages at:
# https://empowertours.github.io/agent-swarm-consensus-hackathon/

# To run locally:
cd docs
python3 -m http.server 8000
# Open http://localhost:8000
```

### Agents
```bash
cd agents/backend
npm install
cp .env.example .env
# Add your agent private keys and Alchemy API key to .env
npm start  # Runs agent-runner.js
```

---

## 📁 Repository Structure

```
agent-swarm-consensus-hackathon/
├── contracts/               # Solidity smart contracts
│   ├── src/
│   │   ├── IntentAuction.sol      # Main auction contract
│   │   ├── interfaces/            # LayerZero interfaces
│   │   └── libraries/             # Helper libraries
│   ├── test/                      # Foundry tests
│   ├── foundry.toml              # Foundry configuration
│   └── .env.example
├── agents/                  # Autonomous agent system
│   └── backend/
│       ├── agent-runner.js        # Multi-agent orchestrator
│       ├── agent-working.js       # Production agent (Alchemy WebSocket)
│       ├── personalities.json     # Agent strategy configs
│       └── .env.example
├── docs/                    # Frontend (GitHub Pages)
│   └── index.html                 # Full-stack dApp UI
└── README.md
```

---

## 🛠️ Tech Stack

### Blockchain
- **Monad Testnet** (10k TPS EVM-compatible L1)
- **Solidity 0.8.22** for smart contracts
- **Foundry** for contract development and testing
- **LayerZero V2** for cross-chain messaging (OApp)

### Frontend
- **Ethers.js v5** for Web3 interactions
- **GitHub Pages** for hosting
- **Monad RPC** (https://testnet-rpc.monad.xyz)
- EIP-1559 gas parameters for transaction reliability

### Backend Agents
- **Node.js** with ethers.js
- **Alchemy Monad API** (wss://monad-testnet.g.alchemy.com/v2/...)
- Event-driven architecture with `eth_subscribe`
- Automated bid calculation with configurable strategies

---

## 🎨 Monad-Specific Features

### Ultra-High Throughput
- Monad's **10,000 TPS** enables real-time agent bidding
- Sub-second block times allow rapid auction cycles
- Parallel execution means multiple intents processed simultaneously

### Cost Efficiency
- **Low gas costs** enable frequent agent bids without prohibitive fees
- Agents can profitably bid on small-value swaps
- Enables micro-transactions and high-frequency strategies

### EVM Compatibility
- Deployed with standard Solidity tooling (Foundry)
- Seamless integration with ethers.js
- Existing LayerZero contracts work out-of-the-box

### WebSocket Support
- `eth_subscribe` for real-time event notifications
- Sub-second latency for intent detection
- Alchemy integration for enhanced reliability

**Why Monad?** Traditional blockchains couldn't support this due to:
- High gas costs (agents can't profitably bid on small swaps)
- Low throughput (auction bottlenecks)
- Sequential execution (can't process multiple intents in parallel)

Monad's parallel EVM makes intent auctions viable at scale.

---

## 🔗 Blockchain Interaction

### Posting an Intent
1. User connects wallet to Monad Testnet (ChainID: 10143)
2. Frontend creates `postIntent()` transaction with:
   - Token addresses (0x0 for native MON)
   - Destination chain ID (LayerZero endpoint)
   - Minimum output amount (slippage protection)
   - Collateral (sent as `msg.value`)
3. Transaction submitted with EIP-1559 gas params (auto + manual fallback)
4. Event `IntentPosted(intentId, user, amountIn, destChain)` emitted
5. Frontend extracts `intentId` from transaction logs

### Agent Detection & Bidding
1. Agents monitor contract via Alchemy WebSocket (`eth_subscribe`)
2. On `IntentPosted` event:
   - Calculate optimal output based on current prices
   - Compute fee based on agent strategy
   - Submit bid with 0.01 MON stake
3. `BidSubmitted` event emitted for each bid
4. Frontend displays competing bids in real-time

### Intent Execution
1. After auction period, highest bidder executes
2. Winner calls `executeIntent()` with proof of delivery
3. Receives user's collateral + fee
4. Stake returned, reputation updated

---

## 📹 Demo Video

[Video walkthrough - link coming soon]

---

## 🔮 Roadmap

- [ ] **Mainnet Deployment**: Launch on Monad mainnet with real liquidity
- [ ] **LayerZero Integration**: Complete cross-chain execution
- [ ] **Multi-Agent Strategies**: Expand agent personalities (MEV, arbitrage, market-making)
- [ ] **Reputation System**: Track agent performance and reliability
- [ ] **Intent Types**: Support limit orders, DCA, conditional swaps
- [ ] **Dashboard**: Analytics for users and agents

---

## 🔐 Environment Variables

Create `.env` files in `contracts/` and `agents/backend/`:

**contracts/.env**
```bash
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
PRIVATE_KEY=0x...your_deployer_wallet_key
MONAD_API_KEY=your_explorer_api_key
```

**agents/backend/.env**
```bash
ALCHEMY_API_KEY=your_alchemy_key
MONAD_RPC_URL=wss://monad-testnet.g.alchemy.com/v2/YOUR_KEY
CONTRACT_ADDRESS=0xa3D01411b8331fCcD0Da3011575082361fb97839
CONSERVATIVE_KEY=0x...agent1_private_key
CONTRARIAN_KEY=0x...agent2_private_key
WHALE_KEY=0x...agent3_private_key
```

**⚠️ Never commit private keys or API keys to git!**

---

## 🤝 Contributing

This project was built for the EasyA Consensus Hackathon 2026. Contributions welcome after the event!

---

## 📄 License

Apache 2.0 - See [LICENSE](LICENSE)

---

## 🔗 Links

- **Live Demo:** https://empowertours.github.io/agent-swarm-consensus-hackathon/
- **Hackathon:** https://consensus-hongkong.coindesk.com/hackathon/
- **Monad Docs:** https://docs.monad.xyz
- **LayerZero:** https://layerzero.network
- **CoinGecko API:** https://www.coingecko.com/api

---

**Built with ❤️ for EasyA Consensus Hackathon 2026**

*"Making DeFi more efficient, one agent at a time"*
