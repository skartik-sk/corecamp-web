import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@campnetwork/origin/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  ExternalLink, 
  Star, 
  Eye, 
  DollarSign, 
  Calendar, 
  Filter,
  Zap,
  Sparkles,
  Crown,
  Layers,
  Activity,
  BarChart3,
  Rocket,
  Brain,
  Diamond,
  Palette,
  Camera,
  Music,
  Code,
  Globe,
  Heart,
  Share2,
  Download,
  Settings
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const filterOptions = ['All', 'Active', 'Draft', 'Disputed'];
const sortOptions = ['Most Recent', 'Most Popular', 'Highest Revenue', 'Most Sales'];

const categoryIcons: Record<string, any> = {
  'Art': Palette,
  'Photography': Camera,
  'Music': Music,
  'Code': Code,
  'Digital': Globe,
  'AI': Brain,
  'Other': Diamond,
  'default': Sparkles
};

export default function MyIPs() {
  const { origin, jwt } = useAuth();
  const [userIPs, setUserIPs] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Most Recent');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedIP, setSelectedIP] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserIPs() {
      setIsLoading(true);
      setError(null);
      try {
        if (!origin || !jwt?.sub) {
          setError('Origin SDK or user address not available.');
          setIsLoading(false);
          return;
        }
        // Mock data for demonstration - replace with actual API calls when available
        const mockIPs = [
          {
            id: '1',
            tokenId: '1',
            name: 'Digital Art Masterpiece',
            description: 'A stunning digital artwork featuring vibrant colors and innovative design.',
            image: 'https://picsum.photos/400/250?random=1',
            category: 'Art',
            price: 2.5,
            revenue: 5.2,
            views: 1250,
            likes: 89,
            sales: 3,
            status: 'active',
            createdAt: new Date('2024-01-15').toISOString(),
            owner: jwt?.sub || '',
            creator: jwt?.sub || ''
          },
          {
            id: '2', 
            tokenId: '2',
            name: 'AI Music Composition',
            description: 'Original music track composed using AI algorithms.',
            image: 'https://picsum.photos/400/250?random=2',
            category: 'Music',
            price: 1.8,
            revenue: 3.6,
            views: 890,
            likes: 67,
            sales: 2,
            status: 'active',
            createdAt: new Date('2024-02-01').toISOString(),
            owner: jwt?.sub || '',
            creator: jwt?.sub || ''
          },
          {
            id: '3',
            tokenId: '3', 
            name: 'Code Library Framework',
            description: 'Reusable code framework for web development.',
            image: 'https://picsum.photos/400/250?random=3',
            category: 'Code',
            price: 3.2,
            revenue: 6.4,
            views: 2100,
            likes: 156,
            sales: 4,
            status: 'active',
            createdAt: new Date('2024-01-20').toISOString(),
            owner: jwt?.sub || '',
            creator: jwt?.sub || ''
          }
        ];
        setUserIPs(mockIPs);
      } catch (err: any) {
        console.error('Error loading IP assets:', err);
        setError('Failed to load your IP assets. ' + (err?.message || 'Unknown error.'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchUserIPs();
  }, [origin, jwt]);

  const filteredAndSortedIPs = userIPs
    .filter(ip => filter === 'All' || (ip.status || 'active').toLowerCase() === filter.toLowerCase())
    .sort((a, b) => {
      switch (sortBy) {
        case 'Most Popular':
          return (b.likes || 0) - (a.likes || 0);
        case 'Highest Revenue':
          return parseFloat(b.revenue || '0') - parseFloat(a.revenue || '0');
        case 'Most Sales':
          return (b.sales || 0) - (a.sales || 0);
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const totalRevenue = userIPs.reduce((sum, ip) => sum + parseFloat(ip.revenue || '0'), 0);
  const totalViews = userIPs.reduce((sum, ip) => sum + (ip.views || 0), 0);
  const totalLikes = userIPs.reduce((sum, ip) => sum + (ip.likes || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-camp-light dark:bg-camp-dark py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Animated Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-4">
                <motion.div 
                  animate={{ 
                    background: [
                      'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                      'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-12 w-96 rounded-2xl"
                />
                <motion.div 
                  animate={{ 
                    background: [
                      'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                      'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="h-6 w-64 rounded-xl"
                />
              </div>
              <motion.div 
                animate={{ 
                  background: [
                    'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                    'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="h-12 w-40 rounded-2xl"
              />
            </div>
            
            {/* Animated Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 dark:bg-camp-dark/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl"
                >
                  <div className="flex justify-between items-center">
                    <div className="space-y-3">
                      <motion.div 
                        animate={{ 
                          background: [
                            'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                            'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                        className="h-4 w-20 rounded"
                      />
                      <motion.div 
                        animate={{ 
                          background: [
                            'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                            'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 + 0.5 }}
                        className="h-8 w-16 rounded"
                      />
                    </div>
                    <motion.div 
                      animate={{ 
                        background: [
                          'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                          'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 + 1 }}
                      className="h-12 w-12 rounded-2xl"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Animated Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 dark:bg-camp-dark/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl"
                >
                  <motion.div 
                    animate={{ 
                      background: [
                        'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                        'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    className="h-48 w-full"
                  />
                  <div className="p-6 space-y-4">
                    <motion.div 
                      animate={{ 
                        background: [
                          'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                          'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 + 0.5 }}
                      className="h-6 w-3/4 rounded"
                    />
                    <motion.div 
                      animate={{ 
                        background: [
                          'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                          'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 + 1 }}
                      className="h-4 w-full rounded"
                    />
                    <motion.div 
                      animate={{ 
                        background: [
                          'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
                          'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 + 1.5 }}
                      className="h-4 w-2/3 rounded"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-camp-light dark:bg-camp-dark py-12 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 dark:bg-camp-dark/90 backdrop-blur-sm border-2 border-red-200 dark:border-red-700 rounded-3xl p-12 text-center max-w-md mx-auto shadow-2xl"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 2 }}
            className="w-20 h-20 bg-gradient-to-r from-camp-orange to-warm-1 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">{error}</h3>
          <p className="text-cool-1 dark:text-cool-2 mb-6">Please try again later.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-camp-light dark:bg-camp-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Epic Header */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <div className="relative">
              <motion.div
                animate={{ 
                  background: [
                    'linear-gradient(45deg, #8b5cf6, #ec4899, #f97316)',
                    'linear-gradient(45deg, #f97316, #8b5cf6, #ec4899)',
                    'linear-gradient(45deg, #ec4899, #f97316, #8b5cf6)'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -inset-2 rounded-3xl opacity-20 blur-xl"
              />
              <div className="relative bg-white/90 dark:bg-camp-dark/90 backdrop-blur-sm rounded-3xl p-8 border border-white/20 dark:border-cool-1/20">
                <div className="flex items-center mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 bg-gradient-to-r from-camp-orange to-warm-1 rounded-3xl flex items-center justify-center mr-6 shadow-xl"
                  >
                    <Crown className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <motion.h1 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-6xl font-black text-camp-dark dark:text-white mb-2 flex items-center"
                    >
                      My IP Empire
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-10 h-10 ml-4 text-yellow-500" />
                      </motion.div>
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl text-cool-1 dark:text-cool-2 flex items-center"
                    >
                      <Rocket className="w-5 h-5 mr-2 text-camp-orange" />
                      Rule your intellectual property kingdom like a boss
                    </motion.p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3">
                  <Link to="/create">
                    <motion.button
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Masterpiece
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="flex items-center px-6 py-3 bg-white/80 dark:bg-camp-dark/80 text-camp-dark dark:text-white rounded-2xl hover:shadow-xl transition-all duration-300 font-bold border-2 border-camp-orange/30 dark:border-camp-orange/50"
                  >
                    <Layers className="w-5 h-5 mr-2" />
                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Insane Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              label: 'Total IPs',
              value: userIPs.length,
              icon: Diamond,
              gradient: 'from-camp-orange to-warm-1',
              bgGradient: 'from-camp-orange/10 to-warm-1/20',
              delay: 0
            },
            {
              label: 'Revenue Generated',
              value: `${totalRevenue.toFixed(2)} ETH`,
              icon: DollarSign,
              gradient: 'from-green-400 via-green-500 to-green-600',
              bgGradient: 'from-green-500/10 to-green-600/20',
              delay: 0.1
            },
            {
              label: 'Total Views',
              value: totalViews.toLocaleString(),
              icon: Eye,
              gradient: 'from-blue-400 via-blue-500 to-blue-600',
              bgGradient: 'from-blue-500/10 to-blue-600/20',
              delay: 0.2
            },
            {
              label: 'Community Love',
              value: totalLikes.toLocaleString(),
              icon: Heart,
              gradient: 'from-pink-400 via-pink-500 to-pink-600',
              bgGradient: 'from-pink-500/10 to-pink-600/20',
              delay: 0.3
            }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: stat.delay, type: "spring", stiffness: 200 }}
              whileHover={{ y: -10, scale: 1.05 }}
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-white/20 dark:border-gray-700/20 group relative overflow-hidden`}
            >
              <motion.div
                animate={{ 
                  background: [
                    `linear-gradient(45deg, transparent, ${stat.gradient.split(' ')[1]}/10, transparent)`,
                    `linear-gradient(135deg, transparent, ${stat.gradient.split(' ')[1]}/20, transparent)`
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-0 opacity-50"
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-bold text-cool-1 dark:text-cool-2 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: stat.delay + 0.3 }}
                      className="text-4xl font-black text-camp-dark dark:text-white"
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`w-16 h-16 bg-gradient-to-r ${stat.gradient} rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl`}
                  >
                    <stat.icon className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: stat.delay + 0.5, duration: 1 }}
                  className={`h-1 bg-gradient-to-r ${stat.gradient} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Advanced Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-camp-dark/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl mb-12 border-2 border-white/20 dark:border-cool-1/20"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-bold text-camp-dark dark:text-white">Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border-2 border-camp-orange/30 dark:border-camp-orange/50 rounded-xl px-4 py-2 focus:ring-4 focus:ring-camp-orange/20 focus:border-camp-orange bg-white dark:bg-camp-dark text-camp-dark dark:text-white font-medium"
                >
                  {filterOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-pink-500" />
                <span className="text-sm font-bold text-camp-dark dark:text-white">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-2 border-warm-1/30 dark:border-warm-1/50 rounded-xl px-4 py-2 focus:ring-4 focus:ring-warm-1/20 focus:border-warm-1 bg-white dark:bg-camp-dark text-camp-dark dark:text-white font-medium"
                >
                  {sortOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-cool-1 dark:text-cool-2 lg:ml-auto">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="font-bold">
                Showing {filteredAndSortedIPs.length} of {userIPs.length} masterpieces
              </span>
            </div>
          </div>
        </motion.div>

        {/* IP Grid/List */}
        {filteredAndSortedIPs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-32 h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
            >
              <Star className="w-16 h-16 text-white" />
            </motion.div>
            <h3 className="text-3xl font-bold text-camp-dark dark:text-white mb-4">No IPs found</h3>
            <p className="text-cool-1 dark:text-cool-2 text-lg mb-8">
              {filter === 'All' ? "Time to create your first digital masterpiece!" : `No IPs match the "${filter}" filter.`}
            </p>
            {filter === 'All' && (
              <Link to="/create">
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-2xl hover:shadow-2xl transition-all duration-300 font-bold text-lg"
                >
                  <Plus className="w-6 h-6 mr-3" />
                  Create Your First Masterpiece
                </motion.button>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-6"}
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedIPs.map((ip, index) => (
                <motion.div
                  key={ip.tokenId || ip.id}
                  initial={{ opacity: 0, y: 40, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.8 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 200 
                  }}
                  layout
                >
                  <EnhancedIPCard 
                    ip={ip} 
                    viewMode={viewMode}
                    isSelected={selectedIP === (ip.tokenId || ip.id)}
                    onSelect={() => setSelectedIP(selectedIP === (ip.tokenId || ip.id) ? null : (ip.tokenId || ip.id))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface EnhancedIPCardProps {
  ip: any;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  onSelect: () => void;
}

function EnhancedIPCard({ ip, viewMode, isSelected, onSelect }: EnhancedIPCardProps) {
  const getStatusColor = (status: string) => {
    switch ((status || 'active').toLowerCase()) {
      case 'active':
        return 'from-green-400 to-green-600 text-white';
      case 'draft':
        return 'from-yellow-400 to-yellow-600 text-white';
      case 'disputed':
        return 'from-red-400 to-red-600 text-white';
      default:
        return 'from-gray-400 to-gray-600 text-white';
    }
  };

  const CategoryIcon = categoryIcons[ip.category] || categoryIcons.default;
  
  const cardVariants = {
    hover: {
      y: -10,
      scale: 1.03,
      rotateX: 5,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    },
    tap: {
      scale: 0.95
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={onSelect}
        className={`bg-white/90 dark:bg-camp-dark/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border-2 transition-all duration-500 cursor-pointer ${
          isSelected 
            ? 'border-purple-500 shadow-purple-500/25 shadow-2xl' 
            : 'border-white/20 dark:border-gray-700/20'
        }`}
      >
        <div className="flex items-center p-8 gap-8">
          <div className="relative">
            <motion.img
              whileHover={{ scale: 1.1, rotate: 5 }}
              src={ip.image || `https://picsum.photos/300/300?random=${ip.tokenId || ip.id}`}
              alt={ip.name}
              className="w-32 h-32 object-cover rounded-2xl shadow-xl"
            />
            <div className="absolute -top-2 -right-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className={`px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r ${getStatusColor(ip.status)} shadow-lg`}
              >
                {(ip.status || 'active').toUpperCase()}
              </motion.div>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-camp-dark dark:text-white flex items-center">
                <CategoryIcon className="w-6 h-6 mr-3 text-purple-500" />
                {ip.name}
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-camp-orange">{formatPrice(ip.price || 0)} ETH</div>
                <div className="text-sm text-cool-1 dark:text-cool-2">Current Price</div>
              </div>
            </div>
            
            <p className="text-cool-1 dark:text-gray-400 text-lg">{ip.description}</p>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-camp-dark dark:text-white">{ip.views || 0}</div>
                <div className="text-xs text-cool-1 dark:text-gray-400">Views</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-camp-dark dark:text-white">{ip.likes || 0}</div>
                <div className="text-xs text-cool-1 dark:text-gray-400">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-camp-dark dark:text-white">{ip.sales || 0}</div>
                <div className="text-xs text-cool-1 dark:text-gray-400">Sales</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatPrice(ip.revenue || 0)} ETH</div>
                <div className="text-xs text-cool-1 dark:text-gray-400">Revenue</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl transition-all duration-300"
            >
              <Edit className="w-5 h-5" />
            </motion.button>
            <Link to={`/ip/${ip.tokenId || ip.id}`}>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-xl transition-all duration-300"
              >
                <ExternalLink className="w-5 h-5" />
              </motion.button>
            </Link>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onSelect}
      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-2xl border-2 transition-all duration-500 cursor-pointer group ${
        isSelected 
          ? 'border-purple-500 shadow-purple-500/25 shadow-2xl' 
          : 'border-white/20 dark:border-gray-700/20'
      }`}
    >
      <div className="relative">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative overflow-hidden"
        >
          <img
            src={ip.image || `https://picsum.photos/400/250?random=${ip.tokenId || ip.id}`}
            alt={ip.name}
            className="w-full h-64 object-cover group-hover:brightness-110 transition-all duration-500"
          />
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex gap-3"
            >
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all">
                <Eye className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <div className="absolute top-4 right-4">
          <motion.div
            animate={{ 
              background: [
                `linear-gradient(45deg, ${getStatusColor(ip.status).split(' ')[1]}, ${getStatusColor(ip.status).split(' ')[3]})`,
                `linear-gradient(135deg, ${getStatusColor(ip.status).split(' ')[3]}, ${getStatusColor(ip.status).split(' ')[1]})`
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className={`px-3 py-1 rounded-xl text-xs font-bold ${getStatusColor(ip.status)} shadow-xl`}
          >
            {(ip.status || 'active').toUpperCase()}
          </motion.div>
        </div>
        
        <div className="absolute top-4 left-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-xl"
          >
            <CategoryIcon className="w-5 h-5 text-purple-500" />
          </motion.div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-camp-dark dark:text-white mb-2 line-clamp-2">
            {ip.name}
          </h3>
          <p className="text-cool-1 dark:text-gray-400 text-sm line-clamp-2">
            {ip.description}
          </p>
        </div>
        
        {/* Animated Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Eye, value: ip.views || 0, label: 'Views', color: 'text-blue-500' },
            { icon: Heart, value: ip.likes || 0, label: 'Likes', color: 'text-pink-500' },
            { icon: Download, value: ip.sales || 0, label: 'Sales', color: 'text-green-500' },
            { icon: DollarSign, value: `${formatPrice(ip.revenue || 0)} ETH`, label: 'Revenue', color: 'text-yellow-500' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-2"
            >
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <div>
                <p className="text-sm font-bold text-camp-dark dark:text-white">{stat.value}</p>
                <p className="text-xs text-cool-1 dark:text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Price and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-2xl font-bold text-camp-orange">
              {formatPrice(ip.price || 0)} ETH
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {ip.createdAt ? new Date(ip.createdAt).toLocaleDateString() : ''}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl transition-all duration-300"
            >
              <Edit className="w-4 h-4" />
            </motion.button>
            <Link to={`/ip/${ip.tokenId || ip.id}`}>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-xl transition-all duration-300"
              >
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </div>
        
        {/* Performance Bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.5, duration: 1 }}
          className="space-y-2"
        >
          <div className="flex justify-between text-xs text-cool-1 dark:text-gray-400">
            <span>Performance</span>
            <span>{Math.min(100, ((ip.views || 0) + (ip.likes || 0) * 2 + (ip.sales || 0) * 10) / 10)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((ip.views || 0) + (ip.likes || 0) * 2 + (ip.sales || 0) * 10) / 10)}%` }}
              transition={{ delay: 0.8, duration: 1.5 }}
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 h-2 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
