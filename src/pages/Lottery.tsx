import { useState, useEffect } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Users, 
  DollarSign, 
  Dice6, 
  Gift, 
  Sparkles,
  Crown
} from 'lucide-react'

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
  },
  {
    id: '3',
    name: 'Music Beats Lottery',
    description: 'Professional music beats package for content creators.',
    prizePool: '3.7 ETH',
    ticketPrice: '0.002 ETH',
    totalTickets: 200,
    ticketsSold: 200,
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'ended',
    participants: 89,
    winner: '0x1234567890abcdef',
  },
  {
    id: '4',
    name: 'Gaming Assets Mega Draw',
    description: 'Complete gaming asset package including sprites and sounds.',
    prizePool: '12.0 ETH',
    ticketPrice: '0.015 ETH',
    totalTickets: 800,
    ticketsSold: 123,
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: 'active',
    participants: 67,
  },
]

export default function Lottery() {
  const { origin } = useAuth();
  const { authenticated } = useAuthState();
  const [lotteries] = useState<LotteryRound[]>(mockLotteries);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended' | 'upcoming'>('all');
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [countdown, setCountdown] = useState<Record<string, string>>({});

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
    if (!origin || !authenticated || ticketCount <= 0) return;
    try {
      // Integrate with smart contract here
      console.log(`Buying ${ticketCount} tickets for lottery ${lotteryId}`);
    } catch (error) {
      console.error('Error buying tickets:', error);
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-camp-light via-white to-camp-orange/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-camp-orange via-camp-light to-cool-2 rounded-3xl flex items-center justify-center mr-6 shadow-xl animate-pulse-glow">
              <Dice6 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-camp-dark mb-2 flex items-center">
                IP Lottery
                <Sparkles className="w-8 h-8 ml-3 text-camp-orange" />
              </h1>
              <p className="text-xl text-cool-1">
                Win exclusive intellectual property assets through decentralized raffles.
              </p>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-center text-camp-orange">
              <Trophy className="w-4 h-4 mr-1" />
              <span>{lotteries.filter(l => l.status === 'active').length} Active Draws</span>
            </div>
            <div className="flex items-center text-cool-1">
              <Users className="w-4 h-4 mr-1" />
              <span>{lotteries.reduce((sum, l) => sum + l.participants, 0)} Total Players</span>
            </div>
            <div className="flex items-center text-camp-orange">
              <DollarSign className="w-4 h-4 mr-1" />
              <span>{lotteries.reduce((sum, l) => sum + parseFloat(l.prizePool), 0).toFixed(1)} ETH in Prizes</span>
            </div>
          </div>
        </motion.div>

        {/* Featured Lotteries */}
        {featuredLotteries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-camp-dark mb-6 flex items-center">
              <Crown className="w-6 h-6 mr-2 text-camp-orange" />
              Featured Draws
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredLotteries.slice(0, 2).map((lottery, index) => (
                <motion.div
                  key={lottery.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gradient-to-br from-camp-light/60 to-camp-orange/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border-2 border-camp-orange/20 p-2"
                >
                  <div className="bg-white/90 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-camp-orange to-cool-2 rounded-2xl flex items-center justify-center mr-4">
                          <Star className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-camp-dark">{lottery.name}</h3>
                          <p className="text-camp-orange font-medium">Featured Draw</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-camp-orange">{lottery.prizePool}</p>
                        <p className="text-sm text-cool-1">Prize Pool</p>
                      </div>
                    </div>

                    <p className="text-cool-1 mb-6 text-lg">{lottery.description}</p>

                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-camp-dark">
                          {countdown[lottery.id] || 'Calculating...'}
                        </p>
                        <p className="text-xs text-cool-1">Time Remaining</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-camp-dark">{lottery.ticketsSold}</p>
                        <p className="text-xs text-cool-1">Tickets Sold</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-camp-dark">{lottery.participants}</p>
                        <p className="text-xs text-cool-1">Players</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-cool-1">Progress</span>
                        <span className="font-medium text-camp-dark">
                          {Math.round((lottery.ticketsSold / lottery.totalTickets) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-cool-1/20 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-camp-orange to-cool-2 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(lottery.ticketsSold / lottery.totalTickets) * 100}%` }}
                        />
                      </div>
                    </div>

                    {authenticated && lottery.status === 'active' && (
                      <div className="flex items-center space-x-4">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={ticketCounts[lottery.id] || 1}
                          onChange={(e) => setTicketCounts(prev => ({ 
                            ...prev, 
                            [lottery.id]: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) 
                          }))}
                          className="w-20 px-3 py-2 border border-camp-orange/30 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent bg-white text-gray-900"
                        />
                        <div className="flex-1">
                          <p className="text-xs text-cool-1 mb-1">
                            {ticketCounts[lottery.id] || 1} ticket(s) × {lottery.ticketPrice} = {
                              ((ticketCounts[lottery.id] || 1) * parseFloat(lottery.ticketPrice)).toFixed(3)
                            } ETH
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => buyTickets(lottery.id, ticketCounts[lottery.id] || 1)}
                            className="w-full py-3 bg-gradient-to-r from-camp-orange to-cool-2 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-bold"
                          >
                            Buy Tickets
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              label: 'Active Draws',
              value: lotteries.filter(l => l.status === 'active').length,
              icon: Dice6,
              color: 'from-camp-orange to-camp-light'
            },
            {
              label: 'Total Participants',
              value: lotteries.reduce((sum, l) => sum + l.participants, 0),
              icon: Users,
              color: 'from-cool-1 to-cool-2'
            },
            {
              label: 'Prize Pool',
              value: `${lotteries.reduce((sum, l) => sum + parseFloat(l.prizePool), 0).toFixed(1)} ETH`,
              icon: Gift,
              color: 'from-camp-orange to-warm-2'
            },
            {
              label: 'Winners This Week',
              value: lotteries.filter(l => l.status === 'ended').length,
              icon: Trophy,
              color: 'from-cool-2 to-cool-3'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cool-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-camp-dark">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 mb-8"
        >
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'all', label: 'All Draws', count: lotteries.length },
              { key: 'active', label: 'Active', count: lotteries.filter(l => l.status === 'active').length },
              { key: 'ended', label: 'Completed', count: lotteries.filter(l => l.status === 'ended').length },
              { key: 'upcoming', label: 'Starting Soon', count: lotteries.filter(l => l.status === 'upcoming').length },
            ].map(({ key, label, count }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(key as any)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                  filter === key
                    ? 'bg-gradient-to-r from-camp-orange to-cool-2 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  filter === key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Lottery Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredLotteries.map((lottery, index) => (
              <motion.div
                key={lottery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <LotteryCard
                  lottery={lottery}
                  authenticated={authenticated}
                  ticketCount={ticketCounts[lottery.id] || 1}
                  setTicketCount={(count) => setTicketCounts(prev => ({ ...prev, [lottery.id]: count }))}
                  onBuyTickets={() => buyTickets(lottery.id, ticketCounts[lottery.id] || 1)}
                  countdown={countdown[lottery.id]}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredLotteries.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Dice6 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No lotteries found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {filter === 'all' ? 'No lottery draws are currently available.' : `No ${filter} lotteries found.`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

interface LotteryCardProps {
  lottery: LotteryRound
  authenticated: boolean
  ticketCount: number
  setTicketCount: (count: number) => void
  onBuyTickets: () => void
  countdown?: string
}

function LotteryCard({ lottery, authenticated, ticketCount, setTicketCount, onBuyTickets, countdown }: LotteryCardProps) {
  const progressPercentage = (lottery.ticketsSold / lottery.totalTickets) * 100

  return (
    <motion.div 
      whileHover={{ y: -5 }}
  className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-camp-dark dark:text-white line-clamp-2">
            {lottery.name}
          </h3>
          <div className={`px-3 py-1 rounded-xl text-xs font-bold ${
            lottery.status === 'active' 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
              : lottery.status === 'ended'
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
          }`}>
            {lottery.status === 'active' ? 'Live' : lottery.status === 'ended' ? 'Ended' : 'Soon'}
          </div>
        </div>
        
        <p className="text-cool-1 dark:text-gray-400 text-sm mb-6 line-clamp-2">
          {lottery.description}
        </p>

        {/* Prize Pool */}
        <div className="bg-gradient-to-r from-camp-light/60 to-camp-orange/10 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-cool-1 mb-1">Prize Pool</p>
              <p className="text-2xl font-bold text-camp-orange">{lottery.prizePool}</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-camp-orange to-cool-2 rounded-2xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-cool-1 dark:text-gray-400 mb-1">Time Left</p>
            <p className="font-bold text-camp-dark dark:text-white">
              {lottery.status === 'active' ? countdown || 'Calculating...' : lottery.status === 'ended' ? 'Finished' : 'Not Started'}
            </p>
          </div>
          <div>
            <p className="text-xs text-cool-1 dark:text-gray-400 mb-1">Participants</p>
            <p className="font-bold text-camp-dark dark:text-white">{lottery.participants}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-cool-1">
              {lottery.ticketsSold} / {lottery.totalTickets} tickets
            </span>
            <span className="font-medium text-camp-dark">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-cool-1/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-camp-orange to-cool-2 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Winner Display */}
        {lottery.status === 'ended' && lottery.winner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-xs text-yellow-700">Winner</p>
                <p className="font-mono text-sm font-bold text-yellow-800">
                  {lottery.winner.slice(0, 6)}...{lottery.winner.slice(-4)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {lottery.status === 'active' && authenticated ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="10"
                value={ticketCount}
                onChange={(e) => setTicketCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-16 px-3 py-2 border border-camp-orange/30 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent bg-white text-gray-900 text-center"
              />
              <div className="flex-1">
                <p className="text-xs text-cool-1">
                  {ticketCount} × {lottery.ticketPrice} = {(ticketCount * parseFloat(lottery.ticketPrice)).toFixed(3)} ETH
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBuyTickets}
              className="w-full py-3 bg-gradient-to-r from-camp-orange to-cool-2 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-bold flex items-center justify-center"
            >
              <Dice6 className="w-4 h-4 mr-2" />
              Buy Tickets
            </motion.button>
          </div>
        ) : lottery.status === 'ended' ? (
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-3">Draw completed</p>
          </div>
        ) : !authenticated ? (
          <div className="text-center">
            <p className="text-cool-1 text-sm mb-3">Connect wallet to participate</p>
            <button className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-medium">
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-3">Draw starts soon</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
