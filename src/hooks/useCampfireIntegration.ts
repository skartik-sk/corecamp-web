import { useState, useEffect } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { parseEther, formatEther, type Address } from 'viem'
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '@/lib/contracts'

// Types for better type safety
export interface CampfireIP {
  tokenId: bigint
  title: string
  description: string
  category: string
  tags: string[]
  creator: Address
  owner: Address
  price: string
  currency: string
  royalty: number
  duration: number
  views: number
  likes: number
  createdAt: string
  image: string
  mimeType?: string
  size?: number
  isListed?: boolean
  isInAuction?: boolean
  isInEscrow?: boolean
  isInLottery?: boolean
  verified?: boolean
  featured?: boolean
}

export interface AuctionData {
  tokenId: bigint
  owner: Address
  highestBidder: Address
  highestBid: bigint
  endTime: bigint
  active: boolean
}

export interface EscrowData {
  tokenId: bigint
  seller: Address
  buyer: Address
  price: bigint
  status: number // 0=Created, 1=Funded, 2=Confirmed
  sellerConfirmed: boolean
  buyerConfirmed: boolean
}

export interface LotteryData {
  id: bigint
  tokenId: bigint
  owner: Address
  ticketPrice: bigint
  maxTickets: bigint
  ticketsSold: bigint
  endTime: bigint
  active: boolean
  winner: Address
}

export function useCampfireIntegration() {
  const auth= useAuth()
  const { authenticated:isConnected } = useAuthState()
  const { origin, jwt,recoverProvider } = auth
const address = auth.walletAddress



  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isSuccess, isError } = useWaitForTransactionReceipt({ hash: txHash })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // // Get user's ETH balance
  const { data: balance } = useBalance({ address: auth.walletAddress as Address | undefined })

  // Clear messages after some time
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  //Handle transaction results
  useEffect(() => {
    if (isSuccess) {
      setSuccess('Transaction completed successfully!')
      setLoading(false)
    }
    if (isError) {
      setError('Transaction failed. Please try again.')
      setLoading(false)
    }
  }, [isSuccess, isError])

  // === ORIGIN SDK INTEGRATION ===
  const  getOriginUsage =async () => {
if (!origin) {
      setError('Origin SDK not available')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const data = await origin.getOriginUsage()
      return data
    } catch (err) {
      console.error('Get origin usage error:', err)
      setError(err instanceof Error ? err.message : 'Failed to get origin usage')
      return null
    } finally {
      setLoading(false)
    }}

