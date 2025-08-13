// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CoreCampLottery
 * @dev Lottery contract for IP-NFTs with block-based pseudo-randomness
 */
contract CoreCampLottery is ReentrancyGuard, Ownable {
    
    struct Lottery {
        uint256 tokenId;
        address owner;
        uint256 ticketPrice;
        uint256 maxTickets;
        bool isActive;
        address[] players;
        uint256 createdAt;
        uint256 endTime;
        address winner;
        bool isDrawn;
    }
    
    // Counter for lottery IDs
    uint256 private _nextLotteryId = 1;
    
    // Maps lottery ID to lottery details
    mapping(uint256 => Lottery) public lotteries;
    
    // Array to track all lottery IDs
    uint256[] public lotteryIds;
    
    // Maps lottery ID to NFT token ID
    mapping(uint256 => uint256) public lotteryToTokenId;
    
    // Maps token ID to lottery ID (one lottery per token)
    mapping(uint256 => uint256) public tokenToLotteryId;
    
    
    // Reference to the CampfireIPNFT contract
    IERC721 public immutable campfireNFT;
    

    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFeeBps = 250; // 2.5%
    
    // Minimum lottery duration (1 hour)
    uint256 public constant MIN_LOTTERY_DURATION = 1 hours;
    
    // Maximum lottery duration (30 days)
    uint256 public constant MAX_LOTTERY_DURATION = 30 days;
    
    // Events
    event LotteryCreated(uint256 indexed lotteryId, uint256 indexed tokenId, address indexed owner, uint256 ticketPrice, uint256 maxTickets, uint256 endTime);
    event TicketPurchased(uint256 indexed lotteryId, address indexed buyer, uint256 ticketNumber);
    event LotteryDrawCompleted(uint256 indexed lotteryId, address indexed winner, uint256 randomWord);
    event LotteryCancelled(uint256 indexed lotteryId, address indexed owner);
    event PrizeDistributed(uint256 indexed lotteryId, address indexed winner, address indexed owner, uint256 prizeAmount);
    
    constructor(address _campfireNFT) {
        require(_campfireNFT != address(0), "Invalid NFT contract address");
        campfireNFT = IERC721(_campfireNFT);
    }
    
    /**
     * @dev Start a new lottery
     * @param tokenId The token ID to put up for lottery
     * @param ticketPrice The price per ticket in wei
     * @param maxTickets Maximum number of tickets to sell
     * @param duration Lottery duration in seconds
     */
    function startLottery(
        uint256 tokenId,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(ticketPrice > 0, "Ticket price must be greater than zero");
        require(maxTickets > 1, "Must allow at least 2 tickets");
        require(maxTickets <= 10000, "Too many tickets"); // Reasonable limit
        require(duration >= MIN_LOTTERY_DURATION, "Lottery duration too short");
        require(duration <= MAX_LOTTERY_DURATION, "Lottery duration too long");
        require(campfireNFT.ownerOf(tokenId) == msg.sender, "You are not the owner");
        require(campfireNFT.getApproved(tokenId) == address(this), "Lottery not approved");
        require(tokenToLotteryId[tokenId] == 0, "Token already in lottery");
        
        uint256 lotteryId = _nextLotteryId++;
        uint256 endTime = block.timestamp + duration;
        
        lotteries[lotteryId] = Lottery({
            tokenId: tokenId,
            owner: msg.sender,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            isActive: true,
            players: new address[](0),
            createdAt: block.timestamp,
            endTime: endTime,
            winner: address(0),
            isDrawn: false
        });
        
        lotteryToTokenId[lotteryId] = tokenId;
        tokenToLotteryId[tokenId] = lotteryId;
        
        // Add to lottery IDs array
        lotteryIds.push(lotteryId);
        
        emit LotteryCreated(lotteryId, tokenId, msg.sender, ticketPrice, maxTickets, endTime);
        
        return lotteryId;
    }
    
    /**
     * @dev Buy a ticket for a lottery
     * @param lotteryId The lottery ID to buy ticket for
     */
    function buyTicket(uint256 lotteryId) external payable nonReentrant {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.isActive, "Lottery is not active");
        require(block.timestamp < lottery.endTime, "Lottery has ended");
        require(lottery.players.length < lottery.maxTickets, "Lottery is sold out");
        require(msg.value == lottery.ticketPrice, "Incorrect ticket price");
        require(msg.sender != lottery.owner, "Owner cannot buy tickets");

        // Check if user already has a ticket (optional restriction)
        for (uint256 i = 0; i < lottery.players.length; i++) {
            require(lottery.players[i] != msg.sender, "Already purchased ticket");
        }

        lottery.players.push(msg.sender);

        emit TicketPurchased(lotteryId, msg.sender, lottery.players.length);

        // Auto-draw if all tickets sold
        if (lottery.players.length == lottery.maxTickets) {
            _drawWinner(lotteryId);
        }
    }
    
    /**
     * @dev Draw the lottery winner (can be called after end time or when sold out)
     * @param lotteryId The lottery ID to draw
     */
    function drawLottery(uint256 lotteryId) external nonReentrant {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.isActive, "Lottery is not active");
        require(!lottery.isDrawn, "Lottery already drawn");
        require(lottery.players.length > 0, "No tickets sold");
        require(
            block.timestamp >= lottery.endTime || lottery.players.length == lottery.maxTickets,
            "Cannot draw yet"
        );
        _drawWinner(lotteryId);
    }
    
    /**
     * @dev Cancel a lottery (only if no tickets sold)
     * @param lotteryId The lottery ID to cancel
     */
    function cancelLottery(uint256 lotteryId) external nonReentrant {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.isActive, "Lottery is not active");
        require(lottery.owner == msg.sender, "You are not the owner");
        require(lottery.players.length == 0, "Cannot cancel lottery with tickets sold");
        
        lottery.isActive = false;
        uint256 tokenId = lotteryToTokenId[lotteryId];
        tokenToLotteryId[tokenId] = 0;
        
        emit LotteryCancelled(lotteryId, msg.sender);
    }
    

    /**
     * @dev Internal function to draw winner using block-based pseudo-randomness
     */
    function _drawWinner(uint256 lotteryId) internal {
        Lottery storage lottery = lotteries[lotteryId];
        require(lottery.isActive, "Lottery is not active");
        require(!lottery.isDrawn, "Lottery already drawn");
        require(lottery.players.length > 0, "No players");

        uint256 randomWord = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    lottery.players.length
                )
            )
        );
        uint256 winnerIndex = randomWord % lottery.players.length;
        address winner = lottery.players[winnerIndex];

        lottery.winner = winner;
        lottery.isDrawn = true;
        lottery.isActive = false;

        emit LotteryDrawCompleted(lotteryId, winner, randomWord);

        // Distribute prizes
        _distributePrizes(lotteryId);
    }
    

    
    /**
     * @dev Internal function to distribute prizes
     */
    function _distributePrizes(uint256 lotteryId) internal {
        Lottery storage lottery = lotteries[lotteryId];
        uint256 tokenId = lotteryToTokenId[lotteryId];
        
        // Verify NFT is still owned and approved
        require(campfireNFT.ownerOf(tokenId) == lottery.owner, "Owner no longer has NFT");
        require(campfireNFT.getApproved(tokenId) == address(this), "Lottery not approved");
        
        // Transfer NFT to winner
        campfireNFT.transferFrom(lottery.owner, lottery.winner, tokenId);
        
        // Calculate prize distribution
        uint256 totalRevenue = lottery.players.length * lottery.ticketPrice;
        uint256 platformFee = (totalRevenue * platformFeeBps) / 10000;
        uint256 ownerAmount = totalRevenue - platformFee;
        
        // Transfer funds to lottery owner
        payable(lottery.owner).transfer(ownerAmount);
        
        // Transfer platform fee to contract owner
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        // Clear token mapping
        tokenToLotteryId[tokenId] = 0;
        
        emit PrizeDistributed(lotteryId, lottery.winner, lottery.owner, ownerAmount);
    }
    
    /**
     * @dev Get all lottery IDs
     */
    function getAllLotteryIds() external view returns (uint256[] memory) {
        return lotteryIds;
    }
    
    /**
     * @dev Get all active lotteries with details
     */
    function getAllActiveLotteries() external view returns (Lottery[] memory) {
        uint256 count = 0;
        
        // First, count active lotteries
        for (uint256 i = 0; i < lotteryIds.length; i++) {
            if (lotteries[lotteryIds[i]].isActive) {
                count++;
            }
        }
        
        // Create array with active lotteries
        Lottery[] memory activeLotteries = new Lottery[](count);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < lotteryIds.length; i++) {
            uint256 lotteryId = lotteryIds[i];
            if (lotteries[lotteryId].isActive) {
                activeLotteries[currentIndex] = lotteries[lotteryId];
                currentIndex++;
            }
        }
        
        return activeLotteries;
    }
    
    /**
     * @dev Get lottery details
     * @param lotteryId The lottery ID to get details for
     */
    function getLottery(uint256 lotteryId) external view returns (
        uint256 tokenId,
        address owner,
        uint256 ticketPrice,
        uint256 maxTickets,
        bool isActive,
        uint256 ticketsSold,
        uint256 endTime,
        address winner,
        bool isDrawn
    ) {
        Lottery memory lottery = lotteries[lotteryId];
        return (
            lottery.tokenId,
            lottery.owner,
            lottery.ticketPrice,
            lottery.maxTickets,
            lottery.isActive,
            lottery.players.length,
            lottery.endTime,
            lottery.winner,
            lottery.isDrawn
        );
    }
    
    /**
     * @dev Get all players for a lottery
     * @param lotteryId The lottery ID
     */
    function getPlayers(uint256 lotteryId) external view returns (address[] memory) {
        return lotteries[lotteryId].players;
    }
    
    /**
     * @dev Check if lottery can be drawn
     * @param lotteryId The lottery ID to check
     */
    function canDrawLottery(uint256 lotteryId) external view returns (bool) {
        Lottery memory lottery = lotteries[lotteryId];
        return lottery.isActive && 
               !lottery.isDrawn && 
               lottery.players.length > 0 &&
               (block.timestamp >= lottery.endTime || lottery.players.length == lottery.maxTickets);
    }
    

    
    /**
     * @dev Update platform fee (only owner)
     * @param newFeeBps New fee in basis points
     */
    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee cannot exceed 10%"); // Max 10%
        platformFeeBps = newFeeBps;
    }
    
    /**
     * @dev Emergency function to withdraw any stuck ETH
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
