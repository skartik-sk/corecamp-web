import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Chat types
export interface ChatRoom {
  id: string
  tokenId: string
  ownerId: string
  buyerId: string
  participants: string[]
  createdAt: Timestamp
  lastMessage: string | null
  lastMessageTime: Timestamp | null
  escrowStatus: 'none' | 'created' | 'funded' | 'confirmed' | 'completed' | 'cancelled'
  ipTitle: string
  ipImage: string

  // NEW: support varied IP content
  ipMimeType?: string
  ipAnimationUrl?: string
  ipAudioUrl?: string
  ipFiles?: { name: string; url: string; mimeType?: string }[]
}

export interface ChatMessage {
  id: string
  chatId: string
  sender: string
  content: string
  timestamp: Timestamp
  type: 'text' | 'offer' | 'escrow_update' | 'system'
  offer?: {
    price: string
    tokenId: string
    status: 'pending' | 'accepted' | 'rejected'
  }
  escrowUpdate?: {
    status: string
    action: string
    tokenId?: string
    price?: string
    seller?: string
    buyer?: string
    dealCreated?: boolean
    dealFunded?: boolean
    needsSellerConfirm?: boolean
    needsBuyerConfirm?: boolean
    transferComplete?: boolean
    transactionHash?: string
    step?: number
    totalSteps?: number
    description?: string
  }

  // NEW: attachments array (images, video links, audio links, generic files)
  attachments?: { name?: string; url: string; mimeType?: string; type?: 'image' | 'video' | 'audio' | 'file' }[]
}

export interface NegotiationRequest {
  id: string
  tokenId: string
  ownerId: string
  ipTitle: string
  ipImage: string
  currentPrice: string
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: Timestamp
  category: string
}

// Create a new chat room for P2P negotiation
export const createChatRoom = async (
  tokenId: string,
  ownerId: string,
  buyerId: string,
  ipTitle: string,
  ipImage: string,
  currentPrice: string,
  ipMeta?: {
    mimeType?: string
    animation_url?: string
    audio_url?: string
    files?: { name: string; url: string; mimeType?: string }[]
  }
): Promise<string> => {
  try {
    // Check if chat already exists
    const chatsRef = collection(db, 'chatRooms')
    const q = query(
      chatsRef,
      where('tokenId', '==', tokenId),
      where('participants', 'array-contains-any', [ownerId, buyerId])
    )
    
    const querySnapshot = await getDocs(q)
    
    // If chat exists, return existing ID
    if (!querySnapshot.empty) {
      const existingChat = querySnapshot.docs.find(doc => {
        const data = doc.data()
        return data.participants.includes(ownerId) && data.participants.includes(buyerId)
      })
      if (existingChat) {
        return existingChat.id
      }
    }

    // Build chat document payload with optional ip metadata
    const chatPayload: any = {
      tokenId,
      ownerId,
      buyerId,
      participants: [ownerId, buyerId],
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
      escrowStatus: 'none',
      ipTitle,
      ipImage,
      currentPrice
    }

    if (ipMeta) {
      if (ipMeta.mimeType) chatPayload.ipMimeType = ipMeta.mimeType
      if (ipMeta.animation_url) chatPayload.ipAnimationUrl = ipMeta.animation_url
      if (ipMeta.audio_url) chatPayload.ipAudioUrl = ipMeta.audio_url
      if (ipMeta.files && Array.isArray(ipMeta.files)) chatPayload.ipFiles = ipMeta.files
    }

    // Create new chat room
    const chatRef = await addDoc(collection(db, 'chatRooms'), chatPayload)

    // Add welcome message
    await sendMessage(
      chatRef.id,
      'system',
      `P2P negotiation started for ${ipTitle}. You can discuss terms and make offers here.`,
      'system'
    )

    return chatRef.id
  } catch (error) {
    console.error('Error creating chat room:', error)
    throw error
  }
}

