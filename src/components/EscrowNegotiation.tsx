import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Handshake, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  Shield,
  RefreshCw
} from 'lucide-react'
import { useCampfireIntegration, type CampfireIP } from '@/hooks/useCampfireIntegration'
import { formatEther } from 'viem'
import type { Address } from 'viem'

interface EscrowNegotiationProps {
  ip: CampfireIP
  onClose: () => void
  buyerAddress?: Address
  initialPrice?: string
}

export const EscrowNegotiation: React.FC<EscrowNegotiationProps> = ({
  ip,
  onClose,
  buyerAddress,
  initialPrice
}) => {
  const {
    createEscrowDeal,
    fundEscrowDeal,
    confirmEscrowTransfer,
    cancelEscrowDeal,
    useEscrowDeal,
    loading,
    error,
    success,
    address,
    clearError,
    clearSuccess
  } = useCampfireIntegration()

  const [negotiationPrice, setNegotiationPrice] = useState(initialPrice || ip.price)
  const [buyerAddr, setBuyerAddr] = useState(buyerAddress || '')
  const [step, setStep] = useState<'setup' | 'created' | 'funded' | 'confirmed' | 'completed'>('setup')
  const [messages, setMessages] = useState<Array<{
    id: string
    sender: string
    message: string
    timestamp: Date
    type: 'message' | 'system'
  }>>([])
  const [newMessage, setNewMessage] = useState('')

  // Get escrow deal data
  const { data: escrowData } = useEscrowDeal(ip.tokenId)

  const isOwner = address === ip.owner
  const isBuyer = address === buyerAddr

  useEffect(() => {
    if (escrowData) {
      const [, , , status, sellerConfirmed, buyerConfirmed] = escrowData as [Address, Address, bigint, number, boolean, boolean]
      
      if (status === 0) {
        setStep('created')
      } else if (status === 1) {
        setStep('funded')
      } else if (status === 2 && sellerConfirmed && buyerConfirmed) {
        setStep('completed')
      } else if (status === 2) {
        setStep('confirmed')
      }
    }
  }, [escrowData])

  useEffect(() => {
    if (success) {
      addSystemMessage(success)
      setTimeout(() => clearSuccess(), 3000)
    }
  }, [success, clearSuccess])

  useEffect(() => {
    if (error) {
      addSystemMessage(`Error: ${error}`)
      setTimeout(() => clearError(), 5000)
    }
  }, [error, clearError])

  const addSystemMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'System',
      message,
      timestamp: new Date(),
      type: 'system'
    }])
  }

  const addMessage = () => {
    if (!newMessage.trim()) return
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: isOwner ? 'Seller' : 'Buyer',
      message: newMessage,
      timestamp: new Date(),
      type: 'message'
    }])
    setNewMessage('')
  }

  const handleCreateDeal = async () => {
    if (!buyerAddr || !negotiationPrice) {
      addSystemMessage('Please provide buyer address and negotiation price')
      return
    }

    const success = await createEscrowDeal(ip.tokenId, buyerAddr as Address, negotiationPrice)
    if (success) {
      setStep('created')
      addSystemMessage(`Escrow deal created for ${negotiationPrice} CAMP. Waiting for buyer to fund the deal.`)
    }
  }

  const handleFundDeal = async () => {
    const success = await fundEscrowDeal(ip.tokenId, negotiationPrice)
    if (success) {
      setStep('funded')
      addSystemMessage(`Deal funded with ${negotiationPrice} CAMP. Both parties can now confirm the transfer.`)
    }
  }

  const handleConfirmTransfer = async () => {
    const success = await confirmEscrowTransfer(ip.tokenId)
    if (success) {
      addSystemMessage('Transfer confirmed. Waiting for the other party to confirm.')
    }
  }

  const handleCancelDeal = async () => {
    const success = await cancelEscrowDeal(ip.tokenId)
    if (success) {
      setStep('setup')
      addSystemMessage('Escrow deal cancelled.')
    }
  }

  const getStepStatus = (currentStep: string) => {
    const steps = ['setup', 'created', 'funded', 'confirmed', 'completed']
    const currentIndex = steps.indexOf(step)
    const stepIndex = steps.indexOf(currentStep)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'current'
    return 'pending'
  }

  const getEscrowStatus = () => {
    if (!escrowData) return null
    
    const [seller, buyer, price, status, sellerConfirmed, buyerConfirmed] = escrowData as [Address, Address, bigint, number, boolean, boolean]
    
    return {
      seller,
      buyer,
      price: formatEther(price),
      status,
      sellerConfirmed,
      buyerConfirmed
    }
  }

  const escrowStatus = getEscrowStatus()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Handshake className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">P2P Escrow Negotiation</h2>
                <p className="opacity-90">Secure peer-to-peer IP transfer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - IP Details & Progress */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            {/* IP Card */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <img
                src={ip.image}
                alt={ip.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold text-lg mb-1">{ip.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{ip.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Original Price:</span>
                <span className="font-bold text-orange-600">{ip.price} CAMP</span>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="space-y-4">
              <h4 className="font-semibold mb-3">Escrow Progress</h4>
              
              {['setup', 'created', 'funded', 'confirmed', 'completed'].map((stepName, index) => {
                const status = getStepStatus(stepName)
                const stepLabels = {
                  setup: 'Setup Deal',
                  created: 'Deal Created',
                  funded: 'Deal Funded', 
                  confirmed: 'Confirmations',
                  completed: 'Completed'
                }

                return (
                  <div key={stepName} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'completed' ? 'bg-green-500 text-white' :
                      status === 'current' ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>
                    <span className={`font-medium ${
                      status === 'current' ? 'text-orange-600' : 
                      status === 'completed' ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {stepLabels[stepName as keyof typeof stepLabels]}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Current Status */}
            {escrowStatus && (
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-blue-600" />
                  Escrow Status
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium">{escrowStatus.price} CAMP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      escrowStatus.status === 2 ? 'text-green-600' :
                      escrowStatus.status === 1 ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {escrowStatus.status === 2 ? 'In Confirmation' :
                       escrowStatus.status === 1 ? 'Funded' : 'Created'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seller Confirmed:</span>
                    <span className={`font-medium ${escrowStatus.sellerConfirmed ? 'text-green-600' : 'text-gray-500'}`}>
                      {escrowStatus.sellerConfirmed ? '✓ Yes' : '○ No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Buyer Confirmed:</span>
                    <span className={`font-medium ${escrowStatus.buyerConfirmed ? 'text-green-600' : 'text-gray-500'}`}>
                      {escrowStatus.buyerConfirmed ? '✓ Yes' : '○ No'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Panel - Chat/Negotiation */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <h4 className="font-semibold mb-3 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Negotiation Chat
              </h4>
              
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.type === 'system' 
                        ? 'bg-blue-100 border-l-4 border-blue-500' 
                        : msg.sender === 'Seller' 
                          ? 'bg-orange-100 ml-4' 
                          : 'bg-green-100 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span className="font-medium">{msg.sender}</span>
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addMessage()}
                />
                <button
                  onClick={addMessage}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Actions */}
          <div className="w-1/3 p-6 overflow-y-auto">
            <h4 className="font-semibold mb-4">Deal Actions</h4>

            {step === 'setup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Buyer Address</label>
                  <input
                    type="text"
                    value={buyerAddr}
                    onChange={(e) => setBuyerAddr(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    disabled={!isOwner}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Negotiation Price (CAMP)</label>
                  <input
                    type="text"
                    value={negotiationPrice}
                    onChange={(e) => setNegotiationPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {isOwner && (
                  <button
                    onClick={handleCreateDeal}
                    disabled={loading || !buyerAddr || !negotiationPrice}
                    className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Handshake className="h-4 w-4" />
                    )}
                    <span>Create Escrow Deal</span>
                  </button>
                )}
              </div>
            )}

            {step === 'created' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm font-medium">Waiting for buyer to fund the deal</span>
                  </div>
                </div>

                {isBuyer && (
                  <button
                    onClick={handleFundDeal}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <DollarSign className="h-4 w-4" />
                    )}
                    <span>Fund Deal ({negotiationPrice} CAMP)</span>
                  </button>
                )}

                <button
                  onClick={handleCancelDeal}
                  disabled={loading}
                  className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  Cancel Deal
                </button>
              </div>
            )}

            {(step === 'funded' || step === 'confirmed') && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium">Deal funded! Ready for confirmation</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmTransfer}
                  disabled={loading || !!(escrowStatus && ((isOwner && escrowStatus.sellerConfirmed) || (isBuyer && escrowStatus.buyerConfirmed)))}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>
                    {escrowStatus && ((isOwner && escrowStatus.sellerConfirmed) || (isBuyer && escrowStatus.buyerConfirmed))
                      ? 'Already Confirmed'
                      : 'Confirm Transfer'
                    }
                  </span>
                </button>

                {escrowStatus && escrowStatus.sellerConfirmed && escrowStatus.buyerConfirmed && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-semibold">Transfer Complete!</p>
                    <p className="text-sm text-green-700">The IP has been successfully transferred</p>
                  </div>
                )}
              </div>
            )}

            {step === 'completed' && (
              <div className="text-center space-y-4">
                <div className="bg-green-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800">Deal Completed!</h3>
                <p className="text-green-700">The IP has been successfully transferred through escrow</p>
              </div>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
                error ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                {error ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <span>{error || success}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
