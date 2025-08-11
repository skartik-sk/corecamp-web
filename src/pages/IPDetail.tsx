import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { ArrowLeft, Heart, Share2, Download, Eye, Calendar, User, DollarSign, Clock, MessageCircle } from 'lucide-react'

interface IPDetails {
  tokenId: string
  title: string
  description: string
  creator: string
  owner: string
  category: string
  tags: string[]
  price: string
  royalty: number
  duration: number
  views: number
  likes: number
  createdAt: string
  image: string
  mimeType: string
  size: number
  isLiked: boolean
}

const mockIP: IPDetails = {
  tokenId: '1',
  title: 'Digital Art Collection #001',
  description: 'A unique collection of AI-generated digital artwork with commercial licensing rights. This piece represents the fusion of artificial intelligence and human creativity, exploring themes of digital identity and virtual aesthetics.',
  creator: '0x1234567890abcdef',
  owner: '0x1234567890abcdef',
  category: 'Art',
  tags: ['AI Art', 'Digital', 'NFT', 'Commercial'],
  price: '0.5 ETH',
  royalty: 5,
  duration: 0,
  views: 1250,
  likes: 42,
  createdAt: '2024-01-15',
  image: '/api/placeholder/600/400',
  mimeType: 'image/jpeg',
  size: 2048576,
  isLiked: false,
}

export default function IPDetail() {
  const { id } = useParams<{ id: string }>()
  const { origin } = useAuth()
  const { authenticated } = useAuthState()
  const [ip, setIp] = useState<IPDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isNegotiating, setIsNegotiating] = useState(false)

  useEffect(() => {
    // Simulate loading IP details
    const timer = setTimeout(() => {
      setIp(mockIP)
      setIsLiked(mockIP.isLiked)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [id])

  const handleLike = () => {
    setIsLiked(!isLiked)
    if (ip) {
      setIp({
        ...ip,
        likes: isLiked ? ip.likes - 1 : ip.likes + 1
      })
    }
  }

  const handleBuyAccess = async () => {
    if (!origin || !ip) return

    try {
      // This would call the Origin SDK to buy access
      console.log('Buying access to IP:', ip.tokenId)
      // await origin.buyAccess(BigInt(ip.tokenId), 1)
    } catch (error) {
      console.error('Error buying access:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!ip) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-camp-dark mb-4">IP Not Found</h1>
          <p className="text-cool-1 mb-8">The intellectual property you're looking for doesn't exist.</p>
          <Link
            to="/marketplace"
            className="inline-flex items-center px-6 py-3 bg-camp-orange text-white rounded-lg hover:bg-warm-1 transition-colors"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/marketplace"
          className="inline-flex items-center text-cool-1 hover:text-camp-dark mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image/Media */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-2xl overflow-hidden card-shadow">
              <img
                src={`https://picsum.photos/600/400?random=${ip.tokenId}`}
                alt={ip.title}
                className="w-full h-96 object-cover"
              />
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full ${
                    isLiked
                      ? 'bg-red-500 text-white'
                      : 'bg-white/90 text-gray-700 hover:bg-white'
                  } transition-colors`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 bg-white/90 text-gray-700 hover:bg-white rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* File Info */}
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h3 className="text-lg font-semibold text-camp-dark mb-4">File Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cool-1">Type:</span>
                  <span className="text-camp-dark">{ip.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cool-1">Size:</span>
                  <span className="text-camp-dark">{(ip.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cool-1">Token ID:</span>
                  <span className="text-camp-dark font-mono">{ip.tokenId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-camp-dark">{ip.title}</h1>
                <span className="bg-cool-3 text-cool-1 text-sm px-3 py-1 rounded-full">
                  {ip.category}
                </span>
              </div>

              <div className="flex items-center space-x-6 text-sm text-cool-1 mb-6">
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {ip.views} views
                </span>
                <span className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {ip.likes} likes
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(ip.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-cool-1 mb-6 leading-relaxed">
                {ip.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {ip.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-cool-3/50 text-cool-1 text-sm px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Creator/Owner Info */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-cool-1 mb-1">Created by</p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-mono text-camp-dark">
                        {ip.creator.slice(0, 6)}...{ip.creator.slice(-4)}
                      </span>
                    </div>
                  </div>
                  {ip.creator !== ip.owner && (
                    <div>
                      <p className="text-sm text-cool-1 mb-1">Owned by</p>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-cool-1 to-cool-2 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-mono text-camp-dark">
                          {ip.owner.slice(0, 6)}...{ip.owner.slice(-4)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Licensing & Purchase */}
            <div className="bg-white rounded-2xl p-6 card-shadow">
              <h3 className="text-xl font-semibold text-camp-dark mb-4">License Terms</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-cool-1">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Price
                  </span>
                  <span className="text-xl font-bold text-camp-orange">{ip.price}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-cool-1">
                    <Clock className="w-4 h-4 mr-2" />
                    Duration
                  </span>
                  <span className="text-camp-dark">
                    {ip.duration === 0 ? 'Perpetual' : `${ip.duration} days`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-cool-1">Royalty</span>
                  <span className="text-camp-dark">{ip.royalty}%</span>
                </div>
              </div>

              {authenticated ? (
                <div className="space-y-3">
                  <button
                    onClick={handleBuyAccess}
                    className="w-full py-3 bg-camp-orange text-white rounded-lg hover:bg-warm-1 transition-colors font-medium"
                  >
                    Buy License - {ip.price}
                  </button>
                  
                  <button
                    onClick={() => setIsNegotiating(true)}
                    className="w-full py-3 border border-camp-orange text-camp-orange bg-white hover:bg-camp-orange hover:text-white transition-colors rounded-lg font-medium flex items-center justify-center"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Negotiate Terms
                  </button>
                  
                  <button className="w-full py-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors rounded-lg font-medium flex items-center justify-center">
                    <Download className="w-4 h-4 mr-2" />
                    Download Preview
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-cool-1 mb-4">Connect your wallet to purchase this IP license</p>
                  <button className="w-full py-3 bg-camp-orange text-white rounded-lg hover:bg-warm-1 transition-colors font-medium">
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Negotiation Modal */}
        {isNegotiating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-camp-dark mb-4">Negotiate License Terms</h3>
              <p className="text-cool-1 mb-4">
                Start a conversation with the IP owner to negotiate custom terms.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsNegotiating(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <Link
                  to="/chat"
                  className="flex-1 py-2 bg-camp-orange text-white rounded-lg hover:bg-warm-1 transition-colors text-center"
                  onClick={() => setIsNegotiating(false)}
                >
                  Start Chat
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
