import { parseEther, formatEther } from 'viem';
import type { Address } from 'viem';

// Import ABIs from utils folder
import { MARKETPLACE_ABI } from '../utils/Marketplace';
import { ESCROW_ABI } from '../utils/Escrow';
import { AUCTION_ABI } from '../utils/Auction';
import { FACTORY_ABI } from '../utils/Factory';
import { LOTTERY_ABI } from '../utils/Lottery';

// Import the lottery ABI from the lib folder (more comprehensive)

// Contract addresses from the Camp Network
export const CONTRACT_ADDRESSES = {
  // IP NFT Contract (Origin SDK)

  IP_NFT: '0xF90733b9eCDa3b49C250B2C3E3E42c96fC93324E',
  CORE_CAMP_FACTORY: '0x9c655a5475b2B2CD8EdD07ACCa6a98e3e23Dab01',

  // Your custom deployed contracts
  CORE_CAMP_MARKETPLACE: '0xf49cC8102fBEAF815e095ac6fCfa8d71AF2E8eB8',
  CORE_CAMP_ESCROW: '0x56360A8F270EDeacCC4872efc374CC4F75cFF9a1',
  CORE_CAMP_AUCTION: '0x02280daEC6829D2595163513cF3d04Cc0028AaF9',
  CORE_CAMP_LOTTERY: '0xbE0FB4e433CD1b0df9003444C2A82830DB7B50E8',

  WCAMP_TOKEN: '0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b' as Address,
};

// Export ABIs for easy import
export const CONTRACT_ABIS = {
  MARKETPLACE: MARKETPLACE_ABI,
  ESCROW: ESCROW_ABI,
  AUCTION: AUCTION_ABI,
  LOTTERY: LOTTERY_ABI,
  FACTORY: FACTORY_ABI,
};

export interface LicenseTerms {
  price: bigint;
  duration: bigint; 
  royaltyBps: number;
  paymentToken: Address;
}

export interface AuctionParams {
  tokenId: bigint;
  startingPrice: bigint;
  endTime: bigint;
  minIncrement: bigint;
  auctionType: 'english' | 'dutch';
  reservePrice?: bigint;
}

export interface LotteryParams {
  ticketPrice: bigint;
  totalTickets: number;
  endTime: bigint;
  prizes: string[];
}

// Utility functions for contract interactions
export class CoreCampContracts {
  private origin: any;

  constructor(origin: any) {
    this.origin = origin;
  }

  // IP NFT Operations
  async mintIPNFT(
    file: File, 
    metadata: Record<string, unknown>, 
    license: LicenseTerms,
    parentId?: bigint
  ): Promise<string> {
    try {
      return await this.origin.mintFile(file, metadata, license, parentId);
    } catch (error) {
      console.error('Error minting IP NFT:', error);
      throw error;
    }
  }

  async getIPNFTData(tokenId: bigint) {
    try {
      return await this.origin.getData(tokenId);
    } catch (error) {
      console.error('Error fetching IP NFT data:', error);
      throw error;
    }
  }

  async updateLicenseTerms(tokenId: bigint, newTerms: LicenseTerms) {
    try {
      return await this.origin.updateTerms(tokenId, newTerms);
    } catch (error) {
      console.error('Error updating license terms:', error);
      throw error;
    }
  }

  // Marketplace Operations
  async buyAccess(tokenId: bigint, periods: number, paymentAmount?: bigint) {
    try {
      if (paymentAmount) {
        return await this.origin.buyAccess(tokenId, periods, paymentAmount);
      } else {
        return await this.origin.buyAccessSmart(tokenId, periods);
      }
    } catch (error) {
      console.error('Error buying access:', error);
      throw error;
    }
  }

  async checkAccess(tokenId: bigint, userAddress: Address): Promise<boolean> {
    try {
      return await this.origin.hasAccess(tokenId, userAddress);
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  }

  async getSubscriptionExpiry(tokenId: bigint, userAddress: Address): Promise<bigint> {
    try {
      return await this.origin.subscriptionExpiry(tokenId, userAddress);
    } catch (error) {
      console.error('Error getting subscription expiry:', error);
      return 0n;
    }
  }

  // Auction Operations (Custom implementation)
  async createAuction(params: AuctionParams) {
    try {
      // This would call your custom auction contract
      const auctionData = {
        tokenId: params.tokenId.toString(),
        startingPrice: formatEther(params.startingPrice),
        endTime: params.endTime.toString(),
        minIncrement: formatEther(params.minIncrement),
        auctionType: params.auctionType,
        reservePrice: params.reservePrice ? formatEther(params.reservePrice) : undefined
      };
      
      console.log('Creating auction:', auctionData);
      
      // Simulate auction creation
      return {
        auctionId: `auction_${Date.now()}`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        ...auctionData
      };
    } catch (error) {
      console.error('Error creating auction:', error);
      throw error;
    }
  }

  async placeBid(auctionId: string, bidAmount: bigint) {
    try {
      console.log('Placing bid:', { auctionId, bidAmount: formatEther(bidAmount) });
      
      // Simulate bid placement
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        bidAmount: formatEther(bidAmount),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error placing bid:', error);
      throw error;
    }
  }

  async finalizeAuction(auctionId: string) {
    try {
      console.log('Finalizing auction:', auctionId);
      
      // Simulate auction finalization
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        winner: `0x${Math.random().toString(16).substring(2, 42)}`,
        finalPrice: formatEther(parseEther('5.2'))
      };
    } catch (error) {
      console.error('Error finalizing auction:', error);
      throw error;
    }
  }

