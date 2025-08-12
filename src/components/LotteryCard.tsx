import { useState, useEffect } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import type { Address } from 'viem';
import { 
  useLotteryDetails, 
  useLotteryPlayers,
  contractInteractions,
  useTransactionStatus 
} from '../lib/hooks';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { formatTimeRemaining } from '../lib/contracts';

interface LotteryCardProps {
  lotteryId: bigint;
  tokenId?: bigint; // Optional if you need to show which NFT is being lotteried
}

// Type for lottery data
type LotteryData = {
  owner: Address;
  ticketPrice: bigint;
  maxTickets: bigint;
  isActive: boolean;
  ticketsSold: bigint;
  endTime: bigint;
  winner: Address;
  isDrawn: boolean;
} | undefined;

export function LotteryCard({ lotteryId, tokenId }: LotteryCardProps) {
  const { address } = useAccount();
  const [ticketPrice, setTicketPrice] = useState('0.1');
  const [maxTickets, setMaxTickets] = useState('100');
  const [duration, setDuration] = useState('24'); // hours

  // Read contract data
  const { data: lotteryResult, refetch: refetchLottery } = useLotteryDetails(lotteryId);
  const { data: playersResult } = useLotteryPlayers(lotteryId);

  // Cast data to proper types
  const lottery = lotteryResult as LotteryData;
  const players = playersResult as Address[] | undefined;

  // Contract write hooks
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  // Transaction status
  const { isSuccess, isError } = useTransactionStatus(txHash);

  const isOwner = lottery?.owner === address;
  const isActive = lottery?.isActive || false;
  const hasEnded = lottery ? Number(lottery.endTime) * 1000 < Date.now() : false;
  const canDraw = lottery && !lottery.isDrawn && (hasEnded || lottery.ticketsSold >= lottery.maxTickets);

  // Format values for display
  const ticketPriceFormatted = lottery ? formatEther(lottery.ticketPrice) : '0';
  const endTimeMs = lottery ? Number(lottery.endTime) * 1000 : 0;
  const timeRemainingFormatted = endTimeMs > Date.now() 
    ? formatTimeRemaining(new Date(endTimeMs)) 
    : 'Ended';

  // Calculate progress
  const ticketsSold = lottery ? Number(lottery.ticketsSold) : 0;
  const totalTickets = lottery ? Number(lottery.maxTickets) : 0;
  const progressPercentage = totalTickets > 0 ? (ticketsSold / totalTickets) * 100 : 0;

  // Start lottery (requires tokenId)
  const handleStartLottery = async () => {
    if (!tokenId || !ticketPrice || !maxTickets || !duration) return;
    
    try {
      const priceInWei = parseEther(ticketPrice);
      const maxTicketsBigInt = BigInt(maxTickets);
      const durationInSeconds = BigInt(parseInt(duration) * 3600); // Convert hours to seconds
      
      await writeContract(contractInteractions.startLottery(
        tokenId, 
        priceInWei, 
        maxTicketsBigInt, 
        durationInSeconds
      ));
    } catch (error) {
      console.error('Error starting lottery:', error);
    }
  };

  // Buy ticket
  const handleBuyTicket = async () => {
    if (!lottery || !address) return;
    
    try {
      await writeContract(contractInteractions.buyTicket(lotteryId, lottery.ticketPrice));
    } catch (error) {
      console.error('Error buying ticket:', error);
    }
  };

  // Draw lottery (owner only)
  const handleDrawLottery = async () => {
    try {
      await writeContract({
        address: '0xfbF4e5DE27ccFDCD84d83093FCDAEFeE8004BCEB' as Address,
        abi: [{
          inputs: [{ internalType: "uint256", name: "lotteryId", type: "uint256" }],
          name: "drawLottery",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function"
        }],
        functionName: 'drawLottery',
        args: [lotteryId],
      });
    } catch (error) {
      console.error('Error drawing lottery:', error);
    }
  };

  // Check if user has already bought a ticket
  const userHasTicket = players && address ? players.includes(address) : false;

  // Refresh data when transaction is successful
  useEffect(() => {
    if (isSuccess) {
      refetchLottery();
    }
  }, [isSuccess, refetchLottery]);

  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold mb-4">
        Lottery #{lotteryId.toString()}
        {tokenId && ` - NFT #${tokenId.toString()}`}
      </h3>
      
      {/* No lottery exists - show creation form */}
      {!lottery && tokenId && (
        <div className="space-y-4">
          <h4 className="font-semibold">Start New Lottery</h4>
          <p className="text-sm text-gray-600">
            Let people compete for your NFT! Set the ticket price and limits.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ticket Price (CAMP)</label>
              <Input
                type="number"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                step="0.01"
                min="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Max Tickets</label>
              <Input
                type="number"
                value={maxTickets}
                onChange={(e) => setMaxTickets(e.target.value)}
                min="1"
                max="10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (Hours)</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="168" // 1 week max
              />
            </div>
          </div>

          <Button
            onClick={handleStartLottery}
            disabled={isPending || !ticketPrice || !maxTickets || !duration}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? 'Starting Lottery...' : 'Start Lottery'}
          </Button>
        </div>
      )}

      {/* Active lottery */}
      {lottery && isActive && (
        <div className="space-y-4">
          {/* Lottery info header */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold">Ticket Price</p>
                <p className="text-2xl font-bold">{ticketPriceFormatted} CAMP</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Time Remaining</p>
                <p className={`text-lg ${hasEnded ? 'text-red-600' : 'text-green-600'}`}>
                  {timeRemainingFormatted}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Tickets Sold</span>
                <span>{ticketsSold} / {totalTickets}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Owner: {lottery.owner.slice(0, 6)}...{lottery.owner.slice(-4)}
            </p>
          </div>

          {/* Buy ticket section */}
          {!hasEnded && !userHasTicket && !isOwner && ticketsSold < totalTickets && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Get Your Lucky Ticket! 🎫</h4>
              <p className="text-sm text-gray-600 mb-3">
                Buy a ticket for {ticketPriceFormatted} CAMP and you could win this NFT!
              </p>
              <Button
                onClick={handleBuyTicket}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPending ? 'Buying Ticket...' : `Buy Ticket (${ticketPriceFormatted} CAMP)`}
              </Button>
            </div>
          )}

          {/* User has ticket */}
          {userHasTicket && (
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-medium">🎉 You have a ticket!</p>
              <p className="text-sm text-green-700">Good luck! The winner will be announced soon.</p>
            </div>
          )}

          {/* Lottery ended - ready to draw */}
          {canDraw && isOwner && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold mb-2">Ready to Draw Winner!</h4>
              <p className="text-sm text-gray-600 mb-3">
                {ticketsSold} ticket{ticketsSold !== 1 ? 's' : ''} sold. Time to pick a winner!
              </p>
              <Button
                onClick={handleDrawLottery}
                disabled={isPending}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isPending ? 'Drawing Winner...' : 'Draw Winner'}
              </Button>
            </div>
          )}

          {/* Lottery completed */}
          {lottery.isDrawn && (
            <div className="p-4 bg-green-100 rounded-lg">
              <h4 className="font-bold text-green-800 mb-2">🎊 Lottery Complete!</h4>
              {lottery.winner !== '0x0000000000000000000000000000000000000000' ? (
                <div>
                  <p className="text-green-700">
                    Winner: {lottery.winner.slice(0, 6)}...{lottery.winner.slice(-4)}
                  </p>
                  {address === lottery.winner && (
                    <p className="text-green-800 font-bold">🎉 Congratulations! You won!</p>
                  )}
                </div>
              ) : (
                <p className="text-green-700">No winner (no tickets sold)</p>
              )}
            </div>
          )}

          {/* Players list */}
          {players && players.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Players ({players.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 text-sm">
                {players.slice(0, 12).map((player, index) => (
                  <div key={index} className={`p-1 rounded ${player === address ? 'bg-blue-100' : ''}`}>
                    {player.slice(0, 6)}...{player.slice(-4)}
                    {player === address && ' (You)'}
                  </div>
                ))}
                {players.length > 12 && (
                  <div className="p-1 text-gray-500">
                    +{players.length - 12} more...
                  </div>
                )}
              </div>
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
