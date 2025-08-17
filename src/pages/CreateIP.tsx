import { useState, useCallback, useEffect } from 'react'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { useCampfireIntegration } from '@/hooks/useCampfireIntegration'
import { Upload, FileText, Image as ImageIcon, Music, Video, Code, Palette, DollarSign, Clock, Percent, CheckCircle, ArrowLeft, ArrowRight, Sparkles, Star, TrendingUp, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence, m } from 'framer-motion'

const categories = [
  { id: 'art', name: 'Digital Art', icon: Palette, color: 'from-purple-400 to-pink-400' },
  { id: 'music', name: 'Music', icon: Music, color: 'from-blue-400 to-cyan-400' },
  { id: 'design', name: 'Design', icon: ImageIcon, color: 'from-green-400 to-emerald-400' },
  { id: 'code', name: 'Code', icon: Code, color: 'from-orange-400 to-red-400' },
  { id: 'video', name: 'Video', icon: Video, color: 'from-yellow-400 to-orange-400' },
  { id: 'writing', name: 'Writing', icon: FileText, color: 'from-indigo-400 to-purple-400' },
]

interface LicenseTerms {
  price: string
  duration: string
  royalty: string
  paymentToken: string
}

interface IPMetadata {
  name: string
  description: string
  category: string
  tags: string[]
  isDerivative: boolean
  parentId?: string
}

