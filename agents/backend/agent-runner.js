const { ethers } = require('ethers');
require('dotenv').config();

// Contract details
const CONTRACT_ADDRESS = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const MONAD_RPC = 'wss://testnet-rpc.monad.xyz'; // Force WebSocket!

const CONTRACT_ABI = [
    'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)',
    'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable',
    'function intents(uint256) external view returns (address user, uint256 amountIn, address tokenIn, address tokenOut, uint32 destChain, uint256 minOut, uint256 deadline, bool executed, address winner)'
];

// Agent personalities
const AGENTS = {
    conservative: {
        name: 'Conservative Agent',
        privateKey: process.env.CONSERVATIVE_KEY,
        feePercent: 0.24,
        executionTime: 180,
        bidDelay: 2000 // Wait 2s before bidding
    },
    contrarian: {
        name: 'Contrarian Agent',
        privateKey: process.env.CONTRARIAN_KEY,
        feePercent: 0.36,
        executionTime: 60,
        bidDelay: 4000 // Wait 4s
    },
    whale: {
        name: 'Whale Agent',
        privateKey: process.env.WHALE_KEY,
        feePercent: 0.36,
        executionTime: 60,
        bidDelay: 6000 // Wait 6s
    }
};

class IntentAgent {
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.provider = new ethers.providers.WebSocketProvider(MONAD_RPC);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);
        
        // WebSocket error handlers
        this.provider._websocket.on('error', (error) => {
            console.error(`[${this.name}] WebSocket error:`, error.message);
        });
        this.provider._websocket.on('close', () => {
            console.log(`[${this.name}] ⚠️  WebSocket closed`);
        });
        this.provider._websocket.on('open', () => {
            console.log(`[${this.name}] ✅ WebSocket connected`);
        });
        
        console.log(`[${this.name}] Initialized with wallet: ${this.wallet.address}`);
        console.log(`[${this.name}] Using WebSocket: ${MONAD_RPC}`);
    }

    async start() {
        console.log(`[${this.name}] Starting to listen for intents...`);
        
        // Monad WebSocket doesn't support eth_subscribe, use polling instead
        let lastBlock = await this.provider.getBlockNumber();
        console.log(`[${this.name}] Starting from block ${lastBlock}`);
        
        const pollInterval = 2000; // Poll every 2 seconds
        
        const poll = async () => {
            try {
                const currentBlock = await this.provider.getBlockNumber();
                
                if (currentBlock > lastBlock) {
                    // Check for events in new blocks
                    const events = await this.contract.queryFilter(
                        'IntentPosted',
                        lastBlock + 1,
                        currentBlock
                    );
                    
                    for (const event of events) {
                        console.log(`\n[${this.name}] 🔔 New intent detected!`);
                        console.log(`  Intent ID: ${event.args.intentId.toString()}`);
                        console.log(`  User: ${event.args.user}`);
                        console.log(`  Amount: ${ethers.utils.formatEther(event.args.amountIn)} MON`);
                        console.log(`  Dest Chain: ${event.args.destChain}`);
                        console.log(`  Block: ${event.blockNumber}`);
                        
                        await this.handleIntent(event.args.intentId, event.args.amountIn);
                    }
                    
                    lastBlock = currentBlock;
                }
            } catch (error) {
                console.error(`[${this.name}] Poll error:`, error.message);
            }
            
            setTimeout(poll, pollInterval);
        };
        
        poll();
        console.log(`[${this.name}] ✅ Polling for events every ${pollInterval}ms...`);
    }

    async handleIntent(intentId, amountIn) {
        try {
            // Wait based on personality (simulate computation time)
            console.log(`[${this.name}] ⏳ Calculating optimal bid... (${this.config.bidDelay}ms)`);
            await new Promise(resolve => setTimeout(resolve, this.config.bidDelay));

            // Calculate bid
            const amountInEther = parseFloat(ethers.utils.formatEther(amountIn));
            const inputValueUSD = amountInEther * 5; // MON = $5
            
            const fee = inputValueUSD * (this.config.feePercent / 100);
            const outputValueUSD = inputValueUSD - fee;
            const outputUSDC = outputValueUSD / 1.0; // USDC = $1
            
            // Convert to wei
            const promisedOut = ethers.utils.parseEther(outputUSDC.toFixed(6));
            const feeWei = ethers.utils.parseEther(fee.toFixed(6));
            const stake = ethers.utils.parseEther('0.01'); // 0.01 MON stake

            console.log(`[${this.name}] 💰 Bid Calculation:`);
            console.log(`  Input: ${amountInEther} MON ($${inputValueUSD})`);
            console.log(`  Fee: ${this.config.feePercent}% ($${fee.toFixed(4)})`);
            console.log(`  Output: ${outputUSDC.toFixed(4)} USDC`);
            console.log(`  Stake: 0.01 MON`);

            // Check balance
            const balance = await this.wallet.getBalance();
            const required = stake.add(ethers.utils.parseEther('0.001')); // Stake + gas
            
            if (balance.lt(required)) {
                console.log(`[${this.name}] ❌ Insufficient balance: ${ethers.utils.formatEther(balance)} MON`);
                return;
            }

            // Submit bid
            console.log(`[${this.name}] 📤 Submitting bid to blockchain...`);
            const tx = await this.contract.submitBid(intentId, promisedOut, feeWei, {
                value: stake,
                gasLimit: 200000
            });

            console.log(`[${this.name}] ✅ Bid submitted! TX: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`[${this.name}] ⛏️ Bid confirmed in block ${receipt.blockNumber}`);

        } catch (error) {
            console.error(`[${this.name}] ❌ Error submitting bid:`, error.message);
        }
    }
}

// Start all agents
async function main() {
    console.log('🚀 Starting Intent Auction Agent System\n');
    console.log(`Contract: ${CONTRACT_ADDRESS}`);
    console.log(`RPC: ${MONAD_RPC}\n`);

    // Check environment variables
    const missingKeys = [];
    if (!process.env.CONSERVATIVE_KEY) missingKeys.push('CONSERVATIVE_KEY');
    if (!process.env.CONTRARIAN_KEY) missingKeys.push('CONTRARIAN_KEY');
    if (!process.env.WHALE_KEY) missingKeys.push('WHALE_KEY');

    if (missingKeys.length > 0) {
        console.error('❌ Missing environment variables:', missingKeys.join(', '));
        console.error('Please set agent private keys in .env file');
        process.exit(1);
    }

    // Initialize agents
    const agents = [];
    for (const [key, config] of Object.entries(AGENTS)) {
        const agent = new IntentAgent(config.name, config);
        agents.push(agent);
        await agent.start();
    }

    console.log('\n✅ All agents running! Press Ctrl+C to stop.\n');
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
