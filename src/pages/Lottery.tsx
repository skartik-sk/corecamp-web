import { useState, useEffect } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Users, 
  DollarSign, 
  Dice6, 
  Sparkles,
  Crown,
  Clock,
  Target,
  X,
  Eye,
  Heart,
  Gavel
} from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { formatEther } from 'viem'

interface LotteryRound {
  id: string
  image: string
  name: string
  description: string
  prizePool: string
  ticketPrice: string
  totalTickets: number
  ticketsSold: number
  endTime: Date
  isActive: boolean,
  winner?: string
  participants: number
  featured?: boolean
  creator?: string
  creatorAddress?: string
  winnerAnnounced?: boolean
  userAddress?: string
  animation_url?: string
  audio?: string
}


export default function Lottery() {
  const { authenticated } = useAuthState();
  const { 
    useAllActiveLotteries,
    getDataByTokenId,
    buyLotteryTicket,
    error, 
    success,
    clearError,
    clearSuccess,
    loading 
  } = useCampfireIntegration();
  const auth = useAuth();

  // Get real lottery data from contract
  const { data: contractLotteries, isLoading: lotteriesLoading, error: lotteriesError } = useAllActiveLotteries();
  
  const [lotteries, setLotteries] = useState<LotteryRound[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended' | 'upcoming'>('all');
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<Record<string, string>>({});

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        if (success) clearSuccess();
        if (error) clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearSuccess, clearError]);

  // Transform contract lottery data to UI format
  useEffect(() => {
    const transformContractData = async () => {
      if (contractLotteries && Array.isArray(contractLotteries) && contractLotteries.length > 0) {
        // console.log('Contract lotteries:', contractLotteries);
        
        const transformedLotteries = await Promise.all(
          contractLotteries.map(async (lottery: any, index: number) => {
            let nftData = null;
            let res;
            try {
              // Get NFT metadata from Origin SDK
              if (lottery.tokenId) {
                res = await getDataByTokenId(lottery.tokenId.toString(), lottery.owner);
                nftData = res?.metadata || {};
              }
            } catch (err) {
              console.error('Error fetching NFT data for token:', lottery.tokenId, err);
            }


            return {
              id: lottery.tokenId?.toString() || index.toString(),
              name: nftData?.name || `Smart Lottery #${lottery.id || index}`,
              creatorAddress: lottery.owner,
              description: nftData?.description || 'Blockchain lottery with transparent prize distribution and smart contract security',
              image: nftData?.image || 'https://example.com/default-lottery-image.jpg',
              prizePool: `${parseFloat(nftData.price || BigInt(0)) } CAMP`,
              ticketPrice: `${parseFloat(formatEther(lottery.ticketPrice || BigInt(0))).toFixed(3)} ETH`,
              totalTickets: Number(lottery.maxTickets || 0),
              ticketsSold: Number(lottery.players.length || 0),
              endTime: new Date(Number(lottery.endTime || 0) * 1000),
              status: lottery.isActive ? ('active' as const) : ('ended' as const),
              isActive: lottery.isActive, // Add isActive property
              participants: Math.floor(Math.random() * 100) + 10,
              featured: Math.random() > 0.8,
              creator: formatAddress(lottery.owner || '0x0000000000000000000000000000000000000000'),
              winner: lottery.winner && lottery.winner !== '0x0000000000000000000000000000000000000000' ? lottery.winner : undefined,
              winnerAnnounced: !lottery.active && lottery.winner && lottery.winner !== '0x0000000000000000000000000000000000000000',
              tokenId: lottery.tokenId?.toString(),
              lotteryId: lottery.id?.toString(),
              animation_url: nftData?.animation_url,
              audio: nftData?.audio
            };
          })
        );

        console.log("Transformed Lotteries:", transformedLotteries)
        setLotteries(transformedLotteries.filter(lottery => lottery.isActive ===true).slice(0, 20)); // Limit to 20 active lotteries
      } else if (lotteriesError) {
        console.error('Lotteries error:', lotteriesError);
        console.log('Using mock lottery data');
      }
    };

    if (!lotteriesLoading) {
      transformContractData();
    }
  }, [contractLotteries, lotteriesLoading, lotteriesError]);

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: Record<string, string> = {};
      lotteries.forEach(lottery => {
        if (lottery.isActive === true) {
          const timeLeft = lottery.endTime.getTime() - Date.now();
          if (timeLeft > 0) {
            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            if (days > 0) {
              newCountdowns[lottery.id] = `${days}d ${hours}h ${minutes}m`;
            } else if (hours > 0) {
              newCountdowns[lottery.id] = `${hours}h ${minutes}m ${seconds}s`;
            } else {
              newCountdowns[lottery.id] = `${minutes}m ${seconds}s`;
            }
          } else {
            newCountdowns[lottery.id] = 'Draw time!';
          }
        }
      });
      setCountdown(newCountdowns);
    };
    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [lotteries]);

  const filteredLotteries = lotteries.filter(lottery => {
    if (filter === 'all') return true;
    return lottery.isActive === (filter === 'active');
  });

  const featuredLotteries = lotteries.filter(l => l.featured && l.isActive);

  const buyTickets = async (lotteryId: string, ticketCount: number) => {
    if (!authenticated || ticketCount <= 0) {
      alert('Please connect your wallet and enter valid ticket count');
      return;
    }

    const lottery = lotteries.find(l => l.id === lotteryId);
    if (!lottery) return;

    const totalCost = (parseFloat(lottery.ticketPrice.split(' ')[0]) * ticketCount).toString();

    try {
      await buyLotteryTicket(BigInt(lotteryId), totalCost);
    } catch (err) {
      console.error('Error buying tickets:', err);
      alert('Failed to buy tickets. Please try again.');
    } 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-camp-light/30 via-white to-cool-3/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-camp-dark mb-4">
              Lucky <span className="text-gradient">Lotteries</span>
            </h1>
            <p className="text-xl text-cool-1 max-w-2xl mx-auto">
              Enter transparent blockchain lotteries and win valuable IP assets with provable fairness.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <Dice6 className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">{lotteries.filter(l => l.isActive === true).length}</div>
              <div className="text-cool-1">Active Lotteries</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">
                {lotteries.reduce((total, lottery) => 
                  total + parseFloat(lottery.prizePool.split(' ')[0] || '0'), 0
                ).toFixed(1)}
              </div>
              <div className="text-cool-1">Total Prize Pool</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">
                {lotteries.reduce((total, lottery) => total + lottery.participants, 0)}
              </div>
              <div className="text-cool-1">Total Players</div>
            </div>
            <div className="glass-effect rounded-2xl p-6 text-center border border-white/20">
              <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-camp-dark">
                {lotteries.filter(l => !l.isActive && l.winner).length}
              </div>
              <div className="text-cool-1">Winners Drawn</div>
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
                { key: 'all', label: 'All Lotteries', count: lotteries.length },
                { key: 'active', label: 'Active', count: lotteries.filter(l => l.isActive).length },
                { key: 'ended', label: 'Ended', count: lotteries.filter(l => !l.isActive).length },

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
        {(lotteriesLoading || loading) && (
          <motion.div 
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Dice6 className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-camp-dark mb-3">Loading Lotteries...</h3>
            <p className="text-cool-1">Fetching lottery data from the blockchain</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !lotteriesLoading && (
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
            <p className="text-sm text-red-500">{error}</p>
          </motion.div>
        )}

        {/* Featured Lotteries */}
        {featuredLotteries.length > 0 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-camp-dark mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-camp-orange" />
              Featured Lotteries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredLotteries.slice(0, 2).map((lottery, index) => (
                <LotteryCard
                  key={lottery.id}
                  lottery={lottery}
                  countdown={countdown[lottery.id] || ''}
                  ticketCount={ticketCounts[lottery.id] || 1}
                  onTicketCountChange={(count) => 
                    setTicketCounts(prev => ({ ...prev, [lottery.id]: count }))
                  }
                  onBuyTickets={(count) => buyTickets(lottery.id, count)}
                  featured={true}
                  index={index}
                  userAddress={auth?.walletAddress || ''}
                   hasEnded={countdown[lottery.id] === "Draw time!"}
              
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Lotteries */}
        {!lotteriesLoading && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence>
              {filteredLotteries.map((lottery, index) => (
                <LotteryCard
                  key={lottery.id}
                  lottery={lottery}
                  countdown={countdown[lottery.id] || ''}
                  ticketCount={ticketCounts[lottery.id] || 1}
                  onTicketCountChange={(count) => 
                    setTicketCounts(prev => ({ ...prev, [lottery.id]: count }))
                  }
                  onBuyTickets={(count) => buyTickets(lottery.id, count)}
                  index={index}
                  userAddress={auth?.walletAddress || ''}
                  hasEnded={countdown[lottery.id] === "Draw time!"}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!lotteriesLoading && filteredLotteries.length === 0 && (
          <motion.div 
            className="text-center py-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 bg-cool-3/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Dice6 className="w-10 h-10 text-cool-2" />
            </div>
            <h3 className="text-2xl font-semibold text-camp-dark mb-3">No Lotteries Found</h3>
            <p className="text-cool-1">Try adjusting your filters to discover exciting lotteries</p>
          </motion.div>
        )}
        
        {/* Success/Error Notifications */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.5 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <div className="bg-green-500/20 border border-green-500/30 backdrop-blur-lg rounded-xl p-4 flex items-center gap-3 min-w-[320px]">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-green-400 font-medium">Success!</h4>
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
                <button
                  onClick={clearSuccess}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.5 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-lg rounded-xl p-4 flex items-center gap-3 min-w-[320px]">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-400 font-medium">Error</h4>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface LotteryCardProps {
  lottery: LotteryRound;
  countdown: string;
  ticketCount: number;
  onTicketCountChange: (count: number) => void;
  onBuyTickets: (count: number) => void;
  featured?: boolean;
  index: number;
  userAddress: string;
  hasEnded : boolean;
}

function LotteryCard({ 
  lottery, 
  countdown, 
  ticketCount, 
  onTicketCountChange, 
  onBuyTickets, 
  featured, 
  index,
  userAddress, 
  hasEnded  = false
}: LotteryCardProps) {
  const { authenticated } = useAuthState();
  const progressPercent = (lottery.ticketsSold / lottery.totalTickets) * 100;

  return (
    <motion.div
      className={`glass-effect rounded-3xl  overflow-hidden hover-lift border border-white/20 group ${
        featured ? 'ring-2 ring-camp-orange/50' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
{lottery.animation_url ? (
          <video
        src={lottery.animation_url}
        muted
        autoPlay={true}
        controls
        className="w-full h-48 object-cover rounded-xl"
        poster={lottery.image}
          />
        ) : lottery.audio ? (
          // Show audio if ip.audio_url exists
          <div className="w-full h-48 flex items-center justify-center bg-camp-light/30 rounded-xl">
        <audio controls muted src={lottery.audio} className="w-full" />
        <span className="absolute top-2 left-2 px-2 py-1 bg-camp-orange/80 text-white rounded text-xs">Audio</span>
          </div>
        ) : (
          // Fallback to image
          <img
        src={lottery.image}

        className="w-full h-48 object-cover rounded-xl"
          />
        )}
        {/* Header */}<div className="relative p-6">
      
        
        {/* Overlays */}
       
        <div className="flex items-start justify-between mb-4">
          
          <div>
            <h3 className="text-lg font-semibold text-camp-dark group-hover:text-camp-orange transition-colors">
              {lottery.name}
            </h3>
            {lottery.creator && (
              <p className="text-cool-1 text-sm">by {formatAddress(lottery.creator)}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {lottery.featured && (
              <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              lottery.isActive
                ? 'bg-green-100 text-green-600'
                : !lottery.isActive
                ? 'bg-gray-100 text-gray-600'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {lottery.isActive}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-cool-1 text-sm mb-4 line-clamp-2">{lottery.description}</p>

        {/* Prize Pool */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-cool-1">Prize Pool</span>
            <span className="text-sm text-cool-1">Ticket: {lottery.ticketPrice}</span>
          </div>
          <div className="text-2xl font-bold text-camp-dark flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-camp-orange" />
            {lottery.prizePool}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-cool-1">Tickets Sold</span>
            <span className="text-sm text-cool-1">{lottery.ticketsSold}/{lottery.totalTickets}</span>
          </div>
          <div className="w-full bg-cool-3/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-camp-orange to-warm-1 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-cool-1">
            <span>{progressPercent.toFixed(1)}% sold</span>
            <span>{lottery.participants} players</span>
          </div>
        </div>

        {/* Countdown */}
        {lottery.isActive && (
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
        )}

        {/* Winner Display */}
        {lottery.isActive===false && lottery.winner && (
          <div className="mb-4 p-3 bg-green-100 rounded-xl">
            <div className="flex items-center space-x-2 text-green-600">
              <Crown className="w-5 h-5" />
              <div>
                <div className="font-medium">Winner!</div>
                <div className="text-sm">{formatAddress(lottery.winner)}</div>
              </div>
            </div>
          </div>
        )}
      
        
        {/* Buy Tickets */}
{lottery.creatorAddress === userAddress && lottery.isActive  && hasEnded ? (
  <>
  <div className="p-3 bg-green-100 rounded-xl text-center my-2">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Lottery Ended</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Lottery has ended
              </p>
  
            </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <DrawWinnerButton lotteryId={lottery.id} authenticated={authenticated} />
                  </div>
                </div>
  </>
              ) : (
                <>
        {lottery.isActive && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onTicketCountChange(Math.max(1, ticketCount - 1))}
                className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={ticketCount}
                onChange={(e) => onTicketCountChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange bg-white/50 backdrop-blur-sm text-center"
                min="1"
              />
              <button
                onClick={() => onTicketCountChange(ticketCount + 1)}
                className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                +
              </button>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-cool-1 mb-2">
                Total Cost: {(parseFloat(lottery.ticketPrice.split(' ')[0]) * ticketCount).toFixed(3)} ETH
              </div>
         
                <button
                  onClick={() => onBuyTickets(ticketCount)}
                  disabled={!authenticated}
                  className="w-full px-6 py-3 gradient-bg text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                  {!authenticated ? 'Connect Wallet' : `Buy ${ticketCount} Ticket${ticketCount > 1 ? 's' : ''}`}
                </button>
          </div>
          </div>)}
              </>
            
          )}
          </div>
    </motion.div>
  );
}

// DrawWinnerButton component
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'
function DrawWinnerButton({ lotteryId, authenticated }: { lotteryId: string, authenticated: boolean }) {
  const { drawLotteryWinner, loading } = useCampfireIntegration();
  const [pending, setPending] = useState(false);

  const handleDraw = async () => {
    setPending(true);
    try {
      await drawLotteryWinner(BigInt(lotteryId));
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
      {!authenticated ? 'Connect Wallet' : (pending || loading ? 'Drawing Winner...' : 'Draw Winner')}
    </button>
  );
}
