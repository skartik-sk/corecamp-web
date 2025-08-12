import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Zap, Loader2, ExternalLink } from 'lucide-react'
import { useAuth } from '@campnetwork/origin/react'
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'
import { CampModal } from '@campnetwork/origin/react'

export default function IntegrationStatus() {
  const { origin, jwt } = useAuth()
  const { isConnected, address, balance } = useCampfireIntegration()
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Show status after a short delay
    const timer = setTimeout(() => setShowStatus(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!showStatus) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-40 max-w-sm w-full"
    >
      <div className="glass-effect rounded-2xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-camp-dark text-sm">🔥 Campfire Integration</h3>
          <button
            onClick={() => setShowStatus(false)}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3 text-xs">
          {/* Origin SDK Status */}
          <div className="flex items-center justify-between">
            <span className="flex items-center text-cool-1">
              <Zap className="w-3 h-3 mr-1" />
              Origin SDK
            </span>
            {origin && jwt ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                <span className="font-medium">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                <span>Ready</span>
              </div>
            )}
          </div>

          {/* Wallet Status */}
          <div className="flex items-center justify-between">
            <span className="flex items-center text-cool-1">
              <span className="w-3 h-3 mr-1 bg-gradient-to-r from-camp-orange to-warm-1 rounded-full"></span>
              Wallet
            </span>
            {isConnected ? (
              <div className="text-green-600 font-medium">
                {balance ? balance.formatted : '0.0'} CAMP
              </div>
            ) : (
              <div className="text-gray-500">
                Not connected
              </div>
            )}
          </div>

          {/* Smart Contracts Status */}
          <div className="flex items-center justify-between">
            <span className="flex items-center text-cool-1">
              <span className="w-3 h-3 mr-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></span>
              Smart Contracts
            </span>
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span className="font-medium">4 Ready</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          {!isConnected ? (
            <div className="flex items-center justify-center">
              <CampModal />
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs">
              <span className="text-cool-1">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <a
                href={`https://basecamp.cloud.blockscout.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-camp-orange hover:text-warm-1"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Explorer
              </a>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 text-xs">
          <div className="flex items-center justify-between text-cool-1">
            <span>✨ All features are ready!</span>
            <div className="flex space-x-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
