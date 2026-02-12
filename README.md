# 🤖 Agent Swarm Intent Auction

> AI agents compete in real-time to execute your cross-chain swaps at the best price

**Built for:** [EasyA Consensus Hackathon 2026](https://easya-ltd.notion.site/EasyA-Consensus-Hackathon-Hong-Kong-f7ebf8719d6d82b5bc3581c62463d426) (Hong Kong)  
**Blockchain:** Monad Testnet  
**Team:** EmpowerTours

---

## 🎯 Problem & Solution

### The Problem
Traditional DEX swaps are inefficient:
- ❌ Fixed 0.5-1% fees
- ❌ No competition for best execution
- ❌ Manual cross-chain routing
- ❌ High slippage on large trades

### Our Solution: Agent Swarm
- ✅ **AI agents compete** for every swap intent
- ✅ **Best bid wins** automatically on-chain
- ✅ **Cross-chain execution** via LayerZero
- ✅ **Real-time pricing** from CoinGecko API
- ✅ **Gas-efficient** on Monad (10,000 TPS)

---

## 🎬 Live Demo

**🌐 [Try Live Demo](https://empowertours.github.io/agent-swarm-consensus-hackathon/)** • **📹 [Watch Demo Video](https://www.youtube.com/shorts/IQybuWz6--U)**

Click **Start Auction** and watch 3 AI agents compete in real-time! 🚀

### Run Locally

```bash
cd agents
python3 -m http.server 8080
# Open http://localhost:8080/live-demo-ui.html
```

---

## 🏗️ How It Works

```
User Posts Intent → Agents Calculate Bids → Best Bid Wins → Cross-Chain Execution
     (Monad)           (CoinGecko API)      (Smart Contract)    (LayerZero)
```

1. **User posts intent**: "Swap 1 MON → USDC on Ethereum"
2. **Agents compete**: 3 agents calculate optimal bids with different strategies
3. **Best bid selected**: User chooses winner (or auto-select highest output)
4. **Cross-chain execution**: Winner fulfills swap via LayerZero bridge

---

## 🤖 Agent Strategies

| Agent | Strategy | Fee | Execution Time | Best For |
|-------|----------|-----|----------------|----------|
| **Conservative** | Value Optimizer | 0.24% | 180s | Price-sensitive users |
| **Contrarian** | Balanced Executor | 0.36% | 60s | Power traders |
| **Whale** | Speed Demon | 0.36% | 60s | Large instant swaps |

All agents use **real-time CoinGecko prices** and calculate optimal routing.

---

## 📊 Smart Contract

**Deployed on Monad Testnet:**
- Address: `0xa3D01411b8331fCcD0Da3011575082361fb97839`
- Explorer: https://testnet.monadscan.com/address/0xa3D01411b8331fCcD0Da3011575082361fb97839
- Verified: ✅

### Key Functions

```solidity
// User functions
postIntent(tokenIn, tokenOut, destChain, minOut) payable
executeIntent(intentId, agent)

// Agent functions  
submitBid(intentId, estimatedOutput, executionTime, route) payable
```

**Security Features:**
- Intent escrow prevents rug pulls
- 0.01 ETH agent stake prevents spam
- User selects winner (no auto-execution)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd agents
npm install
```

### 2. Run Live Auction

```bash
export COINGECKO_API_KEY=your_api_key_here
node run-live-auction.js
```

### 3. View Demo UI

```bash
python3 -m http.server 8080
# Open http://localhost:8080/live-demo-ui.html
```

---

## 📁 Project Structure

```
agent-swarm-clean/
├── contracts/
│   └── IntentAuction.sol          # Main auction contract (Solidity)
├── agents/
│   ├── run-live-auction.js        # Live demo script (Node.js)
│   ├── live-demo-ui.html          # Interactive web UI
│   ├── personalities.json         # Agent strategy configs
│   └── package.json               # Dependencies
├── deployment/
│   └── DEPLOYED.md                # Deployment records & verification
├── docs/
│   └── index.html                 # GitHub Pages demo
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔧 Tech Stack

- **Smart Contracts:** Solidity 0.8.22, Foundry
- **Blockchain:** Monad Testnet (10,000 TPS)
- **Cross-Chain:** LayerZero V2 OApp Protocol
- **Price Feeds:** CoinGecko API (free tier)
- **Backend:** Node.js, ethers.js v6
- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)

---

## 💎 Example Auction

**User Intent:** Swap 1 MON → USDC on Ethereum (worth $5)

**Agent Bids:**
```
Conservative: $4.99 USDC (0.24% fee, 180s) 🏆
Contrarian:   $4.98 USDC (0.36% fee, 60s)
Whale:        $4.98 USDC (0.36% fee, 60s)
```

**Winner:** Conservative Agent  
**User Saves:** $0.03 vs 0.5% traditional DEX fee  
**Transaction:** https://testnet.monadscan.com/tx/0xf2e4a96a...

---

## 📹 Demo Video

[![Watch Demo](https://img.shields.io/badge/▶️_Watch_Demo-YouTube_Shorts-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/shorts/IQybuWz6--U)

---

## 🧪 Testing

Smart contract tests:
```bash
cd contracts
forge test
forge coverage
```

---

## 🏆 Hackathon Submission Checklist

✅ Built on blockchain (Monad testnet)  
✅ DeFi application for efficient trading  
✅ Smart contract deployed & verified  
✅ Open source repository  
✅ Live demo on GitHub Pages  
✅ Demo video (to be added)  
✅ Technical documentation  
✅ Canva presentation (to be added)

---

## 🔐 Environment Variables

Create `.env` file:

```bash
COINGECKO_API_KEY=your_key_here
PRIVATE_KEY=0x...your_wallet_key
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

**Never commit API keys or private keysecho ___BEGIN___COMMAND_OUTPUT_MARKER___ ; PS1= ; PS2= ; unset HISTFILE ; EC=0 ; echo ___BEGIN___COMMAND_DONE_MARKER___0 ; }*

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
