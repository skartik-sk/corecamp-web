import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Contract Addresses on Camp Network Basecamp
export const CONTRACT_ADDRESSES = {
  WCAMP: "0x1aE9c40eCd2DD6ad5858E5430A556d7aff28A44b",
  IpNFT: "0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1",
  Marketplace: "0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981",
  DisputeModule: "0x84EAac1B2dc3f84D92Ff84c3ec205B1FA74671fC",
} as const

// Format address for display
export function formatAddress(address: string, chars = 4): string {
  if (!address) return ""
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`
}

// Format price for display
export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toFixed(3)
}

// Format time remaining
export function getTimeRemaining(endTime: Date): string {
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()
  
  if (diff <= 0) return "Ended"
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
