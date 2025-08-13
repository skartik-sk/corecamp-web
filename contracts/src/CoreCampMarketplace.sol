// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CoreCampMarketplace
 * @dev Direct ownership marketplace for IP-NFTs - fixed price listings with instant buy
 */
contract CoreCampMarketplace is ReentrancyGuard, Ownable {
    
    struct Listing {
        uint256 tokenId;    // The token ID being listed
        address seller;     // The address of the person selling the NFT
        uint256 price;      // The price in wei
        bool isActive;      // Is the listing currently active or has it been sold/cancelled?
    }
    
    // Maps a token ID from the Origin IP-NFT contract to its listing details
    mapping(uint256 => Listing) public listings;
    
    // Array to track all listed token IDs
    uint256[] public listedTokenIds;
    
    // Reference to the CampfireIPNFT contract
    IERC721 public immutable campfireNFT;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFeeBps = 25; // 2.5%
    
    // Events
    event Checkpoint(uint256 indexed tokenId, address indexed user);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId, address indexed seller, uint256 oldPrice, uint256 newPrice);
    
    constructor(address _campfireNFT) {
        require(_campfireNFT != address(0), "Invalid NFT contract address");
        campfireNFT = IERC721(_campfireNFT);
    }
    
    /**
     * @dev List an NFT for sale
     * @param tokenId The token ID to list
     * @param price The price in wei
     */
    function listNFT(uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "Price must be greater than zero");
        require(campfireNFT.ownerOf(tokenId) == msg.sender, "You are not the owner");
        require(campfireNFT.getApproved(tokenId) == address(this), "Marketplace not approved");
        require(!listings[tokenId].isActive, "NFT already listed");
        
        listings[tokenId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true
        });
        
        // Add to listed token IDs array
        listedTokenIds.push(tokenId);
        
        emit NFTListed(tokenId, msg.sender, price);
    }
    
    /**
     * @dev Buy an NFT that's listed for sale
     * @param tokenId The token ID to buy
     */
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Listing is not active");
        require(msg.value >= listing.price, "Insufficient funds");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");
        
        // Verify the NFT is still approved and owned by the seller
        require(campfireNFT.ownerOf(tokenId) == listing.seller, "Seller no longer owns NFT");
        require(campfireNFT.getApproved(tokenId) == address(this), "Marketplace not approved");
        
        // Mark listing as inactive first to prevent re-entrancy
        listings[tokenId].isActive = false;
        
        // Calculate platform fee
        uint256 platformFee = (listing.price * platformFeeBps) / 10000;
        uint256 sellerAmount = listing.price - platformFee;
        
        // Transfer NFT to buyer
        campfireNFT.transferFrom(listing.seller, msg.sender, tokenId);
        
        // Transfer funds to seller
        payable(listing.seller).transfer(sellerAmount);
        
        // Transfer platform fee to owner
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        emit Checkpoint(tokenId, msg.sender);
        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
        
        emit NFTSold(tokenId, listing.seller, msg.sender, listing.price);
    }
    
    /**
     * @dev Cancel an active listing
     * @param tokenId The token ID to cancel listing for
     */
    function cancelListing(uint256 tokenId) external nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Listing is not active");
        require(listing.seller == msg.sender, "You are not the seller");
        
        listings[tokenId].isActive = false;
        
        emit ListingCancelled(tokenId, msg.sender);
    }
    
    /**
     * @dev Update the price of an active listing
     * @param tokenId The token ID to update price for
     * @param newPrice The new price in wei
     */
    function updatePrice(uint256 tokenId, uint256 newPrice) external nonReentrant {
        require(newPrice > 0, "Price must be greater than zero");
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Listing is not active");
        require(listing.seller == msg.sender, "You are not the seller");
        
        uint256 oldPrice = listing.price;
        listing.price = newPrice;
        
        emit PriceUpdated(tokenId, msg.sender, oldPrice, newPrice);
    }
    
    /**
     * @dev Get listing details
     * @param tokenId The token ID to get listing for
     */
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
    
    /**
     * @dev Get all listed token IDs
     */
    function getAllListedTokenIds() external view returns (uint256[] memory) {
        return listedTokenIds;
    }
    
    /**
     * @dev Get all active listings with details
     */
    function getAllActiveListings() external view returns (Listing[] memory) {
        uint256 count = 0;
        
        // First, count active listings
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            if (listings[listedTokenIds[i]].isActive) {
                count++;
            }
        }
        
        // Create array with active listings
        Listing[] memory activeListings = new Listing[](count);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < listedTokenIds.length; i++) {
            uint256 tokenId = listedTokenIds[i];
            if (listings[tokenId].isActive) {
                activeListings[currentIndex] = listings[tokenId];
                currentIndex++;
            }
        }
        
        return activeListings;
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
