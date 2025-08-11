// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CoreCampEscrow
 * @dev P2P Escrow contract for negotiated IP-NFT sales with dual confirmation
 */
contract CoreCampEscrow is ReentrancyGuard, Ownable {
    
    enum DealStatus { Created, Funded, Confirmed, Cancelled }
    
    struct EscrowDeal {
        address seller;
        address buyer;
        uint256 price;
        bool sellerConfirmed;
        bool buyerConfirmed;
        DealStatus status;
        uint256 createdAt;
    }
    
    // Maps a token ID to its escrow deal
    mapping(uint256 => EscrowDeal) public deals;
    
    // Reference to the CampfireIPNFT contract
    IERC721 public immutable campfireNFT;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFeeBps = 250; // 2.5%
    
    // Timeout period for deals (7 days)
    uint256 public constant DEAL_TIMEOUT = 7 days;
    
    // Events
    event DealCreated(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event DealFunded(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event DealConfirmed(uint256 indexed tokenId, address indexed confirmer, bool isSellerConfirmed, bool isBuyerConfirmed);
    event DealCompleted(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event DealCancelled(uint256 indexed tokenId, address indexed canceller, uint256 refundAmount);
    
    constructor(address _campfireNFT) {
        require(_campfireNFT != address(0), "Invalid NFT contract address");
        campfireNFT = IERC721(_campfireNFT);
    }
    
    /**
     * @dev Create a new escrow deal
     * @param buyer The buyer's address
     * @param tokenId The token ID being sold
     * @param price The agreed price in wei
     */
    function createDeal(address buyer, uint256 tokenId, uint256 price) external nonReentrant {
        require(buyer != address(0), "Invalid buyer address");
        require(buyer != msg.sender, "Buyer cannot be seller");
        require(price > 0, "Price must be greater than zero");
        require(campfireNFT.ownerOf(tokenId) == msg.sender, "You are not the owner");
        require(campfireNFT.getApproved(tokenId) == address(this), "Escrow not approved");
        require(deals[tokenId].status == DealStatus.Cancelled || deals[tokenId].seller == address(0), "Deal already exists");
        
        deals[tokenId] = EscrowDeal({
            seller: msg.sender,
            buyer: buyer,
            price: price,
            sellerConfirmed: false,
            buyerConfirmed: false,
            status: DealStatus.Created,
            createdAt: block.timestamp
        });
        
        emit DealCreated(tokenId, msg.sender, buyer, price);
    }
    
    /**
     * @dev Fund an existing deal (buyer only)
     * @param tokenId The token ID of the deal to fund
     */
    function fundDeal(uint256 tokenId) external payable nonReentrant {
        EscrowDeal storage deal = deals[tokenId];
        require(msg.sender == deal.buyer, "You are not the buyer");
        require(deal.status == DealStatus.Created, "Deal not in created state");
        require(msg.value == deal.price, "Incorrect fund amount");
        require(block.timestamp <= deal.createdAt + DEAL_TIMEOUT, "Deal has expired");
        
        // Verify NFT is still available and approved
        require(campfireNFT.ownerOf(tokenId) == deal.seller, "Seller no longer owns NFT");
        require(campfireNFT.getApproved(tokenId) == address(this), "Escrow not approved");
        
        deal.status = DealStatus.Funded;
        
        emit DealFunded(tokenId, msg.sender, msg.value);
    }
    
    /**
     * @dev Confirm the transfer (both parties must confirm)
     * @param tokenId The token ID of the deal to confirm
     */
    function confirmTransfer(uint256 tokenId) external nonReentrant {
        EscrowDeal storage deal = deals[tokenId];
        require(deal.status == DealStatus.Funded, "Deal is not funded");
        require(msg.sender == deal.seller || msg.sender == deal.buyer, "You are not part of this deal");
        require(block.timestamp <= deal.createdAt + DEAL_TIMEOUT, "Deal has expired");
        
        if (msg.sender == deal.seller) {
            require(!deal.sellerConfirmed, "Seller already confirmed");
            deal.sellerConfirmed = true;
        } else {
            require(!deal.buyerConfirmed, "Buyer already confirmed");
            deal.buyerConfirmed = true;
        }
        
        emit DealConfirmed(tokenId, msg.sender, deal.sellerConfirmed, deal.buyerConfirmed);
        
        // If both parties have confirmed, complete the deal
        if (deal.sellerConfirmed && deal.buyerConfirmed) {
            _completeDeal(tokenId);
        }
    }
    
    /**
     * @dev Cancel a deal (either party can cancel)
     * @param tokenId The token ID of the deal to cancel
     */
    function cancelDeal(uint256 tokenId) external nonReentrant {
        EscrowDeal storage deal = deals[tokenId];
        require(deal.status == DealStatus.Created || deal.status == DealStatus.Funded, "Cannot cancel this deal");
        require(msg.sender == deal.seller || msg.sender == deal.buyer, "You are not part of this deal");
        
        uint256 refundAmount = 0;
        
        // If deal was funded, refund the buyer
        if (deal.status == DealStatus.Funded) {
            refundAmount = deal.price;
            payable(deal.buyer).transfer(refundAmount);
        }
        
        deal.status = DealStatus.Cancelled;
        
        emit DealCancelled(tokenId, msg.sender, refundAmount);
    }
    
    /**
     * @dev Cancel expired deals (anyone can call)
     * @param tokenId The token ID of the expired deal
     */
    function cancelExpiredDeal(uint256 tokenId) external nonReentrant {
        EscrowDeal storage deal = deals[tokenId];
        require(deal.status == DealStatus.Created || deal.status == DealStatus.Funded, "Deal not cancellable");
        require(block.timestamp > deal.createdAt + DEAL_TIMEOUT, "Deal not yet expired");
        
        uint256 refundAmount = 0;
        
        // If deal was funded, refund the buyer
        if (deal.status == DealStatus.Funded) {
            refundAmount = deal.price;
            payable(deal.buyer).transfer(refundAmount);
        }
        
        deal.status = DealStatus.Cancelled;
        
        emit DealCancelled(tokenId, msg.sender, refundAmount);
    }
    
    /**
     * @dev Internal function to complete a deal
     */
    function _completeDeal(uint256 tokenId) internal {
        EscrowDeal storage deal = deals[tokenId];
        
        // Final verification
        require(campfireNFT.ownerOf(tokenId) == deal.seller, "Seller no longer owns NFT");
        require(campfireNFT.getApproved(tokenId) == address(this), "Escrow not approved");
        
        deal.status = DealStatus.Confirmed;
        
        // Calculate platform fee
        uint256 platformFee = (deal.price * platformFeeBps) / 10000;
        uint256 sellerAmount = deal.price - platformFee;
        
        // Transfer NFT to buyer
        campfireNFT.transferFrom(deal.seller, deal.buyer, tokenId);
        
        // Transfer funds to seller
        payable(deal.seller).transfer(sellerAmount);
        
        // Transfer platform fee to owner
        if (platformFee > 0) {
            payable(owner()).transfer(platformFee);
        }
        
        emit DealCompleted(tokenId, deal.seller, deal.buyer, deal.price);
    }
    
    /**
     * @dev Get deal details
     * @param tokenId The token ID to get deal for
     */
    function getDeal(uint256 tokenId) external view returns (EscrowDeal memory) {
        return deals[tokenId];
    }
    
    /**
     * @dev Check if a deal has expired
     * @param tokenId The token ID to check
     */
    function isDealExpired(uint256 tokenId) external view returns (bool) {
        EscrowDeal memory deal = deals[tokenId];
        return block.timestamp > deal.createdAt + DEAL_TIMEOUT;
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
