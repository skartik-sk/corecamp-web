import { useState, useEffect, useRef } from 'react'
import { useCampfireIntegration } from '../hooks/useCampfireIntegration'
import { useAuth } from '@campnetwork/origin/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowRight, 
  MessageCircle, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Users, 
  Search, 
  TrendingUp, 
  Star, 
  Zap, 
  Send,
  Shield,
  CreditCard
} from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  getOpenNegotiations,
  startNegotiationChat,
  listenToMessages, 
  sendMessage as sendFirebaseMessage,
  makeOfferCommand,
  acceptOfferCommand,
  fundEscrowDeal,
  cancelEscrowDeal,
  createEscrowDealFirebase,
  listenToUserChats,
  getNegotiationsByUser,
  type ChatMessage,
  type NegotiationRequest,
  type ChatRoom
} from '../lib/firebase'


export default function Chat() {
  const auth = useAuth()
  const campfire = useCampfireIntegration()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get chat room from URL params
  const chatRoomId = searchParams.get('room')
  const tokenId = searchParams.get('token')
  const isOwnerParam = searchParams.get('owner') === 'true'
  
  // State
  const [negotiations, setNegotiations] = useState<NegotiationRequest[]>([])
  const [selectedNegotiation, setSelectedNegotiation] = useState<NegotiationRequest | null>(null)
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatRoomId)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [startingChat, setStartingChat] = useState(false)
  const [userChats, setUserChats] = useState<ChatRoom[]>([])
  const [ownerNegotiations, setOwnerNegotiations] = useState<NegotiationRequest[]>([])
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null)
  const [isOwnerView, setIsOwnerView] = useState(false)

  // Get user from auth - using walletAddress as fallback for now
  const userWalletAddress = auth.walletAddress

  // Load negotiations on mount
  useEffect(() => {
    const loadNegotiations = async () => {
      if (!userWalletAddress) return
      
      try {
        const openNegotiations = await getOpenNegotiations()
        setNegotiations(openNegotiations)
        
        // Load owner negotiations to determine if user is an owner
        const userOwnerNegotiations = await getNegotiationsByUser(userWalletAddress)
        setOwnerNegotiations(userOwnerNegotiations)
        
        // Check if user has any negotiations as owner or if URL indicates owner view
        const hasOwnerNegotiations = userOwnerNegotiations.length > 0
        setIsOwnerView(hasOwnerNegotiations || isOwnerParam)
        
        // If URL has token param and user is owner, find and select the negotiation
        if (tokenId && (hasOwnerNegotiations || isOwnerParam)) {
          const negotiation = userOwnerNegotiations.find(n => n.tokenId === tokenId) || 
                             openNegotiations.find(n => n.tokenId === tokenId && n.ownerId === userWalletAddress)
          if (negotiation) {
            setSelectedNegotiation(negotiation)
          }
        }
        
      } catch (error) {
        console.error('Error loading negotiations:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNegotiations()
  }, [userWalletAddress, tokenId, isOwnerParam])

  // Listen to user's chats (for owners)
  useEffect(() => {
    if (!userWalletAddress || !isOwnerView) return

    console.log('🏠 Setting up owner chat listener for:', userWalletAddress)

    const unsubscribe = listenToUserChats(userWalletAddress, (chats) => {
      console.log('🏠 Owner received chats:', chats.length, chats.map(c => ({ id: c.id, tokenId: c.tokenId })))
      setUserChats(chats)
      
      // If we're in owner view and have chats but no current chat selected, auto-select the first one
      if (chats.length > 0 && !currentChatId && selectedNegotiation) {
        const relevantChat = chats.find(chat => chat.tokenId === selectedNegotiation.tokenId)
        if (relevantChat) {
          console.log('🎯 Auto-selecting relevant chat:', relevantChat.id)
          handleSelectChatRoom(relevantChat)
        }
      }
    })

    return unsubscribe
  }, [userWalletAddress, isOwnerView, currentChatId, selectedNegotiation])

  // Listen to messages for current chat
  useEffect(() => {
    if (!currentChatId || !userWalletAddress) return

    const unsubscribe = listenToMessages(currentChatId, (messages) => {
      setChatMessages(messages)
      scrollToBottom()
    })

    return unsubscribe
  }, [currentChatId, userWalletAddress])

  // Update currentChatId when URL parameters change
  useEffect(() => {
    if (chatRoomId && chatRoomId !== currentChatId) {
      console.log('🔄 Updating currentChatId from URL:', chatRoomId)
      setCurrentChatId(chatRoomId)
    }
  }, [chatRoomId, currentChatId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Start chat for a negotiation
  const handleStartChat = async (negotiation: NegotiationRequest) => {
    if (!userWalletAddress) return

    // If user is the owner, take them to their chat management view
    if (userWalletAddress === negotiation.ownerId) {
      console.log('🏠 Owner clicking View Messages for negotiation:', negotiation.id)
      setSelectedNegotiation(negotiation)
      setIsOwnerView(true)
      
      // For owners, try to find existing chat rooms for this negotiation
      const existingChats = userChats.filter(chat => chat.tokenId === negotiation.tokenId)
      if (existingChats.length > 0) {
        console.log('📱 Found existing chats for owner:', existingChats.length)
        // Auto-select the first chat
        handleSelectChatRoom(existingChats[0])
      } else {
        console.log('📱 No existing chats found, owner will need to wait for buyers')
        navigate(`/chat?token=${negotiation.tokenId}&owner=true`)
      }
      return
    }

    setStartingChat(true)
    try {
      const chatId = await startNegotiationChat(negotiation.id, userWalletAddress)
      setCurrentChatId(chatId)
      setSelectedNegotiation(negotiation)
      
      // Update URL
      navigate(`/chat?room=${chatId}&token=${negotiation.tokenId}`)
    } catch (error) {
      console.error('Error starting chat:', error)
    } finally {
      setStartingChat(false)
    }
  }

  // Handle selecting a chat room (for owners)
  const handleSelectChatRoom = (chatRoom: ChatRoom) => {
    console.log('🏠 Owner selecting chat room:', {
      chatRoomId: chatRoom.id,
      tokenId: chatRoom.tokenId,
      buyerId: chatRoom.buyerId
    })

    setCurrentChatId(chatRoom.id)
    setSelectedChatRoom(chatRoom)
    
    // Find the corresponding negotiation
    const negotiation = ownerNegotiations.find(n => n.tokenId === chatRoom.tokenId)
    if (negotiation) {
      setSelectedNegotiation(negotiation)
      console.log('✅ Found corresponding negotiation:', negotiation.id)
    } else {
      console.log('❌ No negotiation found for tokenId:', chatRoom.tokenId)
    }
    
    // Update URL
    navigate(`/chat?room=${chatRoom.id}&token=${chatRoom.tokenId}`)
  }

  // Handle sending messages
  const handleSendMessage = async () => {
    console.log('🔥 SEND MESSAGE DEBUG:', {
      newMessage: newMessage,
      currentChatId: currentChatId,
      userWalletAddress: userWalletAddress,
      selectedNegotiation: selectedNegotiation?.id,
      isOwnerView: isOwnerView
    })

    if (!newMessage.trim() || !currentChatId || !userWalletAddress) {
      console.log('❌ Send message blocked:', {
        hasMessage: !!newMessage.trim(),
        hasChatId: !!currentChatId,
        hasUser: !!userWalletAddress
      })
      return
    }

    try {
      // Check if message is an offer command
      if (newMessage.startsWith('/offer ')) {
        const priceMatch = newMessage.match(/\/offer\s+(\d*\.?\d+)/)
        if (priceMatch && selectedNegotiation) {
          const price = priceMatch[1]
          console.log('📞 Making offer:', { price, currentChatId })
          await makeOfferCommand(
            currentChatId,
            userWalletAddress,
            price,
            selectedNegotiation.tokenId
          )
        }
      } else {
        // Regular message
        console.log('💬 Sending regular message:', { currentChatId, userWalletAddress, message: newMessage.trim() })
        await sendFirebaseMessage(currentChatId, userWalletAddress, newMessage.trim())
      }
      
      setNewMessage('')
      console.log('✅ Message sent successfully')
    } catch (error) {
      console.error('❌ Error sending message:', error)
    }
  }

  // Handle offer acceptance
  const handleAcceptOffer = async (messageId: string) => {
    if (!currentChatId || !userWalletAddress) return

    try {
      await acceptOfferCommand(currentChatId, userWalletAddress, messageId)
    } catch (error) {
      console.error('Error accepting offer:', error)
    }
  }

  // Handle offer rejection
  const handleRejectOffer = async (messageId: string) => {
    if (!currentChatId || !userWalletAddress) return

    try {
      await sendFirebaseMessage(
        currentChatId,
        userWalletAddress,
        `❌ Offer rejected. Feel free to make another offer. (Ref: ${messageId.slice(0, 8)})`,
        'system'
      )
    } catch (error) {
      console.error('Error rejecting offer:', error)
    }
  }

  // Handle funding deal with contract integration  
  const handleFundDeal = async (tokenId: string, price: string) => {
    if (!currentChatId || !userWalletAddress) return

    try {
      console.log('Funding escrow deal...', { tokenId, price })
      
      // Call smart contract to fund deal (this completes the transfer)
    const res =   await campfire.fundEscrowDeal(BigInt(tokenId), price)

    if(res){
      await fundEscrowDeal(currentChatId, userWalletAddress, tokenId, price, campfire.txHash)

    }else {
      console.error('Error funding escrow deal:', res)
    }
      
      // Update Firebase with completion status
    } catch (error) {
      console.error('Error funding deal:', error)
    }
  }

  // Handle escrow cancellation
  const handleCancelDeal = async (tokenId: string) => {
    if (!currentChatId || !userWalletAddress) return

    try {
      await campfire.cancelEscrowDeal(BigInt(tokenId))
      await cancelEscrowDeal(currentChatId, userWalletAddress, tokenId)
    } catch (error) {
      console.error('Error cancelling deal:', error)
    }
  }

  // Handle creating escrow deal with contract integration
  const handleCreateEscrowDeal = async (tokenId: string, buyer: string, price: string) => {
    if (!currentChatId || !userWalletAddress) return
    
    try {
      console.log('Creating escrow deal...', { tokenId, buyer, price })
      
      // Call smart contract to create escrow deal
   const res =   await campfire.createEscrowDeal(BigInt(tokenId), buyer as any, price)


   if(res){
     await createEscrowDealFirebase(currentChatId, userWalletAddress, tokenId, buyer, price)

   }else {
     console.error('Error creating escrow deal:', res)
   }
      
      // Update Firebase with Step 2 card
    } catch (error) {
      console.error('Error creating escrow deal:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Filter negotiations
  const filteredNegotiations = negotiations.filter(negotiation =>
    negotiation.ipTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    negotiation.tokenId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-3/20 to-cool-3/20 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-cool-1">Loading negotiations...</p>
        </div>
      </div>
    )
  }

  // Show chat interface if we have an active chat OR if owner wants to see their chats
  if ((currentChatId && selectedNegotiation) || (isOwnerView && selectedNegotiation && !currentChatId)) {
    // Owner view - show chat list on left, active chat on right
    if (isOwnerView && userWalletAddress === selectedNegotiation.ownerId) {
      console.log('🏠 OWNER VIEW STATE:', {
        isOwnerView,
        currentChatId,
        selectedChatRoom: selectedChatRoom?.id,
        selectedNegotiation: selectedNegotiation?.id,
        userChats: userChats.length,
        userWalletAddress
      })

      return (
        <div className="min-h-screen bg-gradient-to-br from-warm-3/20 to-cool-3/20 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6">
              {/* Chat List Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-1/3 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-camp-dark mb-2">Your Negotiations</h2>
                      <p className="text-sm text-cool-1">Active chats with potential buyers</p>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentChatId(null)
                        setSelectedNegotiation(null)
                        setIsOwnerView(false)
                        navigate('/chat')
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {userChats.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No active chats yet</p>
                      <p className="text-xs mt-1">Buyers will appear here when they start chatting</p>
                    </div>
                  ) : (
                    userChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectChatRoom(chat)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          currentChatId === chat.id ? 'bg-camp-orange/10 border-l-4 border-l-camp-orange' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={chat.ipImage}
                            alt={chat.ipTitle}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-camp-dark truncate">
                              {chat.ipTitle}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              With: {chat.buyerId.slice(0, 8)}...
                            </p>
                            {chat.lastMessage && (
                              <p className="text-xs text-gray-400 truncate mt-1">
                                {chat.lastMessage}
                              </p>
                            )}
                          </div>
                          {chat.lastMessageTime && (
                            <div className="text-xs text-gray-400">
                              {chat.lastMessageTime.toDate().toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Active Chat or Welcome Message */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
                style={{ height: '600px' }}
              >
                {currentChatId && selectedChatRoom ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-xl font-bold text-camp-dark">{selectedNegotiation.ipTitle}</h1>
                          <p className="text-sm text-cool-1">
                            Token #{selectedNegotiation.tokenId} • Chatting with {selectedChatRoom?.buyerId.slice(0, 8)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-cool-1">Listed Price</p>
                          <p className="text-lg font-bold text-camp-orange">{selectedNegotiation.currentPrice} CAMP</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: '450px' }}>
                      <div className="text-center py-4">
                        <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Buyer can use "/offer 0.5" to make offers.
                        </div>
                      </div>
                      
                      {chatMessages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex ${
                            message.sender === userWalletAddress ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-md px-4 py-3 rounded-2xl ${
                              message.sender === userWalletAddress
                                ? 'gradient-bg text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {message.type === 'offer' && message.offer ? (
                              <div className="space-y-3">
                                <div className="flex items-center font-bold">
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Offer: {message.offer.price} CAMP
                                </div>
                                <p className="text-sm opacity-90">Token #{message.offer.tokenId}</p>
                                {message.sender !== userWalletAddress && message.offer.status === 'pending' && (
                                  <div className="flex space-x-2 mt-3">
                                    <button
                                      onClick={() => handleAcceptOffer(message.id)}
                                      className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRejectOffer(message.id)}
                                      className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-all"
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : message.type === 'escrow_update' && message.escrowUpdate ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center font-bold">
                                    <Shield className="w-4 h-4 mr-2" />
                                    {message.content}
                                  </div>
                                  {message.escrowUpdate.step && message.escrowUpdate.totalSteps && (
                                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      Step {message.escrowUpdate.step}/{message.escrowUpdate.totalSteps}
                                    </div>
                                  )}
                                </div>
                                
                                {message.escrowUpdate.description && (
                                  <p className="text-sm opacity-90 italic">
                                    {message.escrowUpdate.description}
                                  </p>
                                )}
                                
                                {message.escrowUpdate.price && (
                                  <p className="text-sm opacity-90">
                                    Amount: {message.escrowUpdate.price} CAMP
                                  </p>
                                )}
                                
                                {/* Step 1: Create Deal */}
                                {message.escrowUpdate.action === 'create_deal' && userWalletAddress === message.escrowUpdate.seller && (
                                  <div className="flex space-x-2 mt-3">
                                    <button
                                      onClick={() => handleCreateEscrowDeal(
                                        message.escrowUpdate?.tokenId || '', 
                                        message.escrowUpdate?.buyer || '', 
                                        message.escrowUpdate?.price || ''
                                      )}
                                      className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all"
                                    >
                                      <Shield className="w-3 h-3 mr-1" />
                                      Create Deal
                                    </button>
                                  </div>
                                )}
                                
                                {/* Step 2: Fund Deal */}
                                {message.escrowUpdate.action === 'fund_deal' && userWalletAddress === message.escrowUpdate.buyer && (
                                  <div className="flex space-x-2 mt-3">
                                    <button
                                      onClick={() => handleFundDeal(message.escrowUpdate?.tokenId || '', message.escrowUpdate?.price || '')}
                                      className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                                    >
                                      <CreditCard className="w-3 h-3 mr-1" />
                                      Fund Deal
                                    </button>
                                    <button
                                      onClick={() => handleCancelDeal(message.escrowUpdate?.tokenId || '')}
                                      className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-all"
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Cancel
                                    </button>
                                  </div>
                                )}

                                {/* Transfer Complete */}
                                {message.escrowUpdate.action === 'transfer_complete' && (
                                  <div className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Transfer completed successfully!
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p>{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {message.timestamp && typeof message.timestamp.toDate === 'function'
                                    ? message.timestamp.toDate().toLocaleTimeString()
                                    : '—'}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a response to your buyer..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || !currentChatId}
                          className="p-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  // Welcome message when no chat selected
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-camp-dark mb-2">
                        {userChats.length > 0 ? 'Select a Chat' : 'No Active Conversations'}
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        {userChats.length > 0
                          ? 'Choose a conversation from the left to start chatting with buyers'
                          : 'When buyers start negotiations for your IP, their conversations will appear here'}
                      </p>
                      {userChats.length === 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">
                            💡 Share your IP listings to attract buyers and start negotiations!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      )
    }

    // Buyer view - original single chat interface
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-3/20 to-cool-3/20 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Chat Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setCurrentChatId(null)
                    setSelectedNegotiation(null)
                    navigate('/chat')
                  }}
                  className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-camp-dark">{selectedNegotiation.ipTitle}</h1>
                  <p className="text-cool-1">Token #{selectedNegotiation.tokenId} • Negotiating with {selectedNegotiation.ownerId.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-cool-1">Current Price</p>
                <p className="text-xl font-bold text-camp-orange">{selectedNegotiation.currentPrice} CAMP</p>
              </div>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
            style={{ height: '600px' }}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: '480px' }}>
              <div className="text-center py-4">
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Negotiation started. Use "/offer 0.5" to make an offer.
                </div>
              </div>
              
              {chatMessages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${
                    message.sender === userWalletAddress ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-2xl ${
                      message.sender === userWalletAddress
                        ? 'gradient-bg text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {message.type === 'offer' && message.offer ? (
                      <div className="space-y-3">
                        <div className="flex items-center font-bold">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Offer: {message.offer.price} CAMP
                        </div>
                        <p className="text-sm opacity-90">Token #{message.offer.tokenId}</p>
                        {message.sender !== userWalletAddress && message.offer.status === 'pending' && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleAcceptOffer(message.id)}
                              className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectOffer(message.id)}
                              className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-all"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ) : message.type === 'escrow_update' && message.escrowUpdate ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center font-bold">
                            <Shield className="w-4 h-4 mr-2" />
                            {message.content}
                          </div>
                          {message.escrowUpdate.step && message.escrowUpdate.totalSteps && (
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Step {message.escrowUpdate.step}/{message.escrowUpdate.totalSteps}
                            </div>
                          )}
                        </div>
                        
                        {message.escrowUpdate.description && (
                          <p className="text-sm opacity-90 italic">
                            {message.escrowUpdate.description}
                          </p>
                        )}
                        
                        {message.escrowUpdate.price && (
                          <p className="text-sm opacity-90">
                            Amount: {message.escrowUpdate.price} CAMP
                          </p>
                        )}
                        
                        {/* Step 1: Create Deal */}
                        {message.escrowUpdate.action === 'create_deal' && userWalletAddress === message.escrowUpdate.seller && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleCreateEscrowDeal(
                                message.escrowUpdate?.tokenId || '', 
                                message.escrowUpdate?.buyer || '', 
                                message.escrowUpdate?.price || ''
                              )}
                              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              Create Deal
                            </button>
                          </div>
                        )}
                        
                        {/* Step 2: Fund Deal */}
                        {message.escrowUpdate.action === 'fund_deal' && userWalletAddress === message.escrowUpdate.buyer && (
                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleFundDeal(message.escrowUpdate?.tokenId || '', message.escrowUpdate?.price || '')}
                              className="flex items-center px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Fund Deal
                            </button>
                            <button
                              onClick={() => handleCancelDeal(message.escrowUpdate?.tokenId || '')}
                              className="flex items-center px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-all"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Transfer Complete */}
                        {message.escrowUpdate.action === 'transfer_complete' && (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Transfer completed successfully!
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p>{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp && typeof message.timestamp.toDate === 'function'
                            ? message.timestamp.toDate().toLocaleTimeString()
                            : '—'}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message... (use /offer 0.5 to make an offer)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Show negotiations list (main view)
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-3/20 to-cool-3/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-camp-dark mb-1">Active Negotiations</h1>
                <p className="text-lg text-cool-1">
                  Browse open IP negotiations and start conversations.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center text-cool-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{negotiations.length} Open</span>
            </div>
            <div className="flex items-center text-cool-1">
              <Star className="w-4 h-4 mr-1" />
              <span>Real-time Chat</span>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search negotiations..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Negotiations Grid */}
        {filteredNegotiations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No negotiations available</h3>
            <p className="text-gray-500">Check back later for new IP negotiations</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNegotiations.map((negotiation, index) => {
              // Find preview message for this negotiation (if any)
              let previewMsg = ''
              let previewTime = ''
              if (chatMessages.length > 0 && currentChatId && negotiation.id === selectedNegotiation?.id) {
                const lastMsg = chatMessages[chatMessages.length - 1]
                previewMsg = lastMsg.content || (lastMsg.type === 'offer' && lastMsg.offer ? `Offer: ${lastMsg.offer.price} CAMP` : '')
                previewTime = lastMsg.timestamp && typeof lastMsg.timestamp.toDate === 'function'
                  ? lastMsg.timestamp.toDate().toLocaleTimeString()
                  : ''
              }
              return (
                <motion.div
                  key={negotiation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 cursor-pointer group"
                >
                  <div className="relative mb-4">
                    <img
                      src={negotiation.ipImage}
                      alt={negotiation.ipTitle}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <div className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">
                      <Zap className="w-3 h-3 mr-1 inline" />
                      {negotiation.status}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-camp-dark text-lg group-hover:text-camp-orange transition-colors">
                        {negotiation.ipTitle}
                      </h3>
                      <p className="text-xs text-cool-1 font-mono">
                        Token {negotiation.tokenId.length > 8
                          ? `${negotiation.tokenId.slice(0, 4)}...${negotiation.tokenId.slice(-4)}`
                          : negotiation.tokenId}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Current Price</p>
                        <p className="font-bold text-camp-dark">{negotiation.currentPrice} CAMP</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Owner</p>
                        <p className="text-xs font-mono text-cool-1">
                          {negotiation.ownerId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    {/* Preview last message if available */}
                    {previewMsg && (
                      <div className="mt-2 text-xs text-gray-500 italic truncate">
                        <span className="font-semibold text-camp-orange">Preview:</span> {previewMsg}
                        {previewTime && <span className="ml-2">({previewTime})</span>}
                      </div>
                    )}
                    <button
                      onClick={() => handleStartChat(negotiation)}
                      disabled={startingChat || !userWalletAddress || negotiation.status === 'completed'}
                      className="w-full mt-4 py-2 gradient-bg text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-50 group-hover:shadow-lg"
                    >
                      {userWalletAddress === negotiation.ownerId 
                        ? 'View Messages' 
                        : startingChat 
                        ? 'Starting...' 
                        : 'Start Chat'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
