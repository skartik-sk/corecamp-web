# CoreCamp Marketplace Smart Contracts

A comprehensive suite of smart contracts for trading IP-NFTs (Intellectual Property NFTs) on the Campfire platform. This system provides multiple trading mechanisms including direct sales, escrow transactions, auctions, and lotteries.

## 🏗️ Architecture Overview

### Core Contracts

1. **CampfireIPNFT** - The main NFT contract for intellectual property with licensing features
2. **CoreCampMarketplace** - Direct ownership marketplace with fixed-price listings
3. **CoreCampEscrow** - P2P escrow system for negotiated sales with dual confirmation
4. **CoreCampAuction** - English auction system with automatic settlement
5. **CoreCampLottery** - Lottery system with Chainlink VRF for fair randomness
6. **CoreCampFactory** - Factory contract to deploy and manage all marketplace contracts

### Supporting Contracts

- **MockVRFCoordinatorV2** - Mock VRF coordinator for local testing

## 🚀 Features

### CoreCampMarketplace
- ✅ Fixed-price listings with instant purchase
- ✅ Seller can update price or cancel listing
- ✅ Platform fee collection (2.5% default)
- ✅ Automatic ownership transfer on purchase
- ✅ Excess payment refund

### CoreCampEscrow
- ✅ Secure P2P transactions with dual confirmation
- ✅ Automatic refund system for cancelled deals
- ✅ 7-day timeout protection
- ✅ Both parties must confirm before transfer
- ✅ Platform fee collection

### CoreCampAuction
- ✅ English auctions with minimum bid increments (5%)
- ✅ Automatic auction extension (15 minutes) for last-minute bids
- ✅ Secure bid withdrawal system for outbid users
- ✅ Configurable auction duration (1 hour - 30 days)
- ✅ Emergency cancellation by platform owner

### CoreCampLottery
- ✅ Provably fair randomness using Chainlink VRF
- ✅ Configurable ticket price and maximum tickets
- ✅ Auto-draw when all tickets are sold
- ✅ Platform fee distribution
- ✅ One ticket per user restriction

### CoreCampFactory
- ✅ Deploy all marketplace contracts for any NFT contract
- ✅ Centralized management of platform fees
- ✅ Batch operations across all deployed contracts
- ✅ Deployment status management
- ✅ VRF configuration updates

## 📋 Prerequisites

