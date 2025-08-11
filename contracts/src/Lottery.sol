// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    struct LotteryRound {
        address creator;
        string title;
        string description;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 soldTickets;
        uint256 endTime;
        address[] players;
        address winner;
        bool isActive;
        bool winnerAnnounced;
    }

    mapping(uint256 => LotteryRound) public lotteries;
    uint256 public nextLotteryId;

    event LotteryCreated(uint256 indexed lotteryId, address indexed creator, string title, uint256 ticketPrice, uint256 totalTickets, uint256 endTime);
    event TicketPurchased(uint256 indexed lotteryId, address indexed buyer, uint256 quantity);
    event WinnerAnnounced(uint256 indexed lotteryId, address indexed winner);

    function createLottery(string memory title, string memory description, uint256 ticketPrice, uint256 totalTickets, uint256 endTime) external {
        require(endTime > block.timestamp, "End time must be in the future");
        require(totalTickets > 0, "Total tickets must be positive");
        require(ticketPrice > 0, "Ticket price must be positive");

        LotteryRound storage l = lotteries[nextLotteryId];
        l.creator = msg.sender;
        l.title = title;
        l.description = description;
        l.ticketPrice = ticketPrice;
        l.totalTickets = totalTickets;
        l.endTime = endTime;
        l.isActive = true;
        l.winnerAnnounced = false;
        nextLotteryId++;

        emit LotteryCreated(nextLotteryId - 1, msg.sender, title, ticketPrice, totalTickets, endTime);
    }

    function buyTickets(uint256 lotteryId, uint256 quantity) external payable {
        LotteryRound storage l = lotteries[lotteryId];
        require(l.isActive, "Lottery not active");
        require(block.timestamp < l.endTime, "Lottery ended");
        require(l.soldTickets + quantity <= l.totalTickets, "Not enough tickets left");
        require(msg.value == l.ticketPrice * quantity, "Incorrect ETH sent");

        for (uint256 i = 0; i < quantity; i++) {
            l.players.push(msg.sender);
        }
        l.soldTickets += quantity;
        emit TicketPurchased(lotteryId, msg.sender, quantity);
    }

    function announceWinner(uint256 lotteryId) external {
        LotteryRound storage l = lotteries[lotteryId];
        require(l.isActive, "Lottery not active");
        require(block.timestamp >= l.endTime, "Lottery not ended");
        require(!l.winnerAnnounced, "Winner already announced");
        require(l.players.length > 0, "No players");
        require(msg.sender == l.creator, "Only creator can announce winner");

        uint256 winnerIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, l.players.length))) % l.players.length;
        l.winner = l.players[winnerIndex];
        l.isActive = false;
        l.winnerAnnounced = true;
        payable(l.winner).transfer(address(this).balance);
        emit WinnerAnnounced(lotteryId, l.winner);
    }

    function getPlayers(uint256 lotteryId) external view returns (address[] memory) {
        return lotteries[lotteryId].players;
    }
}
