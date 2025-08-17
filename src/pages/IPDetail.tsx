import { useState, useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@campnetwork/origin/react'
import { ArrowLeft, Heart, Share2, Eye, Calendar, User, DollarSign, Clock } from 'lucide-react'
import TradingInterface from '@/components/TradingInterface'
import { formatAddress } from '@/lib/utils'
import type { Address } from 'viem'
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'

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
  audio?: string // Optional audio field
  animation_url?: string // Optional animation URL field
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
    const location = useLocation()
  const params = new URLSearchParams(location.search)
  const auth = useAuth()
  const { origin } = auth
  const [ip, setIp] = useState<IPDetails | null>(null)
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isNegotiating, setIsNegotiating] = useState(false)
  const {getDataByTokenId}= useCampfireIntegration()

  // Mock user address for demo - in real app this would come from wallet
   const userAddress = params.get('userAddress') || (auth.walletAddress as Address)
const currAddress = auth.walletAddress as Address
  useEffect(() => {
    // Simulate loading IP details
    const fetchdata = async () => {
      const data = await getDataByTokenId(id || '0',userAddress)
      console.log(data)
      if (data) {
        setData(data)
        setIp(data.metadata)
        setIp((prev) => ({ ...prev, ...data.metadata, creator: userAddress }))
        setIsLiked(data.isLiked)
      }
      setIsLoading(false)
    }

   fetchdata()
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
        {ip.image && (
          <div className="relative bg-white rounded-2xl overflow-hidden card-shadow">
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
        className="w-full h-48 object-cover rounded-xl"
          />
        )}
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
        )}

        {/* File Info */}
        {(ip.mimeType || ip.size || ip.tokenId) && (
          <div className="bg-white rounded-2xl p-6 card-shadow">
          <h3 className="text-lg font-semibold text-camp-dark mb-4">File Information</h3>
          <div className="space-y-2 text-sm">
            {ip.mimeType && (
            <div className="flex justify-between">
              <span className="text-cool-1">Type:</span>
              <span className="text-camp-dark">{ip.mimeType}</span>
            </div>
            )}
            {ip.size && (
            <div className="flex justify-between">
              <span className="text-cool-1">Size:</span>
              <span className="text-camp-dark">{(ip.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            )}
            {ip.tokenId && (
            <div className="flex justify-between">
              <span className="text-cool-1">Token ID:</span>
              <span className="text-camp-dark font-mono">{ip.tokenId}</span>
            </div>
            )}
          </div>
          </div>
        )}
        </div>

        {/* Details */}
        <div className="space-y-6">
        {(ip.title || ip.category || ip.views || ip.likes || ip.createdAt || ip.description || (ip.tags && ip.tags.length > 0)) && (
          <div className="bg-white rounded-2xl p-6 card-shadow">
          <div className="flex items-start justify-between mb-4">
            {ip.title && (
            <h1 className="text-3xl font-bold text-camp-dark">{ip.title}</h1>
            )}
            {ip.category && (
            <span className="bg-cool-3 text-cool-1 text-sm px-3 py-1 rounded-full">
              {ip.category}
            </span>
            )}
          </div>

          <div className="flex items-center space-x-6 text-sm text-cool-1 mb-6">
            {ip.views !== undefined && (
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {ip.views} views
            </span>
            )}
            {ip.likes !== undefined && (
            <span className="flex items-center">
              <Heart className="w-4 h-4 mr-1" />
              {ip.likes} likes
            </span>
            )}
            {ip.createdAt && (
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(ip.createdAt).toLocaleDateString()}
            </span>
            )}
          </div>

          {ip.description && (
            <p className="text-cool-1 mb-6 leading-relaxed">
            {ip.description}
            </p>
          )}

          {/* Tags */}
          {ip.tags && ip.tags.length > 0 && (
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
          )}

          {/* Creator/Owner Info */}
          {(ip.creator || ip.owner) && (
            <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              {ip.owner && (
              <div>
                <p className="text-sm text-cool-1 mb-1">Created by</p>
                <div className="flex items-center">
                <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-mono text-camp-dark">
                  {ip.owner.slice(0, 6)}...{ip.owner.slice(-4)}
                </span>
                </div>
              </div>
              )}
              {ip.creator && ip.owner && ip.creator !== ip.owner && (
              <div>
                <p className="text-sm text-cool-1 mb-1">Owned by</p>
                <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-cool-1 to-cool-2 rounded-full flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-mono text-camp-dark">
                  {ip.creator.slice(0, 6)}...{ip.creator.slice(-4)}
                </span>
                </div>
              </div>
              )}
            </div>
            </div>
          )}
          </div>
        )}

        {/* Licensing & Purchase */}
        {data.id && ip.owner && data.value && (
          <TradingInterface
            tokenId={BigInt(data.id)}
            currentPrice={ip.price?ip.price:data.value.replace(' ETH', '')}
            isOwner={ip.creator === currAddress}
            ipData={{
              tokenId: BigInt(data.id),
              title: ip.title || data.metadata?.name || 'Untitled IP',
              description: ip.description || data.metadata?.description || '',
              category: ip.category || '',
              tags: ip.tags || [],
              creator: userAddress as Address,
              owner: ip.creator as Address,
              price: ip.price || data.value.replace(' ETH', ''),
              currency: 'ETH',
              royalty: ip.royalty || 0,
              duration: ip.duration || 0,
              views: ip.views || 0,
              likes: ip.likes || 0,
              createdAt: ip.createdAt || new Date().toISOString(),
              image: ip.image || data.metadata?.image || '/api/placeholder/600/400',
              mimeType: ip.mimeType || 'image/jpeg',
              size: ip.size || 0,
              isListed: false,
              isInAuction: false,
              isInEscrow: false,
              isInLottery: false,
              verified: false,
              featured: false
            }}
          />
        )}

        {/* License Information Card */}
        {(ip.price || ip.duration !== undefined || ip.royalty !== undefined) && (
          <div className="bg-white rounded-2xl p-6 card-shadow">
          <h3 className="text-xl font-semibold text-camp-dark mb-4">License Information</h3>
          <div className="space-y-4 mb-6">
            {ip.price && (
            <div className="flex items-center justify-between">
              <span className="flex items-center text-cool-1">
              <DollarSign className="w-4 h-4 mr-2" />
              Price
              </span>
              <span className="text-xl font-bold text-camp-orange">{ip.price}</span>
            </div>
            )}
            {ip.duration !== undefined && (
            <div className="flex items-center justify-between">
              <span className="flex items-center text-cool-1">
              <Clock className="w-4 h-4 mr-2" />
              Duration
              </span>
              <span className="text-camp-dark">
              {ip.duration === 0 ? 'Perpetual' : `${ip.duration} days`}
              </span>
            </div>
            )}
            {ip.royalty !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-cool-1">Royalty</span>
              <span className="text-camp-dark">{ip.royalty}%</span>
            </div>
            )}
          </div>
          <p className="text-sm text-cool-1 mt-2">
            This shows the original license terms from the IP NFT.
          </p>
          </div>
        )}
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
