// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampAuction.sol";

contract CoreCampAuctionTest is Test {
    
    CampfireIPNFT public nftContract;
    CoreCampAuction public auction;
    
    address public owner;
    address public seller;
    address public bidder1;
    address public bidder2;
    address public bidder3;
    
    uint256 public tokenId;
    uint256 public constant STARTING_BID = 0.5 ether;
    uint256 public constant AUCTION_DURATION = 7 days;

    receive() external payable {}

    event AuctionCreated(uint256 indexed tokenId, address indexed seller, uint256 startingBid, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event AuctionCancelled(uint256 indexed tokenId, address indexed seller);
    event BidWithdrawn(address indexed bidder, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        seller = makeAddr("seller");
        bidder1 = makeAddr("bidder1");
        bidder2 = makeAddr("bidder2");
        bidder3 = makeAddr("bidder3");
        
        // Deploy contracts
        nftContract = new CampfireIPNFT();
        auction = new CoreCampAuction(address(nftContract));
        
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
        
        tokenId = nftContract.mintIP(seller, "ipfs://test-uri", licenseTerms, ipMetadata);
        
        vm.stopPrank();
        
        // Fund bidders
        vm.deal(bidder1, 10 ether);
        vm.deal(bidder2, 10 ether);
        vm.deal(bidder3, 10 ether);
    }
    
    // ==================== CREATE AUCTION TESTS ====================
    
    function test_createAuction_Success() public {
        vm.startPrank(seller);
        
        nftContract.approve(address(auction), tokenId);
        
        uint256 expectedEndTime = block.timestamp + AUCTION_DURATION;
        
        vm.expectEmit(true, true, false, true);
        emit AuctionCreated(tokenId, seller, STARTING_BID, expectedEndTime);
        
        auction.createAuction(tokenId, STARTING_BID, AUCTION_DURATION);
        
        vm.stopPrank();
        
        // Verify auction creation
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertEq(auctionData.seller, seller);
        assertEq(auctionData.startingBid, STARTING_BID);
        assertEq(auctionData.endTime, expectedEndTime);
        assertEq(auctionData.highestBidder, address(0));
        assertEq(auctionData.highestBid, 0);
        assertTrue(auctionData.isActive);
    }
    
    function test_createAuction_RevertZeroStartingBid() public {
        vm.startPrank(seller);
        nftContract.approve(address(auction), tokenId);
        
        vm.expectRevert("Starting bid must be greater than zero");
        auction.createAuction(tokenId, 0, AUCTION_DURATION);
        
        vm.stopPrank();
    }
    
    function test_createAuction_RevertDurationTooShort() public {
        vm.startPrank(seller);
        nftContract.approve(address(auction), tokenId);
        
        vm.expectRevert("Auction duration too short");
        auction.createAuction(tokenId, STARTING_BID, 30 minutes); // Less than MIN_AUCTION_DURATION
        
        vm.stopPrank();
    }
    
    function test_createAuction_RevertDurationTooLong() public {
        vm.startPrank(seller);
        nftContract.approve(address(auction), tokenId);
        
        vm.expectRevert("Auction duration too long");
        auction.createAuction(tokenId, STARTING_BID, 31 days); // More than MAX_AUCTION_DURATION
        
        vm.stopPrank();
    }
    
    function test_createAuction_RevertNotOwner() public {
        vm.startPrank(bidder1);
        
        vm.expectRevert("You are not the owner");
        auction.createAuction(tokenId, STARTING_BID, AUCTION_DURATION);
        
        vm.stopPrank();
    }
    
    function test_createAuction_RevertNotApproved() public {
        vm.startPrank(seller);
        
        vm.expectRevert("Auction not approved");
        auction.createAuction(tokenId, STARTING_BID, AUCTION_DURATION);
        
        vm.stopPrank();
    }
    
    function test_createAuction_RevertAlreadyExists() public {
        vm.startPrank(seller);
        nftContract.approve(address(auction), tokenId);
        auction.createAuction(tokenId, STARTING_BID, AUCTION_DURATION);
        
        vm.expectRevert("Auction already exists");
        auction.createAuction(tokenId, STARTING_BID, AUCTION_DURATION);
        
        vm.stopPrank();
    }
    
    // ==================== PLACE BID TESTS ====================
    
    function test_placeBid_FirstBid() public {
        // Setup: Create auction
        _setupAuction();
        
        vm.startPrank(bidder1);
        
        vm.expectEmit(true, true, false, true);
        emit BidPlaced(tokenId, bidder1, STARTING_BID);
        
        auction.placeBid{value: STARTING_BID}(tokenId);
        
        vm.stopPrank();
        
        // Verify bid
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertEq(auctionData.highestBidder, bidder1);
        assertEq(auctionData.highestBid, STARTING_BID);
    }
    
    function test_placeBid_HigherBid() public {
        // Setup: Create auction and place first bid
        _setupAuction();
        
        vm.startPrank(bidder1);
        auction.placeBid{value: STARTING_BID}(tokenId);
        vm.stopPrank();
        
        // Place higher bid
        uint256 higherBid = STARTING_BID + (STARTING_BID * 500) / 10000; // 5% increment
        
        vm.startPrank(bidder2);
        
        vm.expectEmit(true, true, false, true);
        emit BidPlaced(tokenId, bidder2, higherBid);
        
        auction.placeBid{value: higherBid}(tokenId);
        
        vm.stopPrank();
        
        // Verify bid update
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertEq(auctionData.highestBidder, bidder2);
        assertEq(auctionData.highestBid, higherBid);
        
        // Verify previous bidder can withdraw
        assertEq(auction.pendingReturns(bidder1), STARTING_BID);
    }
    
    function test_placeBid_RevertBidTooLow() public {
        // Setup: Create auction and place first bid
        _setupAuction();
        
        vm.startPrank(bidder1);
        auction.placeBid{value: STARTING_BID}(tokenId);
        vm.stopPrank();
        
        // Try to place insufficient bid
        uint256 insufficientBid = STARTING_BID + 0.01 ether; // Less than 5% increment
        
        vm.startPrank(bidder2);
        
        vm.expectRevert("Bid too low");
        auction.placeBid{value: insufficientBid}(tokenId);
        
        vm.stopPrank();
    }
    
    function test_placeBid_RevertSellerCannotBid() public {
        // Setup: Create auction
        _setupAuction();
        
        vm.startPrank(seller);
        vm.deal(address(seller), 10 ether);
        
        vm.expectRevert("Seller cannot bid");
        auction.placeBid{value: STARTING_BID}(tokenId);
        
        vm.stopPrank();
    }
    
    function test_placeBid_RevertAuctionEnded() public {
        // Setup: Create auction
        _setupAuction();
        
        // Fast forward past auction end time
        vm.warp(block.timestamp + AUCTION_DURATION + 1);
        
        vm.startPrank(bidder1);
        
        vm.expectRevert("Auction ended");
        auction.placeBid{value: STARTING_BID}(tokenId);
        
        vm.stopPrank();
    }
    
    function test_placeBid_ExtendAuctionNearEnd() public {
        // Setup: Create auction
        _setupAuction();
        
        // Fast forward to near end (within 15 minutes)
        vm.warp(block.timestamp + AUCTION_DURATION - 10 minutes);
        
        uint256 originalEndTime = block.timestamp + 10 minutes;
        
        vm.startPrank(bidder1);
        auction.placeBid{value: STARTING_BID}(tokenId);
        vm.stopPrank();
        
        // Verify auction was extended
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertGt(auctionData.endTime, originalEndTime);
        assertEq(auctionData.endTime, block.timestamp + 15 minutes);
    }
    
    // ==================== WITHDRAW TESTS ====================
    
    function test_withdraw_Success() public {
        // Setup: Create auction and place bids
        _setupAuction();
        
        vm.startPrank(bidder1);
        auction.placeBid{value: STARTING_BID}(tokenId);
        vm.stopPrank();
        
        uint256 higherBid = STARTING_BID + (STARTING_BID * 500) / 10000;
        
        vm.startPrank(bidder2);
        auction.placeBid{value: higherBid}(tokenId);
        vm.stopPrank();
        
        // Withdraw outbid amount
        uint256 bidder1BalanceBefore = bidder1.balance;
        
        vm.startPrank(bidder1);
        
        vm.expectEmit(true, false, false, true);
        emit BidWithdrawn(bidder1, STARTING_BID);
        
        auction.withdraw();
        
        vm.stopPrank();
        
        // Verify withdrawal
        assertEq(bidder1.balance - bidder1BalanceBefore, STARTING_BID);
        assertEq(auction.pendingReturns(bidder1), 0);
    }
    
    function test_withdraw_RevertNoFunds() public {
        vm.startPrank(bidder1);
        
        vm.expectRevert("No funds to withdraw");
        auction.withdraw();
        
        vm.stopPrank();
    }
    
    // ==================== END AUCTION TESTS ====================
    
    function test_endAuction_WithBids() public {
        // Setup: Create auction and place bid
        _setupAuction();
        
        vm.startPrank(bidder1);
        auction.placeBid{value: STARTING_BID}(tokenId);
        vm.stopPrank();
        
        // Fast forward past auction end time
        vm.warp(block.timestamp + AUCTION_DURATION + 1);
        
        uint256 sellerBalanceBefore = seller.balance;
        
        // End auction
        vm.expectEmit(true, true, false, true);
        emit AuctionEnded(tokenId, bidder1, STARTING_BID);
        
        auction.endAuction(tokenId);
        
        // Verify auction completion
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertFalse(auctionData.isActive);
        
        // Verify NFT ownership transfer
        assertEq(nftContract.ownerOf(tokenId), bidder1);
        
        // Verify payment (considering platform fee)
        uint256 platformFee = (STARTING_BID * 250) / 10000;
        uint256 expectedSellerAmount = STARTING_BID - platformFee;
        assertEq(seller.balance - sellerBalanceBefore, expectedSellerAmount);
    }
    
    function test_endAuction_NoBids() public {
        // Setup: Create auction with no bids
        _setupAuction();
        
        // Fast forward past auction end time
        vm.warp(block.timestamp + AUCTION_DURATION + 1);
        
        // End auction
        vm.expectEmit(true, true, false, true);
        emit AuctionEnded(tokenId, address(0), 0);
        
        auction.endAuction(tokenId);
        
        // Verify auction completion
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertFalse(auctionData.isActive);
        
        // Verify NFT still with seller
        assertEq(nftContract.ownerOf(tokenId), seller);
    }
    
    function test_endAuction_RevertNotEnded() public {
        // Setup: Create auction
        _setupAuction();
        
        vm.expectRevert("Auction not yet ended");
        auction.endAuction(tokenId);
    }
    
    function test_endAuction_RevertAlreadyEnded() public {
        // Setup: Create auction and end it
        _setupAuction();
        
        vm.warp(block.timestamp + AUCTION_DURATION + 1);
        auction.endAuction(tokenId);
        
        vm.expectRevert("Auction not active");
        auction.endAuction(tokenId);
    }
    
    // ==================== CANCEL AUCTION TESTS ====================
    
    function test_cancelAuction_Success() public {
        // Setup: Create auction
        _setupAuction();
        
        vm.startPrank(seller);
        
        vm.expectEmit(true, true, false, true);
        emit AuctionCancelled(tokenId, seller);
        
        auction.cancelAuction(tokenId);
        
        vm.stopPrank();
        
        // Verify cancellation
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertFalse(auctionData.isActive);
    }
    
    function test_cancelAuction_RevertNotSeller() public {
        // Setup: Create auction
        _setupAuction();
        
        vm.startPrank(bidder1);
        
        vm.expectRevert("You are not the seller");
        auction.cancelAuction(tokenId);
        
        vm.stopPrank();
    }
    
    function test_cancelAuction_RevertWithBids() public {
        // Setup: Create auction and place bid
        _setupAuction();
        
        vm.startPrank(bidder1);
        auction.placeBid{value: STARTING_BID}(tokenId);
        vm.stopPrank();
        
        vm.startPrank(seller);
        
        vm.expectRevert("Cannot cancel auction with bids");
        auction.cancelAuction(tokenId);
        
        vm.stopPrank();
    }
    
    // ==================== VIEW FUNCTIONS TESTS ====================
    
    function test_hasAuctionEnded() public {
        // Setup: Create auction
        _setupAuction();
        
        assertFalse(auction.hasAuctionEnded(tokenId));
        
        // Fast forward past end time
        vm.warp(block.timestamp + AUCTION_DURATION + 1);
        
        assertTrue(auction.hasAuctionEnded(tokenId));
    }
    
    function test_getTimeRemaining() public {
        // Setup: Create auction
        _setupAuction();
        
        assertEq(auction.getTimeRemaining(tokenId), AUCTION_DURATION);
        
        // Fast forward halfway
        vm.warp(block.timestamp + AUCTION_DURATION / 2);
        
        assertEq(auction.getTimeRemaining(tokenId), AUCTION_DURATION / 2);
        
        // Fast forward past end
        vm.warp(block.timestamp + AUCTION_DURATION);
        
        assertEq(auction.getTimeRemaining(tokenId), 0);
    }
    
    // ==================== EMERGENCY FUNCTIONS TESTS ====================
    
    function test_emergencyCancelAuction() public {
        // Setup: Create auction and place bid
        _setupAuction();
        
        vm.startPrank(bidder1);
        auction.placeBid{value: STARTING_BID}(tokenId);
        vm.stopPrank();
        
        // Emergency cancel as owner
        vm.expectEmit(true, true, false, true);
        emit AuctionCancelled(tokenId, owner);
        
        auction.emergencyCancelAuction(tokenId);
        
        // Verify auction cancelled and bidder can withdraw
        CoreCampAuction.Auction memory auctionData = auction.getAuction(tokenId);
        assertFalse(auctionData.isActive);
        assertEq(auction.pendingReturns(bidder1), STARTING_BID);
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    function _setupAuction() internal {
        vm.startPrank(seller);
        nftContract.approve(address(auction), tokenId);
        auction.createAuction(tokenId, STARTING_BID, AUCTION_DURATION);
        vm.stopPrank();
    }
    
    // ==================== OWNER FUNCTIONS TESTS ====================
    
    function test_updatePlatformFee_Success() public {
        uint256 newFeeBps = 500; // 5%
        
        auction.updatePlatformFee(newFeeBps);
        
        assertEq(auction.platformFeeBps(), newFeeBps);
    }
    
    function test_emergencyWithdraw_Success() public {
        // Send some ETH to the contract
        vm.deal(address(auction), 1 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        
        auction.emergencyWithdraw();
        
        assertEq(owner.balance - ownerBalanceBefore, 1 ether);
        assertEq(address(auction).balance, 0);
    }
}
