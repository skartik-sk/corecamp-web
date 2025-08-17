import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  SortAsc, 
  Grid, 
  List, 
  Star, 
  Eye,
  Heart,
  Zap,
  Shield
} from 'lucide-react'
import { formatAddress } from '@/lib/utils'
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'
import clsx from 'clsx'

const categories = ['All', 'AI/ML', 'Art', 'Music', 'Design', 'Code', 'Writing', 'Video', 'Other']
const sortOptions = ['Most Recent', 'Price: Low to High', 'Price: High to Low', 'Most Popular']

// Mock data for demonstration


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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Most Recent')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [ipAssets, setIpAssets] = useState<any[]>([])
  const [filteredIPs, setFilteredIPs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { useAllMarketplaceListings,getDataByTokenId } = useCampfireIntegration()
  
  // Use the hook to get all marketplace listings
  const { data: allListings, isLoading: marketplaceLoading, error: marketplaceError } = useAllMarketplaceListings()

  useEffect(() => {
    const fetchdata = async () => {
      setIsLoading(marketplaceLoading)

      if (marketplaceError) {
        console.error('Marketplace error:', marketplaceError)
        setError('Using demo data - marketplace not available')
        setIpAssets([])
      } else if (allListings && Array.isArray(allListings)) {
        console.log('All marketplace listings:', allListings)

        // Transform contract listings to your expected format
        const transformedListings = await Promise.all(
          allListings.map(async (listing: any) => {
            let res: any = {}
            if (getDataByTokenId) {
              try {
                console.log(listing.tokenId, listing.seller)
                res = await getDataByTokenId(
                  typeof listing.tokenId === 'bigint'
                  ? listing.tokenId.toString()
                  : listing.tokenId,
                  listing.seller
                )
                console.log(res)
              } catch (err) {
                console.error('Error fetching metadata for tokenId', listing.tokenId, err)
              }
            }
            const extraData = res?.metadata || {}
            console.log(extraData)
            return {
              id: listing.tokenId?.toString() || listing.tokenId,
              tokenId: listing.tokenId?.toString() || listing.tokenId,
              name: extraData?.name || `IP Asset #${listing.tokenId}`,
              description: extraData?.description || 'Intellectual property asset available for licensing',
              category: extraData?.category || 'AI/ML',
              price: listing.price ? formatEther(listing.price) : '0',
              currency: 'CAMP',
              creator: listing.seller || '0x0000000000000000000000000000000000000000',
              image: extraData?.image || `https://picsum.photos/400/250?random=${listing.tokenId}`,
              likes: Math.floor(Math.random() * 500),
              views: Math.floor(Math.random() * 2000),
              createdAt: new Date().toISOString(),
              verified: Math.random() > 0.5,
              featured: Math.random() > 0.7,
              isActive: listing.isActive,
              animation_url: extraData?.animation_url,
              audio_url: extraData?.audio_url
            }
          })
        )

        // Only show active listings
        const activeListings = transformedListings.filter((listing: any) => listing.isActive)
        setIpAssets(activeListings)
      } else {
        // Use demo data when no contract data
        setIpAssets([])
      }
    }
    fetchdata()
  }, [allListings, marketplaceLoading, marketplaceError])

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
           {ip.animation_url ? (
          <video
        src={ip.animation_url}
muted
        autoPlay={true}
        controls
        className="w-full h-48 object-cover rounded-xl"
        poster={ip.image}
          />
        ) : ip.audio ? (
          // Show audio if ip.audio_url exists
          <div className="w-full h-48 flex items-center justify-center bg-camp-light/30 rounded-xl">
        <audio controls muted src={ip.audio} className="w-full" />
        <span className="absolute top-2 left-2 px-2 py-1 bg-camp-orange/80 text-white rounded text-xs">Audio</span>
          </div>
        ) : (
          // Fallback to image
          <img
        src={ip.image}
        alt={ip.type || ip.name}
        className="w-full h-48 object-cover rounded-xl"
          />
        )}
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
                  to={`/ip/${ip.tokenId || ip.id}?userAddress=${ip.creator}`}
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
       {ip.animation_url ? (
          <video
        src={ip.animation_url}
muted
        autoPlay={true}
              // allow autoplay and show controls
    playsInline         // avoid fullscreen on iOS
    controls
    loop 
        className="w-full h-48 object-cover rounded-xl"
        poster={ip.image}
          />
        ) : ip.audio_url ? (
          // Show audio if ip.audio_url exists
          <div className="w-full h-48 flex items-center justify-center bg-camp-light/30 rounded-xl">
        <audio controls muted src={ip.audio_url} className="w-full" />
        <span className="absolute top-2 left-2 px-2 py-1 bg-camp-orange/80 text-white rounded text-xs">Audio</span>
          </div>
        ) : (
          // Fallback to image
          <img
        src={ip.image}
        alt={ip.type || ip.name}
        className="w-full h-48 object-cover rounded-xl"
          />
        )}
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
 to={`/ip/${ip.tokenId || ip.id}?userAddress=${ip.creator}`}
          className="block w-full text-center px-6 py-3 gradient-bg text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  )
}
