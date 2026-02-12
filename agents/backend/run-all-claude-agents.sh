#!/bin/bash
# Run all three Claude-powered auction agents

cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════════════"
echo "🤖 Starting Claude Agent Swarm for Intent Auctions"
echo "═══════════════════════════════════════════════════════"
echo ""

# Load env vars
export $(cat .env | xargs)

# Start agents in background with logging
echo "🚀 Starting Conservative Agent..."
node claude-auction-agent.js conservative > logs/conservative.log 2>&1 &
CONSERVATIVE_PID=$!

sleep 2

echo "🚀 Starting Contrarian Agent..."
node claude-auction-agent.js contrarian > logs/contrarian.log 2>&1 &
CONTRARIAN_PID=$!

sleep 2

echo "🚀 Starting Whale Agent..."
node claude-auction-agent.js whale > logs/whale.log 2>&1 &
WHALE_PID=$!

echo ""
echo "✅ All agents started!"
echo "   Conservative PID: $CONSERVATIVE_PID"
echo "   Contrarian PID: $CONTRARIAN_PID"
echo "   Whale PID: $WHALE_PID"
echo ""
echo "📝 Logs:"
echo "   tail -f logs/conservative.log"
echo "   tail -f logs/contrarian.log"
echo "   tail -f logs/whale.log"
echo ""
echo "🛑 To stop: kill $CONSERVATIVE_PID $CONTRARIAN_PID $WHALE_PID"
echo ""
echo "Press Ctrl+C to stop monitoring..."
echo ""

# Monitor logs
tail -f logs/*.log
