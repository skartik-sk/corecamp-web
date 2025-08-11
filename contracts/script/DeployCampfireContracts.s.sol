// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampFactory.sol";
import "../src/mocks/MockVRFCoordinatorV2.sol";

/**
 * @title DeployCampfireContracts
 * @dev Script to deploy all Campfire contracts for different environments
 */
contract DeployCampfireContracts is Script {
    
    // VRF Configuration for different networks
    struct VRFConfig {
        address coordinator;
        bytes32 keyHash;
        uint64 subscriptionId;
    }
    
    // Network configurations
    mapping(string => VRFConfig) public vrfConfigs;
    
    function setUp() public {
        // Ethereum Mainnet VRF Config
        vrfConfigs["mainnet"] = VRFConfig({
            coordinator: 0x271682DEB8C4E0901D1a1550aD2e64D568E69909,
            keyHash: 0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef,
            subscriptionId: 0 // This needs to be set after creating subscription
        });
        
        // Ethereum Sepolia VRF Config
        vrfConfigs["sepolia"] = VRFConfig({
            coordinator: 0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625,
            keyHash: 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c,
            subscriptionId: 0 // This needs to be set after creating subscription
        });
        
        // Polygon Mainnet VRF Config
        // vrfConfigs["polygon"] = VRFConfig({
        //     coordinator: 0xAE975071Be8F8eE67addBC1A82488F1C24858067,
        //     keyHash: 0xcc294a196eeeb44da2888d17c0625cc88d70d9760a69d58d853ba6581a0fd61,
        //     subscriptionId: 0 // This needs to be set after creating subscription
        // });
    }
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory network = vm.envOr("NETWORK", string("localhost"));
        
        vm.startBroadcast(deployerPrivateKey);
        
        address nftContract;
        address factory;
        uint256 deploymentId;
        
        if (keccak256(abi.encodePacked(network)) == keccak256(abi.encodePacked("localhost"))) {
            (nftContract, factory, deploymentId) = deployLocal();
        } else {
            (nftContract, factory, deploymentId) = deployToNetwork(network);
        }
        
        vm.stopBroadcast();
        
        // Log deployment addresses
        console.log("=== Campfire Deployment Complete ===");
        console.log("Network:", network);
        console.log("CampfireIPNFT:", nftContract);
        console.log("CoreCampFactory:", factory);
        console.log("Deployment ID:", deploymentId);
        
        // Get and log marketplace contract addresses
        CoreCampFactory factoryContract = CoreCampFactory(payable(factory));
        CoreCampFactory.MarketplaceContracts memory deployment = factoryContract.getDeployment(deploymentId);
        
        console.log("=== Marketplace Contracts ===");
        console.log("CoreCampMarketplace:", deployment.marketplace);
        console.log("CoreCampEscrow:", deployment.escrow);
        console.log("CoreCampAuction:", deployment.auction);
        console.log("CoreCampLottery:", deployment.lottery);
        
        // Save deployment info to file
        _saveDeploymentInfo(network, nftContract, factory, deployment);
    }
    
    function deployLocal() internal returns (address nftContract, address factory, uint256 deploymentId) {
        console.log("Deploying to local network with mock VRF...");
        
        // Deploy mock VRF coordinator for local testing
        MockVRFCoordinatorV2 mockVRF = new MockVRFCoordinatorV2();
        console.log("MockVRFCoordinatorV2 deployed at:", address(mockVRF));
        
        // Deploy main contracts
        CampfireIPNFT nft = new CampfireIPNFT();
        nftContract = address(nft);
        console.log("CampfireIPNFT deployed at:", nftContract);
        
        CoreCampFactory factoryContract = new CoreCampFactory(
            address(mockVRF),
            bytes32("mock_key_hash"),
            1
        );
        factory = address(factoryContract);
        console.log("CoreCampFactory deployed at:", factory);
        
        // Deploy marketplace contracts
        deploymentId = factoryContract.deployMarketplace(nftContract);
        console.log("Marketplace contracts deployed with ID:", deploymentId);
        
        return (nftContract, factory, deploymentId);
    }
    
    function deployToNetwork(string memory network) internal returns (address nftContract, address factory, uint256 deploymentId) {
        console.log("Deploying to network:", network);
        
        VRFConfig memory config = vrfConfigs[network];
        require(config.coordinator != address(0), "VRF config not found for network");
        
        if (config.subscriptionId == 0) {
            console.log("WARNING: VRF subscription ID is 0. You need to:");
            console.log("1. Create a VRF subscription at vrf.chain.link");
            console.log("2. Update the subscription ID in this script");
            console.log("3. Add the deployed lottery contract as a consumer");
        }
        
        // Deploy main contracts
        CampfireIPNFT nft = new CampfireIPNFT();
        nftContract = address(nft);
        console.log("CampfireIPNFT deployed at:", nftContract);
        
        CoreCampFactory factoryContract = new CoreCampFactory(
            config.coordinator,
            config.keyHash,
            config.subscriptionId
        );
        factory = address(factoryContract);
        console.log("CoreCampFactory deployed at:", factory);
        
        // Deploy marketplace contracts
        deploymentId = factoryContract.deployMarketplace(nftContract);
        console.log("Marketplace contracts deployed with ID:", deploymentId);
        
        return (nftContract, factory, deploymentId);
    }
    
    function _saveDeploymentInfo(
        string memory network,
        address nftContract,
        address factory,
        CoreCampFactory.MarketplaceContracts memory deployment
    ) internal {
        string memory json = "deployment";
        
        vm.serializeString(json, "network", network);
        vm.serializeUint(json, "timestamp", block.timestamp);
        vm.serializeAddress(json, "deployer", msg.sender);
        
        vm.serializeAddress(json, "campfireIPNFT", nftContract);
        vm.serializeAddress(json, "coreCampFactory", factory);
        
        vm.serializeAddress(json, "coreCampMarketplace", deployment.marketplace);
        vm.serializeAddress(json, "coreCampEscrow", deployment.escrow);
        vm.serializeAddress(json, "coreCampAuction", deployment.auction);
        string memory finalJson = vm.serializeAddress(json, "coreCampLottery", deployment.lottery);
        
        string memory filename = string.concat("deployments/", network, "-deployment.json");
        vm.writeJson(finalJson, filename);
        
        console.log("Deployment info saved to:", filename);
    }
    
    // Utility function to update VRF subscription ID after deployment
    function updateVRFSubscriptionId(address factoryAddress, uint64 newSubscriptionId) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        CoreCampFactory factory = CoreCampFactory(payable(factoryAddress));
        
        // Get current config
        address currentCoordinator = factory.vrfCoordinator();
        bytes32 currentKeyHash = factory.keyHash();
        
        // Update with new subscription ID
        factory.updateVRFConfig(currentCoordinator, currentKeyHash, newSubscriptionId);
        
        vm.stopBroadcast();
        
        console.log("VRF subscription ID updated to:", newSubscriptionId);
    }
    
    // Function to deploy to a specific network with custom VRF config
    function deployWithCustomVRF(
        address vrfCoordinator,
        bytes32 keyHash,
        uint64 subscriptionId
    ) external returns (address nftContract, address factory, uint256 deploymentId) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy main contracts
        CampfireIPNFT nft = new CampfireIPNFT();
        nftContract = address(nft);
        
        CoreCampFactory factoryContract = new CoreCampFactory(
            vrfCoordinator,
            keyHash,
            subscriptionId
        );
        factory = address(factoryContract);
        
        // Deploy marketplace contracts
        deploymentId = factoryContract.deployMarketplace(nftContract);
        
        vm.stopBroadcast();
        
        return (nftContract, factory, deploymentId);
    }
}
