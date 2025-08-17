import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Filter, 
  Grid, 
  List, 
  Search,
  Eye,
  Heart,
  DollarSign,
  Share2,
  Edit,
  TrendingUp,
  Star,
  Shield,
  Sparkles,
  Camera,
  BarChart3
} from 'lucide-react'
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'

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

export default function MyIPs() {
  const { authenticated } = useAuthState()
  const auth = useAuth();

  const { getOriginData,getOriginUsage,isPending : isLoading } = useCampfireIntegration()
  const [ipAssets,setIpAssets] = useState<any[]>([])
  const [filteredIPs, setFilteredIPs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
const userAddress = auth.walletAddress;
  const [stats,setStats] = useState({
    totalIPs: 3,
    totalRevenue: 23.4,
    totalViews: 2866,
    totalLikes: 479
  })

    useEffect(() => {
  const fetchData = async () => {
    let data = await getOriginData(userAddress ? userAddress : '')
    if (data) {
      data = data.filter(ip => ip.metadata?.image && ip.metadata.image !== '')
      setIpAssets(data)
      setStats(prev => ({
        ...prev,
        totalIPs: data.length
      }))
    }
    const usage = await getOriginUsage()
      if(usage?.data.user){
        setStats(prev => ({
        ...prev,
        totalRevenue: usage.data.user.points,
        totalLikes: usage.data.user.multiplier,

      }))
      }
    
  }

  fetchData()
}, [])

  useEffect(() => {

    // Filter IPs based on search and category
    let filtered =ipAssets


   if (searchTerm) {
  filtered = filtered.filter(ip => {
    const name = (ip.name ?? ip.metadata?.name ?? '').toString().toLowerCase()
    const desc = (ip.description ?? ip.metadata?.description ?? '').toString().toLowerCase()
    return name.includes(searchTerm.toLowerCase()) || desc.includes(searchTerm.toLowerCase())
  })
}

    if (filterCategory !== 'All') {
      filtered = filtered.filter(ip => ip.category === filterCategory)
    }

    setFilteredIPs(filtered)
  }, [ipAssets, searchTerm, filterCategory])


  const categories = ['All', 'AI/ML', 'Art', 'Code', 'Music', 'Design', 'Video', 'Writing']

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-camp-light/30 via-white to-cool-3/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-6"
        >
          <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-camp-dark mb-4">Authentication Required</h2>
          <p className="text-cool-1 mb-8">Please connect your wallet to view your IP portfolio</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 gradient-bg text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Connect Wallet
          </Link>
        </motion.div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-camp-light/30 via-white to-cool-3/20 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-camp-dark mb-2">
                My <span className="text-gradient">IP Portfolio</span>
              </h1>
              <p className="text-cool-1 text-lg">Manage and track your intellectual property assets</p>
            </div>
            <Link
              to="/create"
              className="inline-flex items-center px-6 py-3 gradient-bg text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New IP
            </Link>
          </div>

          {/* Stats Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <motion.div variants={itemVariants} className="glass-effect rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-camp-dark mb-1">{stats.totalIPs}</div>
              <div className="text-cool-1 text-sm">Total IP Assets</div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-effect rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-camp-dark mb-1">{stats.totalRevenue} CAMP</div>
              <div className="text-cool-1 text-sm">Total Revenue</div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-effect rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-camp-dark mb-1">{stats.totalViews.toLocaleString()}</div>
              <div className="text-cool-1 text-sm">Total Views</div>
            </motion.div>

            <motion.div variants={itemVariants} className="glass-effect rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-camp-dark mb-1">{stats.totalLikes}</div>
              <div className="text-cool-1 text-sm">Total Likes</div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6 mb-8 border border-white/20"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cool-1 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your IPs..."
                className="w-full pl-12 pr-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange bg-white/50 backdrop-blur-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 pr-12 focus:ring-2 focus:ring-camp-orange focus:border-camp-orange transition-all"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cool-1 w-5 h-5 pointer-events-none" />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white/30 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-camp-orange shadow-lg'
                    : 'text-cool-1 hover:bg-white/50'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-camp-orange shadow-lg'
                    : 'text-cool-1 hover:bg-white/50'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* IP Assets Grid/List */}
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-camp-dark mb-2">Loading Your IPs...</h3>
              <p className="text-cool-1">Fetching your amazing creations</p>
            </motion.div>
          ) : filteredIPs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-cool-3/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-cool-2" />
              </div>
              <h3 className="text-2xl font-semibold text-camp-dark mb-4">
                {searchTerm || filterCategory !== 'All' ? 'No IPs Found' : 'No IP Assets Yet'}
              </h3>
              <p className="text-cool-1 mb-8 max-w-md mx-auto">
                {searchTerm || filterCategory !== 'All' 
                  ? 'Try adjusting your search or filters'
                  : 'Start creating and tokenizing your intellectual property to build your portfolio'
                }
              </p>
              {!searchTerm && filterCategory === 'All' && (
                <Link
                  to="/create"
                  className="inline-flex items-center px-8 py-4 gradient-bg text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First IP
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
              }
            >
              {filteredIPs
              .filter(ip => ip.metadata?.image && ip.metadata.image !== '')
              .map((ip, index) => (
                <IPCard key={ip.id} value={ip.value} id={ip.id} ip={ip.metadata} viewMode={viewMode} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function IPCard({ id, ip, viewMode ,value }: { id: string; ip: any; value:string; viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <motion.div
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        className="glass-effect rounded-2xl p-6 border border-white/20 hover-lift group"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={ip.image}
              alt={ip.name}
              className="w-24 h-18 rounded-xl object-cover"
            />
            {ip.featured && (
              <div className="absolute -top-2 -right-2 w-6 h-6 gradient-bg rounded-full flex items-center justify-center">
                <Star className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-camp-dark group-hover:text-camp-orange transition-colors">
                  {ip.name}
                </h3>
                <span className="inline-block px-2 py-1 bg-camp-orange/10 text-camp-orange rounded-lg text-xs font-medium mt-1">
                  {ip.category}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-camp-dark">{value} CAMP</div>
                <div className="text-sm text-green-600">+{ip.revenue} CAMP earned</div>
              </div>
            </div>

            <p className="text-cool-1 text-sm mb-3 line-clamp-2">{ip.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-cool-1">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{ip.views}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{ip.likes}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4 text-cool-1" />
                </button>
                <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-cool-1" />
                </button>
                <Link
                  to={`/ip/${id}`}
                  className="px-4 py-2 gradient-bg text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  View
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
      variants={itemVariants}
      initial="hidden"
              animate="visible"
      whileHover={{ scale: 1.05 }}
      className="glass-effect rounded-2xl overflow-hidden border border-white/20 hover-lift group"
    >
      <div className="relative">
        {/* Show video if ip.animation_url exists */}
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

        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-camp-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {ip.featured && (
          <div className="absolute top-3 left-3 w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
        <Star className="w-4 h-4 text-white" />
          </div>
        )}
        
        <div className="absolute top-3 right-3"></div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-camp-dark mb-2 group-hover:text-camp-orange transition-colors">
          {ip.name}
        </h3>
        <p className="text-cool-1 text-sm mb-4 line-clamp-2">{ip.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 text-sm text-cool-1">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{ip.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4" />
              <span>{ip.likes}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-camp-dark">{ip.price ? ip.price : value} CAMP</div>
            <div className="text-xs text-green-600">+{ip.revenue} CAMP</div>
          </div>
        </div>

        <Link
             to={`/ip/${id}`}
          className="block w-full text-center px-4 py-3 gradient-bg text-white rounded-xl font-medium hover:shadow-lg transition-all"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  )
}