export default function CreateIP() {
  const { origin, jwt, viem } = useAuth()
  const { authenticated, loading: authLoading } = useAuthState();
  const {
    mintIPWithOrigin,
    loading,
    error: hookError,
    success: hookSuccess,
    // isConnected,
    clearError,
    clearSuccess 
  } = useCampfireIntegration()
  const isConnected =authenticated
  const [step, setStep] = useState<'upload' | 'metadata' | 'license' | 'mint'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<IPMetadata>({
    name: '',
    description: '',
    category: '',
    tags: [],
    isDerivative: false,
    parentId: '',
  })
  const [license, setLicense] = useState<LicenseTerms>({
    price: '0.001',
    duration: '2345000',
    royalty: '0',
    paymentToken: '0x0000000000000000000000000000000000000000', // ETH
  })
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Use hook states when available
  const finalLoading = loading
  const finalError = hookError || error
  const finalSuccess = hookSuccess || success

  useEffect(() => {
    console.log(viem)

  }, [viem])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      let maxSize = 10 * 1024 * 1024 // default 10MB
      const type = selectedFile.type.split('/')[0]
      if (type === 'audio') maxSize = 15 * 1024 * 1024
      if (type === 'video') maxSize = 20 * 1024 * 1024
      if (selectedFile.size > maxSize) {
      setError(
        `File size must be less than ${
        type === 'audio' ? '15MB' : type === 'video' ? '20MB' : '10MB'
        } for ${type}`
      )
      return
      }
      setFile(selectedFile)
      setError('')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      console.log(droppedFile)
      let maxSize = 10 * 1024 * 1024 // default 10MB
      const type = droppedFile.type.split('/')[0]
      if (type === 'audio') maxSize = 15 * 1024 * 1024
      if (type === 'video') maxSize = 20 * 1024 * 1024
      if (droppedFile.size > maxSize) {
      setError(
        `File size must be less than ${
        type === 'audio' ? '15MB' : type === 'video' ? '20MB' : '10MB'
        } for ${type}`
      )
      return
      }
      setFile(droppedFile)
      setError('')
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const addTag = () => {

    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
    //console.log(metadata.tags)
  }

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleMint = async () => {

    if (!origin || !jwt || !file ) {
      setError('Missing required data for minting')
      return
    }
    if (!authenticated || !origin || !jwt ) {
    setError('Please connect and authenticate your wallet.');
    return;
  }


    // Clear previous messages
    setError('')
    setSuccess('')
    clearError()
    clearSuccess()

    try {
      const tokenId = await mintIPWithOrigin(
        file,
        {
          ...metadata,
          mimeType: file.type,
          size: file.size,
        },
        license,
        metadata.isDerivative && metadata.parentId ? metadata.parentId : ''
      )

      if (tokenId) {
        setSuccess(`Successfully minted IP NFT with ID: ${tokenId}`)
        setStep('mint')
      }
    } catch (err) {
      console.error('Minting error:', err)
      setError(err instanceof Error ? err.message : 'Failed to mint IP NFT')
    }
  }

  const getFileTypeIcon = (file: File) => {
    const type = file.type.split('/')[0]
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'audio': return Music
      default: return FileText
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 bg-gradient-to-br from-camp-orange to-warm-1 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Upload className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-camp-dark mb-2">Upload Your Creation</h2>
              <p className="text-cool-1 text-lg">Transform your intellectual property into a valuable NFT</p>
            </div>

            <motion.div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="relative border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center hover:border-camp-orange transition-all duration-300 group glass-effect"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-camp-orange/5 to-warm-1/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {file ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-6 relative z-10"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                    {(() => {
                      const IconComponent = getFileTypeIcon(file)
                      return <IconComponent className="w-10 h-10 text-white" />
                    })()}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-camp-dark">{file.name}</p>
                    <p className="text-cool-1 text-lg">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFile(null)}
                    className="text-camp-orange hover:text-warm-1 font-medium"
                  >
                    Choose different file
                  </motion.button>
                </motion.div>
              ) : (
                <div className="space-y-6 relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-camp-orange/20 to-warm-1/20 rounded-2xl flex items-center justify-center mx-auto border-2 border-camp-orange/20">
                    <Upload className="w-10 h-10 text-camp-orange" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-camp-dark mb-3">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-cool-1 text-lg">Supports images, videos, audio, documents, and more</p>
                    <p className="text-cool-2 text-sm mt-2">Maximum file size: 10MB</p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept="*/*"
                  />
                  <motion.label
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    htmlFor="file-upload"
                    className="inline-flex items-center px-8 py-4 gradient-bg text-white rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer font-medium"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Choose File
                  </motion.label>
                </div>
              )}
            </motion.div>

            {file && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep('metadata')}
                  className="px-8 py-4 gradient-bg text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium flex items-center"
                >
                  Next: Add Details
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )

      case 'metadata':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Sparkles className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-camp-dark mb-2">Describe Your IP</h2>
              <p className="text-cool-1 text-lg">Add details that make your creation stand out</p>
            </div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-semibold text-camp-dark mb-3">
                  Title <span className="text-camp-orange">*</span>
                </label>
                <input
                  type="text"
                  value={metadata.name}
                  onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect transition-all duration-300 text-lg"
                  placeholder="Enter a captivating title for your IP"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-semibold text-camp-dark mb-3">
                  Description <span className="text-camp-orange">*</span>
                </label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect transition-all duration-300 text-lg resize-none"
                  placeholder="Describe your IP, its unique value, and potential use cases..."
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-camp-dark mb-4">
                  Category <span className="text-camp-orange">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMetadata(prev => ({ ...prev, category: category.id }))}
                      className={`relative flex flex-col items-center space-y-3 p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                        metadata.category === category.id
                          ? 'border-camp-orange bg-camp-orange/10 text-camp-orange shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 ${
                        metadata.category === category.id ? 'opacity-10' : ''
                      } transition-opacity`} />
                      <category.icon className="w-8 h-8 relative z-10" />
                      <span className="font-medium relative z-10">{category.name}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-semibold text-camp-dark mb-3">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {metadata.tags.map((tag, index) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cool-3 to-cool-2 text-cool-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-cool-1 hover:text-camp-dark transition-colors"
                      >
                        ×
                      </motion.button>
                    </motion.span>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect"
                    placeholder="Add tags (press Enter)"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addTag}
                    className="px-6 py-3 gradient-bg text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                  >
                    Add
                  </motion.button>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-effect p-6 rounded-2xl border border-cool-3/20"
              >
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="derivative"
                    checked={metadata.isDerivative}
                    onChange={(e) => setMetadata(prev => ({ ...prev, isDerivative: e.target.checked }))}
                    className="mr-3 rounded"
                  />
                  <label htmlFor="derivative" className="text-sm font-semibold text-camp-dark">
                    This is a derivative work
                  </label>
                </div>
                <AnimatePresence>
                  {metadata.isDerivative && (
                    <motion.input
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      type="text"
                      value={metadata.parentId}
                      onChange={(e) => setMetadata(prev => ({ ...prev, parentId: e.target.value }))}
                      className="w-full px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect"
                      placeholder="Parent IP NFT Token ID"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('upload')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('license')}
                disabled={!metadata.name || !metadata.description || !metadata.category}
                className="px-8 py-4 gradient-bg text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed font-medium flex items-center"
              >
                Next: Set License
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </div>
          </motion.div>
        )

      case 'license':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <DollarSign className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-camp-dark mb-2">Set License Terms</h2>
              <p className="text-cool-1 text-lg">Define how others can use and monetize your IP</p>
            </div>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-effect p-6 rounded-2xl border border-cool-3/20"
              >
                <label className="block text-sm font-semibold text-camp-dark mb-4">
                  <DollarSign className="inline w-5 h-5 mr-2" />
                  License Price (CAMP)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={license.price}
                  onChange={(e) => setLicense(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect text-lg"
                  placeholder="0.0"
                />
                <p className="text-sm text-cool-1 mt-3 flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Set to 0 for free licensing
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-effect p-6 rounded-2xl border border-cool-3/20"
              >
                <label className="block text-sm font-semibold text-camp-dark mb-4">
                  <Clock className="inline w-5 h-5 mr-2" />
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={license.duration}
                  onChange={(e) => setLicense(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect text-lg"
                  placeholder="0"
                />
                <p className="text-sm text-cool-1 mt-3 flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Set to 0 for perpetual licensing
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-effect p-6 rounded-2xl border border-cool-3/20"
              >
                <label className="block text-sm font-semibold text-camp-dark mb-4">
                  <Percent className="inline w-5 h-5 mr-2" />
                  Royalty Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={license.royalty}
                  onChange={(e) => setLicense(prev => ({ ...prev, royalty: e.target.value }))}
                  className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-camp-orange focus:border-transparent glass-effect text-lg"
                  placeholder="0"
                />
                <p className="text-sm text-cool-1 mt-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Percentage of future sales you'll receive (max 10%)
                </p>
              </motion.div>
            </div>

            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('metadata')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium flex items-center"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMint}
                disabled={finalLoading || !isConnected}
                className="px-8 py-4 gradient-bg text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed font-medium flex items-center"
              >
                {finalLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Minting...
                  </>
                ) : !isConnected ? (
                  <>
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Mint IP NFT
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )

      case 'mint':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-4xl font-bold text-camp-dark mb-4">IP NFT Created!</h2>
              <p className="text-cool-1 text-xl max-w-2xl mx-auto">
                Your intellectual property has been successfully tokenized and added to the blockchain. 
                It's now ready to generate value in the Camp Network ecosystem.
              </p>
            </motion.div>
            
            {(finalSuccess || success) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-effect border border-green-200 rounded-2xl p-6 max-w-2xl mx-auto"
              >
                <p className="text-green-800 font-medium">{finalSuccess || success}</p>
              </motion.div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-6 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setStep('upload')
                  setFile(null)
                  setMetadata({
                    name: '',
                    description: '',
                    category: '',
                    tags: [],
                    isDerivative: false,
                    parentId: '',
                  })
                  setLicense({
                    price: '0',
                    duration: '0',
                    royalty: '0',
                    paymentToken: '0x0000000000000000000000000000000000000000',
                  })
                  setSuccess('')
                  setError('')
                }}
                className="px-8 py-4 border-2 border-camp-orange text-camp-orange rounded-xl hover:bg-camp-orange hover:text-white transition-all duration-300 font-medium"
              >
                Create Another
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/my-ips'}
                className="px-8 py-4 gradient-bg text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
              >
                View My IPs
              </motion.button>
            </motion.div>
          </motion.div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-3/20 to-cool-3/20 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-lg">
            {['upload', 'metadata', 'license', 'mint'].map((stepName, index) => (
              <div
                key={stepName}
                className={`flex items-center ${index < 3 ? 'flex-1' : ''}`}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step === stepName
                      ? 'gradient-bg text-white shadow-lg'
                      : ['upload', 'metadata', 'license', 'mint'].indexOf(step) > index
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {['upload', 'metadata', 'license', 'mint'].indexOf(step) > index ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </motion.div>
                {index < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 ${
                      ['upload', 'metadata', 'license', 'mint'].indexOf(step) > index
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {(finalError || finalSuccess) && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`mb-8 rounded-2xl p-6 ${
                finalError 
                  ? 'bg-red-50 border-2 border-red-200' 
                  : 'bg-green-50 border-2 border-green-200'
              }`}
            >
              <div className="flex items-center">
                {finalError ? (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                )}
                <p className={`font-medium ${finalError ? 'text-red-800' : 'text-green-800'}`}>
                  {finalError || finalSuccess}
                </p>
                {(finalError || finalSuccess) && (
                  <button
                    onClick={() => {
                      setError('')
                      setSuccess('')
                      clearError()
                      clearSuccess()
                    }}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20"
        >
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
