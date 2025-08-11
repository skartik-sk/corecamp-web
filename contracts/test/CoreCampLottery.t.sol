// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampLottery.sol";
import "../src/mocks/MockVRFCoordinatorV2.sol";

contract CoreCampLotteryTest is Test {
    
    CampfireIPNFT public nftContract;
    CoreCampLottery public lottery;
    MockVRFCoordinatorV2 public mockVRF;
    
    address public owner;
    address public seller;
    address public player1;
    address public player2;
    address public player3;
    address public nonPlayer;
    
    uint256 public tokenId;
    uint256 public lotteryId;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant MAX_TICKETS = 5;
    uint256 public constant LOTTERY_DURATION = 7 days;
    
    bytes32 public constant KEY_HASH = bytes32("test_key_hash");
    uint64 public constant SUBSCRIPTION_ID = 1;
    receive() external payable {}
    event LotteryCreated(uint256 indexed lotteryId, uint256 indexed tokenId, address indexed owner, uint256 ticketPrice, uint256 maxTickets, uint256 endTime);
    event TicketPurchased(uint256 indexed lotteryId, address indexed buyer, uint256 ticketNumber);
    event LotteryDrawRequested(uint256 indexed lotteryId, uint256 vrfRequestId);
    event LotteryDrawCompleted(uint256 indexed lotteryId, address indexed winner, uint256 randomWord);
    event LotteryCancelled(uint256 indexed lotteryId, address indexed owner);
    event PrizeDistributed(uint256 indexed lotteryId, address indexed winner, address indexed owner, uint256 prizeAmount);
    
    function setUp() public {
        owner = address(this);
        seller = makeAddr("seller");
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        player3 = makeAddr("player3");
        nonPlayer = makeAddr("nonPlayer");
        
        // Deploy mock VRF coordinator
        mockVRF = new MockVRFCoordinatorV2();
        
        // Deploy contracts
        nftContract = new CampfireIPNFT();
        lottery = new CoreCampLottery(
            address(nftContract),
            address(mockVRF),
            KEY_HASH,
            SUBSCRIPTION_ID
        );
        
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
        
        // Fund players
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
        vm.deal(nonPlayer, 10 ether);
    }
    
    // ==================== START LOTTERY TESTS ====================
    
    function test_startLottery_Success() public {
        vm.startPrank(seller);
        
        nftContract.approve(address(lottery), tokenId);
        
        uint256 expectedEndTime = block.timestamp + LOTTERY_DURATION;
        
        vm.expectEmit(true, true, true, true);
        emit LotteryCreated(1, tokenId, seller, TICKET_PRICE, MAX_TICKETS, expectedEndTime);
        
        lotteryId = lottery.startLottery(tokenId, TICKET_PRICE, MAX_TICKETS, LOTTERY_DURATION);
        
        vm.stopPrank();
        
        // Verify lottery creation
        (
            address lotteryOwner,
            uint256 ticketPrice,
            uint256 maxTickets,
            bool isActive,
            uint256 ticketsSold,
            uint256 endTime,
            address winner,
            bool isDrawn
        ) = lottery.getLottery(lotteryId);
        
        assertEq(lotteryOwner, seller);
        assertEq(ticketPrice, TICKET_PRICE);
        assertEq(maxTickets, MAX_TICKETS);
        assertTrue(isActive);
        assertEq(ticketsSold, 0);
        assertEq(endTime, expectedEndTime);
        assertEq(winner, address(0));
        assertFalse(isDrawn);
        assertEq(lotteryId, 1);
    }
    
    function test_startLottery_RevertZeroTicketPrice() public {
        vm.startPrank(seller);
        nftContract.approve(address(lottery), tokenId);
        
        vm.expectRevert("Ticket price must be greater than zero");
        lottery.startLottery(tokenId, 0, MAX_TICKETS, LOTTERY_DURATION);
        
        vm.stopPrank();
    }
    
    function test_startLottery_RevertInsufficientTickets() public {
        vm.startPrank(seller);
        nftContract.approve(address(lottery), tokenId);
        
        vm.expectRevert("Must allow at least 2 tickets");
        lottery.startLottery(tokenId, TICKET_PRICE, 1, LOTTERY_DURATION);
        
        vm.stopPrank();
    }
    
    function test_startLottery_RevertTooManyTickets() public {
        vm.startPrank(seller);
        nftContract.approve(address(lottery), tokenId);
        
        vm.expectRevert("Too many tickets");
        lottery.startLottery(tokenId, TICKET_PRICE, 10001, LOTTERY_DURATION);
        
        vm.stopPrank();
    }
    
    function test_startLottery_RevertDurationTooShort() public {
        vm.startPrank(seller);
        nftContract.approve(address(lottery), tokenId);
        
        vm.expectRevert("Lottery duration too short");
        lottery.startLottery(tokenId, TICKET_PRICE, MAX_TICKETS, 30 minutes);
        
        vm.stopPrank();
    }
    
    function test_startLottery_RevertNotOwner() public {
        vm.startPrank(player1);
        
        vm.expectRevert("You are not the owner");
        lottery.startLottery(tokenId, TICKET_PRICE, MAX_TICKETS, LOTTERY_DURATION);
        
        vm.stopPrank();
    }
    
    function test_startLottery_RevertNotApproved() public {
        vm.startPrank(seller);
        
        vm.expectRevert("Lottery not approved");
        lottery.startLottery(tokenId, TICKET_PRICE, MAX_TICKETS, LOTTERY_DURATION);
        
        vm.stopPrank();
    }
    
    // ==================== BUY TICKET TESTS ====================
    
    function test_buyTicket_Success() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        vm.startPrank(player1);
        
        vm.expectEmit(true, true, false, true);
        emit TicketPurchased(lotteryId, player1, 1);
        
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        
        vm.stopPrank();
        
        // Verify ticket purchase
        address[] memory players = lottery.getPlayers(lotteryId);
        assertEq(players.length, 1);
        assertEq(players[0], player1);
        
        (,,, bool isActive, uint256 ticketsSold,,,) = lottery.getLottery(lotteryId);
        assertTrue(isActive);
        assertEq(ticketsSold, 1);
    }
    
    function test_buyTicket_MultiplePlayers() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        // Player 1 buys ticket
        vm.startPrank(player1);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        // Player 2 buys ticket
        vm.startPrank(player2);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        // Player 3 buys ticket
        vm.startPrank(player3);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        // Verify all purchases
        address[] memory players = lottery.getPlayers(lotteryId);
        assertEq(players.length, 3);
        assertEq(players[0], player1);
        assertEq(players[1], player2);
        assertEq(players[2], player3);
    }
    
    function test_buyTicket_RevertIncorrectPrice() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        vm.startPrank(player1);
        
        vm.expectRevert("Incorrect ticket price");
        lottery.buyTicket{value: TICKET_PRICE - 1}(lotteryId);
        
        vm.stopPrank();
    }
    
    function test_buyTicket_RevertOwnerCannotBuy() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        vm.startPrank(seller);
        vm.deal(address(seller), 10 ether);
        
        vm.expectRevert("Owner cannot buy tickets");
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        
        vm.stopPrank();
    }
    
    function test_buyTicket_RevertAlreadyPurchased() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        vm.startPrank(player1);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        
        vm.expectRevert("Already purchased ticket");
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        
        vm.stopPrank();
    }
    
    function test_buyTicket_RevertLotteryEnded() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        // Fast forward past end time
        vm.warp(block.timestamp + LOTTERY_DURATION + 1);
        
        vm.startPrank(player1);
        
        vm.expectRevert("Lottery has ended");
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        
        vm.stopPrank();
    }
    
    function test_buyTicket_RevertSoldOut() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        // Fill all tickets
        _buyTicketsForAllPlayers();
        
        vm.startPrank(nonPlayer);
        
        vm.expectRevert("Lottery is sold out");
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        
        vm.stopPrank();
    }
    
    function test_buyTicket_AutoDrawWhenSoldOut() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        // Buy all tickets except the last one
        vm.startPrank(player1);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(player2);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(player3);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        address fourthPlayer = makeAddr("fourthPlayer");
        vm.deal(fourthPlayer, 10 ether);
        
        vm.startPrank(fourthPlayer);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        // Final ticket should trigger auto-draw
        address fifthPlayer = makeAddr("fifthPlayer");
        vm.deal(fifthPlayer, 10 ether);
        
        vm.startPrank(fifthPlayer);
        
        vm.expectEmit(true, false, false, false);
        emit LotteryDrawRequested(lotteryId, 0); // requestId will be generated
        
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        
        vm.stopPrank();
    }
    
    // ==================== DRAW LOTTERY TESTS ====================
    
    function test_drawLottery_AfterEndTime() public {
        // Setup: Start lottery and buy tickets
        lotteryId = _setupLottery();
        _buyTicketsForSomePlayers();
        
        // Fast forward past end time
        vm.warp(block.timestamp + LOTTERY_DURATION + 1);
        
        vm.expectEmit(true, false, false, false);
        emit LotteryDrawRequested(lotteryId, 0); // requestId will be generated
        
        lottery.drawLottery(lotteryId);
    }
    
    function test_drawLottery_RevertCannotDrawYet() public {
        // Setup: Start lottery and buy one ticket
        lotteryId = _setupLottery();
        
        vm.startPrank(player1);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.expectRevert("Cannot draw yet");
        lottery.drawLottery(lotteryId);
    }
    
    function test_drawLottery_RevertNoTicketsSold() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        // Fast forward past end time
        vm.warp(block.timestamp + LOTTERY_DURATION + 1);
        
        vm.expectRevert("No tickets sold");
        lottery.drawLottery(lotteryId);
    }
    
    // ==================== VRF CALLBACK TESTS ====================
    
    function test_fulfillRandomWords_Success() public {
        // Setup: Start lottery, buy tickets, and request draw
        lotteryId = _setupLottery();
        _buyTicketsForSomePlayers();
        
        // Fast forward and draw
        vm.warp(block.timestamp + LOTTERY_DURATION + 1);
        lottery.drawLottery(lotteryId);
        
        // Get the VRF request ID
        uint256 requestId = 1; // First request ID from mock
        
        // Mock the random number to select player2 (index 1)
        uint256 randomNumber = 1;
        
        uint256 sellerBalanceBefore = seller.balance;
        
        vm.expectEmit(true, true, false, true);
        emit LotteryDrawCompleted(lotteryId, player2, randomNumber);
        
        vm.expectEmit(true, true, true, false);
        emit PrizeDistributed(lotteryId, player2, seller, 0); // Amount will be calculated
        
        // Fulfill the VRF request
        mockVRF.fulfillRandomWordsWithNumber(requestId, randomNumber);
        
        // Verify winner
        (,,,, uint256 ticketsSold,, address winner, bool isDrawn) = lottery.getLottery(lotteryId);
        assertEq(winner, player2);
        assertTrue(isDrawn);
        
        // Verify NFT transfer
        assertEq(nftContract.ownerOf(tokenId), player2);
        
        // Verify payment to seller (considering platform fee)
        uint256 totalRevenue = ticketsSold * TICKET_PRICE;
        uint256 platformFee = (totalRevenue * 250) / 10000;
        uint256 expectedSellerAmount = totalRevenue - platformFee;
        assertEq(seller.balance - sellerBalanceBefore, expectedSellerAmount);
    }
    
    function test_fulfillRandomWords_RevertOnlyVRFCoordinator() public {
        // Setup: Start lottery, buy tickets, and request draw
        lotteryId = _setupLottery();
        _buyTicketsForSomePlayers();
        
        vm.warp(block.timestamp + LOTTERY_DURATION + 1);
        lottery.drawLottery(lotteryId);
        
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 123;
        
        vm.startPrank(player1);
        
        vm.expectRevert("Only VRF coordinator can call");
        lottery.fulfillRandomWords(1, randomWords);
        
        vm.stopPrank();
    }
    
    // ==================== CANCEL LOTTERY TESTS ====================
    
    function test_cancelLottery_Success() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        vm.startPrank(seller);
        
        vm.expectEmit(true, true, false, true);
        emit LotteryCancelled(lotteryId, seller);
        
        lottery.cancelLottery(lotteryId);
        
        vm.stopPrank();
        
        // Verify cancellation
        (,,, bool isActive,,,, bool isDrawn) = lottery.getLottery(lotteryId);
        assertFalse(isActive);
        assertFalse(isDrawn);
    }
    
    function test_cancelLottery_RevertNotOwner() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        vm.startPrank(player1);
        
        vm.expectRevert("You are not the owner");
        lottery.cancelLottery(lotteryId);
        
        vm.stopPrank();
    }
    
    function test_cancelLottery_RevertTicketsSold() public {
        // Setup: Start lottery and buy ticket
        lotteryId = _setupLottery();
        
        vm.startPrank(player1);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(seller);
        
        vm.expectRevert("Cannot cancel lottery with tickets sold");
        lottery.cancelLottery(lotteryId);
        
        vm.stopPrank();
    }
    
    // ==================== VIEW FUNCTIONS TESTS ====================
    
    function test_canDrawLottery() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        assertFalse(lottery.canDrawLottery(lotteryId));
        
        // Buy tickets
        _buyTicketsForSomePlayers();
        
        assertFalse(lottery.canDrawLottery(lotteryId));
        
        // Fast forward past end time
        vm.warp(block.timestamp + LOTTERY_DURATION + 1);
        
        assertTrue(lottery.canDrawLottery(lotteryId));
    }
    
    function test_canDrawLottery_WhenSoldOut() public {
        // Setup: Start lottery
        lotteryId = _setupLottery();
        
        // Buy all tickets
        _buyTicketsForAllPlayers();
        
        assertTrue(lottery.canDrawLottery(lotteryId));
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    function _setupLottery() internal returns (uint256) {
        vm.startPrank(seller);
        nftContract.approve(address(lottery), tokenId);
        uint256 id = lottery.startLottery(tokenId, TICKET_PRICE, MAX_TICKETS, LOTTERY_DURATION);
        vm.stopPrank();
        return id;
    }
    
    function _buyTicketsForSomePlayers() internal {
        vm.startPrank(player1);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(player2);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(player3);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
    }
    
    function _buyTicketsForAllPlayers() internal {
        vm.startPrank(player1);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(player2);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        vm.startPrank(player3);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        address player4 = makeAddr("player4");
        vm.deal(player4, 10 ether);
        vm.startPrank(player4);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
        
        address player5 = makeAddr("player5");
        vm.deal(player5, 10 ether);
        vm.startPrank(player5);
        lottery.buyTicket{value: TICKET_PRICE}(lotteryId);
        vm.stopPrank();
    }
    
    // ==================== OWNER FUNCTIONS TESTS ====================
    
    function test_updateVRFConfig() public {
        bytes32 newKeyHash = bytes32("new_key_hash");
        uint64 newSubId = 2;
        uint16 newConfirmations = 5;
        uint32 newGasLimit = 400000;
        
        lottery.updateVRFConfig(newKeyHash, newSubId, newConfirmations, newGasLimit);
        
        assertEq(lottery.keyHash(), newKeyHash);
        assertEq(lottery.subscriptionId(), newSubId);
        assertEq(lottery.requestConfirmations(), newConfirmations);
        assertEq(lottery.callbackGasLimit(), newGasLimit);
    }
    
    function test_updatePlatformFee_Success() public {
        uint256 newFeeBps = 500; // 5%
        
        lottery.updatePlatformFee(newFeeBps);
        
        assertEq(lottery.platformFeeBps(), newFeeBps);
    }
    
    function test_emergencyWithdraw_Success() public {
        // Send some ETH to the contract
        vm.deal(address(lottery), 1 ether);
        
        uint256 ownerBalanceBefore = owner.balance;
        
        lottery.emergencyWithdraw();
        
        assertEq(owner.balance - ownerBalanceBefore, 1 ether);
        assertEq(address(lottery).balance, 0);
    }
}
