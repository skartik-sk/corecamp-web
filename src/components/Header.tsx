import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CampModal, MyCampModal, useAuth, useAuthState, useConnect, useModal } from '@campnetwork/origin/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Store, 
  Plus, 
  MessageCircle, 
  User, 
  Dice6, 
  Sparkles,
  Zap,
  Wallet,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useWalletClient } from 'wagmi';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'Auctions', href: '/auctions', icon: Dice6 },
  { name: 'Lottery', href: '/lottery', icon: Zap },
  { name: 'Create IP', href: '/create', icon: Plus, authRequired: true },
  { name: 'Chat', href: '/chat', icon: MessageCircle, authRequired: true },
  { name: 'My IPs', href: '/my-ips', icon: User, authRequired: true },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { authenticated } = useAuthState();
  const { recoverProvider } = useAuth();

  const {disconnect} = useConnect();
  const {connect} = useConnect();
    const { openModal } = useModal();

  const location = useLocation();

  // const { data: walletClient } = useWalletClient()

  const handleAuth = async () => {
    try {
      if (authenticated) {
        // For now, just reload the page to disconnect
       disconnect();
        setUserMenuOpen(false);
      } else {
        // You'll need to implement proper Origin SDK connection
       openModal();
await recoverProvider()


        console.log('Connect with Origin SDK');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-cool-3/20 shadow-lg"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4 lg:border-none">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
                  <img 
                    src="/logo.png" 
                    alt="CoreCamp Logo" 
                    className="w-10 h-10 rounded-xl"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <Sparkles className="w-6 h-6 text-white hidden" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-warm-2 rounded-full animate-pulse">
                  <div className="w-full h-full bg-white rounded-full animate-ping opacity-75"></div>
                </div>
              </motion.div>
              <div className="ml-3">
                <motion.h1 
                  whileHover={{ x: 2 }}
                  className="text-2xl font-bold text-camp-dark"
                >
                  <span className="text-gradient">CoreCamp</span>
                </motion.h1>
                <p className="text-xs text-cool-1 font-medium">
                  IP Marketplace
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navigation.map((item) => {
              const isVisible = !item.authRequired || authenticated;
              if (!isVisible) return null;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                    location.pathname === item.href
                      ? 'text-white gradient-bg shadow-lg'
                      : 'text-camp-dark hover:text-camp-orange hover:bg-white/20'
                  }`}
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </motion.div>
                  {location.pathname === item.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 gradient-bg rounded-2xl -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Auth Section */}
            {authenticated ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-green-200/50 hover:border-green-300/70 transition-all duration-300"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-green-700">
                      Connected
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl"
                    >
                      <div className="p-2 space-y-1">
                        {/* <Link
                          to="/my-ips"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                        > */}
                        <CampModal />
                        <button
                          onClick={openModal}
                          className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">My Profile</span>
                          </button>
                        {/* </Link> */}
                        <button
                          onClick={handleAuth}
                          className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors text-red-600"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Disconnect</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
              <CampModal injectButton={false} />
              <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAuth}
              className="flex items-center space-x-2 px-6 py-3 gradient-bg text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Origin</span>
              </motion.button>
                </>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              className="lg:hidden p-3 rounded-xl bg-gray-100 text-camp-dark transition-all duration-300"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="fixed top-0 right-0 w-80 h-full bg-white/95 backdrop-blur-sm shadow-2xl z-50 border-l border-gray-200"
            >
              <div className="p-6">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                      <img 
                        src="/logo.png" 
                        alt="CoreCamp Logo" 
                        className="w-6 h-6 rounded-lg"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <Sparkles className="w-5 h-5 text-white hidden" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gradient">CoreCamp</h2>
                      <p className="text-xs text-cool-1">IP Marketplace</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-gray-100 text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </motion.button>
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-3 mb-8">
                  {navigation.map((item, index) => {
                    const isVisible = !item.authRequired || authenticated;
                    if (!isVisible) return null;
                    
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          to={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                            location.pathname === item.href
                              ? 'gradient-bg text-white shadow-lg'
                              : 'text-camp-dark hover:bg-gray-100 hover:text-camp-orange'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile Auth */}
                <div className="space-y-3">
                  {authenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2 p-4 bg-green-50 rounded-2xl border border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-green-700">
                          Connected to Origin
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAuth}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
                      >
                        Disconnect Wallet
                      </motion.button>
                    </div>
                  ) : (
                    <CampModal />
                    // <motion.button
                    // whileHover={{ scale: 1.02 }}
                    // whileTap={{ scale: 0.98 }}
                    // onClick={() => {
                    //   handleAuth();
                    //   setMobileMenuOpen(false);
                    // }}
                    // className="w-full flex items-center justify-center space-x-2 px-4 py-3 gradient-bg text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
                    // >
                    //   <Wallet className="w-5 h-5" />
                    //   <span>Connect Origin</span>
                    // </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
