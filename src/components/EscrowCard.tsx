import { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import type { Address } from 'viem';
import { 
  useEscrowDeal, 
  useNFTOwner,
  contractInteractions,
  useTransactionStatus 
} from '../lib/hooks';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface EscrowCardProps {
  tokenId: bigint;
}

// Deal status constants
const DealStatus = {
  Created: 0,
  Funded: 1,
  Confirmed: 2,
  Cancelled: 3,
} as const;

type DealStatusType = typeof DealStatus[keyof typeof DealStatus];

// Type for escrow deal data
type EscrowDealData = {
  seller: Address;
  buyer: Address;
  price: bigint;
  sellerConfirmed: boolean;
  buyerConfirmed: boolean;
  status: DealStatusType;
  createdAt: bigint;
} | undefined;

export function EscrowCard({ tokenId }: EscrowCardProps) {
  const { address } = useAccount();
  const [buyerAddress, setBuyerAddress] = useState('');
  const [dealPrice, setDealPrice] = useState('');

  // Read contract data
  const { data: dealResult, refetch: refetchDeal } = useEscrowDeal(tokenId);
  const { data: owner } = useNFTOwner(tokenId);

  // Cast deal data
  const deal = dealResult as EscrowDealData;

  // Contract write hooks
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  // Transaction status
  const { isSuccess, isError } = useTransactionStatus(txHash);

  const isOwner = owner === address;
  const isBuyer = deal && deal.buyer === address;
  const isSeller = deal && deal.seller === address;
  const dealExists = deal && deal.status !== DealStatus.Cancelled;

  // Status display helpers
  const getStatusText = (status: DealStatusType) => {
    switch (status) {
      case DealStatus.Created: return 'Created - Awaiting Funds';
      case DealStatus.Funded: return 'Funded - Awaiting Confirmation';
      case DealStatus.Confirmed: return 'Completed';
      case DealStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: DealStatusType) => {
    switch (status) {
      case DealStatus.Created: return 'bg-yellow-100 text-yellow-800';
      case DealStatus.Funded: return 'bg-blue-100 text-blue-800';
      case DealStatus.Confirmed: return 'bg-green-100 text-green-800';
      case DealStatus.Cancelled: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Create deal
  const handleCreateDeal = async () => {
    if (!buyerAddress || !dealPrice || !isAddress(buyerAddress)) return;
    
    try {
      const priceInWei = parseEther(dealPrice);
      await writeContract(contractInteractions.createDeal(
        buyerAddress as Address, 
        tokenId, 
        priceInWei
      ));
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  // Fund deal
  const handleFundDeal = async () => {
    if (!deal) return;
    
    try {
      await writeContract(contractInteractions.fundDeal(tokenId, deal.price));
    } catch (error) {
      console.error('Error funding deal:', error);
    }
  };

  // Confirm transfer
  const handleConfirm = async () => {
    try {
      await writeContract(contractInteractions.confirmTransfer(tokenId));
    } catch (error) {
      console.error('Error confirming transfer:', error);
    }
  };

  // Cancel deal
  const handleCancel = async () => {
    try {
      await writeContract({
        address: '0xD353754B3Acf187e90106877DC8e304Bd5da1474' as Address,
        abi: [{
          inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
          name: "cancelDeal",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: 'cancelDeal',
        args: [tokenId],
      });
    } catch (error) {
      console.error('Error cancelling deal:', error);
    }
  };

  // Refresh data when transaction is successful
  useEffect(() => {
    if (isSuccess) {
      refetchDeal();
    }
  }, [isSuccess, refetchDeal]);

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">P2P Escrow - IP NFT #{tokenId.toString()}</h3>
      
      {/* Owner info */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">Owner: {owner}</p>
        {isOwner && <span className="text-green-500 text-sm">You own this NFT</span>}
      </div>

      {/* No deal exists */}
      {!dealExists && isOwner && (
        <div className="space-y-4">
          <h4 className="font-semibold">Create Escrow Deal</h4>
          <p className="text-sm text-gray-600">
            Set up a secure P2P transaction with a specific buyer
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Buyer Address</label>
              <Input
                type="text"
                placeholder="0x..."
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                className={!isAddress(buyerAddress) && buyerAddress ? 'border-red-300' : ''}
              />
              {buyerAddress && !isAddress(buyerAddress) && (
                <p className="text-red-500 text-xs mt-1">Invalid address</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Price (CAMP)</label>
              <Input
                type="number"
                placeholder="0.00"
                value={dealPrice}
                onChange={(e) => setDealPrice(e.target.value)}
                step="0.01"
              />
            </div>
          </div>

          <Button
            onClick={handleCreateDeal}
            disabled={!buyerAddress || !dealPrice || !isAddress(buyerAddress) || isPending}
          >
            {isPending ? 'Creating Deal...' : 'Create Escrow Deal'}
          </Button>
        </div>
      )}

      {/* Deal exists */}
      {dealExists && deal && (
        <div className="space-y-4">
          {/* Deal info */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">Deal Price</p>
                <p className="text-2xl font-bold">{formatEther(deal.price)} CAMP</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deal.status)}`}>
                  {getStatusText(deal.status)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium">Seller</p>
                <p className="text-sm text-gray-600">
                  {deal.seller.slice(0, 6)}...{deal.seller.slice(-4)}
                </p>
                {deal.sellerConfirmed && <span className="text-green-500 text-xs">✓ Confirmed</span>}
              </div>
              <div>
                <p className="text-sm font-medium">Buyer</p>
                <p className="text-sm text-gray-600">
                  {deal.buyer.slice(0, 6)}...{deal.buyer.slice(-4)}
                </p>
                {deal.buyerConfirmed && <span className="text-green-500 text-xs">✓ Confirmed</span>}
              </div>
            </div>
          </div>

          {/* Actions based on status and user role */}
          <div className="space-y-3">
            {/* Buyer needs to fund */}
            {deal.status === DealStatus.Created && isBuyer && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium mb-2">Action Required: Fund the Deal</p>
                <p className="text-sm text-gray-600 mb-3">
                  Deposit {formatEther(deal.price)} CAMP to the escrow contract
                </p>
                <Button
                  onClick={handleFundDeal}
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isPending ? 'Funding...' : `Fund Deal (${formatEther(deal.price)} CAMP)`}
                </Button>
              </div>
            )}

            {/* Both parties need to confirm */}
            {deal.status === DealStatus.Funded && (isBuyer || isSeller) && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="font-medium mb-2">Final Confirmation Required</p>
                <p className="text-sm text-gray-600 mb-3">
                  Both parties must confirm to complete the transfer
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className={deal.sellerConfirmed ? 'text-green-600' : 'text-gray-400'}>
                    {deal.sellerConfirmed ? '✓' : '○'} Seller
                  </span>
                  <span className={deal.buyerConfirmed ? 'text-green-600' : 'text-gray-400'}>
                    {deal.buyerConfirmed ? '✓' : '○'} Buyer
                  </span>
                </div>

                {((isSeller && !deal.sellerConfirmed) || (isBuyer && !deal.buyerConfirmed)) && (
                  <Button
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isPending ? 'Confirming...' : 'Confirm Transfer'}
                  </Button>
                )}
              </div>
            )}

            {/* Deal completed */}
            {deal.status === DealStatus.Confirmed && (
              <div className="p-3 bg-green-100 rounded-lg">
                <p className="font-medium text-green-800">✅ Deal Completed Successfully!</p>
                <p className="text-sm text-green-700">
                  The NFT has been transferred and funds have been released.
                </p>
              </div>
            )}

            {/* Cancel option */}
            {deal.status === DealStatus.Created && (isBuyer || isSeller) && (
              <Button
                onClick={handleCancel}
                disabled={isPending}
                variant="destructive"
                className="w-full"
              >
                {isPending ? 'Cancelling...' : 'Cancel Deal'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* For non-participants */}
      {dealExists && !isBuyer && !isSeller && deal && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium mb-2">Private Deal in Progress</p>
          <p className="text-sm text-gray-600">
            This NFT is currently in an escrow deal between the seller and a specific buyer.
          </p>
          <p className="text-sm mt-2">
            Status: <span className="font-medium">{getStatusText(deal.status)}</span>
          </p>
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
