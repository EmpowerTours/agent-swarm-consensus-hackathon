const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const ALCHEMY_RPC = 'wss://monad-testnet.g.alchemy.com/v2/544_M3_Rv-FNFJbPquEUw';

const ABI = [
    'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)',
    'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable'
];

const provider = new ethers.providers.WebSocketProvider(ALCHEMY_RPC);
const wallet = new ethers.Wallet(process.env.CONSERVATIVE_KEY, provider);
const contract = new ethers.Contract(CONTRACT, ABI, wallet);

const processed = new Set();
let lastBlock = 0;

console.log('🤖 Agent:', wallet.address);
console.log('📡 Using Alchemy WebSocket\n');

async function pollLoop() {
    while (true) {
        try {
            const currentBlock = await provider.getBlockNumber();
            
            if (lastBlock === 0) {
                lastBlock = currentBlock;
                console.log('Starting from block', currentBlock, '\n');
            }
            
            if (currentBlock > lastBlock) {
                console.log(`[${new Date().toLocaleTimeString()}] Blocks ${lastBlock + 1}-${currentBlock}`);
                
                const events = await contract.queryFilter('IntentPosted', lastBlock + 1, currentBlock);
                
                if (events.length > 0) {
                    console.log(`\n🔔 FOUND ${events.length} INTENT(S)!\n`);
                    
                    for (const event of events) {
                        const id = event.args.intentId.toString();
                        
                        if (!processed.has(id)) {
                            processed.add(id);
                            console.log(`📍 Intent ${id}:`);
                            console.log(`   User: ${event.args.user}`);
                            console.log(`   Amount: ${ethers.utils.formatEther(event.args.amountIn)} MON`);
                            console.log(`   Block: ${event.blockNumber}\n`);
                            
                            await submitBid(id, event.args.amountIn);
                        }
                    }
                }
                
                lastBlock = currentBlock;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error('Error:', error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function submitBid(intentId, amountIn) {
    try {
        console.log(`💰 SUBMITTING BID for intent ${intentId}...`);
        
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
        console.log(`✅✅✅ BID CONFIRMED IN BLOCK ${receipt.blockNumber}! ✅✅✅\n`);

    } catch (error) {
        console.error(`❌ Bid error:`, error.message, '\n');
    }
}

pollLoop();
