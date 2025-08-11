// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CoreCampMarketplace.sol";
import "./CoreCampEscrow.sol";
import "./CoreCampAuction.sol";
import "./CoreCampLottery.sol";

/**
 * @title CoreCampFactory
 * @dev Factory contract to deploy and manage all CoreCamp marketplace contracts
 */
contract CoreCampFactory is Ownable, ReentrancyGuard {
    
    struct MarketplaceContracts {
        address marketplace;
        address escrow;
        address auction;
        address lottery;
        address nftContract;
        uint256 deployedAt;
        bool isActive;
    }
    
    // Counter for deployment IDs
    uint256 private _nextDeploymentId = 1;
    
    // Maps deployment ID to contracts
    mapping(uint256 => MarketplaceContracts) public deployments;
    
    // Maps NFT contract address to deployment ID
    mapping(address => uint256) public nftToDeploymentId;
    
    // Array of all deployment IDs for enumeration
    uint256[] public allDeploymentIds;
     receive() external payable {}
    
    // VRF Configuration for lottery deployments
    address public vrfCoordinator;
    bytes32 public keyHash;
    uint64 public subscriptionId;
    
    // Events
    event MarketplaceDeployed(
        uint256 indexed deploymentId,
        address indexed nftContract,
        address marketplace,
        address escrow,
        address auction,
        address lottery
    );
    event DeploymentStatusChanged(uint256 indexed deploymentId, bool isActive);
    event VRFConfigUpdated(address vrfCoordinator, bytes32 keyHash, uint64 subscriptionId);
    
    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) {
        vrfCoordinator = _vrfCoordinator;
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
    }
    
    /**
     * @dev Deploy all marketplace contracts for a given NFT contract
     * @param nftContract The address of the NFT contract
     * @return deploymentId The deployment ID
     */
    function deployMarketplace(address nftContract) public onlyOwner returns (uint256) {
        require(nftContract != address(0), "Invalid NFT contract address");
        require(nftToDeploymentId[nftContract] == 0, "Marketplace already deployed for this NFT");
        
        uint256 deploymentId = _nextDeploymentId++;
        
        // Deploy marketplace contracts
        CoreCampMarketplace marketplace = new CoreCampMarketplace(nftContract);
        CoreCampEscrow escrow = new CoreCampEscrow(nftContract);
        CoreCampAuction auction = new CoreCampAuction(nftContract);
        CoreCampLottery lottery = new CoreCampLottery(
            nftContract,
            vrfCoordinator,
            keyHash,
            subscriptionId
        );
        
        // Store deployment info
        deployments[deploymentId] = MarketplaceContracts({
            marketplace: address(marketplace),
            escrow: address(escrow),
            auction: address(auction),
            lottery: address(lottery),
            nftContract: nftContract,
            deployedAt: block.timestamp,
            isActive: true
        });
        
        nftToDeploymentId[nftContract] = deploymentId;
        allDeploymentIds.push(deploymentId);
        
        emit MarketplaceDeployed(
            deploymentId,
            nftContract,
            address(marketplace),
            address(escrow),
            address(auction),
            address(lottery)
        );
        
        return deploymentId;
    }
    
    /**
     * @dev Deploy marketplace for CampfireIPNFT specifically
     * @param nftContract The CampfireIPNFT contract address
     * @return deploymentId The deployment ID
     */
    function deployCampfireMarketplace(address nftContract) external onlyOwner returns (uint256) {
        return deployMarketplace(nftContract);
    }
    
    /**
     * @dev Get all contract addresses for a deployment
     * @param deploymentId The deployment ID
     */
    function getDeployment(uint256 deploymentId) external view returns (MarketplaceContracts memory) {
        require(deployments[deploymentId].marketplace != address(0), "Deployment does not exist");
        return deployments[deploymentId];
    }
    
    /**
     * @dev Get deployment by NFT contract address
     * @param nftContract The NFT contract address
     */
    function getDeploymentByNFT(address nftContract) external view returns (MarketplaceContracts memory) {
        uint256 deploymentId = nftToDeploymentId[nftContract];
        require(deploymentId != 0, "No deployment found for this NFT contract");
        return deployments[deploymentId];
    }
    
    /**
     * @dev Get all deployment IDs
     */
    function getAllDeploymentIds() external view returns (uint256[] memory) {
        return allDeploymentIds;
    }
    
    /**
     * @dev Get total number of deployments
     */
    function getDeploymentCount() external view returns (uint256) {
        return allDeploymentIds.length;
    }
    
    /**
     * @dev Toggle deployment active status
     * @param deploymentId The deployment ID
     * @param isActive New active status
     */
    function setDeploymentStatus(uint256 deploymentId, bool isActive) external onlyOwner {
        require(deployments[deploymentId].marketplace != address(0), "Deployment does not exist");
        deployments[deploymentId].isActive = isActive;
        emit DeploymentStatusChanged(deploymentId, isActive);
    }
    
    /**
     * @dev Update VRF configuration for future lottery deployments
     * @param _vrfCoordinator New VRF coordinator address
     * @param _keyHash New key hash
     * @param _subscriptionId New subscription ID
     */
    function updateVRFConfig(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId
    ) external onlyOwner {
        vrfCoordinator = _vrfCoordinator;
        keyHash = _keyHash;
        subscriptionId = _subscriptionId;
        
        emit VRFConfigUpdated(_vrfCoordinator, _keyHash, _subscriptionId);
    }
    
    /**
     * @dev Emergency function to call emergency withdraw on deployed contracts
     * @param deploymentId The deployment ID
     */
    function emergencyWithdrawFromContracts(uint256 deploymentId) external onlyOwner {
        MarketplaceContracts memory deployment = deployments[deploymentId];
        require(deployment.marketplace != address(0), "Deployment does not exist");
        
        // Call emergency withdraw on all contracts that support it
        CoreCampMarketplace(deployment.marketplace).emergencyWithdraw();
        CoreCampEscrow(deployment.escrow).emergencyWithdraw();
        CoreCampAuction(deployment.auction).emergencyWithdraw();
        CoreCampLottery(deployment.lottery).emergencyWithdraw();
    }
    
    /**
     * @dev Batch update platform fees across all contracts in a deployment
     * @param deploymentId The deployment ID
     * @param newFeeBps New fee in basis points
     */
    function updateAllPlatformFees(uint256 deploymentId, uint256 newFeeBps) external onlyOwner {
        MarketplaceContracts memory deployment = deployments[deploymentId];
        require(deployment.marketplace != address(0), "Deployment does not exist");
        require(newFeeBps <= 1000, "Fee cannot exceed 10%");
        
        CoreCampMarketplace(deployment.marketplace).updatePlatformFee(newFeeBps);
        CoreCampEscrow(deployment.escrow).updatePlatformFee(newFeeBps);
        CoreCampAuction(deployment.auction).updatePlatformFee(newFeeBps);
        CoreCampLottery(deployment.lottery).updatePlatformFee(newFeeBps);
    }
    
    /**
     * @dev Check if a deployment is active and valid
     * @param deploymentId The deployment ID to check
     */
    function isValidDeployment(uint256 deploymentId) external view returns (bool) {
        MarketplaceContracts memory deployment = deployments[deploymentId];
        return deployment.marketplace != address(0) && deployment.isActive;
    }
    function withdraw() external onlyOwner {
    payable(owner()).transfer(address(this).balance);
}
}
