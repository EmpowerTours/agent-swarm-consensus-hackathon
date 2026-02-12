const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const RPC = 'wss://testnet-rpc.monad.xyz';

const ABI = [
    'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)',
    'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable',
    'function intents(uint256) view returns (address, uint256, address, address, uint32, uint256, uint256, bool, address)'
];

class Agent {
    constructor() {
        this.provider = new ethers.providers.WebSocketProvider(RPC);
        this.wallet = new ethers.Wallet(process.env.CONSERVATIVE_KEY, this.provider);
        this.contract = new ethers.Contract(CONTRACT, ABI, this.wallet);
        this.processed = new Set();
        console.log('Agent:', this.wallet.address);
    }

    async start() {
        const current = await this.provider.getBlockNumber();
        
        // Query in 50-block chunks (Monad limit is 100)
        console.log('Loading past intents...');
        const chunks = 20; // 20 * 50 = 1000 blocks back
        for (let i = 0; i < chunks; i++) {
            const end = current - (i * 50);
            const start = end - 49;
            try {
                const events = await this.contract.queryFilter('IntentPosted', start, end);
                for (const e of events) {
                    const id = e.args.intentId.toString();
                    console.log(`Found intent ${id} at block ${e.blockNumber}`);
                    if (!this.processed.has(id)) {
                        this.processed.add(id);
                        await this.bid(e.args.intentId, e.args.amountIn);
                    }
                }
            } catch (err) {
                console.error(`Chunk ${i} failed:`, err.message);
            }
        }
        
        // Now monitor for new
        let last = current;
        const poll = async () => {
            const now = await this.provider.getBlockNumber();
            if (now > last) {
                const events = await this.contract.queryFilter('IntentPosted', last + 1, now);
                for (const e of events) {
                    const id = e.args.intentId.toString();
                    if (!this.processed.has(id)) {
                        console.log(`\n🔔 NEW INTENT ${id}!`);
                        this.processed.add(id);
                        await this.bid(e.args.intentId, e.args.amountIn);
                    }
                }
                last = now;
            }
            setTimeout(poll, 2000);
        };
        poll();
        console.log('Monitoring...\n');
    }

    async bid(intentId, amountIn) {
        try {
            console.log(`Bidding on intent ${intentId}...`);
            
            const amt = parseFloat(ethers.utils.formatEther(amountIn));
            const usdOut = (amt * 5) * 0.9976; // 0.24% fee
            
            const tx = await this.contract.submitBid(
                intentId,
                ethers.utils.parseEther(usdOut.toFixed(6)),
                ethers.utils.parseEther('0.012'),
                {
                    value: ethers.utils.parseEther('0.01'),
                    gasLimit: 200000
                }
            );

            console.log(`TX: ${tx.hash.substring(0, 20)}...`);
            await tx.wait();
            console.log(`✅ BID CONFIRMED for intent ${intentId}\n`);

        } catch (err) {
            console.error(`Bid error:`, err.reason || err.message);
        }
    }
}

new Agent().start().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
