const WebSocket = require('ws');

const ws = new WebSocket('wss://testnet-rpc.monad.xyz');

ws.on('open', () => {
    console.log('✅ WebSocket connected');
    
    // Subscribe to logs for our contract
    const subscribeRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_subscribe',
        params: [
            'logs',
            {
                address: '0xa3D01411b8331fCcD0Da3011575082361fb97839',
                topics: [
                    '0x5100e0b9919d2a5c2bb7442df04021d8e19ba935f40c6f5aeebc944b1b615cc5' // IntentPosted
                ]
            }
        ]
    };
    
    console.log('Subscribing to IntentPosted events...');
    ws.send(JSON.stringify(subscribeRequest));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('\n📨 Message received:', JSON.stringify(msg, null, 2));
    
    if (msg.method === 'eth_subscription') {
        console.log('\n🎉 EVENT NOTIFICATION!');
        console.log('Subscription:', msg.params.subscription);
        console.log('Data:', msg.params.result);
    }
});

ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
});

ws.on('close', () => {
    console.log('⚠️ WebSocket closed');
});

console.log('=== RAW ETH_SUBSCRIBE TEST ===');
console.log('Connecting to wss://testnet-rpc.monad.xyz');
console.log('\n🎯 POST INTENT #13 to test!\n');

setTimeout(() => {
    console.log('\nTimeout - closing');
    ws.close();
    process.exit(0);
}, 120000);
