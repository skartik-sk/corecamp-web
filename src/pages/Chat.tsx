import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@campnetwork/origin/react'
import { Send, Search, User, MessageCircle, DollarSign, Clock, CheckCircle, XCircle, Users, TrendingUp, Star, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  senderId: string
  senderAddress: string
  content: string
  timestamp: Date
  type: 'text' | 'offer' | 'system'
  offer?: {
    ipId: string
    price: string
    duration: number
    terms: string
  }
}

interface Chat {
  id: string
  participantAddress: string
  participantName: string
  ipId: string
  ipTitle: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  status: 'active' | 'completed' | 'cancelled'
}

const mockChats: Chat[] = [
  {
    id: '1',
    participantAddress: '0x1234567890abcdef',
    participantName: 'AliceCreator',
    ipId: '1',
    ipTitle: 'AI-Generated Art Collection',
    lastMessage: 'I can offer 0.4 ETH for commercial rights',
    lastMessageTime: new Date('2024-01-20T10:30:00'),
    unreadCount: 2,
    status: 'active',
  },
  {
    id: '2',
    participantAddress: '0xfedcba0987654321',
    participantName: 'DesignStudio',
    ipId: '2',
    ipTitle: 'Mobile App UI Kit Pro',
    lastMessage: 'Deal accepted! Processing payment...',
    lastMessageTime: new Date('2024-01-19T15:45:00'),
    unreadCount: 0,
    status: 'completed',
  },
  {
    id: '3',
    participantAddress: '0xabcdef1234567890',
    participantName: 'MusicLabel',
    ipId: '3',
    ipTitle: 'Ambient Track Collection',
    lastMessage: 'Can we discuss exclusive rights?',
    lastMessageTime: new Date('2024-01-18T12:15:00'),
    unreadCount: 1,
    status: 'active',
  },
]

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      senderId: '0x1234567890abcdef',
      senderAddress: '0x1234567890abcdef',
      content: 'Hi! I\'m really impressed by your AI art collection. Would love to discuss licensing for my upcoming project.',
      timestamp: new Date('2024-01-20T09:00:00'),
      type: 'text',
    },
    {
      id: '2',
      senderId: 'user',
      senderAddress: '0xuser123456789',
      content: 'Thank you! I\'d be happy to discuss licensing. The current rate is 0.5 ETH for commercial usage. What kind of project are you working on?',
      timestamp: new Date('2024-01-20T09:15:00'),
      type: 'text',
    },
    {
      id: '3',
      senderId: '0x1234567890abcdef',
      senderAddress: '0x1234567890abcdef',
      content: 'I can offer 0.4 ETH for commercial rights',
      timestamp: new Date('2024-01-20T10:30:00'),
      type: 'offer',
      offer: {
        ipId: '1',
        price: '0.4 ETH',
        duration: 365,
        terms: 'Commercial use for digital marketing campaign (1 year)'
      },
    },
  ],
  '2': [
    {
      id: '1',
      senderId: '0xfedcba0987654321',
      senderAddress: '0xfedcba0987654321',
      content: 'Your UI kit is exactly what we need for our client project. Let\'s make a deal!',
      timestamp: new Date('2024-01-19T14:00:00'),
      type: 'text',
    },
    {
      id: '2',
      senderId: 'user',
      senderAddress: '0xuser123456789',
      content: 'Perfect! I\'m glad it fits your needs. Payment confirmed and license transferred. Enjoy!',
      timestamp: new Date('2024-01-19T15:45:00'),
      type: 'text',
    },
  ],
}

