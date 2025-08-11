import { useState, useEffect } from 'react';
import { useAuthState, useAuth } from '@campnetwork/origin/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock,
  Trophy,
  Eye,
  Heart,
  DollarSign,
  Users,
  Gavel,
  Sparkles,
  Target,
  Star,
  Timer,
  Crown,
  TrendingUp
} from 'lucide-react';

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
}

const mockAuctions: Auction[] = [
  {
    id: '1',
    title: 'Epic Digital Art Collection',
    description: 'Stunning collection of AI-generated artwork with exclusive commercial rights.',
    imageUrl: 'https://picsum.photos/400/300?random=1',
    currentBid: 15.5,
    minimumBid: 0.1,
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    bidCount: 47,
    views: 2341,
    likes: 189,
    category: 'Digital Art',
    creator: 'ArtistPro',
    featured: true
  },
  {
    id: '2',
    title: 'Premium Music Beats Pack',
    description: 'Professional music production pack with unlimited licensing.',
    imageUrl: 'https://picsum.photos/400/300?random=2',
    currentBid: 8.2,
    minimumBid: 0.05,
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours
    bidCount: 23,
    views: 1456,
    likes: 92,
    category: 'Music',
    creator: 'BeatMaker',
    featured: true
  },
  {
    id: '3',
    title: 'Advanced Code Framework',
    description: 'Revolutionary web development framework with extensive documentation.',
    imageUrl: 'https://picsum.photos/400/300?random=3',
    currentBid: 22.8,
    minimumBid: 0.2,
    endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    bidCount: 65,
    views: 3210,
    likes: 234,
    category: 'Code',
    creator: 'DevMaster'
  },
  {
    id: '4',
    title: '3D Model Collection',
    description: 'High-quality 3D models for gaming and architectural visualization.',
    imageUrl: 'https://picsum.photos/400/300?random=4',
    currentBid: 12.1,
    minimumBid: 0.1,
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    bidCount: 31,
    views: 1876,
    likes: 145,
    category: '3D Models',
    creator: 'Model3D'
  },
  {
    id: '5',
    title: 'Video Template Library',
    description: 'Professional video templates for social media and marketing.',
    imageUrl: 'https://picsum.photos/400/300?random=5',
    currentBid: 6.3,
    minimumBid: 0.03,
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
    bidCount: 18,
    views: 987,
    likes: 76,
    category: 'Video',
    creator: 'VideoMaker'
  },
  {
    id: '6',
    title: 'Photography Stock Bundle',
    description: 'Exclusive high-resolution photography collection for commercial use.',
    imageUrl: 'https://picsum.photos/400/300?random=6',
    currentBid: 4.7,
    minimumBid: 0.02,
    endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days
    bidCount: 12,
    views: 654,
    likes: 43,
    category: 'Photography',
    creator: 'PhotoPro'
  }
];

