// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CampfireIPNFT.sol";
import "../src/CoreCampLottery.sol";
contract CoreCampLotteryTest is Test {
    CampfireIPNFT public nftContract;
    CoreCampLottery public lottery;
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
    receive() external payable {}
    event LotteryCreated(uint256 indexed lotteryId, uint256 indexed tokenId, address indexed owner, uint256 ticketPrice, uint256 maxTickets, uint256 endTime);
    event TicketPurchased(uint256 indexed lotteryId, address indexed buyer, uint256 ticketNumber);
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

        // Deploy contracts
        nftContract = new CampfireIPNFT();
        lottery = new CoreCampLottery(address(nftContract));

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
            uint256 tokenIdReturned,
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
        
        (,, ,, bool isActive, uint256 ticketsSold,,,) = lottery.getLottery(lotteryId);
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
        
        vm.expectRevert("Lottery is not active");
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
        // Expect draw event
        vm.expectEmit(true, false, false, false);
        // Winner and randomWord are not known in advance, so just check event signature
        emit LotteryDrawCompleted(lotteryId, address(0), 0);
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
        emit LotteryDrawCompleted(lotteryId, address(0), 0);

        // vm.expectRevert("Lottery is not active");
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
        (,,,, bool isActive,,,, bool isDrawn) = lottery.getLottery(lotteryId);
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
        
        assertFalse(lottery.canDrawLottery(lotteryId));
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
