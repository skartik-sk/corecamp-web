// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampMarketplace.sol";

contract CoreCampMarketplaceTest is Test {
    
    CampfireIPNFT public nftContract;
    CoreCampMarketplace public marketplace;
    
    address public owner;
    address public seller;
    address public buyer1;
    address public buyer2;
    
    uint256 public tokenId;
    uint256 public constant LISTING_PRICE = 1 ether;
     receive() external payable {}
    
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);
    event PriceUpdated(uint256 indexed tokenId, address indexed seller, uint256 oldPrice, uint256 newPrice);
    
    function setUp() public {
        owner = address(this);
        seller = makeAddr("seller");
        buyer1 = makeAddr("buyer1");
        buyer2 = makeAddr("buyer2");
        
        // Deploy contracts
        nftContract = new CampfireIPNFT();
        marketplace = new CoreCampMarketplace(address(nftContract));
        
        // Mint NFT to seller
        vm.startPrank(seller);
        
        CampfireIPNFT.LicenseTerms memory licenseTerms = CampfireIPNFT.LicenseTerms({
            price: 0.1 ether,
            duration: 365 days,
            royaltyBps: 500, // 5%
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
        vm.deal(buyer1, 10 ether);
        vm.deal(buyer2, 10 ether);
    }
    
    // ==================== LIST NFT TESTS ====================
    
    function test_listNFT_Success() public {
        vm.startPrank(seller);
        
        // Approve marketplace
        nftContract.approve(address(marketplace), tokenId);
        
        // Expect event
        vm.expectEmit(true, true, false, true);
        emit NFTListed(tokenId, seller, LISTING_PRICE);
        
        // List NFT
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.stopPrank();
        
        // Verify listing
        CoreCampMarketplace.Listing memory listing = marketplace.getListing(tokenId);
        assertEq(listing.seller, seller);
        assertEq(listing.price, LISTING_PRICE);
        assertTrue(listing.isActive);
    }
    
    function test_listNFT_RevertZeroPrice() public {
        vm.startPrank(seller);
        
        nftContract.approve(address(marketplace), tokenId);
        
        vm.expectRevert("Price must be greater than zero");
        marketplace.listNFT(tokenId, 0);
        
        vm.stopPrank();
    }
    
    function test_listNFT_RevertNotOwner() public {
        vm.startPrank(buyer1);
        
        vm.expectRevert("You are not the owner");
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.stopPrank();
    }
    
    function test_listNFT_RevertNotApproved() public {
        vm.startPrank(seller);
        
        vm.expectRevert("Marketplace not approved");
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.stopPrank();
    }
    
    function test_listNFT_RevertAlreadyListed() public {
        vm.startPrank(seller);
        
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.expectRevert("NFT already listed");
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.stopPrank();
    }
    
    // ==================== BUY NFT TESTS ====================
    
    function test_buyNFT_Success() public {
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        vm.stopPrank();
        
        uint256 sellerBalanceBefore = seller.balance;
        uint256 buyer1BalanceBefore = buyer1.balance;
        
        // Buy NFT
        vm.startPrank(buyer1);
        
        vm.expectEmit(true, true, true, true);
        emit NFTSold(tokenId, seller, buyer1, LISTING_PRICE);
        
        marketplace.buyNFT{value: LISTING_PRICE}(tokenId);
        
        vm.stopPrank();
        
        // Verify ownership transfer
        assertEq(nftContract.ownerOf(tokenId), buyer1);
        
        // Verify listing is inactive
        CoreCampMarketplace.Listing memory listing = marketplace.getListing(tokenId);
        assertFalse(listing.isActive);
        
        // Verify payment (considering platform fee of 2.5%)
        uint256 platformFee = (LISTING_PRICE * 25) / 10000;
        uint256 expectedSellerAmount = LISTING_PRICE - platformFee;
        
        assertEq(seller.balance - sellerBalanceBefore, expectedSellerAmount);
        assertEq(buyer1BalanceBefore - buyer1.balance, LISTING_PRICE);
    }
    
    function test_buyNFT_RevertInactiveListing() public {
        vm.startPrank(buyer1);
        
        vm.expectRevert("Listing is not active");
        marketplace.buyNFT{value: LISTING_PRICE}(tokenId);
        
        vm.stopPrank();
    }
    
    function test_buyNFT_RevertInsufficientFunds() public {
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        
        vm.expectRevert("Insufficient funds");
        marketplace.buyNFT{value: LISTING_PRICE - 1}(tokenId);
        
        vm.stopPrank();
    }
    
    function test_buyNFT_RevertBuyOwnNFT() public {
        // Setup: List NFT
        vm.startPrank(seller);
        vm.deal(address(seller), 10 ether);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        vm.expectRevert("Cannot buy your own NFT");
        marketplace.buyNFT{value: LISTING_PRICE}(tokenId);
        vm.stopPrank();
        
    }
    
    function test_buyNFT_RefundExcessPayment() public {
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        vm.stopPrank();
        
        uint256 excessAmount = 0.5 ether;
        uint256 totalPayment = LISTING_PRICE + excessAmount;
        uint256 buyer1BalanceBefore = buyer1.balance;
        vm.startPrank(buyer1);
        marketplace.buyNFT{value: totalPayment}(tokenId);
       
        console.log("reached here");
        vm.stopPrank();
        
        // Verify only listing price was deducted
        assertEq(buyer1BalanceBefore - buyer1.balance, LISTING_PRICE);
    }
    
    // ==================== CANCEL LISTING TESTS ====================
    
    function test_cancelListing_Success() public {
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.expectEmit(true, true, false, true);
        emit ListingCancelled(tokenId, seller);
        
        marketplace.cancelListing(tokenId);
        
        vm.stopPrank();
        
        // Verify listing is inactive
        CoreCampMarketplace.Listing memory listing = marketplace.getListing(tokenId);
        assertFalse(listing.isActive);
    }
    
    function test_cancelListing_RevertNotSeller() public {
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        
        vm.expectRevert("You are not the seller");
        marketplace.cancelListing(tokenId);
        
        vm.stopPrank();
    }
    
    function test_cancelListing_RevertInactiveListing() public {
        vm.startPrank(seller);
        
        vm.expectRevert("Listing is not active");
        marketplace.cancelListing(tokenId);
        
        vm.stopPrank();
    }
    
    // ==================== UPDATE PRICE TESTS ====================
    
    function test_updatePrice_Success() public {
        uint256 newPrice = 2 ether;
        
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.expectEmit(true, true, false, true);
        emit PriceUpdated(tokenId, seller, LISTING_PRICE, newPrice);
        
        marketplace.updatePrice(tokenId, newPrice);
        
        vm.stopPrank();
        
        // Verify price update
        CoreCampMarketplace.Listing memory listing = marketplace.getListing(tokenId);
        assertEq(listing.price, newPrice);
        assertTrue(listing.isActive);
    }
    
    function test_updatePrice_RevertZeroPrice() public {
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        
        vm.expectRevert("Price must be greater than zero");
        marketplace.updatePrice(tokenId, 0);
        
        vm.stopPrank();
    }
    
    function test_updatePrice_RevertNotSeller() public {
        // Setup: List NFT
        vm.startPrank(seller);
        nftContract.approve(address(marketplace), tokenId);
        marketplace.listNFT(tokenId, LISTING_PRICE);
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        
        vm.expectRevert("You are not the seller");
        marketplace.updatePrice(tokenId, 2 ether);
        
        vm.stopPrank();
    }
    
    // ==================== OWNER FUNCTIONS TESTS ====================
    
    function test_updatePlatformFee_Success() public {
        uint256 newFeeBps = 500; // 5%
        
        marketplace.updatePlatformFee(newFeeBps);
        
        assertEq(marketplace.platformFeeBps(), newFeeBps);
    }
    
    function test_updatePlatformFee_RevertTooHigh() public {
        vm.expectRevert("Fee cannot exceed 10%");
        marketplace.updatePlatformFee(1001); // 10.01%
    }
    
    function test_emergencyWithdraw_Success() public {
        // Send some ETH to the contract
        vm.deal(address(marketplace), 1 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        
        marketplace.emergencyWithdraw();
        
        assertEq(owner.balance - ownerBalanceBefore, 1 ether);
        assertEq(address(marketplace).balance, 0);
    }
}