- [Foundry](https://getfoundry.sh/) (for development and testing)
- [Node.js](https://nodejs.org/) (v16 or later)
- [Git](https://git-scm.com/)

## 🔧 Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd campfire-contracts
```

2. Install Foundry dependencies:
```bash
forge install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/CoreCampMarketplace.t.sol

# Run tests with gas reporting
forge test --gas-report

# Run integration tests
forge test --match-path test/CoreCampIntegration.t.sol

# Run tests with coverage
forge coverage
```

### Test Coverage

The project includes extensive tests covering:
- ✅ All contract functions (happy path and edge cases)
- ✅ Access control and security checks
- ✅ Event emissions
- ✅ Gas usage optimization
- ✅ Integration scenarios across all contracts
- ✅ Error handling and revert conditions

## 🚀 Deployment

### Local Development

```bash
# Start local node
anvil

# Deploy to local network
forge script script/DeployCampfireContracts.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Testnet Deployment

```bash
# Deploy to Sepolia
NETWORK=sepolia forge script script/DeployCampfireContracts.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy to Polygon Mumbai
NETWORK=polygon-mumbai forge script script/DeployCampfireContracts.s.sol --rpc-url $MUMBAI_RPC_URL --broadcast --verify
```

### Mainnet Deployment

```bash
# Deploy to Ethereum Mainnet
NETWORK=mainnet forge script script/DeployCampfireContracts.s.sol --rpc-url $MAINNET_RPC_URL --broadcast --verify

# Deploy to Polygon Mainnet  
NETWORK=polygon forge script script/DeployCampfireContracts.s.sol --rpc-url $POLYGON_RPC_URL --broadcast --verify
```

## 📖 Usage Examples

### 1. Direct Marketplace Sale

```solidity
// 1. Artist mints IP-NFT
uint256 tokenId = campfireNFT.mintIP(artist, uri, licenseTerms, ipMetadata);

// 2. Artist approves marketplace
campfireNFT.approve(address(marketplace), tokenId);

// 3. Artist lists NFT
marketplace.listNFT(tokenId, 5 ether);

// 4. Collector purchases NFT
marketplace.buyNFT{value: 5 ether}(tokenId);
```

### 2. Escrow Transaction

```solidity
// 1. Artist creates escrow deal
campfireNFT.approve(address(escrow), tokenId);
escrow.createDeal(collector, tokenId, 3 ether);

// 2. Collector funds the deal
escrow.fundDeal{value: 3 ether}(tokenId);

// 3. Both parties confirm
escrow.confirmTransfer(tokenId); // Artist calls
escrow.confirmTransfer(tokenId); // Collector calls
```

### 3. Auction

```solidity
// 1. Owner creates auction
campfireNFT.approve(address(auction), tokenId);
auction.createAuction(tokenId, 1 ether, 7 days);

// 2. Bidders place bids
auction.placeBid{value: 1.1 ether}(tokenId);
auction.placeBid{value: 1.2 ether}(tokenId);

// 3. End auction after time expires
auction.endAuction(tokenId);
```

### 4. Lottery

```solidity
// 1. Owner starts lottery
campfireNFT.approve(address(lottery), tokenId);
uint256 lotteryId = lottery.startLottery(tokenId, 0.1 ether, 10, 7 days);

// 2. Players buy tickets
lottery.buyTicket{value: 0.1 ether}(lotteryId);

// 3. Draw lottery (after end time or all tickets sold)
lottery.drawLottery(lotteryId);

// 4. VRF callback completes the lottery automatically
```

## 🔐 Security Features

### Access Control
- Owner-only functions for administrative tasks
- Seller-only functions for listing management
- Buyer verification for purchases

### Reentrancy Protection
- ReentrancyGuard on all payable functions
- Checks-Effects-Interactions pattern
- Safe transfer mechanisms

### Input Validation
- Price validation (> 0)
- Duration limits for auctions and lotteries
- Ownership and approval checks
- State validation for state machines

### Economic Security
- Platform fee limits (max 10%)
- Automatic refund mechanisms
- Withdrawal patterns for outbid users
- Fair randomness via Chainlink VRF

## 📊 Gas Optimization

The contracts are optimized for gas efficiency:
- Efficient storage layouts
- Batch operations where possible
- Minimal external calls
- Optimized loops and conditionals

Typical gas usage:
- NFT Listing: ~100,000 gas
- NFT Purchase: ~150,000 gas
- Auction Bid: ~80,000 gas
- Lottery Ticket: ~70,000 gas

## 🔮 Chainlink VRF Integration

The lottery system uses Chainlink VRF for provably fair randomness:

### Setup Requirements
1. Create VRF subscription at [vrf.chain.link](https://vrf.chain.link)
2. Fund subscription with LINK tokens
3. Add deployed lottery contract as consumer
4. Update subscription ID in factory contract

### Network Configurations
- **Ethereum Mainnet**: Coordinator `0x271682DEB8C4E0901D1a1550aD2e64D568E69909`
- **Sepolia Testnet**: Coordinator `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625`
- **Polygon Mainnet**: Coordinator `0xAE975071Be8F8eE67addBC1A82488F1C24858067`

## 📁 Project Structure

```
contracts/
├── src/
│   ├── CampfireIPNFT.sol           # Main IP-NFT contract
│   ├── CoreCampMarketplace.sol     # Direct marketplace
│   ├── CoreCampEscrow.sol          # P2P escrow system
│   ├── CoreCampAuction.sol         # Auction system
│   ├── CoreCampLottery.sol         # Lottery system
│   ├── CoreCampFactory.sol         # Factory contract
│   └── mocks/
│       └── MockVRFCoordinatorV2.sol # Mock VRF for testing
├── test/
│   ├── CoreCampMarketplace.t.sol   # Marketplace tests
│   ├── CoreCampEscrow.t.sol        # Escrow tests
│   ├── CoreCampAuction.t.sol       # Auction tests
│   ├── CoreCampLottery.t.sol       # Lottery tests
│   ├── CoreCampFactory.t.sol       # Factory tests
│   └── CoreCampIntegration.t.sol   # Integration tests
├── script/
│   └── DeployCampfireContracts.s.sol # Deployment script
├── foundry.toml                    # Foundry configuration
└── README.md                       # This file
```

## 🐛 Common Issues & Solutions

### 1. "Marketplace not approved" Error
**Solution**: Call `nftContract.approve(marketplaceAddress, tokenId)` before listing

### 2. "Insufficient funds" Error
**Solution**: Ensure msg.value >= listing price including platform fees

### 3. VRF Subscription Issues
**Solution**: 
- Verify subscription is funded with LINK
- Confirm lottery contract is added as consumer
- Check subscription ID is correct

### 4. Gas Limit Issues
**Solution**: Increase gas limit for complex operations (especially lottery draws)

## 📚 Additional Resources

- [Foundry Documentation](https://book.getfoundry.sh/)
- [Chainlink VRF Documentation](https://docs.chain.link/vrf/v2/introduction/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`forge test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenZeppelin for secure contract templates
- Foundry team for the excellent development framework
- Chainlink team for VRF oracle services
- The Ethereum community for continuous innovation
