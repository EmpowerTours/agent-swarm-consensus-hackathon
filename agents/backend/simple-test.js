const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT = '0xa3D01411b8331fCcD0Da3011575082361fb97839';
const RPC = 'wss://testnet-rpc.monad.xyz';

async function test() {
    console.log('1. Testing provider connection...');
    const provider = new ethers.providers.WebSocketProvider(RPC);
    const block = await provider.getBlockNumber();
    console.log('✅ Current block:', block);
    
    console.log('\n2. Testing agent wallet...');
    const wallet = new ethers.Wallet(process.env.CONSERVATIVE_KEY, provider);
    console.log('✅ Wallet:', wallet.address);
    const balance = await wallet.getBalance();
    console.log('✅ Balance:', ethers.utils.formatEther(balance), 'MON');
    
    console.log('\n3. Testing contract connection...');
    const contract = new ethers.Contract(
        CONTRACT,
        [
            'event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain)',
            'function submitBid(uint256 intentId, uint256 promisedOut, uint256 fee) external payable'
        ],
        wallet
    );
    
    console.log('\n4. Querying recent intents...');
    const events = await contract.queryFilter('IntentPosted', block - 10, block);
    console.log('✅ Found', events.length, 'recent intents');
    
    if (events.length > 0) {
        const last = events[events.length - 1];
        console.log('\nLatest intent:');
        console.log('  ID:', last.args.intentId.toString());
        console.log('  Amount:', ethers.utils.formatEther(last.args.amountIn), 'MON');
        console.log('  Block:', last.blockNumber);
        
        console.log('\n5. Testing bid submission (DRY RUN)...');
        const intentId = last.args.intentId;
        const amountIn = last.args.amountIn;
        const promisedOut = ethers.utils.parseEther('4.8'); // Promise 4.8 USDC (0.24% fee)
        const feeWei = ethers.utils.parseEther('0.012'); // 0.24% of $5
        const stake = ethers.utils.parseEther('0.01');
        
        console.log('  Bid params:');
        console.log('    Intent ID:', intentId.toString());
        console.log('    Promised out:', ethers.utils.formatEther(promisedOut), 'USDC');
        console.log('    Fee:', ethers.utils.formatEther(feeWei), 'USDC');
        console.log('    Stake:', ethers.utils.formatEther(stake), 'MON');
        
        if (balance.lt(stake.add(ethers.utils.parseEther('0.001')))) {
            console.log('❌ INSUFFICIENT BALANCE for bid!');
        } else {
            console.log('✅ Balance sufficient for bid');
        }
    }
    
    console.log('\n6. Testing polling mechanism...');
    let pollCount = 0;
    const poll = async () => {
        pollCount++;
        const currentBlock = await provider.getBlockNumber();
        console.log(`Poll #${pollCount}: Block ${currentBlock}`);
        
        if (pollCount >= 3) {
            console.log('\n✅ Polling works!');
            process.exit(0);
        }
        setTimeout(poll, 2000);
    };
    poll();
}

test().catch(err => {
    console.error('❌ ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
});
