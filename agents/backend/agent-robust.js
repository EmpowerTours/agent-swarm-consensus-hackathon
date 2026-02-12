const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const RPC = 'wss://testnet-rpc.monad.xyz';
const ABI = [
    'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)',
    'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable'
];

let provider;
let contract;
let wallet;
const processed = new Set();
let lastBlock = 0;

function initProvider() {
    provider = new ethers.providers.WebSocketProvider(RPC);
    wallet = new ethers.Wallet(process.env.CONSERVATIVE_KEY, provider);
    contract = new ethers.Contract(CONTRACT, ABI, wallet);
    
    provider._websocket.on('close', () => {
        console.log('⚠️ WebSocket closed, reconnecting...');
        setTimeout(initProvider, 2000);
    });
    
    provider._websocket.on('error', (err) => {
        console.error('WebSocket error:', err.message);
    });
    
    console.log('✅ Connected');
}

async function poll() {
    try {
        if (!provider || !provider._websocket || provider._websocket.readyState !== 1) {
            console.log('⚠️ Provider disconnected, skipping poll');
            setTimeout(poll, 2000);
            return;
        }
        
        const currentBlock = await provider.getBlockNumber();
        
        if (lastBlock === 0) {
            lastBlock = currentBlock;
            console.log('Starting from block', currentBlock);
        }
        
        if (currentBlock > lastBlock) {
            console.log(`[Block ${currentBlock}] Checking...`);
            
            const events = await contract.queryFilter('IntentPosted', lastBlock + 1, currentBlock);
            
            if (events.length > 0) {
                console.log(`\n🔔 ${events.length} NEW INTENT(S)!`);
                
                for (const event of events) {
                    const id = event.args.intentId.toString();
                    
                    if (!processed.has(id)) {
                        processed.add(id);
                        console.log(`\n📍 INTENT ${id} (Block ${event.blockNumber})`);
                        console.log(`   Amount: ${ethers.utils.formatEther(event.args.amountIn)} MON`);
                        
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
        console.log(`\n💰 BIDDING on ${intentId}...`);
        
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
        console.error(`❌ Bid failed:`, error.reason || error.message);
    }
}

console.log('🤖 AGENT STARTING...');
console.log('Wallet:', process.env.CONSERVATIVE_KEY ? '✓' : '✗');
initProvider();
setTimeout(() => {
    console.log('Agent:', wallet.address, '\n');
    poll();
}, 2000);