const getDataByTokenId = async (tokenId: string, userAdd?: string) => {
  if (!origin) {
    setError('Origin SDK not available')
    return null
  }

  setLoading(true)
  setError(null)

  try {

    const data = await getOriginData(userAdd?.toString() || '')
    // console.log("data form getby token ", data)
    let res = []
    if (data) {
      res = data.filter((item: any) => item.id === tokenId)
    }
    // console.log("data form getby token ", res[0])
    return res[0]
  } catch (err) {
    console.error('Get NFT data error:', err)
    setError(err instanceof Error ? err.message : 'Failed to get NFT data')
    return null
  } finally {
    setLoading(false)
  }
}

  const getOriginData = async (userAdd:string ) => {
    if (!origin) {
      setError('Origin SDK not available')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Build the URL with the user's address
      const userAddress = userAdd ? userAdd as Address : address as Address
      const url = `https://basecamp.cloud.blockscout.com/api/v2/addresses/${userAddress}/nft?type=ERC-721`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch NFT data')
      const body = await response.json()
      return body.items
    } catch (err) {
      console.error('Get origin usage error:', err)
      setError(err instanceof Error ? err.message : 'Failed to get origin usage')
      return null
    } finally {
      setLoading(false)
    }
  }
 async function uploadToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}` // Use your Pinata JWT here
      },
      body: formData
    });

    const result = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

    if (!ipfsUrl || ipfsUrl === '') {
      throw new Error("Failed to get IPFS URL after upload");
    }

    setSuccess("File uploaded to IPFS successfully!");
    return ipfsUrl;
  } catch (error) {
    console.error("IPFS upload error:", error);
    setError("Failed to upload file to IPFS");
    throw error;
  }
} 

  const mintIPWithOrigin = async (
    file: File,
    metadata: any,
    license: {
      price: string
      duration: string
      royalty: string
      paymentToken: string
    },
    parentId: string
  ) => {
await recoverProvider()

    if (!origin || !jwt) {
      setError('Please connect your wallet first')
      return null
    }
    setLoading(true)
    setError(null)
    
    try {
      let ipfsUrl = "";
      try {
        const rest =  await uploadToIPFS(file);
        if (!rest) {
          throw new Error('Failed to upload file to IPFS')
        }
        ipfsUrl = rest;
      } catch (error) {
        return; 
      }
      console.log("first", ipfsUrl)
      const licenseTerms = {
        price: BigInt(parseFloat(license.price || '1') * 1e18),
        duration: parseInt(license.duration || '2345000'),
        royaltyBps: parseInt(license.royalty || '0') * 100,
        paymentToken: (license.paymentToken || '0x0000000000000000000000000000000000000000') as Address,
      }

      const parentTokenId = parentId === '' ? BigInt(0) : BigInt(parentId)
      console.log(metadata)
      console.log(licenseTerms)
      const tokenId = await origin.mintFile(
        file,
      {
         ...metadata,
         image: ipfsUrl,
         owner: address,
 price: license.price ,
          mimeType: file.type,
          size: file.size,
        },
        licenseTerms,
       parentTokenId
      )

      setSuccess(`Successfully minted IP NFT with ID: ${tokenId}`)
      return tokenId
    } catch (err) {
      console.error('Minting error:', err)
      setError(err instanceof Error ? err.message : 'Failed to mint IP NFT')
      return null
    } finally {
      setLoading(false)
    }
  }

  const buyAccessWithOrigin = async (tokenId: bigint, periods: number = 1) => {
    if (!origin) {
      setError('Origin SDK not available')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await origin.buyAccessSmart(tokenId, periods)
      setSuccess('Successfully purchased access!')
      return true
    } catch (err) {
      console.error('Buy access error:', err)
      setError(err instanceof Error ? err.message : 'Failed to buy access')
      return false
    } finally {
      setLoading(false)
    }
  }

  // === MARKETPLACE INTEGRATION ===
  const listNFTOnMarketplace = async (tokenId: bigint, price: string) => {
    await recoverProvider()
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const priceWei = parseEther(price)
     let res= await origin?.approve(CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address, tokenId)
if(!res) {
        setError('Failed to approve NFT to marketplace')
        throw new Error('Failed to transfer NFT to marketplace')
      }
//        res =     await origin?.transferFrom(auth.walletAddress as Address, CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address, tokenId)
//       console.log(res)
//       if(!res) {
//         setError('Failed to transfer NFT to marketplace')
//         throw new Error('Failed to transfer NFT to marketplace')
//       }

      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address,
        abi: CONTRACT_ABIS.MARKETPLACE,
        functionName: 'listNFT',
        args: [tokenId, priceWei],
      })

      return true
    } catch (err) {
      console.error('List NFT error:', err)
      setError(err instanceof Error ? err.message : 'Failed to list NFT')
      setLoading(false)
      return false
    }
  }

  const buyNFTFromMarketplace = async (tokenId: bigint, price: string) => {
    await recoverProvider()
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const priceWei = parseEther(price)

      
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address,
        abi: CONTRACT_ABIS.MARKETPLACE,
        functionName: 'buyNFT',
        args: [tokenId],
        value: priceWei, // Convert to wei
      })

      return true
    } catch (err) {
      console.error('Buy NFT error:', err)
      setError(err instanceof Error ? err.message : 'Failed to buy NFT')
      setLoading(false)
      return false
    }
  }

  const cancelListing = async (tokenId: bigint) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address,
        abi: CONTRACT_ABIS.MARKETPLACE,
        functionName: 'cancelListing',
        args: [tokenId],
      })

      return true
    } catch (err) {
      console.error('Cancel listing error:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel listing')
      setLoading(false)
      return false
    }
  }

  // Read marketplace data - this should be a hook that returns the useReadContract result
  const useMarketplaceListing = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address,
      abi: CONTRACT_ABIS.MARKETPLACE,
      functionName: 'getListing',
      args: [tokenId],
    })
  }

  // Get all active marketplace listings
  const useAllMarketplaceListings = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address,
      abi: CONTRACT_ABIS.MARKETPLACE,
      functionName: 'getAllActiveListings',
      args: [],
    })
  }

  // Get all listed token IDs
  const useAllListedTokenIds = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address,
      abi: CONTRACT_ABIS.MARKETPLACE,
      functionName: 'getAllListedTokenIds',
      args: [],
    })
  }

  // Update listing price
  const updateListingPrice = async (tokenId: bigint, newPrice: string) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const priceWei = parseEther(newPrice)
      
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_MARKETPLACE as Address,
        abi: CONTRACT_ABIS.MARKETPLACE,
        functionName: 'updatePrice',
        args: [tokenId, priceWei],
      })

      return true
    } catch (err) {
      console.error('Update price error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update price')
      setLoading(false)
      return false
    }
  }

  // === AUCTION INTEGRATION ===
  const createAuction = async (tokenId: bigint, startingBid: string, duration: number) => {
    await recoverProvider()
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const startingBidWei = parseEther(startingBid)
        let res= await origin?.approve(CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address, tokenId)
if(!res) {
        setError('Failed to approve NFT to marketplace')
        throw new Error('Failed to transfer NFT to marketplace')
      }
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
        abi: CONTRACT_ABIS.AUCTION,
        functionName: 'createAuction',
        args: [tokenId, startingBidWei, BigInt(duration)],
      })

      return true
    } catch (err) {
      console.error('Create auction error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create auction')
      setLoading(false)
      return false
    }
  }

  const placeBid = async (tokenId: bigint, bidAmount: string) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    
    setError(null)

    try {
      const bidWei = parseEther(bidAmount)
      
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
        abi: CONTRACT_ABIS.AUCTION,
        functionName: 'placeBid',
        args: [tokenId],
        value: bidWei,
      })
     
      return true
    } catch (err) {
      console.error('Place bid error:', err)
      setError(err instanceof Error ? err.message : 'Failed to place bid')
      setLoading(false)
      return false
    }
  }

  const endAuction = async (tokenId: bigint) => {
    await recoverProvider()
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
        abi: CONTRACT_ABIS.AUCTION,
        functionName: 'endAuction',
        args: [tokenId],
      })

      return true
    } catch (err) {
      console.error('End auction error:', err)
      setError(err instanceof Error ? err.message : 'Failed to end auction')
      setLoading(false)
      return false
    }
  }

  const useAuctionDetails = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
      abi: CONTRACT_ABIS.AUCTION,
      functionName: 'getAuction',
      args: [tokenId],
    })
  }

  // Get all active auctions
  const useAllActiveAuctions = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
      abi: CONTRACT_ABIS.AUCTION,
      functionName: 'getAllActiveAuctions',
      args: [],
    })
  }

  // Get all auction token IDs
  const useAllAuctionTokenIds = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
      abi: CONTRACT_ABIS.AUCTION,
      functionName: 'getAllAuctionTokenIds',
      args: [],
    })
  }

  // Get time remaining for auction
  const useAuctionTimeRemaining = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
      abi: CONTRACT_ABIS.AUCTION,
      functionName: 'getTimeRemaining',
      args: [tokenId],
    })
  }

  // Check if auction has ended
  const useHasAuctionEnded = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
      abi: CONTRACT_ABIS.AUCTION,
      functionName: 'hasAuctionEnded',
      args: [tokenId],
    })
  }

  // Get pending returns for user
  const usePendingReturns = (userAddress: Address) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
      abi: CONTRACT_ABIS.AUCTION,
      functionName: 'pendingReturns',
      args: [userAddress],
    })
  }

  // Cancel auction
  const cancelAuction = async (tokenId: bigint) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
        abi: CONTRACT_ABIS.AUCTION,
        functionName: 'cancelAuction',
        args: [tokenId],
      })

      return true
    } catch (err) {
      console.error('Cancel auction error:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel auction')
      setLoading(false)
      return false
    }
  }

  // Withdraw from auction
  const withdrawFromAuction = async () => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_AUCTION as Address,
        abi: CONTRACT_ABIS.AUCTION,
        functionName: 'withdraw',
        args: [],
      })

      return true
    } catch (err) {
      console.error('Withdraw error:', err)
      setError(err instanceof Error ? err.message : 'Failed to withdraw')
      setLoading(false)
      return false
    }
  }

  // === ESCROW INTEGRATION ===
  const createEscrowDeal = async (tokenId: bigint, buyer: Address, price: string) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const priceWei = parseEther(price)
      
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_ESCROW as Address,
        abi: CONTRACT_ABIS.ESCROW,
        functionName: 'createDeal',
        args: [tokenId, buyer, priceWei],
      })

      return true
    } catch (err) {
      console.error('Create escrow deal error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create escrow deal')
      setLoading(false)
      return false
    }
  }

  const fundEscrowDeal = async (tokenId: bigint, price: string) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const priceWei = parseEther(price)
      
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_ESCROW as Address,
        abi: CONTRACT_ABIS.ESCROW,
        functionName: 'fundDeal',
        args: [tokenId],
        value: priceWei,
      })

      return true
    } catch (err) {
      console.error('Fund escrow deal error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fund escrow deal')
      setLoading(false)
      return false
    }
  }

  const confirmEscrowTransfer = async (tokenId: bigint) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_ESCROW as Address,
        abi: CONTRACT_ABIS.ESCROW,
        functionName: 'confirmTransfer',
        args: [tokenId],
      })

      return true
    } catch (err) {
      console.error('Confirm transfer error:', err)
      setError(err instanceof Error ? err.message : 'Failed to confirm transfer')
      setLoading(false)
      return false
    }
  }

  const useEscrowDeal = (tokenId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_ESCROW as Address,
      abi: CONTRACT_ABIS.ESCROW,
      functionName: 'deals',
      args: [tokenId],
    })
  }

  // === LOTTERY INTEGRATION ===
  const startLottery = async (tokenId: bigint, ticketPrice: string, maxTickets: number, duration: number) => {
    await recoverProvider()
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const ticketPriceWei = parseEther(ticketPrice)
      let res= await origin?.approve(CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address, tokenId)
if(!res) {
        setError('Failed to approve NFT to marketplace')
        throw new Error('Failed to transfer NFT to marketplace')
      }
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
        abi: CONTRACT_ABIS.LOTTERY,
        functionName: 'startLottery',
        args: [tokenId, ticketPriceWei, BigInt(maxTickets), BigInt(duration)],
      })

      return true
    } catch (err) {
      console.error('Start lottery error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start lottery')
      setLoading(false)
      return false
    }
  }

  const buyLotteryTicket = async (lotteryId: bigint, ticketPrice: string) => {
    await recoverProvider()
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    //setLoading(true)
    setError(null)

    try {
      const ticketPriceWei = parseEther(ticketPrice)
      
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
        abi: CONTRACT_ABIS.LOTTERY,
        functionName: 'buyTicket',
        args: [lotteryId],
        value: ticketPriceWei,
      })

      return true
    } catch (err) {
      console.error('Buy lottery ticket error:', err)
      setError(err instanceof Error ? err.message : 'Failed to buy lottery ticket')
      setLoading(false)
      return false
    }
  }

  const drawLotteryWinner = async (lotteryId: bigint) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
        abi: CONTRACT_ABIS.LOTTERY,
        functionName: 'drawLottery',
        args: [lotteryId],
      })

      return true
    } catch (err) {
      console.error('Draw lottery error:', err)
      setError(err instanceof Error ? err.message : 'Failed to draw lottery winner')
      setLoading(false)
      return false
    }
  }

  const useLotteryDetails = (lotteryId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
      abi: CONTRACT_ABIS.LOTTERY,
      functionName: 'lotteries',
      args: [lotteryId],
    })
  }

  // Get next lottery ID
  const useNextLotteryId = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
      abi: CONTRACT_ABIS.LOTTERY,
      functionName: 'nextLotteryId',
      args: [],
    })
  }

  // Get players for a lottery
  const useLotteryPlayers = (lotteryId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
      abi: CONTRACT_ABIS.LOTTERY,
      functionName: 'getPlayers',
      args: [lotteryId],
    })
  }

  // Get all active lotteries
  const useAllActiveLotteries = () => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
      abi: CONTRACT_ABIS.LOTTERY,
      functionName: 'getAllActiveLotteries',
      args: [],
    })
  }

  // Announce lottery winner
  const announceLotteryWinner = async (lotteryId: bigint) => {
    if (!isConnected) {
      setError('Please connect your wallet')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.CORE_CAMP_LOTTERY as Address,
        abi: CONTRACT_ABIS.LOTTERY,
        functionName: 'announceWinner',
        args: [lotteryId],
      })

      return true
    } catch (err) {
      console.error('Announce winner error:', err)
      setError(err instanceof Error ? err.message : 'Failed to announce winner')
      setLoading(false)
      return false
    }
  }

  // === UTILITY FUNCTIONS ===
  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return '0'
    return parseFloat(formatEther(balance)).toFixed(4)
  }

  const canAfford = (price: string, userBalance?: bigint) => {
    if (!userBalance) return false
    try {
      const priceWei = parseEther(price)
      return userBalance >= priceWei
    } catch {
      return false
    }
  }

  return {
    // State
    loading,
    error,
    success,
    isConnected,
    address,
    balance,
    txHash,
    isPending: isPending || loading,

    // Origin SDK functions
    getOriginData,
    getOriginUsage,
    mintIPWithOrigin,
    buyAccessWithOrigin,
    getDataByTokenId,

    // Marketplace functions
    listNFTOnMarketplace,
    buyNFTFromMarketplace,
    cancelListing,
    useMarketplaceListing,
    useAllMarketplaceListings,
    useAllListedTokenIds,
    updateListingPrice,

    // Auction functions
    createAuction,
    placeBid,
    endAuction,
    useAuctionDetails,
    useAllActiveAuctions,
    useAllAuctionTokenIds,
    useAuctionTimeRemaining,
    useHasAuctionEnded,
    usePendingReturns,
    cancelAuction,
    withdrawFromAuction,

    // Escrow functions
    createEscrowDeal,
    fundEscrowDeal,
    confirmEscrowTransfer,
    useEscrowDeal,

    // Lottery functions
    startLottery,
    buyLotteryTicket,
    drawLotteryWinner,
    useLotteryDetails,
    useNextLotteryId,
    useLotteryPlayers,
    useAllActiveLotteries,
    announceLotteryWinner,

    // Utilities
    formatBalance,
    canAfford,

    // Clear functions
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
  }
}
