import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@campnetwork/origin/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  SortAsc, 
  Grid, 
  List, 
  Star, 
  Clock, 
  DollarSign,
  Eye,
  Heart,
  Zap,
  Shield
} from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import clsx from 'clsx'

const categories = ['All', 'AI/ML', 'Art', 'Music', 'Design', 'Code', 'Writing', 'Video', 'Other']
const sortOptions = ['Most Recent', 'Price: Low to High', 'Price: High to Low', 'Most Popular']

// Mock data for demonstration
const mockIPAssets = [
  {
    id: '1',
    tokenId: '1',
    name: 'AI Trading Algorithm v2.0',
    description: 'Advanced machine learning model for cryptocurrency trading with 87% accuracy rate.',
    category: 'AI/ML',
    price: '2.5',
    currency: 'ETH',
    creator: '0x742d35Cc6634C0532925a3b8D7Cc6d6C1234567890',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&h=300&fit=crop',
    likes: 234,
    views: 1542,
    createdAt: '2024-01-15T10:30:00Z',
    verified: true,
    featured: true
  },
  {
    id: '2',
    tokenId: '2',
    name: 'Digital Art Collection',
    description: 'Unique digital artworks created with AI assistance, ready for commercial licensing.',
    category: 'Art',
    price: '0.8',
    currency: 'ETH',
    creator: '0x742d35Cc6634C0532925a3b8D7Cc6d6C9876543210',
    image: 'https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=500&h=300&fit=crop',
    likes: 89,
    views: 432,
    createdAt: '2024-01-14T15:45:00Z',
    verified: false,
    featured: false
  },
  {
    id: '3',
    tokenId: '3',
    name: 'Smart Contract Library',
    description: 'Battle-tested smart contracts for DeFi applications with comprehensive documentation.',
    category: 'Code',
    price: '1.2',
    currency: 'ETH',
    creator: '0x742d35Cc6634C0532925a3b8D7Cc6d6C5555555555',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=300&fit=crop',
    likes: 156,
    views: 892,
    createdAt: '2024-01-13T09:20:00Z',
    verified: true,
    featured: true
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
}

export default function Marketplace() {
  const { origin } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Most Recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [ipAssets, setIpAssets] = useState<any[]>(mockIPAssets)
  const [filteredIPs, setFilteredIPs] = useState<any[]>(mockIPAssets)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchIPs() {
      setIsLoading(true)
      setError(null)
      try {
        if (!origin) return
        // Try to fetch real assets, fallback to mock data
        setIpAssets(mockIPAssets)
      } catch (err) {
        setError('Using demo data - Origin SDK not available')
        setIpAssets(mockIPAssets)
      } finally {
        setIsLoading(false)
      }
    }
    fetchIPs()
  }, [origin])

  useEffect(() => {
    let filtered = ipAssets

    if (searchTerm) {
      filtered = filtered.filter(ip =>
        ip.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ip.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(ip => ip.category === selectedCategory)
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'Price: Low to High':
          return parseFloat(a.price) - parseFloat(b.price)
        case 'Price: High to Low':
          return parseFloat(b.price) - parseFloat(a.price)
        case 'Most Popular':
          return (b.likes || 0) - (a.likes || 0)
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredIPs(filtered)
  }, [ipAssets, searchTerm, selectedCategory, sortBy])

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
          <h1 className="text-5xl font-bold text-camp-dark mb-4">
            IP <span className="text-gradient">Marketplace</span>
          </h1>
          <p className="text-xl text-cool-1 max-w-2xl">
            Discover, buy, and license intellectual property from creators worldwide. 
            Build the future together.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div 
          className="glass-effect rounded-3xl p-6 mb-8 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cool-1 w-5 h-5" />
              <input
                type="text"
                placeholder="Search IPs, creators, or keywords..."
                className="w-full pl-12 pr-4 py-4 border border-white/20 rounded-2xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange bg-white/50 backdrop-blur-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 pr-12 focus:ring-2 focus:ring-camp-orange focus:border-camp-orange transition-all"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cool-1 w-5 h-5 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                className="appearance-none bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4 pr-12 focus:ring-2 focus:ring-camp-orange focus:border-camp-orange transition-all"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <SortAsc className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cool-1 w-5 h-5 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2 bg-white/30 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'grid'
                    ? 'bg-white text-camp-orange shadow-lg'
                    : 'text-cool-1 hover:bg-white/50'
                )}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  "p-3 rounded-xl transition-all",
                  viewMode === 'list'
                    ? 'bg-white text-camp-orange shadow-lg'
                    : 'text-cool-1 hover:bg-white/50'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              className="text-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-camp-dark mb-3">Loading Amazing IPs...</h3>
              <p className="text-cool-1">Fetching the best intellectual property assets for you</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              className="text-center py-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-20 h-20 bg-warm-1/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-warm-1" />
              </div>
              <h3 className="text-2xl font-semibold text-warm-1 mb-3">Demo Mode Active</h3>
              <p className="text-cool-1">Showing sample data - Origin SDK integration pending</p>
            </motion.div>
          ) : (
            <>
              <motion.div 
                className="mb-8 flex items-center justify-between"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-cool-1 text-lg">
                  Showing <span className="font-semibold text-camp-dark">{filteredIPs.length}</span> amazing IP{filteredIPs.length !== 1 ? 's' : ''}
                </p>
              </motion.div>

              <motion.div 
                className={clsx(
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                    : 'space-y-6'
                )}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredIPs.map((ip) => (
                  <IPCard key={ip.tokenId || ip.id} ip={ip} viewMode={viewMode} />
                ))}
              </motion.div>

              {filteredIPs.length === 0 && (
                <motion.div 
                  className="text-center py-24"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-20 h-20 bg-cool-3/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-cool-2" />
                  </div>
                  <h3 className="text-2xl font-semibold text-camp-dark mb-3">No IPs Found</h3>
                  <p className="text-cool-1">Try adjusting your search or filters to discover amazing IP assets</p>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function IPCard({ ip, viewMode }: { ip: any; viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <motion.div
        className="glass-effect rounded-3xl p-6 hover-lift border border-white/20 group"
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={ip.image || `https://picsum.photos/200/150?random=${ip.tokenId || ip.id}`}
              alt={ip.name}
              className="w-32 h-24 rounded-2xl object-cover"
            />
            {ip.featured && (
              <div className="absolute -top-2 -right-2 w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold text-camp-dark group-hover:text-camp-orange transition-colors">
                  {ip.name}
                </h3>
                <p className="text-cool-1 text-sm mt-1">by {formatAddress(ip.creator)}</p>
              </div>
              <div className="flex items-center space-x-2">
                {ip.verified && (
                  <div className="p-1 bg-green-100 rounded-full">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                )}
                <span className="px-3 py-1 bg-camp-orange/10 text-camp-orange rounded-full text-sm font-medium">
                  {ip.category}
                </span>
              </div>
            </div>

            <p className="text-cool-1 mb-4 line-clamp-2">{ip.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-cool-1">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{ip.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{ip.views}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-camp-dark">
                    {ip.price} {ip.currency}
                  </div>
                </div>
                <Link
                  to={`/ip/${ip.tokenId || ip.id}`}
                  className="px-6 py-2 gradient-bg text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="glass-effect rounded-3xl overflow-hidden hover-lift border border-white/20 group"
      variants={itemVariants}
      whileHover={{ scale: 1.05 }}
    >
      <div className="relative">
        <img
          src={ip.image || `https://picsum.photos/400/250?random=${ip.tokenId || ip.id}`}
          alt={ip.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-camp-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {ip.featured && (
          <div className="absolute top-4 left-4 w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex space-x-2">
          {ip.verified && (
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
              <Shield className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
            {ip.category}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-camp-dark mb-2 group-hover:text-camp-orange transition-colors">
          {ip.name}
        </h3>
        <p className="text-cool-1 text-sm mb-1">by {formatAddress(ip.creator)}</p>
        <p className="text-cool-1 mb-4 line-clamp-2">{ip.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 text-sm text-cool-1">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{ip.likes}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{ip.views}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-camp-dark">
              {ip.price} {ip.currency}
            </div>
          </div>
        </div>

        <Link
          to={`/ip/${ip.tokenId || ip.id}`}
          className="block w-full text-center px-6 py-3 gradient-bg text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  )
}
