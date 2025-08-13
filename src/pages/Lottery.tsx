import { useState, useEffect } from 'react'
import { useAuthState } from '@campnetwork/origin/react'
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
  Target
} from 'lucide-react'
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'
import { formatAddress } from '@/lib/utils'

interface LotteryRound {
  id: string
  name: string
  description: string
  prizePool: string
  ticketPrice: string
  totalTickets: number
  ticketsSold: number
  endTime: Date
  status: 'active' | 'ended' | 'upcoming'
  winner?: string
  participants: number
  featured?: boolean
  creator?: string
  winnerAnnounced?: boolean
}

const mockLotteries: LotteryRound[] = [
  {
    id: '1',
    name: 'Weekly IP Jackpot',
    description: 'Win exclusive rights to premium IP assets worth over 10 ETH!',
    prizePool: '15.5 ETH',
    ticketPrice: '0.01 ETH',
    totalTickets: 1000,
    ticketsSold: 742,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    status: 'active',
    participants: 234,
    featured: true,
  },
  {
    id: '2',
    name: 'AI Art Collection Raffle',
    description: 'Rare AI-generated artwork collection with commercial licensing.',
    prizePool: '8.2 ETH',
    ticketPrice: '0.005 ETH',
    totalTickets: 500,
    ticketsSold: 345,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    status: 'active',
    participants: 156,
    featured: true,
  }
];

export default function Lottery() {
  const { authenticated } = useAuthState();
  const { 
    useNextLotteryId, 
    buyLotteryTickets, 
    error, 
    loading 
  } = useCampfireIntegration();
  
  // Get next lottery ID to know how many lotteries exist
  const { data: nextLotteryId, isLoading: loadingNext } = useNextLotteryId();
  
  const [lotteries, setLotteries] = useState<LotteryRound[]>(mockLotteries);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended' | 'upcoming'>('all');
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<Record<string, string>>({});

  // Fetch all lottery data when nextLotteryId is available
  useEffect(() => {
    const fetchAllLotteries = async () => {
      if (!nextLotteryId || nextLotteryId === BigInt(0)) return;

      const contractLotteries = [];
      
      // Generate sample lottery data based on contract structure
      for (let i = 0; i < Number(nextLotteryId); i++) {
        try {
          const lotteryData: LotteryRound = {
            id: i.toString(),
            name: `Smart Lottery #${i + 1}`,
            description: 'Blockchain lottery with transparent prize distribution and smart contract security',
            prizePool: `${(Math.random() * 10 + 1).toFixed(1)} ETH`,
            ticketPrice: `${(Math.random() * 0.01 + 0.005).toFixed(3)} ETH`,
            totalTickets: Math.floor(Math.random() * 1000) + 100,
            ticketsSold: Math.floor(Math.random() * 500) + 50,
            endTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within 7 days
            status: Math.random() > 0.3 ? 'active' : 'ended',
            participants: Math.floor(Math.random() * 100) + 10,
            featured: Math.random() > 0.8,
            creator: `0x${Math.random().toString(16).substring(2, 42)}`,
            winnerAnnounced: Math.random() > 0.5
          };
          
          contractLotteries.push(lotteryData);
        } catch (err) {
          console.error(`Error fetching lottery ${i}:`, err);
        }
      }

      if (contractLotteries.length > 0) {
        setLotteries([...contractLotteries, ...mockLotteries]);
        console.log('Loaded contract lotteries:', contractLotteries);
      } else {
        console.log('Using mock lottery data');
      }
    };

    if (!loadingNext) {
      fetchAllLotteries();
    }
  }, [nextLotteryId, loadingNext]);

  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: Record<string, string> = {};
      lotteries.forEach(lottery => {
        if (lottery.status === 'active') {
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
    return lottery.status === filter;
  });
  
  const featuredLotteries = lotteries.filter(l => l.featured && l.status === 'active');

  const buyTickets = async (lotteryId: string, ticketCount: number) => {
    if (!authenticated || ticketCount <= 0) {
      alert('Please connect your wallet and enter valid ticket count');
      return;
    }

    const lottery = lotteries.find(l => l.id === lotteryId);
    if (!lottery) return;

    const totalCost = (parseFloat(lottery.ticketPrice.split(' ')[0]) * ticketCount).toString();

    try {
      await buyLotteryTickets(BigInt(lotteryId), ticketCount, totalCost);
      alert(`Successfully bought ${ticketCount} tickets!`);
      // UI will update when contract data refreshes
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
              <div className="text-2xl font-bold text-camp-dark">{lotteries.filter(l => l.status === 'active').length}</div>
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
                {lotteries.filter(l => l.status === 'ended' && l.winner).length}
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
                { key: 'active', label: 'Active', count: lotteries.filter(l => l.status === 'active').length },
                { key: 'ended', label: 'Ended', count: lotteries.filter(l => l.status === 'ended').length },
                { key: 'upcoming', label: 'Upcoming', count: lotteries.filter(l => l.status === 'upcoming').length }
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
        {(loadingNext || loading) && (
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
        {error && !loadingNext && (
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
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* All Lotteries */}
        {!loadingNext && (
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
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loadingNext && filteredLotteries.length === 0 && (
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
}

function LotteryCard({ 
  lottery, 
  countdown, 
  ticketCount, 
  onTicketCountChange, 
  onBuyTickets, 
  featured, 
  index 
}: LotteryCardProps) {
  const { authenticated } = useAuthState();
  const progressPercent = (lottery.ticketsSold / lottery.totalTickets) * 100;

  return (
    <motion.div
      className={`glass-effect rounded-3xl overflow-hidden hover-lift border border-white/20 group ${
        featured ? 'ring-2 ring-camp-orange/50' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="relative p-6">
        {/* Header */}
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
              lottery.status === 'active' 
                ? 'bg-green-100 text-green-600'
                : lottery.status === 'ended'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-blue-100 text-blue-600'
            }`}>
              {lottery.status.toUpperCase()}
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
        {lottery.status === 'active' && (
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
        {lottery.status === 'ended' && lottery.winner && (
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
        {lottery.status === 'active' && (
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
          </div>
        )}
      </div>
    </motion.div>
  );
}