  // Lottery Operations (Custom implementation)
  async createLottery(params: LotteryParams) {
    try {
      const lotteryData = {
        ticketPrice: formatEther(params.ticketPrice),
        totalTickets: params.totalTickets,
        endTime: params.endTime.toString(),
        prizes: params.prizes
      };
      
      console.log('Creating lottery:', lotteryData);
      
      // Simulate lottery creation
      return {
        lotteryId: `lottery_${Date.now()}`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        ...lotteryData
      };
    } catch (error) {
      console.error('Error creating lottery:', error);
      throw error;
    }
  }

  async buyLotteryTickets(lotteryId: string, quantity: number, totalCost: bigint) {
    try {
      console.log('Buying lottery tickets:', { 
        lotteryId, 
        quantity, 
        totalCost: formatEther(totalCost) 
      });
      
      // Simulate ticket purchase
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        ticketNumbers: Array.from({ length: quantity }, () => 
          Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
        )
      };
    } catch (error) {
      console.error('Error buying lottery tickets:', error);
      throw error;
    }
  }

  async drawLottery(lotteryId: string) {
    try {
      console.log('Drawing lottery:', lotteryId);
      
      // Simulate lottery draw
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        winningNumbers: ['123456', '789012', '345678'],
        winners: [
          `0x${Math.random().toString(16).substring(2, 42)}`,
          `0x${Math.random().toString(16).substring(2, 42)}`,
          `0x${Math.random().toString(16).substring(2, 42)}`
        ]
      };
    } catch (error) {
      console.error('Error drawing lottery:', error);
      throw error;
    }
  }

  // Dispute Operations
  async raiseDispute(tokenId: bigint, evidence: string, bond: bigint) {
    try {
      console.log('Raising dispute:', { 
        tokenId: tokenId.toString(), 
        evidence, 
        bond: formatEther(bond) 
      });
      
      // This would call the dispute module contract
      return {
        success: true,
        disputeId: `dispute_${Date.now()}`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
      };
    } catch (error) {
      console.error('Error raising dispute:', error);
      throw error;
    }
  }

  async assertDispute(disputeId: string, counterEvidence: string) {
    try {
      console.log('Asserting dispute:', { disputeId, counterEvidence });
      
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`
      };
    } catch (error) {
      console.error('Error asserting dispute:', error);
      throw error;
    }
  }

  // Royalty Operations
  async claimRoyalties(vaultAddress: Address) {
    try {
      console.log('Claiming royalties from vault:', vaultAddress);
      
      return {
        success: true,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        claimedAmount: formatEther(parseEther('2.5'))
      };
    } catch (error) {
      console.error('Error claiming royalties:', error);
      throw error;
    }
  }

  // Utility functions
  formatPrice(priceInWei: bigint): string {
    return formatEther(priceInWei);
  }

  parsePrice(priceInEth: string): bigint {
    return parseEther(priceInEth);
  }

  calculateRoyalty(salePrice: bigint, royaltyBps: number): bigint {
    return (salePrice * BigInt(royaltyBps)) / 10000n;
  }

  // Social minting integration
  async mintFromSocial(platform: 'spotify' | 'twitter' | 'tiktok', license: LicenseTerms) {
    try {
      return await this.origin.mintSocial(platform, license);
    } catch (error) {
      console.error('Error minting from social:', error);
      throw error;
    }
  }
}

// Hook for using contracts
export function useCoreCampContracts(origin: any) {
  return new CoreCampContracts(origin);
}

// Price formatting utilities
export const formatCurrency = (amount: string | number, currency = 'CAMP') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${num.toLocaleString(undefined, { 
    minimumFractionDigits: 3, 
    maximumFractionDigits: 3 
  })} ${currency}`;
};

export const formatTimeRemaining = (endTime: Date | number): string => {
  const now = new Date().getTime();
  const end = typeof endTime === 'number' ? endTime : endTime.getTime();
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default CoreCampContracts;
