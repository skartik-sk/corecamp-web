// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampFactory.sol";
import "../src/CoreCampMarketplace.sol";
import "../src/CoreCampEscrow.sol";
import "../src/CoreCampAuction.sol";
import "../src/CoreCampLottery.sol";
import "../src/mocks/MockVRFCoordinatorV2.sol";

contract CoreCampFactoryTest is Test {
    
    CampfireIPNFT public nftContract;
    CoreCampFactory public factory;
    MockVRFCoordinatorV2 public mockVRF;
    
    address public owner;
    address public user1;
    address public user2;
    
    bytes32 public constant KEY_HASH = bytes32("test_key_hash");
    uint64 public constant SUBSCRIPTION_ID = 1;
     receive() external payable {}
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
    
    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy mock VRF coordinator
        mockVRF = new MockVRFCoordinatorV2();
        
        // Deploy NFT contract
        nftContract = new CampfireIPNFT();
        
        // Deploy factory
        factory = new CoreCampFactory(

        );
    }
    
    // ==================== DEPLOY MARKETPLACE TESTS ====================
    
    function test_deployMarketplace_Success() public {
        vm.expectEmit(true, true, false, false);
        emit MarketplaceDeployed(1, address(nftContract), address(0), address(0), address(0), address(0));
        
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        
        assertEq(deploymentId, 1);
        
        // Verify deployment details
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        
        assertEq(deployment.nftContract, address(nftContract));
        assertNotEq(deployment.marketplace, address(0));
        assertNotEq(deployment.escrow, address(0));
        assertNotEq(deployment.auction, address(0));
        assertNotEq(deployment.lottery, address(0));
        assertTrue(deployment.isActive);
        assertEq(deployment.deployedAt, block.timestamp);
        
        // Verify contracts are properly initialized
        CoreCampMarketplace marketplace = CoreCampMarketplace(deployment.marketplace);
        assertEq(address(marketplace.campfireNFT()), address(nftContract));
        
        CoreCampEscrow escrow = CoreCampEscrow(deployment.escrow);
        assertEq(address(escrow.campfireNFT()), address(nftContract));
        
        CoreCampAuction auction = CoreCampAuction(deployment.auction);
        assertEq(address(auction.campfireNFT()), address(nftContract));
        
        CoreCampLottery lottery = CoreCampLottery(deployment.lottery);
        assertEq(address(lottery.campfireNFT()), address(nftContract));

    }
    
    function test_deployMarketplace_RevertInvalidNFTAddress() public {
        vm.expectRevert("Invalid NFT contract address");
        factory.deployMarketplace(address(0));
    }
    
    function test_deployMarketplace_RevertAlreadyDeployed() public {
        factory.deployMarketplace(address(nftContract));
        
        vm.expectRevert("Marketplace already deployed for this NFT");
        factory.deployMarketplace(address(nftContract));
    }
    
    function test_deployMarketplace_MultipleNFTContracts() public {
        // Deploy for first NFT contract
        uint256 deploymentId1 = factory.deployMarketplace(address(nftContract));
        
        // Deploy second NFT contract
        CampfireIPNFT nftContract2 = new CampfireIPNFT();
        uint256 deploymentId2 = factory.deployMarketplace(address(nftContract2));
        
        assertEq(deploymentId1, 1);
        assertEq(deploymentId2, 2);
        
        // Verify both deployments
        CoreCampFactory.MarketplaceContracts memory deployment1 = factory.getDeployment(deploymentId1);
        CoreCampFactory.MarketplaceContracts memory deployment2 = factory.getDeployment(deploymentId2);
        
        assertEq(deployment1.nftContract, address(nftContract));
        assertEq(deployment2.nftContract, address(nftContract2));
        assertNotEq(deployment1.marketplace, deployment2.marketplace);
    }
    
    function test_deployCampfireMarketplace() public {
        uint256 deploymentId = factory.deployCampfireMarketplace(address(nftContract));
        
        assertEq(deploymentId, 1);
        
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        assertEq(deployment.nftContract, address(nftContract));
        assertTrue(deployment.isActive);
    }
    
    // ==================== GETTER FUNCTIONS TESTS ====================
    
    function test_getDeployment() public {
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        
        assertEq(deployment.nftContract, address(nftContract));
        assertNotEq(deployment.marketplace, address(0));
        assertTrue(deployment.isActive);
    }
    
    function test_getDeployment_RevertNonexistent() public {
        vm.expectRevert("Deployment does not exist");
        factory.getDeployment(999);
    }
    
    function test_getDeploymentByNFT() public {
       factory.deployMarketplace(address(nftContract));
        
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeploymentByNFT(address(nftContract));
        
        assertEq(deployment.nftContract, address(nftContract));
        assertNotEq(deployment.marketplace, address(0));
    }
    
    function test_getDeploymentByNFT_RevertNotFound() public {
        vm.expectRevert("No deployment found for this NFT contract");
        factory.getDeploymentByNFT(address(nftContract));
    }
    
    function test_getAllDeploymentIds() public {
        uint256[] memory initialIds = factory.getAllDeploymentIds();
        assertEq(initialIds.length, 0);
        
        factory.deployMarketplace(address(nftContract));
        
        CampfireIPNFT nftContract2 = new CampfireIPNFT();
        factory.deployMarketplace(address(nftContract2));
        
        uint256[] memory allIds = factory.getAllDeploymentIds();
        assertEq(allIds.length, 2);
        assertEq(allIds[0], 1);
        assertEq(allIds[1], 2);
    }
    
    function test_getDeploymentCount() public {
        assertEq(factory.getDeploymentCount(), 0);
        
        factory.deployMarketplace(address(nftContract));
        assertEq(factory.getDeploymentCount(), 1);
        
        CampfireIPNFT nftContract2 = new CampfireIPNFT();
        factory.deployMarketplace(address(nftContract2));
        assertEq(factory.getDeploymentCount(), 2);
    }
    
    // ==================== DEPLOYMENT MANAGEMENT TESTS ====================
    
    function test_setDeploymentStatus() public {
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        
        vm.expectEmit(true, false, false, true);
        emit DeploymentStatusChanged(deploymentId, false);
        
        factory.setDeploymentStatus(deploymentId, false);
        
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        assertFalse(deployment.isActive);
        
        // Set back to active
        vm.expectEmit(true, false, false, true);
        emit DeploymentStatusChanged(deploymentId, true);
        
        factory.setDeploymentStatus(deploymentId, true);
        
        deployment = factory.getDeployment(deploymentId);
        assertTrue(deployment.isActive);
    }
    
    function test_setDeploymentStatus_RevertNonexistent() public {
        vm.expectRevert("Deployment does not exist");
        factory.setDeploymentStatus(999, false);
    }
    
    function test_isValidDeployment() public {
        assertFalse(factory.isValidDeployment(999));
        
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        assertTrue(factory.isValidDeployment(deploymentId));
        
        factory.setDeploymentStatus(deploymentId, false);
        assertFalse(factory.isValidDeployment(deploymentId));
    }
    
    
    
    // ==================== BATCH OPERATIONS TESTS ====================
    
    function test_updateAllPlatformFees() public {
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        uint256 newFeeBps = 500; // 5%
        
        factory.updateAllPlatformFees(deploymentId, newFeeBps);
        
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        
        // Verify all contracts have updated fee
        CoreCampMarketplace marketplace = CoreCampMarketplace(deployment.marketplace);
        assertEq(marketplace.platformFeeBps(), newFeeBps);
        
        CoreCampEscrow escrow = CoreCampEscrow(deployment.escrow);
        assertEq(escrow.platformFeeBps(), newFeeBps);
        
        CoreCampAuction auction = CoreCampAuction(deployment.auction);
        assertEq(auction.platformFeeBps(), newFeeBps);
        
        CoreCampLottery lottery = CoreCampLottery(deployment.lottery);
        assertEq(lottery.platformFeeBps(), newFeeBps);
    }
    
    function test_updateAllPlatformFees_RevertTooHigh() public {
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        
        vm.expectRevert("Fee cannot exceed 10%");
        factory.updateAllPlatformFees(deploymentId, 1001);
    }
    
    function test_updateAllPlatformFees_RevertNonexistent() public {
        vm.expectRevert("Deployment does not exist");
        factory.updateAllPlatformFees(999, 500);
    }
    
    function test_emergencyWithdrawFromContracts() public {
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        
        // Send some ETH to each contract
        vm.deal(deployment.marketplace, 1 ether);
        vm.deal(deployment.escrow, 1 ether);
        vm.deal(deployment.auction, 1 ether);
        vm.deal(deployment.lottery, 1 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        
        factory.emergencyWithdrawFromContracts(deploymentId);
        factory.withdraw();
        
        // Verify all ETH was withdrawn to factory owner
        assertEq(owner.balance - ownerBalanceBefore, 4 ether);
        assertEq(deployment.marketplace.balance, 0);
        assertEq(deployment.escrow.balance, 0);
        assertEq(deployment.auction.balance, 0);
        assertEq(deployment.lottery.balance, 0);
    }
    
    function test_emergencyWithdrawFromContracts_RevertNonexistent() public {
        vm.expectRevert("Deployment does not exist");
        factory.emergencyWithdrawFromContracts(999);
    }
    
    // ==================== ACCESS CONTROL TESTS ====================
    
    function test_onlyOwnerFunctions() public {
        vm.startPrank(user1);
        
        vm.expectRevert("Ownable: caller is not the owner");
        factory.deployMarketplace(address(nftContract));
        
        vm.expectRevert("Ownable: caller is not the owner");
        factory.setDeploymentStatus(1, false);
        

        vm.expectRevert("Ownable: caller is not the owner");
        factory.updateAllPlatformFees(1, 500);
        
        vm.expectRevert("Ownable: caller is not the owner");
        factory.emergencyWithdrawFromContracts(1);
        
        vm.stopPrank();
    }
    
    // ==================== INTEGRATION TESTS ====================
    
    function test_fullIntegration_DeployAndUse() public {
        // Deploy marketplace
        uint256 deploymentId = factory.deployMarketplace(address(nftContract));
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        
        // Setup users and NFT
        address seller = makeAddr("seller");
        address buyer = makeAddr("buyer");
        vm.deal(seller, 10 ether);
        vm.deal(buyer, 10 ether);
        
        // Mint NFT to seller
        vm.startPrank(seller);
        
        CampfireIPNFT.LicenseTerms memory licenseTerms = CampfireIPNFT.LicenseTerms({
            price: 0.1 ether,
            duration: 365 days,
            royaltyBps: 500,
            paymentToken: address(0)
        });
        
        CampfireIPNFT.IPMetadata memory ipMetadata = CampfireIPNFT.IPMetadata({
            creator: seller,
            category: "Art",
            tags: new string[](1),
            createdAt: 0,
            isDerivative: false,
            parentTokenId: 0
        });
        ipMetadata.tags[0] = "Digital";
        
        uint256 tokenId = nftContract.mintIP(seller, "ipfs://test-uri", licenseTerms, ipMetadata);
        
        // Use the deployed marketplace
        nftContract.approve(deployment.marketplace, tokenId);
        CoreCampMarketplace(deployment.marketplace).listNFT(tokenId, 1 ether);
        
        vm.stopPrank();
        
        // Buy the NFT
        vm.startPrank(buyer);
        CoreCampMarketplace(deployment.marketplace).buyNFT{value: 1 ether}(tokenId);
        vm.stopPrank();
        
        // Verify purchase
        assertEq(nftContract.ownerOf(tokenId), buyer);
    }
}
