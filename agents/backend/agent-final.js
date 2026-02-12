const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const RPC = 'wss://testnet-rpc.monad.xyz';
const ABI = [
    'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)',
    'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable'
];

const provider = new ethers.providers.WebSocketProvider(RPC);
const wallet = new ethers.Wallet(process.env.CONSERVATIVE_KEY, provider);
const contract = new ethers.Contract(CONTRACT, ABI, wallet);
const processed = new Set();

console.log('🤖 Agent:', wallet.address);

let lastBlock = 0;

async function poll() {
    try {
        const currentBlock = await provider.getBlockNumber();
        
        if (lastBlock === 0) {
            lastBlock = currentBlock;
            console.log('Starting from block', currentBlock);
        }
        
        if (currentBlock > lastBlock) {
            console.log(`Checking blocks ${lastBlock + 1} - ${currentBlock}...`);
            
            const events = await contract.queryFilter('IntentPosted', lastBlock + 1, currentBlock);
            
            if (events.length > 0) {
                console.log(`\n🔔 Found ${events.length} new intent(s)!`);
                
                for (const event of events) {
                    const id = event.args.intentId.toString();
                    
                    if (!processed.has(id)) {
                        processed.add(id);
                        console.log(`\n📍 Intent ${id}:`);
                        console.log(`  Amount: ${ethers.utils.formatEther(event.args.amountIn)} MON`);
                        console.log(`  User: ${event.args.user}`);
                        console.log(`  Block: ${event.blockNumber}`);
                        
                        await submitBid(id, event.args.amountIn);
                    }
                }
            }
            
            lastBlock = currentBlock;
        }
    } catch (error) {
        console.error('Poll error:', error.message);
    }
    
    setTimeout(poll, 2000);
}

async function submitBid(intentId, amountIn) {
    try {
        console.log(`\n💰 Submitting bid for intent ${intentId}...`);
        
        const amt = parseFloat(ethers.utils.formatEther(amountIn));
        const usdOut = (amt * 5) * 0.9976;
        
        const tx = await contract.submitBid(
            intentId,
            ethers.utils.parseEther(usdOut.toFixed(6)),
            ethers.utils.parseEther('0.012'),
            {
                value: ethers.utils.parseEther('0.01'),
                gasLimit: 200000
            }
        );

        console.log(`📤 TX: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ BID CONFIRMED in block ${receipt.blockNumber}!\n`);

    } catch (error) {
        console.error(`❌ Bid failed:`, error.reason || error.message);
    }
}

poll();
console.log('✅ Monitoring for intents...\n');
