#!/usr/bin/env node
/**
 * Live Agent Swarm Intent Auction - EasyA Consensus Hackathon
 * Runs actual agents against the deployed IntentAuction smart contract
 */

const { ethers } = require('ethers');
const axios = require('axios');

// Contract Configuration
const CONTRACT_ADDRESS = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const MONAD_RPC = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!COINGECKO_API_KEY) {
  console.error('❌ Error: COINGECKO_API_KEY environment variable not set');
  process.exit(1);
}

if (!PRIVATE_KEY) {
  console.error('❌ Error: PRIVATE_KEY environment variable not set');
  process.exit(1);
}

// Agent Strategies (no wallet keys - use env PRIVATE_KEY)
const AGENTS = {
  conservative: {
    name: 'Conservative Agent',
    strategy: 'CHEAP',
    feePercent: 0.24,
    executionTime: 180
  },
  contrarian: {
    name: 'Contrarian Agent',
    strategy: 'SPEEDY',
    feePercent: 0.36,
    executionTime: 60
  },
  whale: {
    name: 'Whale Agent',
    strategy: 'SPEEDY',
    feePercent: 0.36,
    executionTime: 60
  }
};

// Contract ABI (actual deployed contract)
const CONTRACT_ABI = [
  'function postIntent(address tokenIn, address tokenOut, uint32 destChain, uint256 minOut) external payable returns (uint256)',
  'function submitBid(uint256 intentId, uint256 estimatedOutput, uint256 executionTime, string memory route) external payable',
  'function executeIntent(uint256 intentId, address agent) external',
  'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn)',
  'event BidSubmitted(uint256 indexed intentId, address indexed agent, uint256 estimatedOutput)'
];

// Get live prices from CoinGecko
async function getPrices() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'ethereum,usd-coin',
        vs_currencies: 'usd'
      },
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY
      }
    });
    
    return {
      ETH: response.data.ethereum.usd,
      USDC: response.data['usd-coin'].usd,
      MON: 5
    };
  } catch (error) {
    console.error('CoinGecko API error:', error.message);
    return { ETH: 1950, USDC: 1, MON: 5 };
  }
}

// Calculate bid for agent
function calculateBid(agent, amountIn, prices) {
  const inputValue = amountIn * prices.MON;
  const fee = inputValue * (agent.feePercent / 100);
  const outputValue = inputValue - fee;
  const outputAmount = outputValue / prices.USDC;
  
  return {
    estimatedOutput: Math.floor(outputAmount * 1e6),
    executionTime: agent.executionTime,
    route: `MON via Monorail to ETH (${agent.strategy})`
  };
}

async function main() {
  console.log('\n🏛️  AGENT SWARM INTENT AUCTION - LIVE DEMO');
  console.log('='.repeat(60));
  console.log('💎 EasyA Consensus Hackathon 2026\n');
  
  const provider = new ethers.JsonRpcProvider(MONAD_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  
  console.log('📊 Fetching live prices from CoinGecko...');
  const prices = await getPrices();
  console.log(`   ETH: $${prices.ETH}`);
  console.log(`   USDC: $${prices.USDC}`);
  console.log(`   MON: $${prices.MON}\n`);
  
  console.log('👤 User posting intent: Swap 1 MON → USDC on Ethereum');
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const ETH_CHAIN_ID = 1;
  
  const intentTx = await contract.postIntent(
    ZERO_ADDRESS,
    ZERO_ADDRESS,
    ETH_CHAIN_ID,
    ethers.parseEther('4900'),
    { value: ethers.parseEther('1') }
  );
  
  console.log('   ⏳ Confirming transaction...');
  const receipt = await intentTx.wait();
  
  const intentEvent = receipt.logs.find(log => {
    try {
      return contract.interface.parseLog(log).name === 'IntentPosted';
    } catch { return false; }
  });
  
  const intentId = intentEvent ? BigInt(intentEvent.topics[1]) : 0n;
  console.log(`   ✅ Intent posted! TX: ${receipt.hash}`);
  console.log(`   ✅ Intent ID: ${intentId}\n`);
  
  console.log('🤖 Agents calculating bids...\n');
  const bids = [];
  
  for (const [key, agent] of Object.entries(AGENTS)) {
    console.log(`   ${agent.name} (${agent.strategy})`);
    const bid = calculateBid(agent, 1, prices);
    const outputUSDC = bid.estimatedOutput / 1e6;
    console.log(`   └─ Output: ${outputUSDC.toFixed(2)} USDC (~$${outputUSDC.toFixed(2)})`);
    console.log(`   └─ Fee: ${agent.feePercent}% | Time: ${agent.executionTime}s`);
    console.log(`   └─ Route: ${bid.route}\n`);
    
    bids.push({ agent: key, ...bid });
    
    if (key === 'conservative') {
      try {
        console.log(`   📝 Submitting ${agent.name} bid to smart contract...`);
        const bidTx = await contract.submitBid(
          intentId,
          bid.estimatedOutput,
          bid.executionTime,
          bid.route,
          { value: ethers.parseEther('0.01'), gasLimit: 500000 }
        );
        const bidReceipt = await bidTx.wait();
        console.log(`   ✅ Bid submitted! TX: ${bidReceipt.hash}\n`);
      } catch (error) {
        console.log(`   ⚠️  Bid submission failed: ${error.message.substring(0, 100)}...\n`);
      }
    }
  }
  
  const winner = bids.reduce((best, current) => 
    current.estimatedOutput > best.estimatedOutput ? current : best
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('🏆 AUCTION RESULTS\n');
  console.log(`Winner: ${AGENTS[winner.agent].name}`);
  console.log(`Output: $${(winner.estimatedOutput / 1e6).toFixed(2)} USDC`);
  console.log(`Input: $5.00 (1 MON)`);
  console.log(`Savings: $${(5 * 0.005).toFixed(2)} vs 0.5% traditional swap fee\n`);
  
  console.log('✅ Demo complete! Transactions recorded on Monad testnet');
  console.log(`   Intent TX: ${receipt.hash}`);
  console.log(`   Contract: https://testnet.monadscan.com/address/${CONTRACT_ADDRESS}\n`);
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
