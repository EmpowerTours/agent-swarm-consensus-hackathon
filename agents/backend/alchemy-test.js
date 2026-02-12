const { ethers } = require('ethers');
require('dotenv').config();

const ALCHEMY_URL = 'wss://monad-testnet.g.alchemy.com/v2/544_M3_Rv-FNFJbPquEUw';
const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const ABI = [
    'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)',
    'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable'
];

console.log('🔬 Testing Alchemy WebSocket...\n');

const provider = new ethers.providers.WebSocketProvider(ALCHEMY_URL);
const wallet = new ethers.Wallet(process.env.CONSERVATIVE_KEY, provider);
const contract = new ethers.Contract(CONTRACT, ABI, wallet);

provider._websocket.on('open', async () => {
    console.log('✅ Alchemy WebSocket connected!');
    
    const block = await provider.getBlockNumber();
    console.log('Current block:', block);
    console.log('Agent wallet:', wallet.address);
    
    console.log('\n🎧 Setting up event listener...');
    
    contract.on('IntentPosted', async (intentId, user, amountIn, destChain, event) => {
        console.log('\n🔔🔔🔔 EVENT DETECTED! 🔔🔔🔔');
        console.log('Intent ID:', intentId.toString());
        console.log('User:', user);
        console.log('Amount:', ethers.utils.formatEther(amountIn), 'MON');
        console.log('Block:', event.blockNumber);
        
        try {
            console.log('\n💰 Submitting bid...');
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
            
            console.log('📤 TX:', tx.hash);
            const receipt = await tx.wait();
            console.log('✅✅✅ BID CONFIRMED! ✅✅✅');
        } catch (err) {
            console.error('❌ Bid failed:', err.message);
        }
    });
    
    console.log('✅ Listener active!');
    console.log('\n🎯 POST INTENT #17 NOW!\n');
});

provider._websocket.on('error', (err) => {
    console.error('❌ Error:', err.message);
});

provider._websocket.on('close', () => {
    console.log('⚠️ WebSocket closed');
    process.exit(0);
});

setTimeout(() => {
    console.log('\n⏱️ 3 minute timeout - no events detected');
    process.exit(0);
}, 180000);
