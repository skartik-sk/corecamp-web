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
        
   
        // Deploy main contracts

        nftContract = address(0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1);
        console.log("CampfireIPNFT deployed at:", nftContract);
        
        CoreCampFactory factoryContract = new CoreCampFactory(

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
        
        


        nftContract = address(0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1);
        console.log("CampfireIPNFT deployed at:", nftContract);
        
        CoreCampFactory factoryContract = new CoreCampFactory(

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
        console.log("Deployment info JSON:", finalJson);

        
        console.log("Deployment info saved to:", filename);
    }
    
 
}
