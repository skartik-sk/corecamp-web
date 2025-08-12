import React, { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import type { Address } from 'viem';
import { 
  useAuctionDetails, 
  useNFTOwner,
  useTimeRemaining,
  contractInteractions,
  useTransactionStatus 
} from '../lib/hooks';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { formatTimeRemaining } from '../lib/contracts';

interface AuctionCardProps {
  tokenId: bigint;
}

// Type for auction data
type AuctionData = {
  seller: Address;
  startingBid: bigint;
  endTime: bigint;
  highestBidder: Address;
  highestBid: bigint;
  isActive: boolean;
  createdAt: bigint;
} | undefined;

export function AuctionCard({ tokenId }: AuctionCardProps) {
  const { address } = useAccount();
  const [bidAmount, setBidAmount] = useState('');
  const [duration, setDuration] = useState('24'); // hours

  // Read contract data
  const { data: auctionResult, refetch: refetchAuction } = useAuctionDetails(tokenId);
  const { data: owner } = useNFTOwner(tokenId);
  const { data: timeRemaining } = useTimeRemaining(tokenId);

  // Cast auction data
  const auction = auctionResult as AuctionData;

  // Contract write hooks
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  // Transaction status
  const { isSuccess, isError } = useTransactionStatus(txHash);

  const isOwner = owner === address;
  const isAuctionActive = auction && auction.isActive;
  const hasEnded = timeRemaining !== undefined && timeRemaining === 0n;

  // Format values for display
  const highestBidFormatted = auction ? formatEther(auction.highestBid) : '0';
  const startingBidFormatted = auction ? formatEther(auction.startingBid) : '0';
  
  // Calculate end time for countdown
  const endTimeMs = auction ? Number(auction.endTime) * 1000 : 0;
  const timeRemainingFormatted = endTimeMs > Date.now() 
    ? formatTimeRemaining(new Date(endTimeMs)) 
    : 'Ended';

  // Create auction
  const handleCreateAuction = async () => {
    if (!address || !duration) return;
    
    try {
      const durationInSeconds = BigInt(parseInt(duration) * 3600); // Convert hours to seconds
      const startingBid = parseEther('0.1'); // Default starting bid
      
      await writeContract(contractInteractions.createAuction(tokenId, startingBid, durationInSeconds));
    } catch (error) {
      console.error('Error creating auction:', error);
    }
  };

  // Place bid
  const handlePlaceBid = async () => {
    if (!bidAmount || !address || !auction) return;
    
    try {
      const bidInWei = parseEther(bidAmount);
      await writeContract(contractInteractions.placeBid(tokenId, bidInWei));
      setBidAmount(''); // Clear bid amount after placing
    } catch (error) {
      console.error('Error placing bid:', error);
    }
  };

  // End auction
  const handleEndAuction = async () => {
    try {
      await writeContract(contractInteractions.endAuction(tokenId));
    } catch (error) {
      console.error('Error ending auction:', error);
    }
  };

  // Refresh data when transaction is successful
  useEffect(() => {
    if (isSuccess) {
      refetchAuction();
    }
  }, [isSuccess, refetchAuction]);

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">Auction - IP NFT #{tokenId.toString()}</h3>
      
      {/* Owner info */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">Owner: {owner}</p>
        {isOwner && <span className="text-green-500 text-sm">You own this NFT</span>}
      </div>

      {/* No auction exists */}
      {!isAuctionActive && isOwner && (
        <div className="space-y-4">
          <h4 className="font-semibold">Start Auction</h4>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Duration (hours)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              max="168" // 1 week max
            />
          </div>
          <Button
            onClick={handleCreateAuction}
            disabled={isPending || !duration}
          >
            {isPending ? 'Creating...' : 'Start Auction'}
          </Button>
        </div>
      )}

      {/* Active auction */}
      {isAuctionActive && auction && (
        <div className="space-y-4">
          {/* Auction info */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">Current Highest Bid</p>
                <p className="text-2xl font-bold">{highestBidFormatted} CAMP</p>
                {auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                  <p className="text-sm text-gray-600">
                    by {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">Time Remaining</p>
                <p className={`text-lg ${hasEnded ? 'text-red-600' : 'text-green-600'}`}>
                  {timeRemainingFormatted}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Starting bid: {startingBidFormatted} CAMP
            </p>
          </div>

          {/* Bidding section */}
          {!hasEnded && !isOwner && (
            <div>
              <h4 className="font-semibold mb-2">Place Your Bid</h4>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Bid amount in CAMP"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  step="0.01"
                  min={formatEther(auction.highestBid > 0n ? auction.highestBid + parseEther('0.01') : auction.startingBid)}
                />
                <Button
                  onClick={handlePlaceBid}
                  disabled={!bidAmount || isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isPending ? 'Bidding...' : 'Place Bid'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Minimum bid: {formatEther(auction.highestBid > 0n ? auction.highestBid + parseEther('0.01') : auction.startingBid)} CAMP
              </p>
            </div>
          )}

          {/* End auction */}
          {hasEnded && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="font-semibold mb-2">Auction Ended</p>
              {auction.highestBidder !== '0x0000000000000000000000000000000000000000' ? (
                <>
                  <p>Winner: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}</p>
                  <p>Winning bid: {highestBidFormatted} CAMP</p>
                </>
              ) : (
                <p>No bids were placed</p>
              )}
              <Button
                onClick={handleEndAuction}
                disabled={isPending}
                className="mt-2"
              >
                {isPending ? 'Finalizing...' : 'Finalize Auction'}
              </Button>
            </div>
          )}

          {/* Current user status */}
          {address === auction.highestBidder && !hasEnded && (
            <div className="p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">🎉 You are the highest bidder!</p>
            </div>
          )}
        </div>
      )}

      {/* Transaction status */}
      {isPending && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-sm">Transaction pending...</p>
          {txHash && (
            <p className="text-xs font-mono break-all">Hash: {txHash}</p>
          )}
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-800">Transaction successful!</p>
        </div>
      )}

      {isError && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <p className="text-sm text-red-800">Transaction failed. Please try again.</p>
        </div>
      )}
    </Card>
  );
}