export default function Auctions() {
  const { origin } = useAuth();
  const { authenticated } = useAuthState();
  const [auctions] = useState<Auction[]>(mockAuctions);
  const [filter, setFilter] = useState<'all' | 'ending-soon' | 'featured'>('all');
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [countdown, setCountdown] = useState<Record<string, string>>({});

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

  const featuredAuctions = auctions.filter(a => a.featured);

  const placeBid = async (auctionId: string) => {
    const bidAmount = bidAmounts[auctionId];
    if (!origin || !authenticated || !bidAmount) return;
    
    try {
      console.log(`Placing bid of ${bidAmount} ETH on auction ${auctionId}`);
      // This would interact with the auction smart contract
      // await origin.placeBid(BigInt(auctionId), BigInt(parseFloat(bidAmount) * 1e18));
    } catch (error) {
      console.error('Error placing bid:', error);
    }
  };

  return (
    <div className="min-h-screen bg-camp-light dark:bg-camp-dark py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-camp-orange to-warm-1 rounded-2xl flex items-center justify-center mr-6 shadow-xl">
              <Gavel className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-camp-dark dark:text-white mb-2 flex items-center">
                IP Auctions
                <Sparkles className="w-8 h-8 ml-3 text-camp-orange" />
              </h1>
              <p className="text-xl text-cool-1 dark:text-cool-2">
                Bid on exclusive intellectual property assets in real-time auctions.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-center text-camp-orange">
              <Trophy className="w-4 h-4 mr-1" />
              <span>{auctions.length} Active Auctions</span>
            </div>
            <div className="flex items-center text-cool-1 dark:text-cool-2">
              <Users className="w-4 h-4 mr-1" />
              <span>{auctions.reduce((sum, a) => sum + a.bidCount, 0)} Total Bids</span>
            </div>
            <div className="flex items-center text-warm-1">
              <DollarSign className="w-4 h-4 mr-1" />
              <span>{auctions.reduce((sum, a) => sum + a.currentBid, 0).toFixed(1)} ETH Total Value</span>
            </div>
          </div>
        </motion.div>

        {/* Featured Auctions */}
        {featuredAuctions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-camp-dark dark:text-white mb-6 flex items-center">
              <Crown className="w-6 h-6 mr-2 text-camp-orange" />
              Featured Auctions
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredAuctions.slice(0, 2).map((auction, index) => (
                <motion.div
                  key={auction.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white dark:bg-camp-dark rounded-2xl overflow-hidden shadow-xl border border-camp-orange/20 dark:border-camp-orange/30 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="relative">
                    <img
                      src={auction.imageUrl}
                      alt={auction.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-full text-xs font-bold">
                        FEATURED
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2">
                      <div className="text-white font-bold text-sm flex items-center">
                        <Timer className="w-4 h-4 mr-1" />
                        {countdown[auction.id] || 'Calculating...'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-camp-dark dark:text-white">{auction.title}</h3>
                      <span className="text-camp-orange text-sm font-medium bg-camp-orange/10 px-2 py-1 rounded-lg">{auction.category}</span>
                    </div>
                    
                    <p className="text-cool-1 dark:text-cool-2 mb-4">{auction.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-camp-orange">{auction.currentBid} ETH</p>
                        <p className="text-xs text-cool-1 dark:text-cool-2">Current Bid</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-camp-dark dark:text-white">{auction.bidCount}</p>
                        <p className="text-xs text-cool-1 dark:text-cool-2">Bids</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-camp-dark dark:text-white">{auction.views}</p>
                        <p className="text-xs text-cool-1 dark:text-cool-2">Views</p>
                      </div>
                    </div>

                    {authenticated && (
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          step="0.01"
                          min={auction.minimumBid}
                          placeholder={`Min: ${auction.minimumBid} ETH`}
                          value={bidAmounts[auction.id] || ''}
                          onChange={(e) => setBidAmounts(prev => ({ ...prev, [auction.id]: e.target.value }))}
                          className="flex-1 px-4 py-2 border border-cool-2/30 dark:border-cool-1/50 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent bg-white dark:bg-camp-dark text-camp-dark dark:text-white"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => placeBid(auction.id)}
                          disabled={!bidAmounts[auction.id] || parseFloat(bidAmounts[auction.id]) < auction.minimumBid}
                          className="px-6 py-2 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Place Bid
                        </motion.button>
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
              label: 'Active Auctions',
              value: auctions.length,
              icon: Gavel,
              color: 'from-camp-orange to-warm-1'
            },
            {
              label: 'Total Bids',
              value: auctions.reduce((sum, a) => sum + a.bidCount, 0),
              icon: TrendingUp,
              color: 'from-cool-1 to-cool-2'
            },
            {
              label: 'Total Value',
              value: `${auctions.reduce((sum, a) => sum + a.currentBid, 0).toFixed(1)} ETH`,
              icon: DollarSign,
              color: 'from-warm-1 to-warm-2'
            },
            {
              label: 'Ending Soon',
              value: auctions.filter(a => {
                const timeLeft = a.endTime.getTime() - Date.now();
                return timeLeft < 24 * 60 * 60 * 1000;
              }).length,
              icon: Clock,
              color: 'from-red-400 to-red-600'
            }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white dark:bg-camp-dark rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cool-1 dark:text-cool-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-camp-dark dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-camp-dark rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'all', label: 'All Auctions', icon: Target },
              { key: 'featured', label: 'Featured', icon: Star },
              { key: 'ending-soon', label: 'Ending Soon', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(key as any)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 ${
                  filter === key
                    ? 'bg-gradient-to-r from-camp-orange to-warm-1 text-white shadow-lg'
                    : 'text-camp-dark dark:text-white hover:bg-cool-3/20 dark:hover:bg-cool-1/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Auctions Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredAuctions.map((auction, index) => (
              <motion.div
                key={auction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                layout
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white dark:bg-camp-dark rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={auction.imageUrl}
                    alt={auction.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <div className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      auction.endTime.getTime() - Date.now() < 24 * 60 * 60 * 1000
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-black/60 text-white backdrop-blur-sm'
                    }`}>
                      {countdown[auction.id] || 'Calculating...'}
                    </div>
                  </div>
                  {auction.featured && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-lg text-xs font-bold">
                        FEATURED
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-camp-dark dark:text-white line-clamp-2">
                      {auction.title}
                    </h3>
                    <span className="bg-cool-3/20 text-cool-1 dark:text-cool-2 text-xs px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                      {auction.category}
                    </span>
                  </div>
                  
                  <p className="text-cool-1 dark:text-cool-2 text-sm mb-4 line-clamp-2">
                    {auction.description}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-camp-orange">{auction.currentBid} ETH</div>
                      <div className="text-xs text-cool-1 dark:text-cool-2">Current Bid</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-camp-dark dark:text-white">{auction.bidCount}</div>
                      <div className="text-xs text-cool-1 dark:text-cool-2">Bids</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-warm-1">
                        <Heart className="w-3 h-3" />
                        <span className="text-sm font-medium">{auction.likes}</span>
                      </div>
                      <div className="text-xs text-cool-1 dark:text-cool-2">Likes</div>
                    </div>
                  </div>

                  {authenticated ? (
                    <div className="space-y-3">
                      <input
                        type="number"
                        step="0.01"
                        min={auction.minimumBid}
                        placeholder={`Min: ${auction.minimumBid} ETH`}
                        value={bidAmounts[auction.id] || ''}
                        onChange={(e) => setBidAmounts(prev => ({ ...prev, [auction.id]: e.target.value }))}
                        className="w-full px-4 py-2 border border-cool-2/30 dark:border-cool-1/50 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent bg-white dark:bg-camp-dark text-camp-dark dark:text-white"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => placeBid(auction.id)}
                        disabled={!bidAmounts[auction.id] || parseFloat(bidAmounts[auction.id]) < auction.minimumBid}
                        className="w-full py-3 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Gavel className="w-4 h-4 mr-2" />
                        Place Bid
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-cool-1 dark:text-cool-2 text-sm mb-3">Connect wallet to bid</p>
                      <button className="w-full py-3 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm font-medium">
                        Connect Wallet
                      </button>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-cool-3/20 dark:border-cool-1/20">
                    <div className="flex items-center justify-between text-sm text-cool-1 dark:text-cool-2">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {auction.views} views
                      </div>
                      <div>
                        by {auction.creator}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
