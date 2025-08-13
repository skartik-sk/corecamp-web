import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  Gavel, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  CheckCircle,
  X,
  MessageCircle
} from 'lucide-react'
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'
import { EscrowNegotiation } from './EscrowNegotiation'
import type { Address } from 'viem'
import type { CampfireIP } from '@/hooks/useCampfireIntegration'

interface TradingInterfaceProps {
  tokenId: bigint
  currentPrice: string
  isOwner: boolean
  ipData?: CampfireIP // Add IP data for P2P negotiation
}

export default function TradingInterface({ 
  tokenId, 
  currentPrice, 
  isOwner,
  ipData
}: TradingInterfaceProps) {
  const {
    listNFTOnMarketplace,
    buyNFTFromMarketplace,
    createAuction,
    createEscrowDeal,
    startLottery,
    useMarketplaceListing,
    useAuctionDetails,
    useEscrowDeal,
    loading,
    error,
    success,
    isConnected,
    clearError,
    clearSuccess
  } = useCampfireIntegration()

  const [activeTab, setActiveTab] = useState<'buy' | 'auction' | 'escrow' | 'lottery'>('buy')
  const [showModal, setShowModal] = useState(false)
  const [showP2PNegotiation, setShowP2PNegotiation] = useState(false)
  const [formData, setFormData] = useState({
    price: currentPrice || '0.001',
    duration: '7', // days
    buyerAddress: '',
    ticketPrice: '0.01',
    maxTickets: '100'
  })

  // Contract data
  const { data: marketplaceListing } = useMarketplaceListing(tokenId)
  const { data: auctionData } = useAuctionDetails(tokenId)
  const { data: escrowData } = useEscrowDeal(tokenId)

  const handleBuyAccess = async () => {
    try {
      await buyNFTFromMarketplace(tokenId, currentPrice)
      setShowModal(false)
    } catch (err) {
      console.error('Buy access error:', err)
    }
  }

  const handleListMarketplace = async () => {
    try {
      await listNFTOnMarketplace(tokenId, formData.price)
      setShowModal(false)
    } catch (err) {
      console.error('List marketplace error:', err)
    }
  }

  const handleCreateAuction = async () => {
    try {
      const durationSeconds = parseInt(formData.duration) * 24 * 60 * 60
      await createAuction(tokenId, formData.price, durationSeconds)
      setShowModal(false)
    } catch (err) {
      console.error('Create auction error:', err)
    }
  }

  const handleCreateEscrow = async () => {
    try {
      await createEscrowDeal(tokenId, formData.buyerAddress as Address, formData.price)
      setShowModal(false)
    } catch (err) {
      console.error('Create escrow error:', err)
    }
  }

  const handleStartLottery = async () => {
    try {
      const durationSeconds = parseInt(formData.duration) * 1 * 60 * 60
      await startLottery(
        tokenId, 
        formData.ticketPrice, 
        parseInt(formData.maxTickets), 
        durationSeconds
      )
      setShowModal(false)
    } catch (err) {
      console.error('Start lottery error:', err)
    }
  }

  const getActionButton = () => {
    if (!isConnected) {
      return (
        <button 
          disabled
          className="w-full py-3 bg-gray-300 text-gray-500 rounded-xl font-medium cursor-not-allowed"
        >
          Connect Wallet to Trade
        </button>
      )
    }

    if (isOwner) {
      return (
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium"
        >
          List for Sale
        </button>
      )
    }

    return (
      <div className="space-y-3">
        <button
          onClick={handleBuyAccess}
          disabled={loading}
          className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
        >
          {loading ? 'Processing...' : `Buy Access - ${currentPrice} ETH`}
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 border border-camp-orange text-camp-orange bg-white hover:bg-camp-orange hover:text-white transition-all rounded-xl font-medium"
        >
          Negotiate Deal
        </button>
      </div>
    )
  }

  const renderModalContent = () => {
    if (!isOwner) {
      return (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-camp-dark">Start Negotiation</h3>
          
          <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
            {(['auction', 'escrow'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-white text-camp-orange shadow-sm'
                    : 'text-gray-600 hover:text-camp-orange'
                }`}
              >
                {tab === 'auction' && <><Gavel className="w-4 h-4 mr-2 inline" />Auction</>}
                {tab === 'escrow' && <><ShieldCheck className="w-4 h-4 mr-2 inline" />P2P Deal</>}
              </button>
            ))}
          </div>

          {activeTab === 'auction' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
                />
              </div>
              <button
                onClick={handleCreateAuction}
                disabled={loading}
                className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Start Auction'}
              </button>
            </motion.div>
          )}

          {activeTab === 'escrow' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={formData.buyerAddress}
                  onChange={(e) => setFormData({...formData, buyerAddress: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agreed Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
                />
              </div>
              <button
                onClick={handleCreateEscrow}
                disabled={loading || !formData.buyerAddress}
                className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Escrow Deal'}
              </button>
            </motion.div>
          )}
        </div>
      )
    }

    // Owner options
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-camp-dark">List Your IP</h3>
        
        <div className="flex space-x-2 bg-gray-100 rounded-xl p-1">
          {(['buy', 'auction', 'escrow', 'lottery'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-2 rounded-lg font-medium transition-all text-xs ${
                activeTab === tab
                  ? 'bg-white text-camp-orange shadow-sm'
                  : 'text-gray-600 hover:text-camp-orange'
              }`}
            >
              {tab === 'buy' && <><DollarSign className="w-3 h-3 mr-1 inline" />Sale</>}
              {tab === 'auction' && <><Gavel className="w-3 h-3 mr-1 inline" />Auction</>}
              {tab === 'escrow' && <><ShieldCheck className="w-3 h-3 mr-1 inline" />P2P</>}
              {tab === 'lottery' && <><Zap className="w-3 h-3 mr-1 inline" />Lottery</>}
            </button>
          ))}
        </div>

        {activeTab === 'buy' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Price (CAMP)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
              />
            </div>
            <button
              onClick={handleListMarketplace}
              disabled={loading}
              className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
            >
              {loading ? 'Listing...' : 'List for Sale'}
            </button>
          </motion.div>
        )}

        {activeTab === 'auction' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starting Bid (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (days)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
              />
            </div>
            <button
              onClick={handleCreateAuction}
              disabled={loading}
              className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Start Auction'}
            </button>
          </motion.div>
        )}

        {activeTab === 'escrow' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* P2P Negotiation Option */}
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center mb-3">
                <MessageCircle className="h-5 w-5 text-orange-600 mr-2" />
                <h3 className="font-semibold text-gray-800">P2P Negotiation</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Start a secure escrow negotiation with real-time chat and step-by-step deal management.
              </p>
              <button
                onClick={() => setShowP2PNegotiation(true)}
                disabled={!ipData}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50"
              >
                Start P2P Negotiation
              </button>
            </div>

            {/* Quick Escrow Option */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 mb-3">Quick Escrow</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={formData.buyerAddress}
                  onChange={(e) => setFormData({...formData, buyerAddress: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agreed Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
                />
              </div>
              <button
                onClick={handleCreateEscrow}
                disabled={loading || !formData.buyerAddress}
                className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Escrow Deal'}
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'lottery' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={formData.ticketPrice}
                  onChange={(e) => setFormData({...formData, ticketPrice: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tickets
                </label>
                <input
                  type="number"
                  value={formData.maxTickets}
                  onChange={(e) => setFormData({...formData, maxTickets: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (days)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-camp-orange"
              />
            </div>
            <button
              onClick={handleStartLottery}
              disabled={loading}
              className="w-full py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Lottery'}
            </button>
          </motion.div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Action Button */}
      <div className="bg-white rounded-2xl p-6 card-shadow">
        <h3 className="text-xl font-semibold text-camp-dark mb-4">Trade This IP</h3>
        
        {/* Status Messages */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-4 rounded-xl border-2 ${
                error 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {error ? (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">{error || success}</span>
                </div>
                <button
                  onClick={() => {
                    clearError()
                    clearSuccess()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {getActionButton()}

        {/* Current Status */}
        {(!!marketplaceListing || !!auctionData || !!escrowData) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-cool-1 mb-2">Current Status:</p>
            {!!marketplaceListing && (
              <div className="flex items-center text-sm text-green-600">
                <DollarSign className="w-4 h-4 mr-1" />
                Listed for sale
              </div>
            )}
            {!!auctionData && (
              <div className="flex items-center text-sm text-blue-600">
                <Gavel className="w-4 h-4 mr-1" />
                In auction
              </div>
            )}
            {!!escrowData && (
              <div className="flex items-center text-sm text-purple-600">
                <ShieldCheck className="w-4 h-4 mr-1" />
                In escrow
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trading Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div />
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {renderModalContent()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* P2P Escrow Negotiation Modal */}
      <AnimatePresence>
        {showP2PNegotiation && ipData && (
          <EscrowNegotiation
            ip={ipData}
            onClose={() => setShowP2PNegotiation(false)}
            initialPrice={currentPrice}
          />
        )}
      </AnimatePresence>
    </>
  )
}
