import { Link } from 'react-router-dom'
import { useAuth, useAuthState } from '@campnetwork/origin/react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Sparkles, 
  Users, 
  Camera, 
  MessageSquare, 
  Gavel, 
  TrendingUp,
  Upload,
  HandHeart,
  Zap,
  Globe,
  Lock,
  Star
} from 'lucide-react'
import clsx from 'clsx'

const features = [
  {
    name: 'Create IP Assets',
    description: 'Turn any content into tokenized IP with smart contracts and customizable licensing.',
    icon: Camera,
    color: 'from-camp-orange to-warm-1',
  },
  {
    name: '1:1 Negotiations',
    description: 'Direct messaging with escrow protection for secure IP licensing discussions.',
    icon: MessageSquare,
    color: 'from-cool-1 to-cool-2',
  },
  {
    name: 'Marketplace Trading',
    description: 'Buy, sell, and discover IP assets in our comprehensive marketplace.',
    icon: Globe,
    color: 'from-warm-2 to-warm-3',
  },
  {
    name: 'Auctions & Lottery',
    description: 'Participate in IP auctions or try your luck with lottery-based acquisitions.',
    icon: Gavel,
    color: 'from-cool-2 to-cool-3',
  },
]

const stats = [
  { name: 'IP Assets Created', value: '12.5K+', icon: Upload },
  { name: 'Active Creators', value: '3.2K+', icon: Users },
  { name: 'Total Volume', value: '$2.1M+', icon: TrendingUp },
  { name: 'Successful Deals', value: '8.7K+', icon: HandHeart },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      damping: 20,
      stiffness: 100
    }
  }
}

export default function HomeNew() {
  const { authenticated } = useAuthState()
  const { login } = useAuth()

  const handleConnectWallet = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-camp-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warm-2/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-cool-2/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-camp-light/80 via-white/50 to-cool-3/30"></div>
      </div>

      {/* Hero Section */}
      <motion.div 
        className="relative pt-20 pb-32 sm:pt-32 sm:pb-48"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div 
              className="flex justify-center mb-8"
              variants={itemVariants}
            >
              <div className="relative">
                <div className="w-24 h-22 gradient-bg rounded-3xl flex items-center justify-center animate-pulse-glow">
                  <img 
                    src="/logo.png" 
                    alt="CoreCamp Logo" 
                    className="w-20 h-18 rounded-2xl"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-warm-2 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1 
              className="text-5xl sm:text-7xl font-bold text-camp-dark mb-8 leading-tight"
              variants={itemVariants}
            >
              <span className="block ">CoreCamp</span>
              <span className="block text-gradient">
                IP Marketplace
              </span>
            </motion.h1>

            <motion.p 
              className="text-xl sm:text-2xl text-cool-1 max-w-4xl mx-auto mb-12 leading-relaxed"
              variants={itemVariants}
            >
              Create, trade, auction, and negotiate intellectual property assets on the blockchain. 
              Join the future of IP ownership with Camp Network's Origin SDK.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
              variants={itemVariants}
            >
              {authenticated ? (
                <>
                  <Link
                    to="/create"
                    className="group inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-2xl text-white gradient-bg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Create Your First IP
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/marketplace"
                    className="group inline-flex items-center px-8 py-4 border-2 border-cool-1 text-lg font-semibold rounded-2xl text-cool-1 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-300"
                  >
                    Explore Marketplace
                    <Globe className="ml-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
                  </Link>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleConnectWallet}
                    className="group inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded-2xl text-white gradient-bg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Connect with Origin
                    <Lock className="ml-3 w-6 h-6 group-hover:animate-bounce" />
                  </button>
                  <Link
                    to="/marketplace"
                    className="group inline-flex items-center px-8 py-4 border-2 border-cool-1 text-lg font-semibold rounded-2xl text-cool-1 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-300"
                  >
                    Browse IPs
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="py-32 bg-white/70 backdrop-blur-sm"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-20" variants={itemVariants}>
            <h2 className="text-4xl sm:text-5xl font-bold text-camp-dark mb-6">
              Complete IP Ecosystem
            </h2>
            <p className="text-xl text-cool-1 max-w-3xl mx-auto">
              From creation to marketplace, negotiations to auctions - everything you need in one platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 card-shadow hover-lift border border-white/20"
                variants={itemVariants}
                custom={index}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className={clsx(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br",
                  feature.color
                )}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-camp-dark mb-4 group-hover:text-camp-orange transition-colors">
                  {feature.name}
                </h3>
                <p className="text-cool-1 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="py-24 gradient-bg relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div 
                key={stat.name} 
                className="text-center group"
                variants={itemVariants}
                custom={index}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 group-hover:bg-white/30 transition-colors">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 text-lg">{stat.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div 
        className="py-32 bg-gradient-to-b from-white/70 to-camp-light/80"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-20" variants={itemVariants}>
            <h2 className="text-4xl sm:text-5xl font-bold text-camp-dark mb-6">
              How CoreCamp Works
            </h2>
            <p className="text-xl text-cool-1 max-w-3xl mx-auto">
              Simple steps to start your IP journey on the blockchain
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: '01', title: 'Connect & Upload', desc: 'Sign in with your wallet and upload any content to create IP assets', icon: Upload },
              { step: '02', title: 'List & Negotiate', desc: 'List on marketplace or engage in direct 1:1 negotiations with buyers', icon: MessageSquare },
              { step: '03', title: 'Trade & Earn', desc: 'Complete secure transactions with escrow protection and start earning', icon: Star }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center group"
                variants={itemVariants}
                custom={index}
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto gradient-bg rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-8 w-12 h-12 bg-warm-2 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-camp-dark mb-4">{item.title}</h3>
                <p className="text-cool-1 text-lg leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="py-24 bg-gradient-to-r from-cool-1 to-camp-dark relative overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-4xl sm:text-5xl font-bold text-white mb-6"
            variants={itemVariants}
          >
            Ready to Build the Future of IP?
          </motion.h2>
          <motion.p 
            className="text-xl text-cool-3 mb-12 max-w-3xl mx-auto"
            variants={itemVariants}
          >
            Join thousands of creators, innovators, and businesses revolutionizing intellectual property ownership on the blockchain.
          </motion.p>
          {!authenticated && (
            <motion.button 
              onClick={handleConnectWallet}
              className="group inline-flex items-center px-10 py-5 border border-transparent text-xl font-semibold rounded-2xl text-cool-1 bg-white hover:bg-camp-light transform hover:scale-105 transition-all duration-300 shadow-2xl"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your IP Journey
              <Sparkles className="ml-3 w-6 h-6 group-hover:animate-spin" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
