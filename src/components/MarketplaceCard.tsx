import React, { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import type { Address } from 'viem';
import { 
  useMarketplaceListing, 
  useNFTOwner, 
  contractInteractions,
  useTransactionStatus 
} from '../lib/hooks';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface MarketplaceCardProps {
  tokenId: bigint;
}

// Type for marketplace listing data
type ListingData = {
  seller: Address;
  price: bigint;
  isActive: boolean;
} | undefined;

export function MarketplaceCard({ tokenId }: MarketplaceCardProps) {
  const { address } = useAccount();
  const [listingPrice, setListingPrice] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Read contract data
  const { data: listingResult, refetch: refetchListing } = useMarketplaceListing(tokenId);
  const { data: owner } = useNFTOwner(tokenId);

  // Cast listing data to proper type
  const listing = listingResult as ListingData;

  // Contract write hooks
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  // Transaction status
  const { isSuccess, isError } = useTransactionStatus(txHash);

  const isOwner = owner === address;
  const isListed = listing && listing.isActive;
  const listingPriceFormatted = listing ? formatEther(listing.price) : '0';

  // Step 1: Approve NFT for marketplace
  const handleApprove = async () => {
    if (!address) return;
    
    try {
      setIsApproving(true);
      await writeContract(contractInteractions.approveNFT(
        '0x4A790778B73b3028e7EdAf967a5a5EB92B3e395b' as Address, // Marketplace address
        tokenId
      ));
    } catch (error) {
      console.error('Error approving NFT:', error);
    } finally {
      setIsApproving(false);
    }
  };

  // Step 2: List NFT
  const handleList = async () => {
    if (!listingPrice || !address) return;
    
    try {
      const priceInWei = parseEther(listingPrice);
      await writeContract(contractInteractions.listNFT(tokenId, priceInWei));
    } catch (error) {
      console.error('Error listing NFT:', error);
    }
  };

  // Buy NFT
  const handleBuy = async () => {
    if (!listing || !address) return;
    
    try {
      await writeContract(contractInteractions.buyNFT(tokenId, listing.price));
    } catch (error) {
      console.error('Error buying NFT:', error);
    }
  };

  // Cancel listing
  const handleCancel = async () => {
    try {
      await writeContract(contractInteractions.cancelListing(tokenId));
    } catch (error) {
      console.error('Error cancelling listing:', error);
    }
  };

  // Refresh data when transaction is successful
  React.useEffect(() => {
    if (isSuccess) {
      refetchListing();
    }
  }, [isSuccess, refetchListing]);

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">IP NFT #{tokenId.toString()}</h3>
      
      {/* Owner info */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">Owner: {owner}</p>
        {isOwner && <span className="text-green-500 text-sm">You own this NFT</span>}
      </div>

      {/* Listing info */}
      {isListed && listing && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">Listed for Sale</p>
          <p className="text-2xl font-bold">{listingPriceFormatted} CAMP</p>
          <p className="text-sm text-gray-600">Seller: {listing.seller}</p>
        </div>
      )}

      {/* Actions based on ownership and listing status */}
      <div className="space-y-4">
        {isOwner && !isListed && (
          <div>
            <h4 className="font-semibold mb-2">List for Sale</h4>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Price in CAMP"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                step="0.01"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleApprove}
                disabled={isApproving || isPending}
                variant="outline"
              >
                {isApproving ? 'Approving...' : '1. Approve NFT'}
              </Button>
              <Button
                onClick={handleList}
                disabled={!listingPrice || isPending}
              >
                {isPending ? 'Listing...' : '2. List NFT'}
              </Button>
            </div>
          </div>
        )}

        {isOwner && isListed && (
          <Button
            onClick={handleCancel}
            disabled={isPending}
            variant="destructive"
          >
            {isPending ? 'Cancelling...' : 'Cancel Listing'}
          </Button>
        )}

        {!isOwner && isListed && listing && (
          <Button
            onClick={handleBuy}
            disabled={isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isPending ? 'Buying...' : `Buy for ${listingPriceFormatted} CAMP`}
          </Button>
        )}
      </div>

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
