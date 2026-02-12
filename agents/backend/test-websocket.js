const { ethers } = require('ethers');

const CONTRACT_ADDRESS = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const MONAD_RPC = 'wss://testnet-rpc.monad.xyz';

console.log('Testing WebSocket connection...');
console.log('RPC:', MONAD_RPC);

const provider = new ethers.providers.WebSocketProvider(MONAD_RPC);

provider._websocket.on('open', () => {
    console.log('✅ WebSocket OPENED');
});

provider._websocket.on('error', (err) => {
    console.error('❌ WebSocket ERROR:', err.message);
});

provider._websocket.on('close', () => {
    console.log('⚠️  WebSocket CLOSED');
});

const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ['event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)'],
    provider
);

console.log('Setting up event listener...');

contract.on('IntentPosted', (intentId, user, amountIn, destChain) => {
    console.log('\n🎉 EVENT DETECTED!');
    console.log('Intent ID:', intentId.toString());
    console.log('User:', user);
    console.log('Amount:', ethers.utils.formatEther(amountIn));
    console.log('Chain:', destChain);
});

console.log('✅ Listening... Post an intent now!');
console.log('(Will run for 2 minutes)');

setTimeout(() => {
    console.log('\nTimeout - no events detected in 2 minutes');
    process.exit(0);
}, 120000);
