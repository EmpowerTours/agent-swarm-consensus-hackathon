const { ethers } = require('ethers');

const RPC = 'wss://testnet-rpc.monad.xyz';
const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';

console.log('=== DEEP WEBSOCKET DIAGNOSTIC ===\n');

// Test 1: Can we connect at all?
console.log('Test 1: Basic WebSocket connection...');
const provider = new ethers.providers.WebSocketProvider(RPC);

provider._websocket.on('open', () => {
    console.log('✅ WebSocket opened');
    
    // Test 2: Can we query the chain?
    provider.getBlockNumber().then(bn => {
        console.log('✅ Current block:', bn);
        
        // Test 3: Can we get past events?
        const contract = new ethers.Contract(
            CONTRACT,
            ['event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)'],
            provider
        );
        
        console.log('\nTest 2: Querying past IntentPosted events...');
        contract.queryFilter('IntentPosted', -1000, 'latest').then(events => {
            console.log(`✅ Found ${events.length} past events`);
            if (events.length > 0) {
                const last = events[events.length - 1];
                console.log('Latest event:', {
                    intentId: last.args.intentId.toString(),
                    user: last.args.user,
                    block: last.blockNumber
                });
            }
            
            // Test 4: Can we listen for NEW events?
            console.log('\nTest 3: Setting up event listener...');
            let listenerSet = false;
            
            contract.on('IntentPosted', (intentId, user, amountIn, destChain, event) => {
                console.log('\n🎉 NEW EVENT DETECTED!');
                console.log('Intent ID:', intentId.toString());
                console.log('Block:', event.blockNumber);
                listenerSet = true;
            });
            
            console.log('✅ Listener registered');
            console.log('\n=== WAITING FOR NEW EVENTS ===');
            console.log('Post an intent now! Waiting 90 seconds...\n');
            
            setTimeout(() => {
                if (!listenerSet) {
                    console.log('❌ No events detected in 90 seconds');
                    console.log('\nDEBUG: Checking WebSocket status...');
                    console.log('ReadyState:', provider._websocket.readyState);
                    console.log('(1 = OPEN, 2 = CLOSING, 3 = CLOSED)');
                }
                process.exit(0);
            }, 90000);
            
        }).catch(err => {
            console.error('❌ Error querying events:', err.message);
        });
        
    }).catch(err => {
        console.error('❌ Error getting block:', err.message);
    });
});

provider._websocket.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
});

provider._websocket.on('close', () => {
    console.log('⚠️ WebSocket closed');
});

provider._websocket.on('message', (data) => {
    console.log('📨 WebSocket message received:', data.toString().substring(0, 200));
});
