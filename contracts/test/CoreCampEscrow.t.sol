// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampEscrow.sol";

contract CoreCampEscrowTest is Test {
    
    CampfireIPNFT public nftContract;
    CoreCampEscrow public escrow;
    
    address public owner;
    address public seller;
    address public buyer;
    address public buyer2;
    
    uint256 public tokenId;
    uint256 public constant DEAL_PRICE = 1 ether;
    receive() external payable {}
    
    event DealCreated(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event DealFunded(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event DealConfirmed(uint256 indexed tokenId, address indexed confirmer, bool isSellerConfirmed, bool isBuyerConfirmed);
    event DealCompleted(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event DealCancelled(uint256 indexed tokenId, address indexed canceller, uint256 refundAmount);
    
    function setUp() public {
        owner = address(this);
        seller = makeAddr("seller");
        buyer = makeAddr("buyer");
        buyer2 = makeAddr("buyer2");
        
        // Deploy contracts
        nftContract = new CampfireIPNFT();
        escrow = new CoreCampEscrow(address(nftContract));
        
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
        
        // Fund buyers
        vm.deal(buyer, 10 ether);
        vm.deal(buyer2, 10 ether);
    }
    
    // ==================== CREATE DEAL TESTS ====================
    
    function test_createDeal_Success() public {
        vm.startPrank(seller);
        
        // Approve escrow
        nftContract.approve(address(escrow), tokenId);
        
        vm.expectEmit(true, true, true, true);
        emit DealCreated(tokenId, seller, buyer, DEAL_PRICE);
        
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        
        vm.stopPrank();
        
        // Verify deal creation
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId);
        assertEq(deal.seller, seller);
        assertEq(deal.buyer, buyer);
        assertEq(deal.price, DEAL_PRICE);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Created));
        assertFalse(deal.sellerConfirmed);
        assertFalse(deal.buyerConfirmed);
    }
    
    function test_createDeal_RevertInvalidBuyer() public {
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        
        vm.expectRevert("Invalid buyer address");
        escrow.createDeal(address(0), tokenId, DEAL_PRICE);
        
        vm.stopPrank();
    }
    
    function test_createDeal_RevertBuyerIsSeller() public {
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        
        vm.expectRevert("Buyer cannot be seller");
        escrow.createDeal(seller, tokenId, DEAL_PRICE);
        
        vm.stopPrank();
    }
    
    function test_createDeal_RevertZeroPrice() public {
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        
        vm.expectRevert("Price must be greater than zero");
        escrow.createDeal(buyer, tokenId, 0);
        
        vm.stopPrank();
    }
    
    function test_createDeal_RevertNotOwner() public {
        vm.startPrank(buyer);
        
        vm.expectRevert("You are not the owner");
        escrow.createDeal(buyer2, tokenId, DEAL_PRICE);
        
        vm.stopPrank();
    }
    
    function test_createDeal_RevertNotApproved() public {
        vm.startPrank(seller);
        
        vm.expectRevert("Escrow not approved");
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        
        vm.stopPrank();
    }
    
    // ==================== FUND DEAL TESTS ====================
    
    function test_fundDeal_Success() public {
        // Setup: Create deal
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        
        vm.expectEmit(true, true, false, true);
        emit DealFunded(tokenId, buyer, DEAL_PRICE);
        
        escrow.fundDeal{value: DEAL_PRICE}(tokenId);
        
        vm.stopPrank();
        
        // Verify deal is funded
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Funded));
        assertEq(address(escrow).balance, DEAL_PRICE);
    }
    
    function test_fundDeal_RevertNotBuyer() public {
        // Setup: Create deal
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer2);
        
        vm.expectRevert("You are not the buyer");
        escrow.fundDeal{value: DEAL_PRICE}(tokenId);
        
        vm.stopPrank();
    }
    
    function test_fundDeal_RevertIncorrectAmount() public {
        // Setup: Create deal
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        
        vm.expectRevert("Incorrect fund amount");
        escrow.fundDeal{value: DEAL_PRICE - 1}(tokenId);
        
        vm.stopPrank();
    }
    
    function test_fundDeal_RevertWrongStatus() public {
          vm.startPrank(seller);
    nftContract.approve(address(escrow), tokenId);
    escrow.createDeal(buyer, tokenId, DEAL_PRICE);
    vm.stopPrank();

    vm.startPrank(buyer);
    escrow.fundDeal{value: DEAL_PRICE}(tokenId); // Now status is Funded
    vm.expectRevert("Deal not in created state");
    escrow.fundDeal{value: DEAL_PRICE}(tokenId); // Try to fund again
    vm.stopPrank();
    }
    
    // ==================== CONFIRM TRANSFER TESTS ====================
    
    function test_confirmTransfer_SellerFirst() public {
        // Setup: Create and fund deal
        _setupFundedDeal();
        
        vm.startPrank(seller);
        
        vm.expectEmit(true, true, false, true);
        emit DealConfirmed(tokenId, seller, true, false);
        
        escrow.confirmTransfer(tokenId);
        
        vm.stopPrank();
        
        // Verify seller confirmation
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId);
        assertTrue(deal.sellerConfirmed);
        assertFalse(deal.buyerConfirmed);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Funded));
    }
    
    function test_confirmTransfer_BothPartiesCompletesDeal() public {
        // Setup: Create and fund deal
        _setupFundedDeal();
        
        uint256 sellerBalanceBefore = seller.balance;
        
        // Seller confirms
        vm.startPrank(seller);
        escrow.confirmTransfer(tokenId);
        vm.stopPrank();
        
        // Buyer confirms (should complete the deal)
        vm.startPrank(buyer);
        
        vm.expectEmit(true, true, false, true);
        emit DealConfirmed(tokenId, buyer, true, true);
        
        vm.expectEmit(true, true, true, true);
        emit DealCompleted(tokenId, seller, buyer, DEAL_PRICE);
        
        escrow.confirmTransfer(tokenId);
        
        vm.stopPrank();
        
        // Verify deal completion
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Confirmed));
        assertTrue(deal.sellerConfirmed);
        assertTrue(deal.buyerConfirmed);
        
        // Verify NFT ownership transfer
        assertEq(nftContract.ownerOf(tokenId), buyer);
        
        // Verify payment (considering platform fee)
        uint256 platformFee = (DEAL_PRICE * 250) / 10000;
        uint256 expectedSellerAmount = DEAL_PRICE - platformFee;
        assertEq(seller.balance - sellerBalanceBefore, expectedSellerAmount);
    }
    
    function test_confirmTransfer_RevertNotPartyToDeal() public {
        // Setup: Create and fund deal
        _setupFundedDeal();
        
        vm.startPrank(buyer2);
        
        vm.expectRevert("You are not part of this deal");
        escrow.confirmTransfer(tokenId);
        
        vm.stopPrank();
    }
    
    function test_confirmTransfer_RevertAlreadyConfirmed() public {
        // Setup: Create and fund deal
        _setupFundedDeal();
        
        vm.startPrank(seller);
        escrow.confirmTransfer(tokenId);
        
        vm.expectRevert("Seller already confirmed");
        escrow.confirmTransfer(tokenId);
        
        vm.stopPrank();
    }
    
    // ==================== CANCEL DEAL TESTS ====================
    
    function test_cancelDeal_BeforeFunding() public {
        // Setup: Create deal
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        
        vm.expectEmit(true, true, false, true);
        emit DealCancelled(tokenId, seller, 0);
        
        escrow.cancelDeal(tokenId);
        
        vm.stopPrank();
        
        // Verify cancellation
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Cancelled));
    }
    
    function test_cancelDeal_AfterFunding() public {
        // Setup: Create and fund deal
        _setupFundedDeal();
        
        uint256 buyerBalanceBefore = buyer.balance;
        
        vm.startPrank(buyer);
        
        vm.expectEmit(true, true, false, true);
        emit DealCancelled(tokenId, buyer, DEAL_PRICE);
        
        escrow.cancelDeal(tokenId);
        
        vm.stopPrank();
        
        // Verify cancellation and refund
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Cancelled));
        assertEq(buyer.balance - buyerBalanceBefore, DEAL_PRICE);
    }
    
    function test_cancelDeal_RevertNotPartyToDeal() public {
        // Setup: Create deal
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer2);
        
        vm.expectRevert("You are not part of this deal");
        escrow.cancelDeal(tokenId);
        
        vm.stopPrank();
    }
    
    // ==================== EXPIRED DEAL TESTS ====================
    
    function test_cancelExpiredDeal_Success() public {
        // Setup: Create and fund deal
        _setupFundedDeal();
        
        // Fast forward past timeout
        vm.warp(block.timestamp + escrow.DEAL_TIMEOUT() + 1);
        
        uint256 buyerBalanceBefore = buyer.balance;
        
        // Anyone can cancel expired deal
        vm.startPrank(buyer2);
        
        vm.expectEmit(true, true, false, true);
        emit DealCancelled(tokenId, buyer2, DEAL_PRICE);
        
        escrow.cancelExpiredDeal(tokenId);
        
        vm.stopPrank();
        
        // Verify cancellation and refund
        CoreCampEscrow.EscrowDeal memory deal = escrow.getDeal(tokenId);
        assertEq(uint8(deal.status), uint8(CoreCampEscrow.DealStatus.Cancelled));
        assertEq(buyer.balance - buyerBalanceBefore, DEAL_PRICE);
    }
    
    function test_cancelExpiredDeal_RevertNotExpired() public {
        // Setup: Create and fund deal
        _setupFundedDeal();
        
        vm.startPrank(buyer2);
        
        vm.expectRevert("Deal not yet expired");
        escrow.cancelExpiredDeal(tokenId);
        
        vm.stopPrank();
    }
    
    function test_isDealExpired() public {
        // Setup: Create deal
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        vm.stopPrank();
        
        assertFalse(escrow.isDealExpired(tokenId));
        
        // Fast forward past timeout
        vm.warp(block.timestamp + escrow.DEAL_TIMEOUT() + 1);
        
        assertTrue(escrow.isDealExpired(tokenId));
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    function _setupFundedDeal() internal {
        vm.startPrank(seller);
        nftContract.approve(address(escrow), tokenId);
        escrow.createDeal(buyer, tokenId, DEAL_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer);
        escrow.fundDeal{value: DEAL_PRICE}(tokenId);
        vm.stopPrank();
    }
    
    // ==================== OWNER FUNCTIONS TESTS ====================
    
    function test_updatePlatformFee_Success() public {
        uint256 newFeeBps = 500; // 5%
        
        escrow.updatePlatformFee(newFeeBps);
        
        assertEq(escrow.platformFeeBps(), newFeeBps);
    }
    
    function test_emergencyWithdraw_Success() public {
        // Send some ETH to the contract
        vm.deal(address(escrow), 1 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        
        escrow.emergencyWithdraw();
        
        assertEq(owner.balance - ownerBalanceBefore, 1 ether);
        assertEq(address(escrow).balance, 0);
    }
}
