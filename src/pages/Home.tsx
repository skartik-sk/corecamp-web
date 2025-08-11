import { Link } from 'react-router-dom'
import { useAuthState } from '@campnetwork/origin/react'
import { ArrowRight, Zap, Shield, Users, Flame, Star, TrendingUp } from 'lucide-react'

const features = [
  {
    name: 'Create & Mint IP',
    description: 'Upload any content and turn it into a tokenized IP NFT with customizable licensing terms.',
    icon: Zap,
  },
  {
    name: 'Secure Trading',
    description: 'Buy, sell, and negotiate IP rights with built-in escrow protection and smart contracts.',
    icon: Shield,
  },
  {
    name: 'Community Driven',
    description: 'Connect with creators, collaborate on projects, and build the future of IP together.',
    icon: Users,
  },
]

const stats = [
  { name: 'Total IPs Created', value: '2.5K+' },
  { name: 'Active Creators', value: '850+' },
  { name: 'Total Volume', value: '$125K+' },
  { name: 'Successful Trades', value: '3.2K+' },
]

export default function Home() {
  const { authenticated } = useAuthState()

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="relative pt-14 pb-20 sm:pt-24 sm:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 gradient-bg rounded-2xl flex items-center justify-center animate-pulse-glow">
                <Flame className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-camp-dark mb-6">
              Where IP Meets
              <span className="block bg-gradient-to-r from-camp-orange via-warm-2 to-warm-1 bg-clip-text text-transparent">
                Innovation
              </span>
            </h1>
            <p className="text-xl text-cool-1 max-w-3xl mx-auto mb-10">
              The ultimate marketplace for intellectual property. Create, trade, auction, and collaborate 
              on IP assets powered by Camp Network's Origin SDK and blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {authenticated ? (
                <>
                  <Link
                    to="/create"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white gradient-bg hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    Create Your First IP
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                  <Link
                    to="/marketplace"
                    className="inline-flex items-center px-6 py-3 border border-cool-1 text-base font-medium rounded-lg text-cool-1 bg-white hover:bg-cool-3/10 transition-colors"
                  >
                    Explore Marketplace
                  </Link>
                </>
              ) : (
                <>
                  <button className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white gradient-bg hover:shadow-lg transform hover:scale-105 transition-all">
                    Connect Wallet to Start
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                  <Link
                    to="/marketplace"
                    className="inline-flex items-center px-6 py-3 border border-cool-1 text-base font-medium rounded-lg text-cool-1 bg-white hover:bg-cool-3/10 transition-colors"
                  >
                    Browse IPs
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-camp-dark mb-4">
              Everything You Need for IP Trading
            </h2>
            <p className="text-lg text-cool-1 max-w-2xl mx-auto">
              From creation to marketplace, auctions to negotiations - we've got you covered.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="bg-white rounded-2xl p-8 card-shadow hover-lift"
              >
                <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-camp-dark mb-3">
                  {feature.name}
                </h3>
                <p className="text-cool-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-orange-100">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-camp-dark mb-4">
              Latest Activity
            </h2>
            <p className="text-lg text-cool-1">
              See what's happening in the Campfire community
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-white rounded-2xl p-6 card-shadow hover-lift"
              >
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <span className="ml-3 text-sm text-cool-1">2 hours ago</span>
                </div>
                <h3 className="text-lg font-semibold text-camp-dark mb-2">
                  New IP Listed: "AI Art Collection #{item}"
                </h3>
                <p className="text-cool-1 text-sm mb-4">
                  A unique collection of AI-generated artwork ready for licensing and collaboration.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-camp-orange font-semibold">$125 CAMP</span>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm">+15%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-cool-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your IP Journey?
          </h2>
          <p className="text-cool-3 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of creators building the future of intellectual property on the blockchain.
          </p>
          {!authenticated && (
            <button className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-cool-1 bg-white hover:bg-camp-light transform hover:scale-105 transition-all">
              Connect Wallet to Begin
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
