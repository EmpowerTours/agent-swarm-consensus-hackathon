const { ethers } = require('ethers');

console.log('=== FINAL DIAGNOSTIC ===\n');

// Test both HTTP and WebSocket
const httpProvider = new ethers.providers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
const wsProvider = new ethers.providers.WebSocketProvider('wss://testnet-rpc.monad.xyz');

const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const TX_HASH = '0x152ace3bafe4b919125cf7210d406c6e06b9a02a686375e6b0ba1296020244f0';

const ABI = ['event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)'];

async function test() {
    console.log('1. Checking transaction receipt via HTTP...');
    const receipt = await httpProvider.getTransactionReceipt(TX_HASH);
    console.log('✅ Receipt found, logs:', receipt.logs.length);
    
    const iface = new ethers.utils.Interface(ABI);
    const log = receipt.logs[0];
    const parsed = iface.parseLog(log);
    
    console.log('✅ Event parsed:');
    console.log('  Intent ID:', parsed.args.intentId.toString());
    console.log('  User:', parsed.args.user);
    console.log('  Block:', receipt.blockNumber);
    
    console.log('\n2. Testing WebSocket event filter...');
    const wsContract = new ethers.Contract(CONTRACT, ABI, wsProvider);
    
    // Query this specific block
    console.log('Querying block', receipt.blockNumber, 'for events...');
    const events = await wsContract.queryFilter('IntentPosted', receipt.blockNumber, receipt.blockNumber);
    console.log('✅ Found', events.length, 'events in that block');
    
    if (events.length > 0) {
        console.log('  Event intentId:', events[0].args.intentId.toString());
    }
    
    console.log('\n3. Setting up live listener for NEXT intent...');
    let detected = false;
    
    wsContract.on('IntentPosted', (intentId, user, amountIn, destChain) => {
        if (!detected) {
            detected = true;
            console.log('\n🎉 LIVE EVENT DETECTED!');
            console.log('Intent ID:', intentId.toString());
            console.log('User:', user);
            console.log('\n✅✅✅ WEBSOCKET WORKS! ✅✅✅\n');
            process.exit(0);
        }
    });
    
    console.log('✅ Listener active');
    console.log('\n🎯 POST INTENT #13 NOW to test live detection!');
    console.log('(Waiting 2 minutes...)\n');
    
    setTimeout(() => {
        if (!detected) {
            console.log('\n❌ No new events detected');
            console.log('WebSocket may not support live event subscriptions on Monad');
        }
        process.exit(1);
    }, 120000);
}

test().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
