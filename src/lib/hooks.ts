import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './contracts';
import type { Address } from 'viem';

// Cast addresses to proper type
const MARKETPLACE_ADDRESS = CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address;
const ESCROW_ADDRESS = CONTRACT_ADDRESSES.CORE_CAMP_ESCROW as Address;
const AUCTION_ADDRESS = CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address;
const LOTTERY_ADDRESS = CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address;
const IP_NFT_ADDRESS = CONTRACT_ADDRESSES.IP_NFT as Address;

// ============ MARKETPLACE HOOKS ============

export function useMarketplaceListing(tokenId: bigint) {
  return useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: CONTRACT_ABIS.MARKETPLACE,
    functionName: 'getListing',
    args: [tokenId],
  });
}

export function useListNFT() {
  return useWriteContract();
}

export function useBuyNFT() {
  return useWriteContract();
}

export function useCancelListing() {
  return useWriteContract();
}

export function useUpdatePrice() {
  return useWriteContract();
}

// ============ ESCROW HOOKS ============

export function useEscrowDeal(tokenId: bigint) {
  return useReadContract({
    address: ESCROW_ADDRESS,
    abi: CONTRACT_ABIS.ESCROW,
    functionName: 'getDeal',
    args: [tokenId],
  });
}

export function useCreateDeal() {
  return useWriteContract();
}

export function useFundDeal() {
  return useWriteContract();
}

export function useConfirmTransfer() {
  return useWriteContract();
}

export function useCancelDeal() {
  return useWriteContract();
}

// ============ AUCTION HOOKS ============

export function useAuctionDetails(tokenId: bigint) {
  return useReadContract({
    address: AUCTION_ADDRESS,
    abi: CONTRACT_ABIS.AUCTION,
    functionName: 'getAuction',
    args: [tokenId],
  });
}

export function useCreateAuction() {
  return useWriteContract();
}

export function usePlaceBid() {
  return useWriteContract();
}

export function useEndAuction() {
  return useWriteContract();
}

export function useCancelAuction() {
  return useWriteContract();
}

export function useWithdrawBid() {
  return useWriteContract();
}

export function useTimeRemaining(tokenId: bigint) {
  return useReadContract({
    address: AUCTION_ADDRESS,
    abi: CONTRACT_ABIS.AUCTION,
    functionName: 'getTimeRemaining',
    args: [tokenId],
  });
}

// ============ LOTTERY HOOKS ============

export function useLotteryDetails(lotteryId: bigint) {
  return useReadContract({
    address: LOTTERY_ADDRESS,
    abi: CONTRACT_ABIS.LOTTERY,
    functionName: 'getLottery',
    args: [lotteryId],
  });
}

export function useStartLottery() {
  return useWriteContract();
}

export function useBuyTicket() {
  return useWriteContract();
}

export function useDrawLottery() {
  return useWriteContract();
}

export function useCancelLottery() {
  return useWriteContract();
}

export function useLotteryPlayers(lotteryId: bigint) {
  return useReadContract({
    address: LOTTERY_ADDRESS,
    abi: CONTRACT_ABIS.LOTTERY,
    functionName: 'getPlayers',
    args: [lotteryId],
  });
}

// ============ IP NFT HOOKS (Origin SDK) ============

export function useNFTApproval() {
  return useWriteContract();
}

export function useNFTOwner(tokenId: bigint) {
  return useReadContract({
    address: IP_NFT_ADDRESS,
    abi: [
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'ownerOf',
    args: [tokenId],
  });
}

// ============ UTILITY HOOKS ============

export function useTransactionStatus(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({
    hash,
  });
}

// ============ HELPER FUNCTIONS FOR CONTRACT INTERACTIONS ============

export const contractInteractions = {
  // Marketplace interactions
  listNFT: (tokenId: bigint, price: bigint) => ({
    address: MARKETPLACE_ADDRESS,
    abi: CONTRACT_ABIS.MARKETPLACE,
    functionName: 'listNFT',
    args: [tokenId, price],
  }),

  buyNFT: (tokenId: bigint, value: bigint) => ({
    address: MARKETPLACE_ADDRESS,
    abi: CONTRACT_ABIS.MARKETPLACE,
    functionName: 'buyNFT',
    args: [tokenId],
    value,
  }),

  cancelListing: (tokenId: bigint) => ({
    address: MARKETPLACE_ADDRESS,
    abi: CONTRACT_ABIS.MARKETPLACE,
    functionName: 'cancelListing',
    args: [tokenId],
  }),

  // Escrow interactions
  createDeal: (buyer: Address, tokenId: bigint, price: bigint) => ({
    address: ESCROW_ADDRESS,
    abi: CONTRACT_ABIS.ESCROW,
    functionName: 'createDeal',
    args: [buyer, tokenId, price],
  }),

  fundDeal: (tokenId: bigint, value: bigint) => ({
    address: ESCROW_ADDRESS,
    abi: CONTRACT_ABIS.ESCROW,
    functionName: 'fundDeal',
    args: [tokenId],
    value,
  }),

  confirmTransfer: (tokenId: bigint) => ({
    address: ESCROW_ADDRESS,
    abi: CONTRACT_ABIS.ESCROW,
    functionName: 'confirmTransfer',
    args: [tokenId],
  }),

  // Auction interactions
  createAuction: (tokenId: bigint, startingBid: bigint, duration: bigint) => ({
    address: AUCTION_ADDRESS,
    abi: CONTRACT_ABIS.AUCTION,
    functionName: 'createAuction',
    args: [tokenId, startingBid, duration],
  }),

  placeBid: (tokenId: bigint, value: bigint) => ({
    address: AUCTION_ADDRESS,
    abi: CONTRACT_ABIS.AUCTION,
    functionName: 'placeBid',
    args: [tokenId],
    value,
  }),

  endAuction: (tokenId: bigint) => ({
    address: AUCTION_ADDRESS,
    abi: CONTRACT_ABIS.AUCTION,
    functionName: 'endAuction',
    args: [tokenId],
  }),

  // Lottery interactions
  startLottery: (tokenId: bigint, ticketPrice: bigint, maxTickets: bigint, duration: bigint) => ({
    address: LOTTERY_ADDRESS,
    abi: CONTRACT_ABIS.LOTTERY,
    functionName: 'startLottery',
    args: [tokenId, ticketPrice, maxTickets, duration],
  }),

  buyTicket: (lotteryId: bigint, value: bigint) => ({
    address: LOTTERY_ADDRESS,
    abi: CONTRACT_ABIS.LOTTERY,
    functionName: 'buyTicket',
    args: [lotteryId],
    value,
  }),

  // NFT approval
  approveNFT: (spender: Address, tokenId: bigint) => ({
    address: IP_NFT_ADDRESS,
    abi: [
      {
        inputs: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" }
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      }
    ],
    functionName: 'approve',
    args: [spender, tokenId],
  }),
};
