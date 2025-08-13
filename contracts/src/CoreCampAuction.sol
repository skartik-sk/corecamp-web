// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CoreCampAuction
 * @dev English auction contract for IP-NFTs with automatic settlement
 */
contract CoreCampAuction is ReentrancyGuard, Ownable {
    
    struct Auction {
        uint256 tokenId;
        address payable seller;
        uint256 startingBid;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool isActive;
        uint256 createdAt;
    }
    
    // Maps token ID to its auction
    mapping(uint256 => Auction) public auctions;
    
    // Array to track all auction token IDs
    uint256[] public auctionTokenIds;
    
    // To handle refunds for outbid users
    mapping(address => uint256) public pendingReturns;
    
    // Reference to the CampfireIPNFT contract
    IERC721 public immutable campfireNFT;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFeeBps = 250; // 2.5%
    
    // Minimum auction duration (1 hour)
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    
    // Maximum auction duration (30 days)
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    
    // Bid increment percentage (5%)
    uint256 public constant MIN_BID_INCREMENT = 500; // 5% in basis points
    
    // Events
    event AuctionCreated(uint256 indexed tokenId, address indexed seller, uint256 startingBid, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed tokenId, address indexed seller);
    event BidWithdrawn(address indexed bidder, uint256 amount);
    
    constructor(address _campfireNFT) {
        require(_campfireNFT != address(0), "Invalid NFT contract address");
        campfireNFT = IERC721(_campfireNFT);
    }
    
    /**
     * @dev Create a new auction
     * @param tokenId The token ID to auction
     * @param startingBid The starting bid in wei
     * @param duration The auction duration in seconds
     */
    function createAuction(uint256 tokenId, uint256 startingBid, uint256 duration) external nonReentrant {
        require(startingBid > 0, "Starting bid must be greater than zero");
        require(duration >= MIN_AUCTION_DURATION, "Auction duration too short");
        require(duration <= MAX_AUCTION_DURATION, "Auction duration too long");
        require(campfireNFT.ownerOf(tokenId) == msg.sender, "You are not the owner");
        require(campfireNFT.getApproved(tokenId) == address(this), "Auction not approved");
        require(!auctions[tokenId].isActive, "Auction already exists");
        
        uint256 endTime = block.timestamp + duration;
        
        auctions[tokenId] = Auction({
            tokenId: tokenId,
            seller: payable(msg.sender),
            startingBid: startingBid,
            endTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // Add to auction token IDs array
        auctionTokenIds.push(tokenId);
        
        emit AuctionCreated(tokenId, msg.sender, startingBid, endTime);
    }
    
    /**
     * @dev Place a bid on an auction
     * @param tokenId The token ID to bid on
     */
    function placeBid(uint256 tokenId) external payable nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction is not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value > 0, "Bid must be greater than zero");
        
        uint256 minBid;
        if (auction.highestBid == 0) {
            minBid = auction.startingBid;
        } else {
            // Require minimum increment of 5%
            minBid = auction.highestBid + (auction.highestBid * MIN_BID_INCREMENT) / 10000;
        }
        
        require(msg.value >= minBid, "Bid too low");
        
        // Refund the previous highest bidder
        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }
        
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
        
        // Extend auction if bid placed in last 15 minutes
        if (auction.endTime - block.timestamp < 15 minutes) {
            auction.endTime = block.timestamp + 15 minutes;
        }
        
        emit BidPlaced(tokenId, msg.sender, msg.value);
    }
    
    /**
     * @dev End an auction and transfer assets
     * @param tokenId The token ID of the auction to end
     */
    function endAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp >= auction.endTime, "Auction not yet ended");
        
        auction.isActive = false;
        
        // Verify NFT is still owned and approved
        require(campfireNFT.ownerOf(tokenId) == auction.seller, "Seller no longer owns NFT");
        require(campfireNFT.getApproved(tokenId) == address(this), "Auction not approved");
        
        if (auction.highestBidder != address(0)) {
            // Calculate platform fee
            uint256 platformFee = (auction.highestBid * platformFeeBps) / 10000;
            uint256 sellerAmount = auction.highestBid - platformFee;
            
            // Transfer NFT to highest bidder
            campfireNFT.transferFrom(auction.seller, auction.highestBidder, tokenId);
            
            // Transfer funds to seller
            auction.seller.transfer(sellerAmount);
            
            // Transfer platform fee to owner
            if (platformFee > 0) {
                payable(owner()).transfer(platformFee);
            }
            
            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        } else {
            // No bids received, auction ends without sale
            emit AuctionEnded(tokenId, address(0), 0);
        }
    }
    
    /**
     * @dev Cancel an auction (only if no bids placed)
     * @param tokenId The token ID of the auction to cancel
     */
    function cancelAuction(uint256 tokenId) external nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(auction.seller == msg.sender, "You are not the seller");
        require(auction.highestBidder == address(0), "Cannot cancel auction with bids");
        
        auction.isActive = false;
        
        emit AuctionCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Withdraw bid refunds
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingReturns[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit BidWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Emergency cancel auction (owner only, refunds all bids)
     * @param tokenId The token ID of the auction to emergency cancel
     */
    function emergencyCancelAuction(uint256 tokenId) external onlyOwner nonReentrant {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        
        auction.isActive = false;
        
        // Refund highest bidder if exists
        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
            auction.highestBid = 0;
            auction.highestBidder = address(0);
        }
        
        emit AuctionCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Get all auction token IDs
     */
    function getAllAuctionTokenIds() external view returns (uint256[] memory) {
        return auctionTokenIds;
    }
    
    /**
     * @dev Get all active auctions with details
     */
    function getAllActiveAuctions() external view returns (Auction[] memory) {
        uint256 count = 0;
        
        // First, count active auctions
        for (uint256 i = 0; i < auctionTokenIds.length; i++) {
            if (auctions[auctionTokenIds[i]].isActive) {
                count++;
            }
        }
        
        // Create array with active auctions
        Auction[] memory activeAuctions = new Auction[](count);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < auctionTokenIds.length; i++) {
            uint256 tokenId = auctionTokenIds[i];
            if (auctions[tokenId].isActive) {
                activeAuctions[currentIndex] = auctions[tokenId];
                currentIndex++;
            }
        }
        
        return activeAuctions;
    }
    
    /**
     * @dev Get auction details
     * @param tokenId The token ID to get auction for
     */
    function getAuction(uint256 tokenId) external view returns (Auction memory) {
        return auctions[tokenId];
    }
    
    /**
     * @dev Check if auction has ended
     * @param tokenId The token ID to check
     */
    function hasAuctionEnded(uint256 tokenId) external view returns (bool) {
        return block.timestamp >= auctions[tokenId].endTime;
    }
    
    /**
     * @dev Get time remaining in auction
     * @param tokenId The token ID to check
     */
    function getTimeRemaining(uint256 tokenId) external view returns (uint256) {
        Auction memory auction = auctions[tokenId];
        if (block.timestamp >= auction.endTime) {
            return 0;
        }
        return auction.endTime - block.timestamp;
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