export default function Chat() {
  const { jwt } = useAuth()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [chats] = useState<Chat[]>(mockChats)
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chats.length > 0 && !selectedChatId) {
      setSelectedChatId(chats[0].id)
    }
  }, [chats, selectedChatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedChatId])

  const selectedChat = chats.find(chat => chat.id === selectedChatId)
  const chatMessages = selectedChatId ? messages[selectedChatId] || [] : []

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChatId) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      senderAddress: '0xuser123456789',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text',
    }

    setMessages(prev => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), message]
    }))

    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const acceptOffer = (messageId: string) => {
    console.log('Accepting offer:', messageId)
    // This would trigger smart contract interaction
  }

  const rejectOffer = (messageId: string) => {
    console.log('Rejecting offer:', messageId)
  }

  const filteredChats = chats.filter(chat =>
    chat.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.ipTitle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': 
        return { 
          class: 'bg-green-100 text-green-800 border border-green-200', 
          icon: Zap 
        }
      case 'completed': 
        return { 
          class: 'bg-blue-100 text-blue-800 border border-blue-200', 
          icon: CheckCircle 
        }
      case 'cancelled': 
        return { 
          class: 'bg-red-100 text-red-800 border border-red-200', 
          icon: XCircle 
        }
      default: 
        return { 
          class: 'bg-gray-100 text-gray-800 border border-gray-200', 
          icon: MessageCircle 
        }
    }
  }

  const getAvatarGradient = (name: string) => {
    const gradients = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-orange-400 to-red-400',
      'from-yellow-400 to-orange-400',
      'from-indigo-400 to-purple-400',
    ]
    return gradients[name.length % gradients.length]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-3/20 to-cool-3/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-camp-orange to-warm-1 rounded-2xl flex items-center justify-center mr-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-camp-dark mb-1">Negotiations</h1>
              <p className="text-lg text-cool-1">
                Connect with IP owners and buyers to create valuable partnerships.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center text-cool-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{chats.filter(c => c.status === 'active').length} Active</span>
            </div>
            <div className="flex items-center text-cool-1">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>{chats.filter(c => c.status === 'completed').length} Completed</span>
            </div>
            <div className="flex items-center text-cool-1">
              <Star className="w-4 h-4 mr-1" />
              <span>95% Success Rate</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
          style={{ height: '700px' }}
        >
          <div className="flex h-full">
            {/* Chat List */}
            <div className="w-1/3 border-r border-gray-200/50 flex flex-col bg-gray-50/50">
              {/* Search */}
              <div className="p-6 border-b border-gray-200/50">
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect transition-all duration-300 text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </motion.div>
              </div>

              {/* Chat Items */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                  {filteredChats.map((chat, index) => {
                    const statusConfig = getStatusConfig(chat.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <motion.div
                        key={chat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4 }}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`p-6 cursor-pointer border-b border-gray-100 hover:bg-white/70 transition-all duration-300 relative overflow-hidden ${
                          selectedChatId === chat.id 
                            ? 'bg-white shadow-lg border-l-4 border-l-camp-orange' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 bg-gradient-to-r ${getAvatarGradient(chat.participantName)} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-camp-dark text-lg">{chat.participantName}</p>
                              <p className="text-xs text-cool-1 font-mono">
                                {chat.participantAddress.slice(0, 6)}...{chat.participantAddress.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className={`flex items-center text-xs px-3 py-1 rounded-full ${statusConfig.class}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {chat.status}
                            </div>
                            {chat.unreadCount > 0 && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-gradient-to-r from-camp-orange to-warm-1 text-white text-xs rounded-full px-3 py-1 font-bold shadow-lg"
                              >
                                {chat.unreadCount}
                              </motion.span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-cool-1 mb-2 font-medium">{chat.ipTitle}</p>
                        <p className="text-sm text-gray-600 truncate mb-2">{chat.lastMessage}</p>
                        <p className="text-xs text-gray-400">
                          {chat.lastMessageTime.toLocaleDateString()}
                        </p>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {filteredChats.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 text-center"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">No conversations found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search terms</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {selectedChat ? (
                  <motion.div
                    key={selectedChat.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col h-full"
                  >
                    {/* Chat Header */}
                    <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getAvatarGradient(selectedChat.participantName)} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-camp-dark text-xl">{selectedChat.participantName}</h3>
                            <p className="text-cool-1 flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {selectedChat.ipTitle}
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center text-sm px-4 py-2 rounded-xl ${getStatusConfig(selectedChat.status).class}`}>
                          {(() => {
                            const StatusIcon = getStatusConfig(selectedChat.status).icon
                            return <StatusIcon className="w-4 h-4 mr-2" />
                          })()}
                          {selectedChat.status}
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <AnimatePresence>
                        {chatMessages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex ${
                              message.senderId === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-md px-6 py-4 rounded-2xl shadow-lg ${
                                message.senderId === 'user'
                                  ? 'bg-gradient-to-r from-camp-orange to-warm-1 text-white'
                                  : 'bg-white border border-gray-200 text-camp-dark'
                              }`}
                            >
                              {message.type === 'offer' && message.offer ? (
                                <div className="space-y-4">
                                  <div className="flex items-center text-lg font-bold">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    <span>Offer: {message.offer.price}</span>
                                  </div>
                                  <div className="flex items-center text-sm opacity-90">
                                    <Clock className="w-4 h-4 mr-2" />
                                    <span>{message.offer.duration} days license</span>
                                  </div>
                                  <p className="text-sm opacity-90">{message.offer.terms}</p>
                                  {message.senderId !== 'user' && (
                                    <div className="flex space-x-3 mt-4">
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => acceptOffer(message.id)}
                                        className="flex items-center px-4 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600 transition-all duration-300 font-medium shadow-lg"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Accept
                                      </motion.button>
                                      <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => rejectOffer(message.id)}
                                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 transition-all duration-300 font-medium shadow-lg"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Counter
                                      </motion.button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <p className="text-base leading-relaxed">{message.content}</p>
                                  <p className={`text-xs mt-2 ${
                                    message.senderId === 'user' ? 'text-orange-100' : 'text-gray-500'
                                  }`}>
                                    {message.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50"
                    >
                      <div className="flex items-end space-x-4">
                        <div className="flex-1">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="w-full resize-none border border-gray-200 rounded-xl px-6 py-4 focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect transition-all duration-300 text-lg"
                            rows={1}
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="p-4 bg-gradient-to-r from-camp-orange to-warm-1 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed"
                        >
                          <Send className="w-6 h-6" />
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-camp-orange/20 to-warm-1/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="w-10 h-10 text-camp-orange" />
                      </div>
                      <h3 className="text-xl font-semibold text-camp-dark mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-cool-1">Choose a chat from the left to start negotiating</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