// Send a message
export const sendMessage = async (
  chatId: string,
  sender: string,
  content: string,
  type: 'text' | 'offer' | 'escrow_update' | 'system' = 'text',
  offer?: {
    price: string
    tokenId: string
    status: 'pending' | 'accepted' | 'rejected'
  },
  escrowUpdate?: {
    status: string
    action: string
    tokenId?: string
    price?: string
    seller?: string
    buyer?: string
    dealCreated?: boolean
    dealFunded?: boolean
    needsSellerConfirm?: boolean
    needsBuyerConfirm?: boolean
    transferComplete?: boolean
    step?: number
    totalSteps?: number
    description?: string
  },
  attachments?: { name?: string; url: string; mimeType?: string; type?: 'image' | 'video' | 'audio' | 'file' }[]
): Promise<string> => {
  try {
    console.log('🔥 FIREBASE: Sending message:', {
      chatId,
      sender,
      content: content.substring(0, 50) + '...',
      type
    })

    // Write message into the chat's messages subcollection to avoid cross-chat queries
    const messageRef = await addDoc(collection(db, 'chatRooms', chatId, 'messages'), {
      sender,
      content,
      timestamp: serverTimestamp(),
      type,
      offer: offer || null,
      escrowUpdate: escrowUpdate || null,
      attachments: attachments || null
    })

    console.log('✅ FIREBASE: Message added to subcollection, messageId:', messageRef.id)

    // Update chat room with last message
    const chatRef = doc(db, 'chatRooms', chatId)
    await updateDoc(chatRef, {
      lastMessage: content,
      lastMessageTime: serverTimestamp()
    })

    console.log('✅ FIREBASE: Chat room updated with last message')

    return messageRef.id
  } catch (error) {
    console.error('❌ FIREBASE: Error sending message:', error)
    throw error
  }
}

// Listen to messages for a chat
export const listenToMessages = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  // Listen to messages in the chat's subcollection. This avoids queries that
  // filter by chatId on a top-level collection which can require composite indexes.
  const q = query(
    collection(db, 'chatRooms', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  )

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      chatId,
      ...doc.data()
    })) as ChatMessage[]
    callback(messages)
  })
}

// Listen to all chat rooms for a user
export const listenToUserChats = (userId: string, callback: (chats: ChatRoom[]) => void) => {
  const q = query(
    collection(db, 'chatRooms'),
    where('participants', 'array-contains', userId)
  )

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatRoom[]
    
    // Sort on client side to avoid composite index requirement
    chats.sort((a, b) => {
      const aTime = a.lastMessageTime?.toMillis?.() ?? 0
      const bTime = b.lastMessageTime?.toMillis?.() ?? 0
      return bTime - aTime
    })
    
    callback(chats)
  })
}

// Update chat escrow status
export const updateChatEscrowStatus = async (
  chatId: string, 
  status: 'none' | 'created' | 'funded' | 'confirmed' | 'completed' | 'cancelled'
) => {
  try {
    const chatRef = doc(db, 'chatRooms', chatId)
    await updateDoc(chatRef, {
      escrowStatus: status
    })
  } catch (error) {
    console.error('Error updating escrow status:', error)
    throw error
  }
}

// Make an offer
export const makeOffer = async (
  chatId: string,
  sender: string,
  price: string,
  tokenId: string
): Promise<string> => {
  return await sendMessage(
    chatId,
    sender,
    `💰 Offer: ${price} CAMP for this IP`,
    'offer',
    {
      price,
      tokenId,
      status: 'pending'
    }
  )
}

// Accept an offer
export const acceptOffer = async (
  chatId: string,
  accepter: string
): Promise<void> => {
  try {
    // Update the offer status (you'll need to implement this based on your message structure)
    await sendMessage(
      chatId,
      accepter,
      '✅ Offer accepted! Escrow deal will be created.',
      'system'
    )
  } catch (error) {
    console.error('Error accepting offer:', error)
    throw error
  }
}

// Get chat room by ID
export const getChatRoom = async (chatId: string): Promise<ChatRoom | null> => {
  try {
  const chatDoc = await getDocs(query(collection(db, 'chatRooms'), where('__name__', '==', chatId)))
    
    if (!chatDoc.empty) {
      return {
        id: chatDoc.docs[0].id,
        ...chatDoc.docs[0].data()
      } as ChatRoom
    }
    return null
  } catch (error) {
    console.error('Error getting chat room:', error)
    return null
  }
}

