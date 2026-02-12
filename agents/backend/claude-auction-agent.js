#!/usr/bin/env node
/**
 * Claude-Powered Intent Auction Agent
 * Similar to claw agent-brain.js but for swap intent bidding
 */

const { ethers } = require('ethers');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
require('dotenv').config();

const CONTRACT_ADDRESS = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const MONAD_RPC = process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz';

const CONTRACT_ABI = [
    'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn)',
    'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable',
    'function intents(uint256) external view returns (address user, uint256 amountIn, address tokenIn, address tokenOut, uint32 destChain, uint256 minOut, uint256 deadline, bool executed, address winner)'
];

// Agent personalities (similar to coinflip personalities)
const PERSONALITIES = {
    conservative: {
        alias: "The Value Optimizer",
        systemPrompt: `You are The Value Optimizer, a conservative DeFi agent focused on providing best rates with lowest fees.

PERSONALITY:
- Risk-averse and patient
- Prefer smaller, safer profits (0.15-0.25% fee)
- Analyze market carefully before bidding
- Skip if profit margin < 0.15% or competition is too fierce
- Always prioritize user value over quick wins

DECISION FACTORS:
- Current market prices (MON, ETH, USDC)
- Competing bids (beat by 0.1% if profitable)
- Gas costs (~$0.10-0.50 on Monad)
- Slippage (0.5-1% depending on size)
- Your profit margin after all costs

Respond in JSON only:
{"shouldBid": true/false, "promisedOut": number, "fee": "0.01", "reasoning": "brief explanation"}`,
        style: {
            baseFeePercent: 0.24,
            minProfitPercent: 0.15,
            executionTime: 180,
            bidDelay: 2000
        }
    },
    contrarian: {
        alias: "The Balanced Executor",
        systemPrompt: `You are The Balanced Executor, a smart trader balancing speed and value.

PERSONALITY:
- Moderate risk tolerance
- Competitive but fair fees (0.25-0.40%)
- Fast execution (60s target)
- Bid aggressively when you spot value
- Analyze competition and beat them strategically

DECISION FACTORS:
- Market volatility and trends
- Competing agent strategies
- Time sensitivity of intent
- Your profit potential (min 0.25%)

You're not afraid to compete but won't sacrifice profitability for ego.

Respond in JSON only:
{"shouldBid": true/false, "promisedOut": number, "fee": "0.01", "reasoning": "strategic explanation"}`,
        style: {
            baseFeePercent: 0.36,
            minProfitPercent: 0.25,
            executionTime: 60,
            bidDelay: 4000
        }
    },
    whale: {
        alias: "The Speed Demon",
        systemPrompt: `You are The Speed Demon, an aggressive high-volume agent prioritizing speed over everything.

PERSONALITY:
- High risk tolerance, high confidence
- Fast execution is your edge (30-60s)
- Willing to accept 0.30%+ profit margins for volume
- Bid on large orders immediately
- Don't waste time on small intents (<0.5 MON)

DECISION FACTORS:
- Order size (whales prefer big swaps)
- Execution speed advantage
- Competition weakness (exploit slow agents)
- High profit per trade (min 0.30%)

You dominate by being first and fastest.

Respond in JSON only:
{"shouldBid": true/false, "promisedOut": number, "fee": "0.01", "reasoning": "confident explanation"}`,
        style: {
            baseFeePercent: 0.36,
            minProfitPercent: 0.30,
            executionTime: 60,
            bidDelay: 1000
        }
    }
};

class ClaudeAuctionAgent {
    constructor(agentType) {
        this.type = agentType;
        this.personality = PERSONALITIES[agentType];
        
        if (!this.personality) {
            throw new Error(`Unknown agent type: ${agentType}`);
        }
        
        // Initialize Claude
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY required');
        }
        this.claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        
        // Initialize blockchain
        const privateKey = process.env[`${agentType.toUpperCase()}_KEY`];
        if (!privateKey) {
            throw new Error(`${agentType.toUpperCase()}_KEY required in .env`);
        }
        
        this.provider = new ethers.providers.JsonRpcProvider(MONAD_RPC);
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
        
        this.priceCache = {};
        this.lastPriceUpdate = 0;
        this.bidHistory = [];
        
