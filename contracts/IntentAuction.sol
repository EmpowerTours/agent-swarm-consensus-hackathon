// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IntentAuction
 * @notice Decentralized auction marketplace for cross-chain swap intents
 * @dev Agents bid to fulfill user intents, winner executes via LayerZero
 */
contract IntentAuction {
    struct Intent {
        address user;
        uint256 amountIn;
        address tokenIn;
        address tokenOut;
        uint32 destChain;     // LayerZero chain ID
        uint256 minOut;
        uint256 deadline;
        bool executed;
        address winner;
    }

    struct Bid {
        address agent;
        uint256 promisedOut;
        uint256 fee;
        uint256 timestamp;
    }

    uint256 public intentCount;
    mapping(uint256 => Intent) public intents;
    mapping(uint256 => Bid[]) public bids;
    mapping(address => uint256) public agentReputation;
    
    event IntentPosted(uint256 indexed intentId, address indexed user, uint256 amountIn, uint32 destChain);
    event BidSubmitted(uint256 indexed intentId, address indexed agent, uint256 promisedOut);
    event IntentExecuted(uint256 indexed intentId, address indexed winner);

    /**
     * @notice User posts an intent to swap cross-chain
     * @param tokenIn Source token address (address(0) for native)
     * @param tokenOut Target token address on destination chain
     * @param destChain LayerZero destination chain ID
     * @param minOut Minimum output amount (slippage protection)
     */
    function postIntent(
        address tokenIn,
        address tokenOut,
        uint32 destChain,
        uint256 minOut
    ) external payable returns (uint256) {
        require(msg.value > 0, "Must send value");
        require(block.timestamp + 300 > block.timestamp, "Deadline too short");

        uint256 intentId = intentCount++;
        
        intents[intentId] = Intent({
            user: msg.sender,
            amountIn: msg.value,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            destChain: destChain,
            minOut: minOut,
            deadline: block.timestamp + 300,  // 5 min auction
            executed: false,
            winner: address(0)
        });

        emit IntentPosted(intentId, msg.sender, msg.value, destChain);
        return intentId;
    }

    /**
     * @notice Agent submits a bid to fulfill intent
     * @param intentId Intent to bid on
     * @param promisedOut Amount agent promises to deliver
     * @param fee Agent's fee
     */
    function submitBid(
        uint256 intentId,
        uint256 promisedOut,
        uint256 fee
    ) external payable {
        Intent storage intent = intents[intentId];
        require(!intent.executed, "Intent already executed");
        require(block.timestamp < intent.deadline, "Auction ended");
        require(promisedOut >= intent.minOut, "Bid below minimum");
        require(msg.value >= 0.01 ether, "Must stake 0.01 ETH");  // Anti-spam

        bids[intentId].push(Bid({
            agent: msg.sender,
            promisedOut: promisedOut,
            fee: fee,
            timestamp: block.timestamp
        }));

        emit BidSubmitted(intentId, msg.sender, promisedOut);
    }

    /**
     * @notice Select winning bid and execute
     * @param intentId Intent to execute
     * @param bidIndex Index of winning bid
     */
    function executeIntent(uint256 intentId, uint256 bidIndex) external {
        Intent storage intent = intents[intentId];
        require(msg.sender == intent.user, "Only user can execute");
        require(!intent.executed, "Already executed");
        require(block.timestamp >= intent.deadline, "Auction still active");
        
        Bid memory winningBid = bids[intentId][bidIndex];
        require(winningBid.promisedOut >= intent.minOut, "Winning bid too low");

        intent.executed = true;
        intent.winner = winningBid.agent;

        // Transfer funds to winning agent for execution
        payable(winningBid.agent).transfer(intent.amountIn);
        
        // Update reputation
        agentReputation[winningBid.agent]++;

        emit IntentExecuted(intentId, winningBid.agent);
    }

    /**
     * @notice Get all bids for an intent
     */
    function getBids(uint256 intentId) external view returns (Bid[] memory) {
        return bids[intentId];
    }

    /**
     * @notice Get best bid (highest promisedOut)
     */
    function getBestBid(uint256 intentId) external view returns (Bid memory, uint256) {
        Bid[] memory intentBids = bids[intentId];
        require(intentBids.length > 0, "No bids");
        
        uint256 bestIndex = 0;
        uint256 bestOutput = intentBids[0].promisedOut;
        
        for (uint256 i = 1; i < intentBids.length; i++) {
            if (intentBids[i].promisedOut > bestOutput) {
                bestOutput = intentBids[i].promisedOut;
                bestIndex = i;
            }
        }
        
        return (intentBids[bestIndex], bestIndex);
    }
}