// Create negotiation request (when owner allows negotiation)
export const createNegotiationRequest = async (
  tokenId: string,
  ownerId: string,
  ipTitle: string,
  ipImage: string,
  currentPrice: string,
  category: string
): Promise<string> => {
  try {
    const negotiationRef = await addDoc(collection(db, 'negotiations'), {
      tokenId,
      ownerId,
      ipTitle,
      ipImage,
      currentPrice,
      category,
      status: 'open',
      createdAt: serverTimestamp()
    })
    
    return negotiationRef.id
  } catch (error) {
    console.error('Error creating negotiation request:', error)
    throw error
  }
}

// Get all open negotiations
export const getOpenNegotiations = async (): Promise<NegotiationRequest[]> => {
  try {
    const q = query(
      collection(db, 'negotiations'),
      // where('status', '==', 'open'),
    )
    
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NegotiationRequest[]

     items.sort((a, b) => {
      const aMillis = (a.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0
      const bMillis = (b.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0
      return bMillis - aMillis
    })

    return items
  } catch (error) {
    console.error('Error getting open negotiations:', error)
    return []
  }
}

// Get negotiations by user (as buyer or owner)
export const getNegotiationsByUser = async (userId: string): Promise<NegotiationRequest[]> => {
  try {
    const q = query(
      collection(db, 'negotiations'),
      where('ownerId', '==', userId)
    )
    
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NegotiationRequest[]
    
    // Sort on client side to avoid composite index requirement
    items.sort((a, b) => {
      const aMillis = (a.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0
      const bMillis = (b.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0
      return bMillis - aMillis
    })
    
    return items
  } catch (error) {
    console.error('Error getting user negotiations:', error)
    return []
  }
}

// Start chat for specific negotiation
export const startNegotiationChat = async (
  negotiationId: string,
  buyerId: string
): Promise<string> => {
  try {
    // Get negotiation details
    const negotiationRef = doc(db, 'negotiations', negotiationId)
    const negotiationDoc = await getDocs(query(collection(db, 'negotiations'), where('__name__', '==', negotiationId)))
    
    if (negotiationDoc.empty) {
      throw new Error('Negotiation not found')
    }
    
    const negotiation = negotiationDoc.docs[0].data() as NegotiationRequest
    
    // Create chat room
    const chatId = await createChatRoom(
      negotiation.tokenId,
      negotiation.ownerId,
      buyerId,
      negotiation.ipTitle,
      negotiation.ipImage,
      negotiation.currentPrice
    )
    
    // Update negotiation status
    await updateDoc(negotiationRef, {
      status: 'in_progress'
    })
    
    return chatId
  } catch (error) {
    console.error('Error starting negotiation chat:', error)
    throw error
  }
}

// Make offer with /offer command
export const makeOfferCommand = async (
  chatId: string,
  sender: string,
  price: string,
  tokenId: string
): Promise<string> => {
  return await sendMessage(
    chatId,
    sender,
    `💰 Offer: ${price} CAMP for Token #${tokenId}`,
    'offer',
    {
      price,
      tokenId,
      status: 'pending'
    }
  )
}

// Accept offer and trigger contract
export const acceptOfferCommand = async (
  chatId: string,
  accepter: string,
  messageId?: string
): Promise<void> => {
  try {
    // Send acceptance message
    await sendMessage(
      chatId,
      accepter,
      '✅ Offer accepted! Creating escrow deal...',
      'system'
    )
    
    // Get the chat room to find token and offer details
    const chatDoc = await getDocs(query(collection(db, 'chatRooms'), where('__name__', '==', chatId)))
    
    if (!chatDoc.empty) {
      const chatData = chatDoc.docs[0].data()
      
      // Find the offer message to get price details
      if (messageId) {
        const messagesQuery = query(
          collection(db, 'chatRooms', chatId, 'messages'),
          where('type', '==', 'offer')
        )
        
        const offerMessages = await getDocs(messagesQuery)
        const offerMessage = offerMessages.docs.find(doc => doc.id === messageId)
        
        if (offerMessage) {
          const offerData = offerMessage.data()
          
          console.log('🔥 CAMPFIRE: Offer acceptance details:', {
            tokenId: chatData.tokenId,
            offeredPrice: offerData.offer?.price,
            buyer: chatData.buyerId,
            seller: chatData.ownerId,
            chatId: chatId
          })
          
          // Create Step 1: Create Escrow Deal card
          const escrowUpdate = {
            status: 'created',
            action: 'create_deal',
            tokenId: chatData.tokenId,
            price: offerData.offer?.price,
            seller: chatData.ownerId,
            buyer: chatData.buyerId,
            step: 1,
            totalSteps: 2,
            description: 'Seller needs to create escrow deal (requires NFT approval first)'
          }

          await sendMessage(
            chatId,
            'system',
            '🤝 Step 1: Create Escrow Deal',
            'escrow_update',
            undefined,
            escrowUpdate
          )
          

          // Update chat with escrow creation status
          await updateChatEscrowStatus(chatId, 'created')
          
        }
      }
    }
    
  } catch (error) {
    console.error('Error accepting offer:', error)
    
    // Send error message to chat
    await sendMessage(
      chatId,
      'system',
      '❌ Error processing offer acceptance. Please try again.',
      'system'
    )
    
    throw error
  }
}

// Fund escrow deal (automatically completes transfer in 2-step process)
export const fundEscrowDeal = async (
  chatId: string,
  funder: string,
  tokenId: string,
  price: string,
  transactionHash?: string
): Promise<void> => {
  try {
    await sendMessage(
      chatId,
      'system',
      '💸 Processing payment and transfer...',
      'system'
    )
    
    // TODO: Integrate with useCampfireIntegration hook
    // This should call: fundEscrowDeal(BigInt(tokenId), price)
    // The contract automatically completes transfer after funding
    
    // Transfer completed automatically
    await sendMessage(
      chatId,
      'system',
      `✅ Transfer Complete! ${transactionHash ? `Tx: ${transactionHash}` : ''}`,
      'escrow_update',
      undefined,
      {
        status: 'completed',
        action: 'transfer_complete',
        tokenId: tokenId,
        price: price,
        description: 'Transfer completed successfully! NFT ownership has been transferred.'
      }
    )

    await updateChatEscrowStatus(chatId, 'completed')
    
  } catch (error) {
    console.error('Error funding escrow deal:', error)
    throw error
  }
}

// Confirm transfer (for both parties)
// Note: confirmEscrowTransfer is no longer needed in 2-step process
// Transfer is automatically completed when buyer funds the deal

// Cancel escrow deal
export const cancelEscrowDeal = async (
  chatId: string,
  canceller: string,
  tokenId: string
): Promise<void> => {
  try {
    await sendMessage(
      chatId,
      'system',
      '❌ Deal cancelled and refund processed',
      'system'
    )

    // TODO: Implement actual smart contract call
    // await escrowContract.cancelDeal(tokenId)
    
    await updateChatEscrowStatus(chatId, 'cancelled')
    
  } catch (error) {
    console.error('Error cancelling deal:', error)
    throw error
  }
}

// Note: approveNFTToEscrow is now handled within createEscrowDeal step
// NFT approval is required before calling createDeal on the smart contract// Step 1: Create escrow deal on smart contract (simplified 2-step process)
export const createEscrowDealFirebase = async (
  chatId: string,
  creator: string,
  tokenId: string,
  buyer: string,
  price: string
): Promise<void> => {
  try {
    await sendMessage(
      chatId,
      'system',
      '⏳ Creating escrow deal on smart contract...',
      'system'
    )

    // TODO: Integrate with useCampfireIntegration hook
    // This should call: createEscrowDeal(BigInt(tokenId), buyer as Address, price)
    
    // After successful contract call, create Step 2: Fund Deal card
    const escrowUpdate = {
      status: 'created',
      action: 'fund_deal',
      tokenId: tokenId,
      price: price,
      seller: creator,
      buyer: buyer,
      step: 2,
      totalSteps: 2,
      description: 'Buyer needs to fund the escrow deal to complete transfer'
    }

    await sendMessage(
      chatId,
      'system',
      '💰 Step 2: Fund Deal',
      'escrow_update',
      undefined,
      escrowUpdate
    )
    
  } catch (error) {
    console.error('Error creating escrow deal:', error)
    throw error
  }
}
