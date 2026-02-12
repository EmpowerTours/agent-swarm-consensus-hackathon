#!/usr/bin/env node
/**
 * Multi-Agent Runner for Claude-Powered Intent Auction
 * 
 * Runs all three agent personalities simultaneously:
 * - Conservative (value optimizer)
 * - Contrarian (balanced)
 * - Whale (speed demon)
 */

const { spawn } = require('child_process');
require('dotenv').config();

console.log('═══════════════════════════════════════════════════════');
console.log('🤖 Starting Claude Agent Swarm');
console.log('═══════════════════════════════════════════════════════\n');

// Validate environment variables
const requiredVars = [
    'ANTHROPIC_API_KEY',
    'CONSERVATIVE_KEY',
    'CONTRARIAN_KEY',
    'WHALE_KEY'
];

const missing = requiredVars.filter(v => !process.env[v]);
if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nCopy .env.example to .env and fill in values.');
    process.exit(1);
}

const agents = ['conservative', 'contrarian', 'whale'];
const processes = [];

// Color codes for terminal output
const colors = {
    conservative: '\x1b[32m', // Green
    contrarian: '\x1b[33m',   // Yellow
    whale: '\x1b[36m',        // Cyan
    reset: '\x1b[0m'
};

// Start each agent in separate process
agents.forEach((agentType, index) => {
    console.log(`🚀 Launching ${agentType} agent...`);
    
    const agentProcess = spawn('node', ['claude-agent.js', agentType], {
        cwd: __dirname,
        env: process.env,
        stdio: 'pipe'
    });
    
    const color = colors[agentType];
    const prefix = `[${agentType.toUpperCase()}]`.padEnd(15);
    
    agentProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${color}${prefix}${colors.reset} ${line}`);
            }
        });
    });
    
    agentProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.error(`${color}${prefix}${colors.reset} ❌ ${line}`);
            }
        });
    });
    
    agentProcess.on('close', (code) => {
        console.log(`${color}${prefix}${colors.reset} Process exited with code ${code}`);
        
        // If any agent dies, kill all
        if (code !== 0) {
            console.error(`\n❌ Agent ${agentType} crashed! Shutting down swarm...`);
            processes.forEach(p => p.kill());
            process.exit(1);
        }
    });
    
    processes.push(agentProcess);
});

console.log('\n✅ All agents started successfully!');
console.log('📡 Listening for intents on Monad Testnet...');
console.log('\nPress Ctrl+C to stop all agents.\n');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Shutting down agent swarm...');
    processes.forEach(p => p.kill());
    setTimeout(() => process.exit(0), 1000);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Received SIGTERM, shutting down...');
    processes.forEach(p => p.kill());
    setTimeout(() => process.exit(0), 1000);
});
