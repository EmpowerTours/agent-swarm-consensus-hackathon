const { ethers } = require('ethers');

console.log('🔑 Generating 3 Agent Wallets\n');

const agents = ['Conservative', 'Contrarian', 'Whale'];

agents.forEach(name => {
    const wallet = ethers.Wallet.createRandom();
    console.log(`${name} Agent:`);
    console.log(`  Address: ${wallet.address}`);
    console.log(`  Private Key: ${wallet.privateKey}`);
    console.log();
});

console.log('⚠️  SAVE THESE PRIVATE KEYS - They will not be shown again!');
console.log('Add them to agents/backend/.env file');