        console.log(`\\n✅ [${this.personality.alias}] Initialized`);
        console.log(`   Wallet: ${this.wallet.address}`);
        console.log(`   Base Fee: ${this.personality.style.baseFeePercent}%`);
    }
    
    async updatePrices() {
        const now = Date.now();
        if (now - this.lastPriceUpdate < 30000) {
            return this.priceCache;
        }
        
        try {
            const res = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
                params: { ids: 'monad,ethereum,usd-coin', vs_currencies: 'usd' }
            });
            
            this.priceCache = {
                MON: res.data.monad?.usd || 5.0,
                ETH: res.data.ethereum?.usd || 1966.25,
                USDC: res.data['usd-coin']?.usd || 1.0
            };
            this.lastPriceUpdate = now;
            
            console.log(`[${this.personality.alias}] 💰 Prices: MON=$${this.priceCache.MON}, ETH=$${this.priceCache.ETH}`);
            return this.priceCache;
        } catch (error) {
            console.error(`[${this.personality.alias}] Price fetch error:`, error.message);
            return this.priceCache.MON ? this.priceCache : { MON: 5.0, ETH: 1966.25, USDC: 1.0 };
        }
    }
    
    async askClaude(intentId, amountInMON, prices) {
        const inputValueUSD = amountInMON * prices.MON;
        
        const context = `INTENT #${intentId} ANALYSIS:\\n` +
            `- Input: ${amountInMON} MON ($${inputValueUSD.toFixed(2)})\\n` +
            `- Output Token: USDC (assume cross-chain to Ethereum)\\n` +
            `- Current Prices: MON=$${prices.MON}, ETH=$${prices.ETH}, USDC=$${prices.USDC}\\n` +
            `- Your Balance: ${ethers.utils.formatEther(await this.wallet.getBalance())} MON\\n` +
            `- Your Base Fee: ${this.personality.style.baseFeePercent}%\\n` +
            `- Min Profit Required: ${this.personality.style.minProfitPercent}%\\n\\n` +
            `Recent Performance:\\n` +
            `- Total Bids: ${this.bidHistory.length}\\n` +
            `- Recent: ${this.bidHistory.slice(-3).map(b => b.won ? 'WIN' : 'BID').join(', ') || 'None'}\\n\\n` +
            `Calculate:\\n` +
            `1. Expected USDC output (after fee + slippage)\\n` +
            `2. Your profit in USD\\n` +
            `3. Should you bid?\\n\\n` +
            `Remember: Stake is 0.01 MON, gas ~$0.10-0.50`;
        
        try {
            const response = await this.claude.messages.create({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 400,
                messages: [{
                    role: 'user',
                    content: this.personality.systemPrompt + '\\n\\n' + context
                }]
            });
            
            const text = response.content[0].text;
            console.log(`\\n[${this.personality.alias}] 🤖 Claude thinks:\\n${text}\\n`);
            
            const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error(`[${this.personality.alias}] Claude error:`, error.message);
        }
        
        // Fallback calculation
        const feeMultiplier = 1 - (this.personality.style.baseFeePercent / 100);
        const slippage = 0.005;
        const outputUSDC = (inputValueUSD * feeMultiplier * (1 - slippage)) / prices.USDC;
        const profitUSD = inputValueUSD * (this.personality.style.baseFeePercent / 100);
        const shouldBid = profitUSD > 0.50 && amountInMON >= 0.5;
        
        return {
            shouldBid,
            promisedOut: outputUSDC.toFixed(6),
            fee: '0.01',
            reasoning: `Fallback: ${this.personality.style.baseFeePercent}% fee, profit $${profitUSD.toFixed(2)}`
        };
    }
    
    async submitBid(intentId, decision) {
        try {
            const promisedOutWei = ethers.utils.parseEther(decision.promisedOut.toString());
            const feeWei = ethers.utils.parseEther(decision.fee);
            
            console.log(`[${this.personality.alias}] 📤 Submitting bid #${intentId}...`);
            console.log(`   Output: ${decision.promisedOut} USDC`);
            console.log(`   Reasoning: ${decision.reasoning}`);
            
            const tx = await this.contract.submitBid(intentId, promisedOutWei, feeWei, {
                value: feeWei,
                gasLimit: 200000
            });
            
            console.log(`[${this.personality.alias}] ⏳ TX: ${tx.hash}`);
            const receipt = await tx.wait();
            
            console.log(`[${this.personality.alias}] ✅ Bid confirmed in block ${receipt.blockNumber}`);
            
            this.bidHistory.push({ intentId, won: false, timestamp: Date.now() });
            return receipt;
        } catch (error) {
            console.error(`[${this.personality.alias}] ❌ Bid failed:`, error.message);
            return null;
        }
    }
    
    async handleIntent(intentId, amountIn) {
        console.log(`\\n[${this.personality.alias}] 🔔 Intent #${intentId} detected!`);
        
        // Wait based on personality
        await new Promise(r => setTimeout(r, this.personality.style.bidDelay));
        
        const amountInMON = parseFloat(ethers.utils.formatEther(amountIn));
        const prices = await this.updatePrices();
        
        // Ask Claude for decision
        const decision = await this.askClaude(intentId, amountInMON, prices);
        
        if (decision.shouldBid) {
            await this.submitBid(intentId, decision);
        } else {
            console.log(`[${this.personality.alias}] ⏭️  Skipping: ${decision.reasoning}`);
        }
    }
    
    async start() {
        console.log(`\\n[${this.personality.alias}] 🚀 Starting Claude-powered agent...`);
        
        const balance = await this.wallet.getBalance();
        console.log(`[${this.personality.alias}] 💰 Balance: ${ethers.utils.formatEther(balance)} MON`);
        
        // Poll for events
        let lastBlock = await this.provider.getBlockNumber();
        console.log(`[${this.personality.alias}] 📡 Listening from block ${lastBlock}...`);
        
        const poll = async () => {
            try {
                const currentBlock = await this.provider.getBlockNumber();
                
                if (currentBlock > lastBlock) {
                    const events = await this.contract.queryFilter(
                        'IntentPosted',
                        lastBlock + 1,
                        currentBlock
                    );
                    
                    for (const event of events) {
                        await this.handleIntent(event.args.intentId, event.args.amountIn);
                    }
                    
                    lastBlock = currentBlock;
                }
            } catch (error) {
                console.error(`[${this.personality.alias}] Poll error:`, error.message);
            }
            
            setTimeout(poll, 3000);
        };
        
        poll();
    }
}

async function main() {
    const agentType = process.argv[2] || 'conservative';
    
    if (!PERSONALITIES[agentType]) {
        console.error('Unknown agent type:', agentType);
        console.error('Available: conservative, contrarian, whale');
        process.exit(1);
    }
    
    const agent = new ClaudeAuctionAgent(agentType);
    await agent.start();
}

main().catch(console.error);
