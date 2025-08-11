// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CampfireIPNFT.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CampfireMarketplace
 * @dev Marketplace for IP NFTs with escrow functionality
 */
contract CampfireMarketplace is ReentrancyGuard, Ownable {
    CampfireIPNFT public immutable ipNFT;
    
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        bool active;
        uint256 createdAt;
    }
    
    struct Negotiation {
        address buyer;
        address seller;
        uint256 tokenId;
        uint256 offeredPrice;
        uint256 offeredDuration;
        string terms;
        bool accepted;
        bool cancelled;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    // Mappings
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Negotiation) public negotiations;
    mapping(address => uint256[]) public userNegotiations;
    
    uint256 public nextNegotiationId;
    uint256 public marketplaceFee = 250; // 2.5%
    
    // Events
    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event NegotiationCreated(uint256 indexed negotiationId, address indexed buyer, uint256 indexed tokenId);
    event NegotiationAccepted(uint256 indexed negotiationId);
    event NegotiationCancelled(uint256 indexed negotiationId);
    
    constructor(address _ipNFT) {
        ipNFT = CampfireIPNFT(_ipNFT);
    }
    
    /**
     * @dev List an IP NFT for sale
     */
    function listItem(uint256 tokenId, uint256 price) external {
        require(ipNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be greater than 0");
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            active: true,
            createdAt: block.timestamp
        });
        
        emit ItemListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Buy an IP NFT directly
     */
    function buyItem(uint256 tokenId) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Item not for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        address seller = listing.seller;
        uint256 price = listing.price;
        
        listing.active = false;
        
        // Calculate fees
        uint256 fee = (price * marketplaceFee) / 10000;
        uint256 sellerAmount = price - fee;
        
        // Transfer NFT
        ipNFT.transferFrom(seller, msg.sender, tokenId);
        
        // Transfer payments
        payable(seller).transfer(sellerAmount);
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
        
        emit ItemSold(tokenId, msg.sender, seller, price);
    }
    
    /**
     * @dev Create a negotiation offer
     */
    function createNegotiation(
        uint256 tokenId,
        uint256 offeredPrice,
        uint256 offeredDuration,
        string memory terms,
        uint256 expirationHours
    ) external payable {
        require(ipNFT.ownerOf(tokenId) != msg.sender, "Cannot negotiate with yourself");
        require(msg.value >= offeredPrice, "Must escrow the offered amount");
        
        address seller = ipNFT.ownerOf(tokenId);
        uint256 negotiationId = nextNegotiationId++;
        
        negotiations[negotiationId] = Negotiation({
            buyer: msg.sender,
            seller: seller,
            tokenId: tokenId,
            offeredPrice: offeredPrice,
            offeredDuration: offeredDuration,
            terms: terms,
            accepted: false,
            cancelled: false,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + (expirationHours * 1 hours)
        });
        
        userNegotiations[msg.sender].push(negotiationId);
        userNegotiations[seller].push(negotiationId);
        
        emit NegotiationCreated(negotiationId, msg.sender, tokenId);
    }
    
    /**
     * @dev Accept a negotiation offer
     */
    function acceptNegotiation(uint256 negotiationId) external nonReentrant {
        Negotiation storage negotiation = negotiations[negotiationId];
        require(negotiation.seller == msg.sender, "Not the seller");
        require(!negotiation.accepted && !negotiation.cancelled, "Negotiation already resolved");
        require(block.timestamp <= negotiation.expiresAt, "Negotiation expired");
        
        negotiation.accepted = true;
        
        // Calculate fees
        uint256 fee = (negotiation.offeredPrice * marketplaceFee) / 10000;
        uint256 sellerAmount = negotiation.offeredPrice - fee;
        
        // Transfer NFT
        ipNFT.transferFrom(msg.sender, negotiation.buyer, negotiation.tokenId);
        
        // Transfer escrowed payment to seller
        payable(msg.sender).transfer(sellerAmount);
        
        emit NegotiationAccepted(negotiationId);
    }
    
    /**
     * @dev Cancel a negotiation (buyer can cancel and get refund)
     */
    function cancelNegotiation(uint256 negotiationId) external nonReentrant {
        Negotiation storage negotiation = negotiations[negotiationId];
        require(
            negotiation.buyer == msg.sender || 
            negotiation.seller == msg.sender ||
            block.timestamp > negotiation.expiresAt,
            "Cannot cancel negotiation"
        );
        require(!negotiation.accepted && !negotiation.cancelled, "Negotiation already resolved");
        
        negotiation.cancelled = true;
        
        // Refund escrowed amount to buyer
        payable(negotiation.buyer).transfer(negotiation.offeredPrice);
        
        emit NegotiationCancelled(negotiationId);
    }
    
    /**
     * @dev Get user's active negotiations
     */
    function getUserNegotiations(address user) external view returns (uint256[] memory) {
        return userNegotiations[user];
    }
    
    /**
     * @dev Remove listing
     */
    function removeListing(uint256 tokenId) external {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        listings[tokenId].active = false;
    }
    
    /**
     * @dev Update marketplace fee (owner only)
     */
    function updateMarketplaceFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        marketplaceFee = newFee;
    }
    
    /**
     * @dev Withdraw marketplace fees
     */
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
