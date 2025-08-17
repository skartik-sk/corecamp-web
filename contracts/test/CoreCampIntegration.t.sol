// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../lib/forge-std/src/Test.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampFactory.sol";
import "../src/CoreCampMarketplace.sol";
import "../src/CoreCampEscrow.sol";
import "../src/CoreCampAuction.sol";
import "../src/CoreCampLottery.sol";
import "../src/mocks/MockVRFCoordinatorV2.sol";

/**
 * @title CoreCampIntegrationTest
 * @dev Integration tests for all CoreCamp marketplace contracts
 */
contract CoreCampIntegrationTest is Test {
    
    CampfireIPNFT public nftContract;
    CoreCampFactory public factory;
    MockVRFCoordinatorV2 public mockVRF;
    
    CoreCampMarketplace public marketplace;
    CoreCampEscrow public escrow;
    CoreCampAuction public auction;
    CoreCampLottery public lottery;
    
    address public owner;
    address public artist1;
    address public artist2;
    address public collector1;
    address public collector2;
    address public collector3;
    
    uint256 public tokenId1;
    uint256 public tokenId2;
    uint256 public deploymentId;
    receive() external payable {}
    
    function setUp() public {
        owner = address(this);
        artist1 = makeAddr("artist1");
        artist2 = makeAddr("artist2");
        collector1 = makeAddr("collector1");
        collector2 = makeAddr("collector2");
        collector3 = makeAddr("collector3");
        
        // Fund accounts
        vm.deal(artist1, 100 ether);
        vm.deal(artist2, 100 ether);
        vm.deal(collector1, 100 ether);
        vm.deal(collector2, 100 ether);
        vm.deal(collector3, 100 ether);
        
        // Deploy infrastructure
        mockVRF = new MockVRFCoordinatorV2();
        nftContract = new CampfireIPNFT();
        factory = new CoreCampFactory(

        );
        
        // Deploy marketplace contracts
        deploymentId = factory.deployMarketplace(address(nftContract));
        CoreCampFactory.MarketplaceContracts memory deployment = factory.getDeployment(deploymentId);
        
        marketplace = CoreCampMarketplace(deployment.marketplace);
        escrow = CoreCampEscrow(deployment.escrow);
        auction = CoreCampAuction(deployment.auction);
        lottery = CoreCampLottery(deployment.lottery);
        
        // Mint test NFTs
        _mintTestNFTs();
    }
    
    function _mintTestNFTs() internal {
        // Artist1 mints first NFT
        vm.startPrank(artist1);
        
        CampfireIPNFT.LicenseTerms memory licenseTerms1 = CampfireIPNFT.LicenseTerms({
            price: 0.1 ether,
            duration: 365 days,
            royaltyBps: 500,
            paymentToken: address(0)
        });
        
        CampfireIPNFT.IPMetadata memory ipMetadata1 = CampfireIPNFT.IPMetadata({
            creator: artist1,
            category: "Digital Art",
            tags: new string[](2),
            createdAt: 0,
            isDerivative: false,
            parentTokenId: 0
        });
        ipMetadata1.tags[0] = "Abstract";
        ipMetadata1.tags[1] = "NFT";
        
        tokenId1 = nftContract.mintIP(artist1, "ipfs://artwork1", licenseTerms1, ipMetadata1);
        
        vm.stopPrank();
        
        // Artist2 mints second NFT
        vm.startPrank(artist2);
        
        CampfireIPNFT.LicenseTerms memory licenseTerms2 = CampfireIPNFT.LicenseTerms({
            price: 0.05 ether,
            duration: 180 days,
            royaltyBps: 300,
            paymentToken: address(0)
        });
        
        CampfireIPNFT.IPMetadata memory ipMetadata2 = CampfireIPNFT.IPMetadata({
            creator: artist2,
            category: "Photography",
            tags: new string[](2),
            createdAt: 0,
            isDerivative: false,
            parentTokenId: 0
        });
        ipMetadata2.tags[0] = "Nature";
        ipMetadata2.tags[1] = "Landscape";
        
        tokenId2 = nftContract.mintIP(artist2, "ipfs://artwork2", licenseTerms2, ipMetadata2);
        
        vm.stopPrank();
    }
    
    // ==================== MARKETPLACE INTEGRATION TESTS ====================
    
    function test_fullMarketplaceWorkflow() public {
        uint256 listingPrice = 5 ether;
        
        // Artist1 lists NFT on marketplace
        vm.startPrank(artist1);
        nftContract.approve(address(marketplace), tokenId1);
        marketplace.listNFT(tokenId1, listingPrice);
        vm.stopPrank();
        
        // Verify listing
        CoreCampMarketplace.Listing memory listing = marketplace.getListing(tokenId1);
        assertEq(listing.seller, artist1);
        assertEq(listing.price, listingPrice);
        assertTrue(listing.isActive);
        
        // Collector1 purchases the NFT
        uint256 artist1BalanceBefore = artist1.balance;
        uint256 collector1BalanceBefore = collector1.balance;
        
        vm.startPrank(collector1);
        marketplace.buyNFT{value: listingPrice}(tokenId1);
        vm.stopPrank();
        
        // Verify ownership transfer and payment
        assertEq(nftContract.ownerOf(tokenId1), collector1);
        
        uint256 platformFee = (listingPrice * marketplace.platformFeeBps()) / 10000;
        uint256 artistPayment = listingPrice - platformFee;
        
        assertEq(artist1.balance - artist1BalanceBefore, artistPayment);
        assertEq(collector1BalanceBefore - collector1.balance, listingPrice);
        
        // Verify listing is inactive
        listing = marketplace.getListing(tokenId1);
        assertFalse(listing.isActive);
    }
    
    // ==================== ESCROW INTEGRATION TESTS ====================
    
    function test_fullEscrowWorkflow() public {
        uint256 dealPrice = 3 ether;
        uint256 artist2BalanceBefore = artist2.balance;
        
        // Artist2 creates escrow deal with collector1
        vm.startPrank(artist2);
        nftContract.approve(address(escrow), tokenId2);
        escrow.createDeal(collector1, tokenId2, dealPrice);
        vm.stopPrank();
        
        // Verify deal creation
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId2);
        assertEq(deal.seller, artist2);
        assertEq(deal.buyer, collector1);
        assertEq(deal.price, dealPrice);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Created));

        // Collector1 funds the deal
        vm.startPrank(collector1);
        escrow.fundDeal{value: dealPrice}(tokenId2);
        vm.stopPrank();
        
        // Verify funding
        deal = escrow.getDeal(tokenId2);

       
        
 
        
        // Verify transfers
        assertEq(nftContract.ownerOf(tokenId2), collector1);
        
        uint256 platformFee = (dealPrice * escrow.platformFeeBps()) / 10000;
        uint256 artistPayment = dealPrice - platformFee;
        assertEq(artist2.balance - artist2BalanceBefore, artistPayment);
    }
    
    // ==================== AUCTION INTEGRATION TESTS ====================
    
    function test_fullAuctionWorkflow() public {
        uint256 startingBid = 1 ether;
        uint256 auctionDuration = 1 days;
        
        // Collector1 (who now owns tokenId2) creates auction
        vm.startPrank(artist1);
        nftContract.approve(address(auction), tokenId1);
        auction.createAuction(tokenId1, startingBid, auctionDuration);
        vm.stopPrank();
  
        // Verify auction creation
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId1);
        assertEq(auctionData.seller, artist1);
        assertEq(auctionData.startingBid, startingBid);
        assertTrue(auctionData.isActive);
        
        // Collector2 places first bid
        vm.startPrank(collector2);
        auction.placeBid{value: startingBid}(tokenId1);
        vm.stopPrank();
        // Collector3 places higher bid
        uint256 higherBid = startingBid + (startingBid * 500) / 10000; // 5% increment
        
        vm.startPrank(collector3);
        auction.placeBid{value: higherBid}(tokenId1);
        vm.stopPrank();
        
        // Verify bidding
        auctionData = auction.getAuction(tokenId1);
        assertEq(auctionData.highestBidder, collector3);
        assertEq(auctionData.highestBid, higherBid);
        assertEq(auction.pendingReturns(collector2), startingBid);
        
        // Collector2 withdraws outbid amount
        uint256 collector2BalanceBefore = collector2.balance;
        
        vm.startPrank(collector2);
        auction.withdraw();
        vm.stopPrank();
        
        assertEq(collector2.balance - collector2BalanceBefore, startingBid);
        
        // Fast forward past auction end
        vm.warp(block.timestamp + auctionDuration + 1);
        
        // End auction
        uint256 collector1BalanceBefore = collector1.balance;

        auction.endAuction(tokenId1);

        // Verify auction completion
        auctionData = auction.getAuction(tokenId1);
        assertFalse(auctionData.isActive);
        
        // Verify transfers
        assertEq(nftContract.ownerOf(tokenId1), collector3);
        
        uint256 platformFee = (higherBid * auction.platformFeeBps()) / 10000;
        uint256 sellerPayment = higherBid - platformFee;
        assertEq(artist1.balance - collector1BalanceBefore, sellerPayment);
    }
    
    // ==================== LOTTERY INTEGRATION TESTS ====================
    
    function test_fullLotteryWorkflow() public {
        uint256 ticketPrice = 0.2 ether;
        uint256 maxTickets = 3;
        uint256 lotteryDuration = 1 days;
        
        // Collector3 (who now owns tokenId2) starts lottery
        vm.startPrank(artist2);
        nftContract.approve(address(lottery), tokenId2);
        uint256 lotteryId = lottery.startLottery(tokenId2, ticketPrice, maxTickets, lotteryDuration);
        vm.stopPrank();
        
        // Verify lottery creation
        (
            uint256 tokenIdReturned,
            address lotteryOwner,
            uint256 lotteryTicketPrice,
            uint256 lotteryMaxTickets,
            bool isActive,
            uint256 ticketsSold,
            ,
            address winner,
            bool isDrawn
        ) = lottery.getLottery(lotteryId);
        
        assertEq(lotteryOwner, artist2);
        assertEq(lotteryTicketPrice, ticketPrice);
        assertEq(lotteryMaxTickets, maxTickets);
        assertTrue(isActive);
        assertEq(ticketsSold, 0);
        assertEq(winner, address(0));
        assertFalse(isDrawn);
        
        // Players buy tickets
        vm.startPrank(artist1);
        lottery.buyTicket{value: ticketPrice}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(collector1);
        lottery.buyTicket{value: ticketPrice}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(collector2);
        lottery.buyTicket{value: ticketPrice}(lotteryId); // This should trigger auto-draw
        vm.stopPrank();
        
        // Verify all tickets sold
        address[] memory players = lottery.getPlayers(lotteryId);
        assertEq(players.length, 3);
        assertEq(players[0], artist1);
        assertEq(players[1], collector1);
        assertEq(players[2], collector2);
        
        // Fulfill VRF request (simulate random number = 1, so collector1 wins)
    // First request in mock VRF
 // This will select index 1 % 3 = 1 (collector1)
        
        uint256 collector3BalanceBefore = collector3.balance;
        

        // Verify lottery completion
        (, ,,, isActive, , ,  winner, isDrawn) = lottery.getLottery(lotteryId);
        assertFalse(isActive);
        assertEq(winner, collector1);
        assertTrue(isDrawn);

        // Verify transfers
        assertEq(nftContract.ownerOf(tokenId2), collector1);
        
        uint256 totalRevenue = maxTickets * ticketPrice;
        uint256 platformFee = (totalRevenue * lottery.platformFeeBps()) / 10000;
        uint256 ownerPayment = totalRevenue - platformFee;
        assertEq(artist2.balance - collector3BalanceBefore, ownerPayment);
    }
    
    // ==================== CROSS-CONTRACT SCENARIOS ====================
    
    function test_nftMovementAcrossContracts() public {
        // Track NFT as it moves through different contracts
        
        // Initial: artist1 owns tokenId1
        assertEq(nftContract.ownerOf(tokenId1), artist1);
        
        // 1. List on marketplace and sell
        vm.startPrank(artist1);
        nftContract.approve(address(marketplace), tokenId1);
        marketplace.listNFT(tokenId1, 2 ether);
        vm.stopPrank();
        
        vm.startPrank(collector1);
        marketplace.buyNFT{value: 2 ether}(tokenId1);
        vm.stopPrank();
        
        assertEq(nftContract.ownerOf(tokenId1), collector1);
        
        // 2. Put into auction
        vm.startPrank(collector1);
        nftContract.approve(address(auction), tokenId1);
        auction.createAuction(tokenId1, 1 ether, 1 days);
        vm.stopPrank();
        
        vm.startPrank(collector2);
        auction.placeBid{value: 1.1 ether}(tokenId1);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 1 days + 1);
        auction.endAuction(tokenId1);
        
        assertEq(nftContract.ownerOf(tokenId1), collector2);
        
        // 3. Use escrow for private sale
        vm.startPrank(collector2);
        nftContract.approve(address(escrow), tokenId1);
        escrow.createDeal(collector3, tokenId1, 3 ether);
        vm.stopPrank();
        
        vm.startPrank(collector3);
        escrow.fundDeal{value: 3 ether}(tokenId1);
        vm.stopPrank();
        
       
        
        assertEq(nftContract.ownerOf(tokenId1), collector3);
        
        // 4. Finally put into lottery
        vm.startPrank(collector3);
        nftContract.approve(address(lottery), tokenId1);
        uint256 lotteryId = lottery.startLottery(tokenId1, 0.5 ether, 2, 1 days);
        vm.stopPrank();
        
        vm.startPrank(artist1);
        lottery.buyTicket{value: 0.5 ether}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(collector1);
        lottery.buyTicket{value: 0.5 ether}(lotteryId); // Auto-draw triggers
        vm.stopPrank();
        

        
        // NFT returns to artist1!
        assertEq(nftContract.ownerOf(tokenId1), artist1);
    }
    
    // ==================== FACTORY MANAGEMENT TESTS ====================
    
    function test_factoryManagement() public {
        // Update platform fees across all contracts
        uint256 newFeeBps = 300; // 3%
        
        factory.updateAllPlatformFees(deploymentId, newFeeBps);
        
        assertEq(marketplace.platformFeeBps(), newFeeBps);
        assertEq(escrow.platformFeeBps(), newFeeBps);
        assertEq(auction.platformFeeBps(), newFeeBps);
        assertEq(lottery.platformFeeBps(), newFeeBps);
        
        // Test deployment status management
        assertTrue(factory.isValidDeployment(deploymentId));
        
        factory.setDeploymentStatus(deploymentId, false);
        assertFalse(factory.isValidDeployment(deploymentId));
        
        factory.setDeploymentStatus(deploymentId, true);
        assertTrue(factory.isValidDeployment(deploymentId));
    }
    
    // ==================== REVENUE DISTRIBUTION TESTS ====================
    
    function test_platformFeeCollection() public {

        uint256 salePrice = 10 ether;
        uint256 expectedPlatformFee = (salePrice * marketplace.platformFeeBps()) / 10000;
        
        // Execute a marketplace sale
        vm.startPrank(artist1);
        nftContract.approve(address(marketplace), tokenId1);
        marketplace.listNFT(tokenId1, salePrice);
        vm.stopPrank();
        
        vm.startPrank(collector1);
        marketplace.buyNFT{value: salePrice}(tokenId1);
        vm.stopPrank();

        
        // Check platform fee was collected
        uint256 platformFeeCollected = address(factory).balance;
        assertEq(platformFeeCollected, expectedPlatformFee);
    }
    
    // ==================== ERROR HANDLING TESTS ====================
    
    function test_approvalRevocation() public {
        // Test what happens when approval is revoked after listing
        
        vm.startPrank(artist1);
        nftContract.approve(address(marketplace), tokenId1);
        marketplace.listNFT(tokenId1, 1 ether);
        
        // Revoke approval
        nftContract.approve(address(0), tokenId1);
        vm.stopPrank();
        
        // Purchase should fail
        vm.startPrank(collector1);
        vm.expectRevert("Marketplace not approved");
        marketplace.buyNFT{value: 1 ether}(tokenId1);
        vm.stopPrank();
    }
    
    function test_ownershipChange() public {
        // Test what happens when NFT ownership changes after listing
        
        vm.startPrank(artist1);
        nftContract.approve(address(marketplace), tokenId1);
        marketplace.listNFT(tokenId1, 1 ether);
        
        // Transfer NFT to someone else
        nftContract.transferFrom(artist1, collector2, tokenId1);
        vm.stopPrank();
        
        // Purchase should fail
        vm.startPrank(collector1);
        vm.expectRevert("Seller no longer owns NFT");
        marketplace.buyNFT{value: 1 ether}(tokenId1);
        vm.stopPrank();
    }
    
    // ==================== GAS OPTIMIZATION TESTS ====================
    
    function test_gasUsageOptimization() public {
        // Test gas usage for common operations
        
        vm.startPrank(artist1);
        nftContract.approve(address(marketplace), tokenId1);
        
        uint256 gasStart = gasleft();
        marketplace.listNFT(tokenId1, 1 ether);
        uint256 gasUsed = gasStart - gasleft();
        
        // Log gas usage for monitoring
        emit log_named_uint("Gas used for listing", gasUsed);
        
        vm.stopPrank();
        
        vm.startPrank(collector1);
        gasStart = gasleft();
        marketplace.buyNFT{value: 1 ether}(tokenId1);
        gasUsed = gasStart - gasleft();
        
        emit log_named_uint("Gas used for buying", gasUsed);
        
        vm.stopPrank();
        
        // Basic gas usage checks (adjust thresholds as needed)
        // These are rough estimates and may need adjustment
        assertTrue(gasUsed < 200000, "Buy operation should use less than 200k gas");
    }
}
