// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CampfireIPNFT
 * @dev NFT contract for intellectual property with licensing and royalty features
 */
contract CampfireIPNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;
    
    struct LicenseTerms {
        uint256 price;           // Price in wei
        uint256 duration;        // Duration in seconds (0 = perpetual)
        uint256 royaltyBps;      // Royalty in basis points (100 = 1%)
        address paymentToken;    // Payment token address (address(0) = ETH)
    }
    
    struct IPMetadata {
        address creator;
        string category;
        string[] tags;
        uint256 createdAt;
        bool isDerivative;
        uint256 parentTokenId;
    }
    
    // Mappings
    mapping(uint256 => LicenseTerms) public licenseTerms;
    mapping(uint256 => IPMetadata) public ipMetadata;
    mapping(uint256 => mapping(address => uint256)) public licenseExpiry;
    mapping(uint256 => uint256) public totalRevenue;
    mapping(address => uint256) public creatorRevenue;
    
    // Events
    event IPCreated(uint256 indexed tokenId, address indexed creator, string uri);
    event LicensePurchased(uint256 indexed tokenId, address indexed buyer, uint256 price, uint256 duration);
    event RoyaltyPaid(uint256 indexed tokenId, address indexed creator, uint256 amount);
    
    constructor() ERC721("Campfire IP NFT", "CFIP") {}
    
    /**
     * @dev Mint a new IP NFT with license terms
     */
    function mintIP(
        address to,
        string memory uri,
        LicenseTerms memory _licenseTerms,
        IPMetadata memory _ipMetadata
    ) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        licenseTerms[tokenId] = _licenseTerms;
        ipMetadata[tokenId] = _ipMetadata;
        ipMetadata[tokenId].creator = to;
        ipMetadata[tokenId].createdAt = block.timestamp;
        
        emit IPCreated(tokenId, to, uri);
        return tokenId;
    }
    
    /**
     * @dev Purchase a license for an IP NFT
     */
    function purchaseLicense(uint256 tokenId, uint256 periods) external payable nonReentrant {
        require(_exists(tokenId), "Token does not exist");
        require(periods > 0, "Periods must be greater than 0");
        
        LicenseTerms memory terms = licenseTerms[tokenId];
        uint256 totalCost = terms.price * periods;
        
        if (terms.paymentToken == address(0)) {
            require(msg.value >= totalCost, "Insufficient payment");
        }
        
        // Calculate license duration
        uint256 licenseDuration = terms.duration * periods;
        if (terms.duration == 0) {
            licenseDuration = type(uint256).max; // Perpetual
        }
        
        // Set or extend license
        uint256 currentExpiry = licenseExpiry[tokenId][msg.sender];
        if (currentExpiry < block.timestamp) {
            licenseExpiry[tokenId][msg.sender] = block.timestamp + licenseDuration;
        } else {
            licenseExpiry[tokenId][msg.sender] = currentExpiry + licenseDuration;
        }
        
        // Handle payment
        address creator = ipMetadata[tokenId].creator;
        uint256 royaltyAmount = 0;
        
        if (terms.royaltyBps > 0) {
            royaltyAmount = (totalCost * terms.royaltyBps) / 10000;
        }
        
        uint256 creatorAmount = totalCost - royaltyAmount;
        
        // Pay creator
        if (terms.paymentToken == address(0)) {
            payable(creator).transfer(creatorAmount);
            if (msg.value > totalCost) {
                payable(msg.sender).transfer(msg.value - totalCost);
            }
        }
        
        // Update revenue tracking
        totalRevenue[tokenId] += totalCost;
        creatorRevenue[creator] += creatorAmount;
        
        emit LicensePurchased(tokenId, msg.sender, totalCost, licenseDuration);
        if (royaltyAmount > 0) {
            emit RoyaltyPaid(tokenId, creator, royaltyAmount);
        }
    }
    
    /**
     * @dev Check if user has valid license for an IP
     */
    function hasValidLicense(uint256 tokenId, address user) external view returns (bool) {
        return licenseExpiry[tokenId][user] > block.timestamp;
    }
    
    /**
     * @dev Update license terms (only token owner)
     */
    function updateLicenseTerms(uint256 tokenId, LicenseTerms memory newTerms) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        licenseTerms[tokenId] = newTerms;
    }
    
    /**
     * @dev Get IP statistics
     */
    function getIPStats(uint256 tokenId) external view returns (
        address creator,
        uint256 revenue,
        uint256 createdAt,
        string memory category
    ) {
        IPMetadata memory metadata = ipMetadata[tokenId];
        return (
            metadata.creator,
            totalRevenue[tokenId],
            metadata.createdAt,
            metadata.category
        );
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
