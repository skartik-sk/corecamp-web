import { useState, useEffect } from 'react';
import { useAuthState } from '@campnetwork/origin/react';
import { formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock,
  Trophy,
  Eye,
  Heart,
  DollarSign,
  Users,
  Gavel,
  Target,
  Star,
  Timer
} from 'lucide-react';
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration';
import { formatAddress } from '@/lib/utils';


interface Auction {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  minimumBid: number;
  endTime: Date;
  bidCount: number;
  views: number;
  likes: number;
  category: string;
  creator: string;
  featured?: boolean;
  tokenId?: string;
  seller?: string;
  highestBidder?: string;
  isActive?: boolean;
  animation_url?: string;
  audio?: string;
}



export default function Auctions() {
  const { authenticated } = useAuthState();
  const { useAllActiveAuctions, getDataByTokenId, placeBid, error, success, clearError, clearSuccess, loading } = useCampfireIntegration();
  
  // Get real auction data from contract
  const { data: contractAuctions, isLoading: auctionsLoading, error: auctionsError } = useAllActiveAuctions();
  
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filter, setFilter] = useState<'all' | 'ending-soon' | 'featured'>('all');
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<Record<string, string>>({});
  // Success notification state
  // (success and error come from useCampfireIntegration)

  // Transform contract auction data to UI format
  useEffect(() => {
    const transformContractData = async () => {
      if (contractAuctions && Array.isArray(contractAuctions) && contractAuctions.length > 0) {
        console.log('Contract auctions:', contractAuctions);
        
        const transformedAuctions = await Promise.all(
          contractAuctions.map(async (auction: any, index: number) => {
            console.log(auction)
            let nftData = null;
            let res
            try {
              // Get NFT metadata from Origin SDK
              if (auction.tokenId) {

                 res = await getDataByTokenId(auction.tokenId.toString(), auction.seller);
               nftData = res?.metadata || {}
              }
            } catch (err) {
              console.error('Error fetching NFT data for token:', auction.tokenId, err);
            } 
           

            return {
              id: auction.tokenId?.toString() || index.toString(),
              title: nftData?.name || `Auction #${auction.tokenId || index}`,
              description: nftData?.description || 'Intellectual property asset up for auction',
              imageUrl: nftData?.image || `https://picsum.photos/400/300?random=${index}`,
              currentBid: parseFloat(formatEther(auction.highestBid || BigInt(0))),
              minimumBid: parseFloat(formatEther(auction.startingBid || BigInt(0))),
              endTime: new Date(Number(auction.endTime || 0) * 1000),
              bidCount: Math.floor(Math.random() * 50) + 1, // This would need to be tracked separately
              views: Math.floor(Math.random() * 1000) + 100,
              likes: Math.floor(Math.random() * 100) + 10,
              category: nftData?.category || 'Digital Asset',
              creator: formatAddress(auction.seller || '0x0000000000000000000000000000000000000000'),
              featured: Math.random() > 0.7,
              tokenId: auction.tokenId?.toString(),
              seller: auction.seller,
              highestBidder: auction.highestBidder,
              isActive: auction.isActive,
              animation_url: nftData?.animation_url,
              audio: nftData?.audio
            }
          })
        );

        setAuctions(transformedAuctions.filter(auction => auction.isActive));
      } else if (auctionsError) {
        console.error('Auctions error:', auctionsError);
        console.log('Using mock auction data');
      }
    };

    if (!auctionsLoading) {
      transformContractData();
    }
  }, [contractAuctions, auctionsLoading, auctionsError]);

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: Record<string, string> = {};
      auctions.forEach(auction => {
        const timeLeft = auction.endTime.getTime() - Date.now();
        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          
          if (days > 0) {
            newCountdowns[auction.id] = `${days}d ${hours}h ${minutes}m`;
          } else if (hours > 0) {
            newCountdowns[auction.id] = `${hours}h ${minutes}m ${seconds}s`;
          } else {
            newCountdowns[auction.id] = `${minutes}m ${seconds}s`;
          }
        } else {
          newCountdowns[auction.id] = 'Ended';
        }
      });
      setCountdown(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [auctions]);

  const filteredAuctions = auctions.filter(auction => {
    if (filter === 'featured') return auction.featured;
    if (filter === 'ending-soon') {
      const timeLeft = auction.endTime.getTime() - Date.now();
      return timeLeft < 24 * 60 * 60 * 1000; // Less than 24 hours
    }
    return true;
  });

  const handlePlaceBid = async (auctionId: string, amount: string) => {
    if (!authenticated) {
      alert('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    const auction = auctions.find(a => a.id === auctionId);
    if (!auction) return;

    if (parseFloat(amount) <= auction.currentBid) {
      alert('Bid must be higher than current bid');
      return;
    }

    try {
      if (auction.tokenId) {
       const res =  await placeBid(BigInt(auction.tokenId), amount);
       

        // The UI will update automatically when the contract data refreshes
      }
    } catch (err) {
      console.error('Error placing bid:', err);
      alert('Failed to place bid. Please try again.');
    }
  };

  const featuredAuctions = auctions.filter(a => a.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-camp-light/30 via-white to-cool-3/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success/Error Notification */}
        
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-camp-dark mb-4">
              Live <span className="text-gradient">Auctions</span>
            </h1>
            <p className="text-xl text-cool-1 max-w-2xl mx-auto">
              Bid on exclusive intellectual property and secure valuable assets for your projects.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">{auctions.length}</div>
              <div className="text-cool-1">Live Auctions</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">
                {auctions.reduce((total, auction) => total + auction.currentBid, 0).toFixed(1)}
              </div>
              <div className="text-cool-1">ETH Total Volume</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">
                {auctions.reduce((total, auction) => total + auction.bidCount, 0)}
              </div>
              <div className="text-cool-1">Total Bids</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">
                {auctions.filter(a => a.endTime.getTime() - Date.now() < 24 * 60 * 60 * 1000).length}
              </div>
              <div className="text-cool-1">Ending Soon</div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="glass-effect rounded-2xl p-6 mb-8 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              {[
                { key: 'all', label: 'All Auctions', count: auctions.length },
                { key: 'featured', label: 'Featured', count: featuredAuctions.length },
                { key: 'ending-soon', label: 'Ending Soon', count: auctions.filter(a => a.endTime.getTime() - Date.now() < 24 * 60 * 60 * 1000).length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    filter === key
                      ? 'gradient-bg text-white shadow-lg'
                      : 'bg-white/30 text-cool-1 hover:bg-white/50'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {(auctionsLoading || loading) && (
          <motion.div 
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Gavel className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-camp-dark mb-3">Loading Auctions...</h3>
            <p className="text-cool-1">Fetching live auction data from the blockchain</p>
          </motion.div>
        )}

        {/* Error State */}
        {auctionsError && !auctionsLoading && (
          <motion.div 
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 bg-warm-1/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-warm-1" />
            </div>
            <h3 className="text-2xl font-semibold text-warm-1 mb-3">Demo Mode Active</h3>
            <p className="text-cool-1 mb-4">Showing sample data - Smart contracts not available</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </motion.div>
        )}

        {/* Auctions Grid */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-4 rounded-xl border-2 ${
                error 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {error ? (
                    <Target className="w-4 h-4 mr-2" />
                  ) : (
                    <Trophy className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">{error || success}</span>
                </div>
                <button
                  onClick={() => {
                    clearError();
                    clearSuccess();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Timer className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!auctionsLoading && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence>
              {filteredAuctions.map((auction, index) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  countdown={countdown[auction.id] || ''}
                  bidAmount={bidAmounts[auction.id] || ''}
                  onBidAmountChange={(amount) => 
                    setBidAmounts(prev => ({ ...prev, [auction.id]: amount }))
                  }
                  onPlaceBid={(amount) => handlePlaceBid(auction.id, amount)}
                  index={index}
                  error={error ?? undefined}
                  success={success ?? undefined}
                  clearError={clearError}
                  clearSuccess={clearSuccess}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!auctionsLoading && filteredAuctions.length === 0 && (
          <motion.div 
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 bg-cool-3/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gavel className="w-10 h-10 text-cool-2" />
            </div>
            <h3 className="text-2xl font-semibold text-camp-dark mb-3">No Auctions Found</h3>
            <p className="text-cool-1">Try adjusting your filters to discover amazing auctions</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface AuctionCardProps {
  auction: Auction;
  countdown: string;
  bidAmount: string;
  onBidAmountChange: (amount: string) => void;
  onPlaceBid: (amount: string) => void;
  index: number;
  error?: string;
  success?: string;
  clearError?: () => void;
  clearSuccess?: () => void;
}

function AuctionCard({ auction, countdown, bidAmount, onBidAmountChange, onPlaceBid, index, error,success,clearError,clearSuccess }: AuctionCardProps) {
  const { authenticated } = useAuthState();
  const isEndingSoon = auction.endTime.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const hasEnded = countdown === 'Ended';

  return (
    <motion.div
      className="glass-effect rounded-3xl overflow-hidden hover-lift border border-white/20 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative">
        {auction.animation_url ? (
          <video
        src={auction.animation_url}
        muted
        autoPlay={true}
        controls
        className="w-full h-48 object-cover rounded-xl"
        poster={auction.imageUrl}
          />
        ) : auction.audio ? (
          // Show audio if ip.audio_url exists
          <div className="w-full h-48 flex items-center justify-center bg-camp-light/30 rounded-xl">
        <audio controls muted src={auction.audio} className="w-full" />
        <span className="absolute top-2 left-2 px-2 py-1 bg-camp-orange/80 text-white rounded text-xs">Audio</span>
          </div>
        ) : (
          // Fallback to image
          <img
        src={auction.imageUrl}
        className="w-full h-48 object-cover rounded-xl"
          />
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-camp-dark/60 via-transparent to-transparent" />
        
        {auction.featured && (
          <div className="absolute top-4 left-4 w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
        )}

        {isEndingSoon && !hasEnded && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium animate-pulse">
            Ending Soon!
          </div>
        )}

        {hasEnded && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-medium">
            Ended
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{auction.views}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{auction.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Gavel className="w-4 h-4" />
                <span>{auction.bidCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-camp-dark mb-2 group-hover:text-camp-orange transition-colors">
            {auction.title}
          </h3>
          <p className="text-cool-1 text-sm mb-2">by {auction.creator}</p>
          <p className="text-cool-1 text-sm line-clamp-2">{auction.description}</p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-cool-1">Current Bid</span>
            <span className="text-sm text-cool-1">Min Bid: {auction.minimumBid} ETH</span>
          </div>
          <div className="text-2xl font-bold text-camp-dark">
            {auction.currentBid} ETH
          </div>
        </div>

        <div className="mb-4 p-3 bg-camp-orange/10 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-camp-orange">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Time Left</span>
            </div>
            <div className="text-camp-orange font-semibold">
              {countdown}
            </div>
          </div>
        </div>

        {!hasEnded && (
            <div className="space-y-3">
            <input
              type="number"
              // Minimum bid is currentBid + 5%
              placeholder={`Min: ${(auction.currentBid * 1.05).toFixed(3)} ETH`}
              value={bidAmount}
              onChange={(e) => onBidAmountChange(e.target.value)}
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange bg-white/50 backdrop-blur-sm"
              step="0.001"
              min={auction.currentBid * 1.05}
            />
            
            <button
              onClick={() => onPlaceBid(bidAmount)}
              disabled={
              !authenticated ||
              !bidAmount ||
              parseFloat(bidAmount) < auction.currentBid * 1.05
              }
              className="w-full px-6 py-3 gradient-bg text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!authenticated ? 'Connect Wallet' : 'Place Bid'}
            </button>
            </div>
        )}

        {hasEnded && auction.highestBidder && (
          <>
          <div className="p-3 bg-green-100 rounded-xl text-center my-2">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Auction Ended</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Won by {formatAddress(auction.highestBidder)}
            </p>

          </div>
         {auction.isActive &&
         (

           <div className="space-y-3">
                  <div className="text-center">
                    <DrawWinnerButton lotteryId={auction.id} authenticated={authenticated} />
                  </div>
                </div>
              
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}



// DrawWinnerButton component

function DrawWinnerButton({ lotteryId, authenticated }: { lotteryId: string, authenticated: boolean }) {
  const { endAuction, loading } = useCampfireIntegration();
  const [pending, setPending] = useState(false);

  const handleDraw = async () => {
    setPending(true);
    try {
      await endAuction(BigInt(lotteryId));
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleDraw}
      disabled={!authenticated || loading || pending}
      className="w-full px-6 py-3 bg-camp-orange text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {!authenticated ? 'Connect Wallet' : (pending || loading ? 'Drawing Winner...' : 'Distribute Winnings')}
    </button>
  );
}
