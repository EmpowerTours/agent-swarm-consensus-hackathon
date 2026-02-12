const { ethers } = require('ethers');

const RPC = 'wss://testnet-rpc.monad.xyz';
const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';

console.log('=== LIVE EVENT LISTENING TEST ===\n');

const provider = new ethers.providers.WebSocketProvider(RPC);

provider._websocket.on('open', async () => {
    console.log('✅ WebSocket connected');
    
    const blockNumber = await provider.getBlockNumber();
    console.log('✅ Current block:', blockNumber);
    
    // Query recent events with correct range
    const contract = new ethers.Contract(
        CONTRACT,
        ['event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)'],
        provider
    );
    
    console.log('\nQuerying last 50 blocks for past events...');
    try {
        const events = await contract.queryFilter('IntentPosted', blockNumber - 50, blockNumber);
        console.log(`✅ Found ${events.length} recent events`);
        
        if (events.length > 0) {
            const last = events[events.length - 1];
            console.log('Most recent:', {
                intentId: last.args.intentId.toString(),
                block: last.blockNumber,
                tx: last.transactionHash
            });
        }
    } catch (err) {
        console.log('⚠️ Past events query failed:', err.message);
    }
    
    // Set up live listener
    console.log('\n=== SETTING UP LIVE LISTENER ===');
    
    let eventCount = 0;
    
    contract.on('IntentPosted', (intentId, user, amountIn, destChain, event) => {
        eventCount++;
        console.log(`\n🎉 EVENT #${eventCount} DETECTED!`);
        console.log('Intent ID:', intentId.toString());
        console.log('User:', user);
        console.log('Amount:', ethers.utils.formatEther(amountIn), 'MON');
        console.log('Chain:', destChain.toString());
        console.log('Block:', event.blockNumber);
        console.log('TX:', event.transactionHash);
    });
    
    console.log('✅ Live listener active');
    console.log('\n🎯 POST INTENT #10 NOW! Waiting 2 minutes...\n');
    
    setTimeout(() => {
        if (eventCount === 0) {
            console.log('\n❌ No live events detected in 2 minutes');
            console.log('WebSocket state:', provider._websocket.readyState, '(1=OPEN)');
        } else {
            console.log(`\n✅ Successfully detected ${eventCount} event(s)!`);
        }
        process.exit(0);
    }, 120000);
});

provider._websocket.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
});

provider._websocket.on('close', () => {
    console.log('⚠️ WebSocket closed unexpectedly');
    process.exit(1);
});
